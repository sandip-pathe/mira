import { Inviter, Registerer, SessionState, UserAgent } from 'sip.js';
import type { MediaStream } from 'react-native-webrtc';
import { ApiError, getAuthenticatedSession, requestWithRenewal } from '../../shared/api';
import type { NativeCallMedia } from './nativeMedia';
import { claimMicrophone } from '../../shared/microphoneLease';
import { isCallContextCurrent, prepareCallContext } from './callContext';

type CallSession = {
  run_id: string; agent_id: string; sip_username: string; sip_password: string;
  wss_url: string; sip_register: boolean; ice_servers: RTCIceServer[];
};
type ReceivedAudioStats = {
  id: string; type: string; kind?: string; mediaType?: string;
  audioLevel?: number; totalAudioEnergy?: number; totalSamplesDuration?: number;
};
export type CallState = 'connecting' | 'ringing' | 'connected' | 'reconnecting' | 'ended' | 'failed';

/** One instance per attempt. A cancelled attempt can never acquire media later. */
export class BolnaCall {
  private cancelled = false;
  private abort = new AbortController();
  private ua?: UserAgent;
  private inviter?: Inviter;
  private stream?: MediaStream;
  private media?: NativeCallMedia;
  private timer?: ReturnType<typeof setTimeout>;
  private connected = false;
  private releaseMicrophone?: () => void;
  private disconnectTimer?: ReturnType<typeof setTimeout>;
  private muted = false;
  private held = false;
  private audioEnergy = new Map<string, { energy: number; duration: number }>();

  reserveMicrophone() { this.releaseMicrophone ??= claimMicrophone(this); }

  constructor(private update: (state: CallState, error?: string) => void) {}

  async start() {
    let phase: 'context' | 'session' | 'microphone' | 'connection' = 'context';
    this.update('connecting');
    this.timer = setTimeout(() => this.fail('Mira could not connect. Try calling again.'), 35000);
    try {
      this.reserveMicrophone();
      const session = await getAuthenticatedSession();
      const context = await prepareCallContext(session.userId);
      if (this.cancelled) return;
      phase = 'session';
      const credentials = await requestWithRenewal<CallSession>(
        '/workers/bolna/session', session, context, 'POST', { signal: this.abort.signal },
      );
      if (this.cancelled) return;
      if (!await isCallContextCurrent(session.userId, context.consent_revision)) {
        this.fail('Shared context changed. Retry call to use your current choices.'); return;
      }
      if (this.cancelled) return;
      phase = 'microphone';
      const { mediaDevices } = require('react-native-webrtc') as typeof import('react-native-webrtc');
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      if (this.cancelled) {
        stream.getTracks().forEach(track => track.stop());
        stream.release();
        return;
      }
      this.stream = stream;
      this.mute(this.muted);
      phase = 'connection';
      const host = new URL(credentials.wss_url).hostname;
      const user = credentials.sip_register ? credentials.sip_username : credentials.run_id;
      const uri = UserAgent.makeURI(`sip:${user}@${host}`);
      const target = UserAgent.makeURI(`sip:7000@${host}`);
      if (!uri || !target) throw new Error('Invalid call address');
      const { NativeCallMedia } = require('./nativeMedia') as typeof import('./nativeMedia');
      const ua = new UserAgent({
        uri, authorizationUsername: credentials.sip_username,
        authorizationPassword: credentials.sip_password,
        transportOptions: { server: credentials.wss_url, connectionTimeout: 15 },
        logLevel: 'error', logBuiltinEnabled: false,
        sessionDescriptionHandlerFactory: () => {
          if (this.cancelled) throw new Error('Call ended');
          this.media = new NativeCallMedia(credentials.ice_servers, stream);
          this.media.pc.onconnectionstatechange = () => {
            const state = this.media?.pc.connectionState;
            if (state === 'failed') this.fail('Call connection was lost.');
            else if (state === 'disconnected' && this.connected) {
              this.update('reconnecting');
              this.disconnectTimer ??= setTimeout(() => this.fail('Call connection was lost.'), 10000);
            } else if (state === 'connected' && this.connected) {
              clearTimeout(this.disconnectTimer); this.disconnectTimer = undefined;
              this.update('connected');
            }
          };
          return this.media;
        },
        delegate: { onDisconnect: () => { if (!this.cancelled) this.fail('Call connection was lost.'); } },
      });
      this.ua = ua;
      await ua.start();
      if (this.cancelled) { void ua.stop().catch(() => {}); return; }
      if (credentials.sip_register) {
        await new Promise<void>((resolve, reject) => {
          void new Registerer(ua).register({ requestDelegate: {
            onAccept: () => resolve(), onReject: () => reject(new Error('Registration rejected')),
          } }).catch(reject);
        });
      }
      if (this.cancelled) return;
      const inviter = new Inviter(ua, target, {
        extraHeaders: [`X-Agent-Id: ${credentials.agent_id}`, `X-Run-Id: ${credentials.run_id}`],
      });
      this.inviter = inviter;
      inviter.stateChange.addListener(state => {
        if (this.cancelled) return;
        if (state === SessionState.Established) {
          this.connected = true;
          this.hold(this.held);
          clearTimeout(this.timer);
          this.update('connected');
        } else if (state === SessionState.Terminated) {
          if (this.connected) this.stop();
          else this.fail('Mira could not answer. Try calling again.');
        }
      });
      await inviter.invite({ requestDelegate: {
        onProgress: response => {
          if (!this.cancelled && !this.connected && response.message.statusCode === 180) this.update('ringing');
        },
        onReject: () => this.fail('Mira could not answer. Try calling again.'),
      } });
    } catch (error) {
      if (this.cancelled) return;
      this.fail(error instanceof ApiError && error.status === 401 ? error.message
        : phase === 'context' ? 'Call context could not load. Retry call or continue with Talk.'
        : phase === 'session' ? error instanceof ApiError
          ? `${error.message} Continue with Talk if you prefer.`
          : 'Mira calling is temporarily offline. Retry call or continue with Talk.'
        : phase === 'microphone' ? 'Microphone access is needed. Allow it in Settings or continue with Talk.'
        : 'Mira could not connect. Retry call or continue with Talk.');
    }
  }

