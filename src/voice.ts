import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { DemoSession, Message, request } from './api';

export type VoiceState = 'disconnected' | 'connecting' | 'ready' | 'listening' | 'thinking' | 'speaking';
export type Metric = { event: string; ms?: number };
type Callbacks = {
  state: (value: VoiceState) => void;
  message: (message: Message) => void;
  error: (message: string) => void;
  metric: (metric: Metric) => void;
  actions: (actions: Array<{ id: string; title: string; summary: string; steps: string[] }>) => void;
  context: (matches: Array<{ id: string; source_type: 'journal' | 'feedback'; source_id: string; excerpt: string }>, noMatch?: boolean) => void;
  urgentHelp: () => void;
};

export class Voice {
  private pc: any;
  private channel: any;
  private stream: any;
  private remoteTracks: any[] = [];
  private lifecycle?: ReturnType<typeof AppState.addEventListener>;
  private timeout?: ReturnType<typeof setTimeout>;
  private ready = false;
  private held = false;
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
  private session?: DemoSession;

  constructor(private callbacks: Callbacks) {}

  async connect(session: DemoSession, history: Message[], feedbackId?: string) {
    this.close();
    const epoch = this.epoch;
    this.session = session;
    this.callbacks.state('connecting');
    this.lifecycle = AppState.addEventListener('change', state => {
      if (state !== 'active') this.close();
    });
    this.timeout = setTimeout(() => {
      if (!this.ready && epoch === this.epoch) this.fail('Voice connection timed out. Retry voice or continue with text.');
    }, 30000);
    try {
      // Lazy load lets Expo Go preview Journal without evaluating native WebRTC.
      const { RTCPeerConnection, RTCSessionDescription, mediaDevices } = require('react-native-webrtc') as typeof import('react-native-webrtc');
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Microphone permission denied. Continue with text.');
      }
      if (epoch !== this.epoch || AppState.currentState !== 'active') return;
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getAudioTracks().forEach(track => { track.enabled = false; });
      if (epoch !== this.epoch) { stream.getTracks().forEach(track => track.stop()); stream.release(); return; }
      this.stream = stream;
      const pc = new RTCPeerConnection({ iceServers: [] });
      this.pc = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      const channel = pc.createDataChannel('oai-events');
      this.channel = channel;
      channel.onmessage = (event: any) => {
        if (epoch !== this.epoch) return;
        try { this.event(JSON.parse(event.data)); }
        catch { this.fail('Voice event could not be processed. Retry voice or continue with text.'); }
      };
      channel.onopen = () => {
        if (epoch !== this.epoch) return;
        // Restore only confirmed captions; do not replay unfinished audio turns.
        history.forEach(message => this.send({ type: 'conversation.item.create', item: {
          type: 'message', role: message.role,
          content: [{ type: message.role === 'user' ? 'input_text' : 'text', text: message.content }],
        } }));
        this.send({ type: 'session.update', session: { type: 'realtime', audio: { input: { turn_detection: null } } } });
      };
      channel.onclose = () => { if (epoch === this.epoch) this.fail('Voice connection dropped. Retry voice or continue with text.'); };
      pc.onconnectionstatechange = () => {
        if (epoch === this.epoch && ['failed', 'disconnected', 'closed'].includes(pc.connectionState))
          this.fail('Voice connection dropped. Retry voice or continue with text.');
      };
      pc.ontrack = (event: any) => {
        if (epoch !== this.epoch) return;
        this.remoteTracks.push(event.track);
        event.track.enabled = !this.suppressed;
      };
      const secret = await request<{ value: string; generation: number; context_source?: { id: string; source_type: 'feedback'; source_id: string; label: string; excerpt: string } | null }>(
        `/sessions/${session.session_id}/voice`, session, { feedback_id: feedbackId ?? null });
      if (secret.context_source) this.callbacks.context([secret.context_source]);
      if (epoch !== this.epoch) return;
      this.generation = secret.generation;
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      const response = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST', headers: { Authorization: `Bearer ${secret.value}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp, signal: AbortSignal.timeout(25000),
      });
      if (epoch !== this.epoch) return;
      if (!response.ok) throw new Error('Mira is temporarily offline.');
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: await response.text() }));
    } catch (error) {
      if (epoch === this.epoch) this.fail(error instanceof Error ? error.message : 'Voice unavailable. Retry voice or continue with text.');
    }
  }

  private send(event: object) {
    if (this.channel?.readyState === 'open') this.channel.send(JSON.stringify(event));
  }
  private mic(enabled: boolean) {
    this.stream?.getAudioTracks().forEach((track: any) => { track.enabled = enabled; });
  }
  private muteOutput(muted: boolean) {
    this.remoteTracks.forEach(track => { track.enabled = !muted; });
  }

  press() {
    if (!this.ready || this.held || AppState.currentState !== 'active') return;
    this.turn++;
    this.held = true;
    this.holdAt = Date.now();
    this.suppressed = true;
    this.continueAfterTools = false;
    this.muteOutput(true);
    if (this.responseId) this.cancelledResponses.add(this.responseId);
    if (this.playingResponseId) this.cancelledResponses.add(this.playingResponseId);
    if (this.responseActive) this.send({ type: 'response.cancel' });
    if (this.outputPlaying || this.responseActive) this.send({ type: 'output_audio_buffer.clear' });
    this.send({ type: 'input_audio_buffer.clear' });
    this.mic(true);
    this.callbacks.state('listening');
    this.callbacks.metric({ event: 'mic enabled on hold' });
  }

  release() {
    this.mic(false);
    if (!this.held) return;
    this.held = false;
    if (!this.ready) return;
    if (Date.now() - this.holdAt < 150) {
      this.send({ type: 'input_audio_buffer.clear' });
      this.callbacks.state('ready');
      return;
    }
    this.releasedAt = Date.now();
    this.commits.push(this.turn);
    this.send({ type: 'input_audio_buffer.commit' });
    // Create the response on the commit acknowledgement to avoid an empty-buffer race.
    this.callbacks.state('thinking');
    this.callbacks.metric({ event: 'mic disabled; turn committed' });
  }

  cancel() {
    this.turn++;
    this.mic(false);
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
    if (this.ready) this.callbacks.state('ready');
    this.callbacks.metric({ event: 'cancel; mic and output off' });
  }

  private event(event: any) {
    if (event.response_id && this.cancelledResponses.has(event.response_id)) return;
    switch (event.type) {
      case 'session.updated':
        if (event.session?.audio?.input?.turn_detection !== null) {
          this.fail('Push-to-talk configuration was not accepted.'); return;
        }
        this.ready = true;
        clearTimeout(this.timeout);
        this.callbacks.state('ready');
        this.callbacks.metric({ event: 'WebRTC ready; mic off; VAD off' });
        break;
      case 'input_audio_buffer.committed':
        if (this.commits.shift() === this.turn && this.releasedAt && !this.held) {
          this.suppressed = false;
          this.muteOutput(false);
          this.send({ type: 'response.create' });
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
        if (!this.held && !this.outputPlaying && !this.toolJobs && !this.continueAfterTools) this.callbacks.state('ready');
        break;
      case 'output_audio_buffer.started':
        if (this.suppressed) { this.send({ type: 'output_audio_buffer.clear' }); break; }
        this.outputPlaying = true;
        this.playingResponseId = event.response_id;
        this.callbacks.state('speaking');
        if (this.releasedAt) {
          this.callbacks.metric({ event: 'release to output-start (audible timing needs phone)', ms: Date.now() - this.releasedAt });
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
        if (!this.held && !this.responseActive) this.callbacks.state('ready');
        break;
      case 'output_audio_buffer.cleared':
        this.outputPlaying = false;
        this.playingResponseId = undefined;
        if (!this.held && !this.responseActive) this.callbacks.state('ready');
        break;
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          this.callbacks.message({ role: 'user', content: event.transcript });
          if (event.transcript.trim() === 'I am in immediate danger and need emergency help now.') {
            this.cancel(); this.callbacks.urgentHelp();
          }
        }
        break;
      case 'conversation.item.input_audio_transcription.failed':
        this.callbacks.error('This turn could not be transcribed. Try again or continue with text.');
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
        this.callbacks.error('Voice turn failed. Hold to try again or continue with text.');
        if (this.ready) this.callbacks.state('ready');
        break;
    }
  }

  private confirmCaption(id: string) {
    if (this.cancelledResponses.has(id)) { this.captions.delete(id); return; }
    if (!this.completedResponses.has(id) || !this.playedResponses.has(id)) return;
    const caption = this.captions.get(id);
    if (!caption) return;
    this.captions.delete(id);
    this.callbacks.message({ role: 'assistant', content: caption });
  }

  private continueTools() {
    if (this.continueAfterTools && !this.toolJobs && !this.responseActive && !this.held && !this.suppressed) {
      this.continueAfterTools = false;
      this.send({ type: 'response.create' });
    }
  }

  private async relay(event: any) {
    if (!this.session || this.suppressed || this.seenCalls.has(event.call_id)) return;
    this.seenCalls.add(event.call_id);
    const epoch = this.epoch, turn = this.turn, started = Date.now();
    const session = this.session;
    this.toolJobs++;
    let output: unknown;
    try {
      const call = { call_id: event.call_id, name: event.name, arguments: JSON.parse(event.arguments) };
      await request(`/sessions/${session.session_id}/tool-calls?generation=${this.generation}`, session, call);
      if (epoch !== this.epoch || turn !== this.turn) return;
      const response = await request<{ call_id: string; result: any }>(`/sessions/${session.session_id}/tools`, session, call);
      if (epoch !== this.epoch || turn !== this.turn) return;
      if (response.call_id !== event.call_id) throw new Error('Mismatched call ID');
      output = response.result;
      if (response.result.actions) this.callbacks.actions(response.result.actions);
      if (response.result.matches) this.callbacks.context(response.result.matches, response.result.no_match);
      this.callbacks.metric({ event: `tool round-trip: ${event.name}`, ms: Date.now() - started });
    } catch {
      output = { error: 'tool_unavailable', instruction: 'Continue without memory; do not invent actions.' };
      if (epoch === this.epoch && turn === this.turn) this.callbacks.error('Tool unavailable. Continuing without its result.');
    } finally {
      if (epoch === this.epoch) {
        this.toolJobs--;
        if (turn === this.turn && !this.suppressed && output !== undefined) {
          this.send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: event.call_id, output: JSON.stringify(output) } });
          this.continueAfterTools = true;
          this.continueTools();
        }
      }
    }
  }

  private fail(message: string) { this.close(); this.callbacks.error(message); }

  close() {
    this.mic(false);
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
    clearTimeout(this.timeout);
    this.lifecycle?.remove();
    this.lifecycle = undefined;
    this.channel?.close();
    this.stream?.getTracks().forEach((track: any) => track.stop());
    this.stream?.release?.();
    this.pc?.close();
    this.channel = this.stream = this.pc = undefined;
    this.remoteTracks = [];
    this.seenCalls.clear();
    this.cancelledResponses.clear();
    this.completedResponses.clear();
    this.playedResponses.clear();
    this.captions.clear();
    this.commits = [];
    this.callbacks.state('disconnected');
  }
}
