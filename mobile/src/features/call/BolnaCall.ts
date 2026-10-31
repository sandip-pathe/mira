import { Inviter, Registerer, SessionState, UserAgent } from 'sip.js';
import type { MediaStream } from 'react-native-webrtc';
import { getAuthenticatedSession, requestWithRenewal } from '../../shared/api';
import type { NativeCallMedia } from './nativeMedia';

type CallSession = {
  run_id: string; agent_id: string; sip_username: string; sip_password: string;
  wss_url: string; sip_register: boolean; ice_servers: RTCIceServer[];
};
export type CallState = 'connecting' | 'ringing' | 'connected' | 'ended' | 'failed';

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

  constructor(private update: (state: CallState, error?: string) => void) {}

  async start() {
    this.update('connecting');
    this.timer = setTimeout(() => this.fail('Mira could not connect. Try calling again.'), 35000);
    try {
      const session = await getAuthenticatedSession();
      const credentials = await requestWithRenewal<CallSession>(
        '/workers/bolna/session', session, {}, 'POST', { signal: this.abort.signal },
      );
      if (this.cancelled) return;
      const { mediaDevices } = require('react-native-webrtc') as typeof import('react-native-webrtc');
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      if (this.cancelled) {
        stream.getTracks().forEach(track => track.stop());
        stream.release();
        return;
      }
      this.stream = stream;
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
            if (this.media?.pc.connectionState === 'failed') this.fail('Call connection was lost.');
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
          clearTimeout(this.timer);
          this.update('connected');
        } else if (state === SessionState.Terminated) {
          if (this.connected) this.stop();
          else this.fail('Mira could not answer. Try calling again.');
        }
      });
      await inviter.invite({ requestDelegate: {
        onProgress: response => {
          if (!this.cancelled && response.message.statusCode === 180) this.update('ringing');
        },
        onReject: () => this.fail('Mira could not answer. Try calling again.'),
      } });
    } catch {
      if (!this.cancelled) this.fail('Mira could not connect. Check microphone access and try again.');
    }
  }

  mute(value: boolean) { this.stream?.getAudioTracks().forEach(track => { track.enabled = !value; }); }

  private fail(message: string) {
    if (this.cancelled) return;
    this.stop(false); this.update('failed', message);
  }

  stop(notify = true) {
    if (this.cancelled) return;
    this.cancelled = true;
    this.abort.abort();
    clearTimeout(this.timer);
    // Release capture immediately, even if SIP shutdown cannot reach the server.
    this.media?.close();
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream?.release();
    const inviter = this.inviter;
    const ua = this.ua;
    const hangup = inviter?.state === SessionState.Established ? inviter.bye()
      : inviter?.state === SessionState.Establishing ? inviter.cancel() : Promise.resolve();
    void hangup.catch(() => {}).finally(() => { void ua?.stop().catch(() => {}); });
    if (notify) this.update('ended');
  }
}