  mute(value: boolean) {
    this.muted = value;
    this.stream?.getAudioTracks().forEach(track => { track.enabled = !value && !this.held; });
  }

  async getAudioLevel() {
    if (!this.connected || this.cancelled || this.held || !this.media) return 0;
    try {
      const stats: Map<string, ReceivedAudioStats> = await this.media.pc.getStats();
      let level = 0;
      stats.forEach(report => {
        if (report.type !== 'inbound-rtp' || (report.kind !== 'audio' && report.mediaType !== 'audio')) return;
        if (typeof report.audioLevel === 'number') level = Math.max(level, report.audioLevel);
        else if (typeof report.totalAudioEnergy === 'number' && typeof report.totalSamplesDuration === 'number') {
          const previous = this.audioEnergy.get(report.id);
          if (previous) {
            const duration = report.totalSamplesDuration - previous.duration;
            const energy = report.totalAudioEnergy - previous.energy;
            if (duration > 0 && energy > 0) level = Math.max(level, Math.sqrt(energy / duration));
          }
          this.audioEnergy.set(report.id, { energy: report.totalAudioEnergy, duration: report.totalSamplesDuration });
        }
      });
      return this.cancelled ? 0 : Math.min(1, level);
    } catch { return 0; }
  }

  hold(value: boolean) {
    this.held = value; this.mute(this.muted);
    this.media?.pc.getReceivers().forEach(receiver => { if (receiver.track) receiver.track.enabled = !value; });
  }

  private fail(message: string) {
    if (this.cancelled) return;
    this.stop(false); this.update('failed', message);
  }

  stop(notify = true) {
    if (this.cancelled) return;
    this.cancelled = true;
    this.abort.abort();
    clearTimeout(this.timer);
    clearTimeout(this.disconnectTimer);
    // Release capture immediately, even if SIP shutdown cannot reach the server.
    this.media?.close();
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream?.release();
    this.releaseMicrophone?.(); this.releaseMicrophone = undefined;
    const inviter = this.inviter;
    const ua = this.ua;
    const hangup = inviter?.state === SessionState.Established ? inviter.bye()
      : inviter?.state === SessionState.Establishing ? inviter.cancel() : Promise.resolve();
    void hangup.catch(() => {}).finally(() => { void ua?.stop().catch(() => {}); });
    if (notify) this.update('ended');
  }
}
