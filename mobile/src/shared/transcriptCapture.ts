import { AppState } from 'react-native';
import { getAuthenticatedSession, requestWithRenewal } from './api';
import { requestMicrophonePermission } from './voice';

export type TranscriptCaptureState = 'idle' | 'permission' | 'connecting' | 'starting' | 'recording' | 'transcribing' | 'failed';
export type TranscriptFailureKind = 'permission' | 'transport' | 'capture' | 'transcription' | 'interrupted';
type Callbacks = {
  state: (value: TranscriptCaptureState, requestId?: string) => void;
  transcript: (value: { runId: string; requestId: string; itemId: string; text: string }) => void;
  failure: (value: { runId: string; requestId: string; kind: TranscriptFailureKind; message: string }) => void;
  cancelled: (runId: string, requestId: string) => void;
};

export function transformInsertionAnchor(previous: string, next: string, position: number) {
  let prefix = 0;
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) prefix++;
  let suffix = 0;
  while (suffix < previous.length - prefix && suffix < next.length - prefix &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]) suffix++;
  const removedEnd = previous.length - suffix;
  const insertedLength = next.length - prefix - suffix;
  const delta = insertedLength - (removedEnd - prefix);
  let anchor = position;
  if (anchor > removedEnd) anchor += delta;
  else if (anchor >= prefix) anchor = prefix + insertedLength;
  return Math.max(0, Math.min(anchor, next.length));
}

/** Run-scoped, manual-turn WebRTC capture. It has no response.create or Talk callbacks. */
export class TranscriptCapture {
  private pc: any;
  private channel: any;
  private stream: any;
  private sender: any;
  private mediaDevices: any;
  private ready = false;
  private peerConnected = false;
  private channelOpen = false;
  private sessionStarted = false;
  private held = false;
  private captureReady = false;
  private requestId?: string;
  private committingRequestId?: string;
  private awaitingRequestId?: string;
  private itemRequests = new Map<string, string>();
  private completedItems = new Set<string>();
  private epoch = 0;
  private connectTimer?: ReturnType<typeof setTimeout>;
  private transcriptTimer?: ReturnType<typeof setTimeout>;
  private appSubscription: { remove: () => void };

