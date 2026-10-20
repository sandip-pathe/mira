import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { ApiError, DemoSession, Message, renewDemoSession, request } from './api';
import { SupportDecision } from './interventions';
import type { ContextMatch, MomentState } from '../features/talk/conversation';
import { activityCapabilities } from './activityRegistry';
import { currentConsentRevision, selectTalkContext } from '../features/talk/data/contextRepository';

export type VoiceTransportState =
  | 'disconnected'
  | 'connecting'
  | 'ready'
  | 'reconnecting'
  | 'error';
export type VoiceTurnState =
  | 'idle'
  | 'starting'
  | 'recording'
  | 'finalizing'
  | 'processing'
  | 'speaking'
  | 'failed';
export type VoiceState = VoiceTransportState | VoiceTurnState | 'turn_error';
type Callbacks = {
  transport: (value: VoiceTransportState) => void;
  turn: (value: VoiceTurnState) => void;
  audioLevel: (value: number) => void;
  message: (message: Message) => void;
  error: (message: string) => void;
  decision: (decision: SupportDecision) => void;
  moment: (state: MomentState) => void;
  context: (matches: ContextMatch[], noMatch?: boolean) => void;
  declinedInterventions: () => string[];
  urgentHelp: () => void;
};

const momentModes = new Set<MomentState['support_mode']>([
  'listen_more', 'clarify', 'offer_action', 'continue_action', 'check_outcome', 'suggest_human_support',
]);
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function exactKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).length === keys.length && keys.every((key) => key in value);
}
function parseToolArguments(name: string, raw: string): Record<string, unknown> {
  if (raw.length > 5000) throw new Error('Tool arguments are too large.');
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value)) throw new Error('Tool arguments are invalid.');
  if (name === 'retrieve_shared_context') {
    if (!exactKeys(value, ['query', 'max_results']) || typeof value.query !== 'string' ||
        !value.query.trim() || value.query.length > 500 || value.max_results !== 1)
      throw new Error('Context query is invalid.');
  } else if (name === 'choose_support') {
    if (!exactKeys(value, ['user_message', 'situation_summary', 'current_need']) ||
        typeof value.user_message !== 'string' || value.user_message.length > 2000 ||
        typeof value.situation_summary !== 'string' || value.situation_summary.length > 500 ||
        typeof value.current_need !== 'string' || value.current_need.length > 240)
      throw new Error('Support request is invalid.');
  } else if (name === 'update_moment_state') {
    const keys = ['what_happened', 'current_need', 'what_is_unclear', 'support_mode', 'suggested_action', 'previously_helpful'];
    const max: Record<string, number> = {
      what_happened: 240, current_need: 160, what_is_unclear: 160,
      suggested_action: 160, previously_helpful: 160,
    };
    if (!exactKeys(value, keys) || !momentModes.has(value.support_mode as MomentState['support_mode']) ||
        keys.some((key) => key !== 'support_mode' &&
          (typeof value[key] !== 'string' || (value[key] as string).length > max[key])))
      throw new Error('Moment update is invalid.');
  } else throw new Error('Unknown tool.');
  return value;
}

export async function requestMicrophonePermission(context: 'talk' | 'brain_dump' = 'talk') {
  const title = context === 'talk' ? 'Use your microphone in Talk?' : 'Use your microphone in Brain Dump?';
  const message = context === 'talk'
    ? 'Mira only captures audio while you hold the Talk button to speak.'
    : 'Mira only captures audio while you hold to speak. The transcript stays in this temporary draft.';
  const deniedAndroid = context === 'talk'
    ? 'Microphone access is needed for voice. You can allow it in Settings or use text.'
    : 'Microphone access was not allowed. Your typed draft is still here.';
  const deniedOther = context === 'talk'
    ? 'Microphone access is needed for voice. Allow it in Settings or use text.'
    : 'Microphone access was not allowed. Your typed draft is still here.';
  const { permissions } = require('react-native-webrtc') as typeof import('react-native-webrtc');
  if (Platform.OS === 'android') {
    const permission = (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO))
      ? PermissionsAndroid.RESULTS.GRANTED
      : await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title,
          message,
          buttonPositive: 'Continue',
          buttonNegative: 'Not now',
        });
    if (permission !== PermissionsAndroid.RESULTS.GRANTED)
      throw new Error(deniedAndroid);
    return;
  }
  const permission = await permissions.query({ name: 'microphone' });
  const granted = permission === permissions.RESULT.GRANTED ||
    (permission === permissions.RESULT.PROMPT && (await permissions.request({ name: 'microphone' })) === true);
  if (!granted) throw new Error(deniedOther);
}

