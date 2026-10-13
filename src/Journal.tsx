import React, { useEffect, useRef, useState } from 'react';
import { AppState, Button, Text, TextInput, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';
import { API_URL, DemoSession } from './api';

export function Journal({ draft, setDraft, getSession, visible }: {
  draft: string; setDraft: (text: string) => void; getSession: () => Promise<DemoSession>; visible: boolean;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uri, setUri] = useState<string>();
  const [status, setStatus] = useState('Use synthetic demo text. Review and edit the transcript here.');
  const active = useRef(true);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const recordingRef = useRef(false);
  const retainedUri = useRef<string | undefined>(undefined);
  const controller = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    if (!visible && recordingRef.current) {
      recordingRef.current = false;
      void recorder.stop().then(() => {
        retainedUri.current = recorder.uri ?? undefined;
        setUri(retainedUri.current); setRecording(false);
        setStatus('Recording stopped. Retry transcription or discard.');
        void setAudioModeAsync({ allowsRecording: false });
      }).catch(() => { setRecording(false); setStatus('Recording interrupted. Try again.'); });
    }
  }, [visible, recorder]);

  function discardFile(path?: string) {
    if (!path) return;
    try { const file = new File(path); if (file.exists) file.delete(); } catch { /* best effort cache cleanup */ }
  }

  useEffect(() => {
    active.current = true;
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' && recordingRef.current) {
        recordingRef.current = false;
        void recorder.stop().then(() => {
          if (!active.current) return;
          retainedUri.current = recorder.uri ?? undefined;
          setUri(retainedUri.current);
          setRecording(false);
          setStatus('Recording stopped when the app left the foreground. Retry transcription or discard.');
        }).catch(() => { if (active.current) { setRecording(false); setStatus('Recording interrupted. Try again.'); } });
      }
    });
    return () => {
      active.current = false;
      subscription.remove();
      controller.current?.abort();
      if (recordingRef.current) {
        recordingRef.current = false;
        void recorder.stop().then(() => discardFile(recorder.uri ?? undefined)).catch(() => {});
      }
      discardFile(retainedUri.current);
      void setAudioModeAsync({ allowsRecording: false });
    };
  }, [recorder]);

  async function transcribe(path: string) {
    setBusy(true);
    setStatus('Transcribing…');
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 50000);
    try {
      const session = await getSession();
      if (!active.current || abort.signal.aborted) return;
      const form = new FormData();
      form.append('file', { uri: path, name: 'journal.m4a', type: 'audio/mp4' } as any);
      const response = await fetch(`${API_URL}/sessions/${session.session_id}/transcriptions`, {
        method: 'POST', headers: { Authorization: `Bearer ${session.capability}` }, body: form, signal: abort.signal,
      });
      if (!response.ok) throw new Error('Transcription unavailable. The recording is kept for retry or discard.');
      const result = await response.json();
      if (!active.current) return;
      setDraft(result.text);
      discardFile(path);
      retainedUri.current = undefined;
      setUri(undefined);
      setStatus('Transcript ready. Edit it before saving.');
    } catch (error) {
      if (active.current) setStatus(error instanceof Error ? error.message : 'Transcription failed. Retry or discard.');
    } finally {
      clearTimeout(timeout);
      if (active.current) setBusy(false);
    }
  }

  async function start() {
    setBusy(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('Microphone permission denied. You can still write.');
      if (!active.current || !visibleRef.current || AppState.currentState !== 'active') return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, allowsBackgroundRecording: false });
      await recorder.prepareToRecordAsync();
      if (!active.current || !visibleRef.current || AppState.currentState !== 'active') {
        await recorder.stop().catch(() => {});
        discardFile(recorder.uri ?? undefined);
        return;
      }
      recorder.record();
      recordingRef.current = true;
      setRecording(true);
      setStatus('Recording your short synthetic note…');
    } catch (error) {
      if (active.current) setStatus(error instanceof Error ? error.message : 'Recording failed. You can still write.');
    } finally { if (active.current) setBusy(false); }
  }

  async function stop() {
    setBusy(true);
    try {
      await recorder.stop();
      recordingRef.current = false;
      setRecording(false);
      await setAudioModeAsync({ allowsRecording: false });
      const path = recorder.uri;
      if (!path) throw new Error('No recording available. Try again.');
      retainedUri.current = path;
      setUri(path);
      await transcribe(path);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not stop recording. Try again.');
    } finally { if (active.current) setBusy(false); }
  }

  return <View style={{ gap: 16 }}>
    <Text style={{ fontSize: 24, color: '#302C28' }}>What’s on your mind?</Text>
    <Text accessibilityLiveRegion="polite" style={{ fontSize: 16 }}>{status}</Text>
    <TextInput accessibilityLabel="Editable journal draft" multiline value={draft} onChangeText={setDraft}
      editable={!busy && !recording} placeholder="A few words about your day…"
      style={{ minHeight: 180, padding: 16, borderWidth: 1, borderColor: '#746A60', borderRadius: 12, fontSize: 18, textAlignVertical: 'top' }} />
    <Button title={recording ? 'Stop and transcribe' : 'Record voice note'} disabled={busy || !!uri} onPress={() => void (recording ? stop() : start())} />
    {uri && <><Button title="Retry transcription" disabled={busy} onPress={() => void transcribe(uri)} />
      <Button title="Discard recording" disabled={busy} onPress={() => {
        discardFile(uri); retainedUri.current = undefined; setUri(undefined); setStatus('Recording discarded. Your text draft is kept.');
      }} /></>}
    <Text style={{ fontSize: 16 }}>This draft has not been saved or shared with Talk.</Text>
  </View>;
}