  constructor(private readonly runId: string, private readonly callbacks: Callbacks) {
    this.appSubscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') this.interrupt();
    });
  }

  async hold(requestId: string) {
    if (!requestId || this.held || this.awaitingRequestId || !this.runId) return;
    this.requestId = requestId;
    this.held = true;
    this.callbacks.state(this.ready ? 'starting' : 'permission', requestId);
    if (this.ready) {
      await this.startMic(requestId, this.epoch);
      return;
    }
    await this.connect(requestId);
  }

  async release(requestId: string) {
    if (!this.held || this.requestId !== requestId) return;
    this.held = false;
    if (!this.captureReady) {
      this.requestId = undefined;
      this.invalidateTransport();
      this.callbacks.cancelled(this.runId, requestId);
      this.callbacks.state('idle');
      return;
    }
    this.captureReady = false;
    this.committingRequestId = requestId;
    this.awaitingRequestId = requestId;
    this.callbacks.state('transcribing', requestId);
    const epoch = this.epoch;
    await this.stopMic();
    if (epoch !== this.epoch || !this.channelOpen || !this.channel) {
      this.fail(requestId, 'interrupted', 'Capture stopped before it could be transcribed. Your typed draft is still here.');
      return;
    }
    this.channel.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    this.transcriptTimer = setTimeout(() => {
      if (this.awaitingRequestId === requestId)
        this.fail(requestId, 'transcription', 'Transcription is taking too long. Retry or discard this voice chunk.');
    }, 30000);
  }

  discard(requestId: string) {
    if (this.requestId !== requestId && this.awaitingRequestId !== requestId && this.committingRequestId !== requestId) return;
    this.held = false;
    this.requestId = undefined;
    this.committingRequestId = undefined;
    this.awaitingRequestId = undefined;
    this.invalidateTransport();
    this.callbacks.state('idle');
  }

  close() {
    this.held = false;
    this.appSubscription.remove();
    this.invalidateTransport();
  }

  private async connect(requestId: string) {
    const epoch = ++this.epoch;
    try {
      await requestMicrophonePermission('brain_dump');
      if (epoch !== this.epoch || !this.held) return;
      this.callbacks.state('connecting', requestId);
      if (AppState.currentState !== 'active') throw new Error('App is not active.');
      const session = await getAuthenticatedSession();
      if (epoch !== this.epoch || !this.held) return;
      const secret = await requestWithRenewal<{ value: string }>(
        '/workers/voice/transcription', session, {}, 'POST',
      );
      if (epoch !== this.epoch || !this.held) return;
      const { RTCPeerConnection, RTCSessionDescription, mediaDevices } =
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- Keep native WebRTC lazy for Expo Go.
        require('react-native-webrtc') as typeof import('react-native-webrtc');
      this.mediaDevices = mediaDevices;
      const pc = new RTCPeerConnection({ iceServers: [] });
      this.pc = pc;
      this.sender = pc.addTransceiver('audio', { direction: 'sendonly' }).sender;
      const channel = pc.createDataChannel('transcription-events');
      this.channel = channel;
      channel.onmessage = (event: any) => {
        if (epoch !== this.epoch) return;
        try { this.event(JSON.parse(event.data)); }
        catch { this.fail(requestId, 'transport', 'Transcription connection returned an unreadable event. Retry or keep typing.'); }
      };
      channel.onopen = () => { if (epoch === this.epoch) { this.channelOpen = true; this.maybeReady(); } };
      channel.onclose = () => {
        if (epoch === this.epoch) this.failActive('transport', 'Transcription connection closed. Retry or keep typing.');
      };
      pc.onconnectionstatechange = () => {
        if (epoch !== this.epoch) return;
        if (pc.connectionState === 'connected') { this.peerConnected = true; this.maybeReady(); }
        else if (['failed', 'closed', 'disconnected'].includes(pc.connectionState))
          this.failActive('transport', 'Transcription connection was interrupted. Retry or keep typing.');
      };
      this.connectTimer = setTimeout(() => {
        if (epoch === this.epoch && !this.ready)
          this.failActive('transport', 'Transcription connection timed out. Retry or keep typing.');
      }, 30000);
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      if (epoch !== this.epoch) return;
      const response = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret.value}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp,
        signal: AbortSignal.timeout(25000),
      });
      if (epoch !== this.epoch) return;
      if (!response.ok) throw new Error('Transcription service is unavailable.');
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: await response.text() }));
      if (epoch !== this.epoch) return;
    } catch (error) {
      if (epoch !== this.epoch) return;
      const message = error instanceof Error ? error.message : 'Voice capture is unavailable. Keep typing.';
      const kind = message.toLowerCase().includes('microphone access') ? 'permission' : 'transport';
      this.fail(requestId, kind, message);
    }
  }

  private maybeReady() {
    if (this.ready || !this.peerConnected || !this.channelOpen || !this.sessionStarted) return;
    this.ready = true;
    clearTimeout(this.connectTimer);
    if (this.held && this.requestId) void this.startMic(this.requestId, this.epoch);
  }

  private async startMic(requestId: string, epoch: number) {
    if (!this.held || this.requestId !== requestId || !this.ready || !this.mediaDevices || !this.sender) return;
    this.callbacks.state('starting', requestId);
    try {
      const stream = await this.mediaDevices.getUserMedia({ audio: true, video: false });
      const track = stream.getAudioTracks()[0];
      if (!track) throw new Error('Microphone is unavailable. Your typed draft is still here.');
      if (epoch !== this.epoch || !this.held || this.requestId !== requestId) {
        stream.getTracks().forEach((item: any) => item.stop()); stream.release?.(); return;
      }
      this.stream = stream;
      track.enabled = true;
      await this.sender.replaceTrack(track);
      if (epoch !== this.epoch || !this.held || this.requestId !== requestId) { await this.stopMic(); return; }
      this.captureReady = true;
      this.callbacks.state('recording', requestId);
    } catch (error) {
      if (epoch !== this.epoch || this.requestId !== requestId) return;
      this.fail(requestId, 'capture', error instanceof Error ? error.message : 'Microphone could not start. Retry or keep typing.');
    }
  }

  private event(event: any) {
    if (event.type === 'session.created' || event.type === 'session.updated') {
      const session = event.session;
      if (session?.type !== 'transcription' || session?.audio?.input?.turn_detection != null) {
        this.failActive('transport', 'The server did not confirm manual transcription mode. Retry or keep typing.');
        return;
      }
      this.sessionStarted = true;
      this.maybeReady();
      return;
    }
    if (event.type === 'input_audio_buffer.committed') {
      const requestId = this.committingRequestId ?? this.awaitingRequestId;
      if (!requestId || typeof event.item_id !== 'string') return;
      this.itemRequests.set(event.item_id, requestId);
      this.committingRequestId = undefined;
      return;
    }
    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      const itemId = event.item_id;
      if (typeof itemId !== 'string' || this.completedItems.has(itemId)) return;
      let requestId = typeof itemId === 'string' ? this.itemRequests.get(itemId) : undefined;
      if (!requestId && typeof itemId === 'string' && this.committingRequestId && this.awaitingRequestId === this.committingRequestId) {
        requestId = this.committingRequestId;
        this.itemRequests.set(itemId, requestId);
        this.committingRequestId = undefined;
      }
      if (!requestId) return;
      this.completedItems.add(itemId);
      if (this.completedItems.size > 32) this.completedItems.delete(this.completedItems.values().next().value!);
      this.itemRequests.delete(itemId);
      if (typeof event.transcript !== 'string' || !event.transcript.trim()) {
        this.fail(requestId, 'transcription', 'No words came through. Retry this voice chunk or discard it.');
        return;
      }
      this.clearPending(requestId);
      this.callbacks.transcript({ runId: this.runId, requestId, itemId, text: event.transcript.trim() });
      this.callbacks.state('idle');
      return;
    }
    if (event.type === 'conversation.item.input_audio_transcription.failed') {
      const itemId = event.item_id;
      let requestId = typeof itemId === 'string' ? this.itemRequests.get(itemId) : undefined;
      if (!requestId && typeof itemId === 'string' && this.committingRequestId && this.awaitingRequestId === this.committingRequestId) {
        requestId = this.committingRequestId;
        this.itemRequests.set(itemId, requestId);
        this.committingRequestId = undefined;
      }
      if (requestId) this.fail(requestId, 'transcription', 'Transcription failed. Retry this voice chunk or discard it.');
      return;
    }
    if (event.type === 'error') {
      const requestId = this.awaitingRequestId ?? this.requestId;
      if (requestId) this.fail(requestId, this.awaitingRequestId ? 'transcription' : 'transport', 'Voice capture failed. Retry this chunk or keep typing.');
    }
  }

  private clearPending(requestId: string) {
    clearTimeout(this.transcriptTimer);
    this.transcriptTimer = undefined;
    this.itemRequests.forEach((value, key) => { if (value === requestId) this.itemRequests.delete(key); });
    this.awaitingRequestId = undefined;
    this.committingRequestId = undefined;
    if (this.requestId === requestId) this.requestId = undefined;
  }

  private fail(requestId: string, kind: TranscriptFailureKind, message: string) {
    if (this.requestId !== requestId && this.awaitingRequestId !== requestId && this.committingRequestId !== requestId) return;
    this.held = false;
    this.captureReady = false;
    this.clearPending(requestId);
    void this.stopMic();
    this.callbacks.failure({ runId: this.runId, requestId, kind, message });
    this.callbacks.state('failed', requestId);
    if (kind === 'transport' || kind === 'transcription') this.invalidateTransport();
  }

  private failActive(kind: TranscriptFailureKind, message: string) {
    const requestId = this.awaitingRequestId ?? this.committingRequestId ?? this.requestId;
    if (requestId) this.fail(requestId, kind, message);
    this.invalidateTransport();
  }

  private interrupt() {
    const requestId = this.awaitingRequestId ?? this.committingRequestId ?? this.requestId;
    if (!requestId) { this.invalidateTransport(); return; }
    const wasStarting = !this.captureReady && !this.awaitingRequestId && !this.committingRequestId;
    this.held = false;
    this.captureReady = false;
    this.clearPending(requestId);
    this.invalidateTransport();
    if (wasStarting) {
      this.callbacks.cancelled(this.runId, requestId);
      this.callbacks.state('idle');
    } else {
      this.callbacks.failure({ runId: this.runId, requestId, kind: 'interrupted', message: 'Capture stopped when Mira went into the background. Your typed draft is still here.' });
      this.callbacks.state('failed', requestId);
    }
  }

  private async stopMic() {
    const stream = this.stream;
    this.stream = undefined;
    stream?.getTracks().forEach((track: any) => { track.enabled = false; track.stop(); });
    stream?.release?.();
    try { await this.sender?.replaceTrack(null); } catch { /* Capture is already stopped locally. */ }
  }

  private invalidateTransport() {
    this.epoch++;
    this.ready = false;
    this.peerConnected = false;
    this.channelOpen = false;
    this.sessionStarted = false;
    this.held = false;
    this.captureReady = false;
    clearTimeout(this.connectTimer);
    clearTimeout(this.transcriptTimer);
    void this.stopMic();
    this.channel?.close();
    this.pc?.close();
    this.pc = this.channel = this.sender = this.mediaDevices = undefined;
    this.itemRequests.clear();
    this.committingRequestId = undefined;
    this.awaitingRequestId = undefined;
    this.requestId = undefined;
  }
}