export class Voice {
  private pc: any;
  private channel: any;
  private stream: any;
  private audioSender: any;
  private senderUpdate: Promise<void> = Promise.resolve();
  private mediaDevices: any;
  private remoteTracks: any[] = [];
  private timeout?: ReturnType<typeof setTimeout>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private ready = false;
  private peerConnected = false;
  private channelOpen = false;
  private sessionStarted = false;
  private held = false;
  private holdAttempt = 0;
  private captureReady = false;
  private holdAt = 0;
  private releasedAt = 0;
  private responseActive = false;
  private responseId?: string;
  private cancelledResponses = new Set<string>();
  private completedResponses = new Set<string>();
  private playedResponses = new Set<string>();
  private captions = new Map<string, string>();
  private commits: number[] = [];
  private outputPlaying = false;
  private playingResponseId?: string;
  private suppressed = false;
  private epoch = 0;
  private turn = 0;
  private generation = 0;
  private seenCalls = new Set<string>();
  private toolJobs = 0;
  private continueAfterTools = false;
  private awaitingTranscript = false;
  private statsTimer?: ReturnType<typeof setInterval>;
  private lastAudioLevel = 0;
  private previousAudioStats = new Map<string, { energy: number; duration: number }>();
  private audioMeterGeneration = 0;
  private remoteAudioTrack: any;
  private session?: DemoSession;
  private connectController?: AbortController;
  private toolAbortControllers = new Set<AbortController>();

  constructor(private callbacks: Callbacks) {}

  async requestMicPermission() {
    await requestMicrophonePermission();
  }

  async connect(
    session: DemoSession,
    history: Message[],
    momentState?: unknown,
    reconnecting = false,
    permissionGranted = false,
  ) {
    this.close(false);
    const epoch = this.epoch;
    const connectController = new AbortController();
    this.connectController = connectController;
    this.session = session;
    this.callbacks.transport(reconnecting ? 'reconnecting' : 'connecting');
    this.timeout = setTimeout(() => {
      if (!this.ready && epoch === this.epoch)
        this.fail('Voice connection timed out. Retry voice or continue with text.');
    }, 30000);
    try {
      // Lazy load lets Expo Go preview Journal without evaluating native WebRTC.
      const { RTCPeerConnection, RTCSessionDescription, mediaDevices } =
        require('react-native-webrtc') as typeof import('react-native-webrtc');
      this.mediaDevices = mediaDevices;
      if (!permissionGranted) await this.requestMicPermission();
      if (epoch !== this.epoch || AppState.currentState !== 'active') return;
      const pc = new RTCPeerConnection({ iceServers: [] });
      this.pc = pc;
      // Negotiate the audio channel now; acquire a microphone track only during a hold.
      this.audioSender = pc.addTransceiver('audio', { direction: 'sendrecv' }).sender;
      const channel = pc.createDataChannel('oai-events');
      this.channel = channel;
      channel.onmessage = (event: any) => {
        if (epoch !== this.epoch) return;
        try {
          this.event(JSON.parse(event.data));
        } catch {
          this.fail('Voice event could not be processed. Retry voice or continue with text.');
        }
      };
      channel.onopen = () => {
        if (epoch !== this.epoch) return;
        this.channelOpen = true;
        // Restore only confirmed captions; do not replay unfinished audio turns.
        this.addTextMessages(history);
        this.maybeReady();
      };
      channel.onclose = () => {
        if (epoch === this.epoch) this.fail('Voice connection dropped. Reconnecting…', this.ready);
      };
      pc.onconnectionstatechange = () => {
        if (epoch !== this.epoch) return;
        if (pc.connectionState === 'connected') {
          this.peerConnected = true;
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = undefined;
          this.maybeReady();
        } else if (pc.connectionState === 'disconnected' && this.ready) {
          this.peerConnected = false;
          this.callbacks.transport('reconnecting');
          this.reconnectTimer = setTimeout(() => {
            if (epoch === this.epoch && pc.connectionState === 'disconnected')
              this.fail('Voice connection dropped. Reconnecting…', true);
          }, 1800);
        } else if (['failed', 'closed'].includes(pc.connectionState)) {
          this.peerConnected = false;
          this.fail('Voice connection dropped. Reconnecting…', this.ready);
        }
      };
      pc.ontrack = (event: any) => {
        if (epoch !== this.epoch) return;
        this.remoteTracks.push(event.track);
        this.remoteAudioTrack = event.track;
        event.track.enabled = !this.suppressed;
        this.startAudioMeter(pc, event.track, 'inbound');
      };
      let activeSession = session;
      const voiceRequest = () => request<{
        value: string;
        generation: number;
      }>(`/sessions/${activeSession.session_id}/voice`, activeSession, {
        moment_state: momentState ?? null,
        client_activity_capabilities: activityCapabilities(),
      }, 'POST', { signal: connectController.signal });
      const offerPromise = (async () => {
        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);
        return offer;
      })();
      const offer = await offerPromise;
      let secret: Awaited<ReturnType<typeof voiceRequest>>;
      try {
        secret = await voiceRequest();
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401 || epoch !== this.epoch) throw error;
        activeSession = await renewDemoSession(activeSession);
        if (epoch !== this.epoch || connectController.signal.aborted) return;
        this.session = activeSession;
        secret = await voiceRequest();
      }
      if (epoch !== this.epoch) return;
      this.session = activeSession;
      this.generation = secret.generation;
      const openAiController = new AbortController();
      const abortOpenAi = () => openAiController.abort();
      connectController.signal.addEventListener('abort', abortOpenAi, { once: true });
      const openAiTimeout = setTimeout(abortOpenAi, 25000);
      let response: Response;
      try {
        response = await fetch('https://api.openai.com/v1/realtime/calls', {
          method: 'POST',
          headers: { Authorization: `Bearer ${secret.value}`, 'Content-Type': 'application/sdp' },
          body: offer.sdp,
          signal: openAiController.signal,
        });
      } finally {
        clearTimeout(openAiTimeout);
        connectController.signal.removeEventListener('abort', abortOpenAi);
      }
      if (epoch !== this.epoch) return;
      if (!response.ok) throw new Error('Mira is temporarily offline.');
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: await response.text() }),
      );
      if (this.connectController === connectController) this.connectController = undefined;
    } catch (error) {
      if (this.connectController === connectController) this.connectController = undefined;
      if (epoch === this.epoch)
        this.fail(
          error instanceof Error
            ? error.message
            : 'Voice unavailable. Retry voice or continue with text.',
        );
    }
  }

  private send(event: object) {
    if (this.channel?.readyState === 'open') this.channel.send(JSON.stringify(event));
  }
  private maybeReady() {
    if (this.ready || !this.peerConnected || !this.channelOpen || !this.sessionStarted) return;
    this.ready = true;
    clearTimeout(this.timeout);
    this.callbacks.transport('ready');
  }
  private startAudioMeter(pc: any, track: any, direction: 'inbound' | 'outbound') {
    clearInterval(this.statsTimer);
    const generation = ++this.audioMeterGeneration;
    this.previousAudioStats.clear();
    this.statsTimer = setInterval(async () => {
      if (pc !== this.pc || !this.ready || (direction === 'inbound' && this.suppressed)) return;
      try {
        const stats = await pc.getStats(track);
        if (generation !== this.audioMeterGeneration) return;
        let level = 0;
        stats.forEach((report: any) => {
          if (
            (report.type === `${direction}-rtp` ||
              (direction === 'outbound' && report.type === 'media-source')) &&
            (report.kind === 'audio' || report.mediaType === 'audio') &&
            report.isRemote !== true
          ) {
            if (typeof report.audioLevel === 'number') {
              level = Math.max(level, report.audioLevel);
            } else if (
              typeof report.totalAudioEnergy === 'number' &&
              typeof report.totalSamplesDuration === 'number'
            ) {
              const previous = this.previousAudioStats.get(report.id);
              if (previous) {
                const energy = report.totalAudioEnergy - previous.energy;
                const duration = report.totalSamplesDuration - previous.duration;
                if (energy > 0 && duration > 0)
                  level = Math.max(level, Math.sqrt(energy / duration));
              }
              this.previousAudioStats.set(report.id, {
                energy: report.totalAudioEnergy,
                duration: report.totalSamplesDuration,
              });
            }
          }
        });
        this.lastAudioLevel = level;
        this.callbacks.audioLevel(level);
      } catch {
        // Stats are only used for visualization; audio continues without them.
      }
    }, 100);
  }
  addTextMessages(messages: Message[]) {
    messages.forEach((message) =>
      this.send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: message.role,
          content: [
            { type: message.role === 'user' ? 'input_text' : 'text', text: message.content },
          ],
        },
      }),
    );
  }
  private stopCapture() {
    const stream = this.stream;
    this.stream = undefined;
    this.captureReady = false;
    stream?.getTracks().forEach((track: any) => {
      track.enabled = false;
      track.stop();
    });
    stream?.release();
    return this.replaceAudioTrack(null).catch(() => {});
  }
  private replaceAudioTrack(track: any) {
    const sender = this.audioSender;
    this.senderUpdate = this.senderUpdate
      .catch(() => {})
      .then(() => (sender ? sender.replaceTrack(track) : undefined));
    return this.senderUpdate;
  }
  private muteOutput(muted: boolean) {
    this.remoteTracks.forEach((track) => {
      track.enabled = !muted;
    });
  }

  private cancelToolWork() {
    this.toolAbortControllers.forEach((controller) => controller.abort());
    this.toolAbortControllers.clear();
  }

  async press() {
    if (!this.ready || this.held || AppState.currentState !== 'active') return;
    this.turn++;
    this.cancelToolWork();
    this.held = true;
    this.captureReady = false;
    const holdAttempt = ++this.holdAttempt;
    this.holdAt = Date.now();
    this.suppressed = true;
    this.continueAfterTools = false;
    this.muteOutput(true);
    if (this.responseId) this.cancelledResponses.add(this.responseId);
    if (this.playingResponseId) this.cancelledResponses.add(this.playingResponseId);
    if (this.responseActive) this.send({ type: 'response.cancel' });
    if (this.outputPlaying || this.responseActive) this.send({ type: 'output_audio_buffer.clear' });
    this.send({ type: 'input_audio_buffer.clear' });
    this.callbacks.turn('starting');
    try {
      const stream = await this.mediaDevices.getUserMedia({ audio: true, video: false });
      const track = stream.getAudioTracks()[0];
      if (!track) throw new Error('Microphone is unavailable. You can retry or use text.');
      if (!this.held || holdAttempt !== this.holdAttempt || !this.ready) {
        stream.getTracks().forEach((item: any) => item.stop());
        stream.release();
        return;
      }
      this.stream = stream;
      track.enabled = true;
      await this.replaceAudioTrack(track);
      if (!this.held || holdAttempt !== this.holdAttempt || !this.ready) {
        this.stopCapture();
        return;
      }
      this.captureReady = true;
      this.startAudioMeter(this.pc, track, 'outbound');
      this.callbacks.turn('recording');
    } catch (error) {
      if (holdAttempt !== this.holdAttempt) return;
      this.held = false;
      this.stopCapture();
      this.callbacks.audioLevel(0);
      this.callbacks.error(
        error instanceof Error ? error.message : 'Microphone unavailable. Retry or use text.',
      );
      this.callbacks.turn('failed');
    }
  }

  async release() {
    if (!this.held) return;
    this.held = false;
    this.holdAttempt++;
    const captured = this.captureReady;
    const detach = this.stopCapture();
    if (!this.ready) {
      await detach;
      return;
    }
    if (!captured) {
      this.send({ type: 'input_audio_buffer.clear' });
      this.callbacks.turn('idle');
      await detach;
      return;
    }
    if (Date.now() - this.holdAt < 350) {
      await detach;
      if (this.remoteAudioTrack && this.pc)
        this.startAudioMeter(this.pc, this.remoteAudioTrack, 'inbound');
      this.send({ type: 'input_audio_buffer.clear' });
      this.callbacks.turn('idle');
      return;
    }
    this.releasedAt = Date.now();
    const releasedTurn = this.turn;
    this.callbacks.turn('finalizing');
    await detach;
    if (this.remoteAudioTrack && this.pc)
      this.startAudioMeter(this.pc, this.remoteAudioTrack, 'inbound');
    if (!this.ready || this.held || this.turn !== releasedTurn) return;
    this.commits.push(releasedTurn);
    this.send({ type: 'input_audio_buffer.commit' });
    // Create the response on the commit acknowledgement to avoid an empty-buffer race.
  }

  cancel() {
    this.turn++;
    this.cancelToolWork();
    this.holdAttempt++;
    void this.stopCapture();
    this.held = false;
    this.releasedAt = 0;
    this.suppressed = true;
    this.continueAfterTools = false;
    this.muteOutput(true);
    if (this.responseId) this.cancelledResponses.add(this.responseId);
    if (this.playingResponseId) this.cancelledResponses.add(this.playingResponseId);
    if (this.responseActive) this.send({ type: 'response.cancel' });
    this.send({ type: 'output_audio_buffer.clear' });
    this.send({ type: 'input_audio_buffer.clear' });
    this.awaitingTranscript = false;
    this.callbacks.turn('idle');
  }

  private event(event: any) {
    if (event.response_id && this.cancelledResponses.has(event.response_id)) return;
    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        const turnDetection = event.session?.audio?.input?.turn_detection;
        if (turnDetection !== undefined && turnDetection !== null) {
          this.fail('Push-to-talk configuration was not accepted.');
          return;
        }
        this.sessionStarted = true;
        this.maybeReady();
        break;
      case 'input_audio_buffer.committed':
        if (this.commits.shift() === this.turn && this.releasedAt && !this.held) {
          this.suppressed = false;
          this.muteOutput(false);
          this.awaitingTranscript = true;
          this.callbacks.turn('processing');
        }
        break;
      case 'response.created':
        this.responseActive = true;
        this.responseId = event.response?.id;
        if (this.suppressed) {
          if (this.responseId) this.cancelledResponses.add(this.responseId);
          this.send({ type: 'response.cancel' });
        }
        break;
      case 'response.done':
        if (this.responseId && event.response?.id && this.responseId !== event.response.id) break;
        this.responseActive = false;
        this.responseId = undefined;
        if (event.response?.status === 'completed') {
          this.completedResponses.add(event.response.id);
          this.confirmCaption(event.response.id);
        }
        this.continueTools();
        if (!this.held && !this.outputPlaying && !this.toolJobs && !this.continueAfterTools)
          this.callbacks.turn('idle');
        break;
      case 'output_audio_buffer.started':
        if (this.suppressed) {
          this.send({ type: 'output_audio_buffer.clear' });
          break;
        }
        this.outputPlaying = true;
        this.playingResponseId = event.response_id;
        this.callbacks.turn('speaking');
        if (this.releasedAt) {
          this.releasedAt = 0;
        }
        break;
      case 'output_audio_buffer.stopped':
        if (event.response_id) {
          this.playedResponses.add(event.response_id);
          this.confirmCaption(event.response_id);
        }
        this.outputPlaying = false;
        this.playingResponseId = undefined;
        if (!this.held && !this.responseActive) this.callbacks.turn('idle');
        break;
      case 'output_audio_buffer.cleared':
        this.outputPlaying = false;
        this.playingResponseId = undefined;
        if (!this.held && !this.responseActive) this.callbacks.turn('idle');
        break;
      case 'conversation.item.input_audio_transcription.completed':
        if (typeof event.transcript === 'string' && event.transcript.trim()) {
          const transcript = event.transcript.trim();
          this.callbacks.message({ role: 'user', content: transcript });
          if (transcript === 'I am in immediate danger and need emergency help now.') {
            this.cancel();
            this.callbacks.urgentHelp();
            break;
          }
          if (this.awaitingTranscript && !this.suppressed) {
            this.awaitingTranscript = false;
            this.send({ type: 'response.create' });
          }
        } else if (this.awaitingTranscript) {
          this.awaitingTranscript = false;
          this.releasedAt = 0;
          this.callbacks.turn('idle');
        }
        break;
      case 'conversation.item.input_audio_transcription.failed':
        this.awaitingTranscript = false;
        this.releasedAt = 0;
        this.callbacks.turn('idle');
        break;
      case 'response.output_audio_transcript.done':
        if (!this.suppressed && event.transcript && event.response_id) {
          this.captions.set(event.response_id, event.transcript);
          this.confirmCaption(event.response_id);
        }
        break;
      case 'response.function_call_arguments.done':
        void this.relay(event);
        break;
      case 'error':
        // Cancellation can race completion. It is safe to ignore only this specific race.
        if (event.error?.code === 'response_cancel_not_active') break;
        this.cancel();
        this.callbacks.error(
          event.error?.code
            ? `Voice turn failed (${event.error.code}). Hold to try again or continue with text.`
            : 'Voice turn failed. Hold to try again or continue with text.',
        );
        this.callbacks.turn('failed');
        break;
    }
  }

  private confirmCaption(id: string) {
    if (this.cancelledResponses.has(id)) {
      this.captions.delete(id);
      return;
    }
    if (!this.completedResponses.has(id) || !this.playedResponses.has(id)) return;
    const caption = this.captions.get(id);
    if (!caption) return;
    this.captions.delete(id);
    this.callbacks.message({ role: 'assistant', content: caption });
  }

  private continueTools() {
    if (
      this.continueAfterTools &&
      !this.toolJobs &&
      !this.responseActive &&
      !this.held &&
      !this.suppressed
    ) {
      this.continueAfterTools = false;
      this.send({ type: 'response.create' });
    }
  }

  private async relay(event: any) {
    if (!this.session || this.suppressed || this.seenCalls.has(event?.call_id)) return;
    if (typeof event.call_id !== 'string' || event.call_id.length > 128 ||
        !/^[A-Za-z0-9_-]+$/.test(event.call_id)) return;
    this.seenCalls.add(event.call_id);
    const epoch = this.epoch, turn = this.turn, session = this.session;
    const controller = new AbortController();
    this.toolAbortControllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 12000);
    this.toolJobs++;
    let output: unknown;
    try {
      const args = parseToolArguments(event.name, event.arguments);
      if (event.name === 'retrieve_shared_context') {
        const selected = await selectTalkContext(args.query as string);
        const currentRevision = await currentConsentRevision();
        if (epoch !== this.epoch || turn !== this.turn) return;
        const matches = currentRevision === selected.revision ? selected.matches : [];
        output = { matches, no_match: !matches.length };
        this.callbacks.context(matches, !matches.length);
      } else if (event.name === 'update_moment_state') {
        const moment = args as unknown as MomentState;
        this.callbacks.moment(moment);
        output = { moment_state: moment };
      } else {
        const call = { call_id: event.call_id, name: event.name, arguments: args };
        await request(
          `/sessions/${session.session_id}/tool-calls?generation=${this.generation}`,
          session,
          call,
          undefined,
          { signal: controller.signal },
        );
        if (epoch !== this.epoch || turn !== this.turn) return;
        const query = `${args.user_message} ${args.situation_summary} ${args.current_need}`;
        const approved = await selectTalkContext(query);
        const revision = await currentConsentRevision();
        if (epoch !== this.epoch || turn !== this.turn) return;
        if (revision !== approved.revision) throw new Error('Consent changed during support request.');
        const response = await request<{ call_id: string; result: any }>(
          `/sessions/${session.session_id}/tools`,
          session,
          { call, approved_preferences: approved.preferences, declined_interventions: this.callbacks.declinedInterventions(), consent_revision: revision },
          undefined,
          { signal: controller.signal },
        );
        if (epoch !== this.epoch || turn !== this.turn) return;
        if (response.call_id !== event.call_id) throw new Error('Mismatched call ID');
        output = response.result;
        if (response.result.decision) this.callbacks.decision(response.result.decision);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && epoch === this.epoch) {
        this.fail('Voice capability expired. Reconnectingâ€¦', true);
        return;
      }
      output = { error: 'tool_unavailable', instruction: 'Continue without saved context or an activity suggestion.' };
      if (epoch === this.epoch && turn === this.turn)
        this.callbacks.error('Tool unavailable. Continuing without its result.');
    } finally {
      clearTimeout(timeout);
      this.toolAbortControllers.delete(controller);
      if (epoch === this.epoch) {
        this.toolJobs--;
        if (turn === this.turn && !this.suppressed && output !== undefined) {
          this.send({ type: 'conversation.item.create', item: {
            type: 'function_call_output', call_id: event.call_id, output: JSON.stringify(output),
          } });
          this.continueAfterTools = true;
          this.continueTools();
        }
      }
    }
  }

  private fail(message: string, recoverable = false) {
    this.close(false);
    this.callbacks.error(message);
    this.callbacks.transport(recoverable ? 'reconnecting' : 'error');
  }

  close(notify = true) {
    this.connectController?.abort();
    this.connectController = undefined;
    this.toolAbortControllers.forEach((controller) => controller.abort());
    this.toolAbortControllers.clear();
    void this.stopCapture();
    this.muteOutput(true);
    this.epoch++;
    this.ready = false;
    this.held = false;
    this.responseActive = false;
    this.responseId = undefined;
    this.outputPlaying = false;
    this.playingResponseId = undefined;
    this.suppressed = true;
    this.releasedAt = 0;
    this.toolJobs = 0;
    this.continueAfterTools = false;
    this.awaitingTranscript = false;
    clearTimeout(this.timeout);
    clearTimeout(this.reconnectTimer);
    clearInterval(this.statsTimer);
    this.statsTimer = undefined;
    this.audioMeterGeneration++;
    this.lastAudioLevel = 0;
    this.previousAudioStats.clear();
    this.channel?.close();
    this.pc?.close();
    this.channel = this.stream = this.pc = undefined;
    this.audioSender = this.mediaDevices = undefined;
    this.session = undefined;
    this.remoteTracks = [];
    this.remoteAudioTrack = undefined;
    this.seenCalls.clear();
    this.cancelledResponses.clear();
    this.completedResponses.clear();
    this.playedResponses.clear();
    this.captions.clear();
    this.commits = [];
    this.peerConnected = false;
    this.channelOpen = false;
    this.sessionStarted = false;
    if (notify) {
      this.callbacks.turn('idle');
      this.callbacks.audioLevel(0);
      this.callbacks.transport('disconnected');
    }
  }
}
