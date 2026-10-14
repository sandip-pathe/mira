import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, AppState, Text, TextInput, View } from 'react-native';
import { fetch as expoFetch } from 'expo/fetch';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';
import { API_URL, DemoSession, request } from './api';
import { ActionButton, Eyebrow, StatusPill, Surface, ui } from './ui';

type Entry = { id: string; text: string; input_type: 'text' | 'voice'; created_at: number };
type MemoryItem = { id: string; source_entry_id: string; excerpt: string; approved: number; revoked: number };
type FeedbackItem = { id: string; action_id: string; rating: string; reuse_context: number; helpful_lesson?: string | null };

export function Journal({ draft, setDraft, getSession, visible, onReset, onContextRevoked }: {
  draft: string; setDraft: (text: string) => void; getSession: () => Promise<DemoSession>; visible: boolean;
  onReset: () => void; onContextRevoked: () => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uri, setUri] = useState<string>();
  const [status, setStatus] = useState('Use synthetic demo text. Review and edit the transcript here.');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry>();
  const [excerpt, setExcerpt] = useState('');
  const [voiceDraft, setVoiceDraft] = useState(false);
  const active = useRef(true);
  const visibleRef = useRef(visible);
  useLayoutEffect(() => { visibleRef.current = visible; }, [visible]);
  const recordingRef = useRef(false);
  const retainedUri = useRef<string | undefined>(undefined);
  const controller = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void getSession().then(async session => {
      const [journal, context] = await Promise.all([
        request<{ entries: Entry[] }>(`/sessions/${session.session_id}/journal`, session),
        request<{ items: MemoryItem[]; feedback: FeedbackItem[] }>(`/sessions/${session.session_id}/memory`, session),
      ]);
      if (!cancelled) { setEntries(journal.entries); setMemories(context.items); setFeedback(context.feedback); }
    }).catch(() => { if (!cancelled) setStatus('Mira is temporarily offline. Your draft stays here.'); });
    return () => { cancelled = true; };
  }, [visible, getSession]);

  async function saveEntry() {
    const text = draft.trim();
    if (!text || busy || recording) return;
    setBusy(true); setStatus('Saving journal entry…');
    try {
      const session = await getSession();
      const entry = await request<Entry>(`/sessions/${session.session_id}/journal`, session,
        { text, input_type: voiceDraft ? 'voice' : 'text' });
      setEntries(items => [entry, ...items]); setDraft(''); setVoiceDraft(false);
      setStatus('Entry saved on this demo server. You can choose an excerpt for Talk below.');
    } catch { setStatus('Entry was not saved. Your draft is kept; try again.'); }
    finally { setBusy(false); }
  }

  async function createMemory() {
    if (!selectedEntry || !excerpt.trim()) return;
    setBusy(true);
    try {
      const session = await getSession();
      const item = await request<MemoryItem>(`/sessions/${session.session_id}/memory`, session,
        { source_entry_id: selectedEntry.id, excerpt: excerpt.trim() });
      setMemories(values => [item, ...values]); setSelectedEntry(undefined);
      setStatus('Excerpt saved as pending. Approve it separately before Talk can use it.');
    } catch { setStatus('Excerpt was not saved. Your entry is unchanged; try again.'); }
    finally { setBusy(false); }
  }

  async function memoryAction(id: string, action: 'approve' | 'revoke' | 'delete') {
    try {
      const session = await getSession();
      await request(`/sessions/${session.session_id}/memory/${id}${action === 'delete' ? '' : `/${action}`}`,
        session, undefined, action === 'delete' ? 'DELETE' : 'POST');
      setMemories(items => items.flatMap(item => item.id !== id ? [item] : action === 'delete'
        ? [] : [{ ...item, approved: action === 'approve' ? 1 : 0, revoked: action === 'revoke' ? 1 : item.revoked }]));
      if (action !== 'approve') {
        onContextRevoked();
        setStatus('Context removed from future use. Prior Talk history was cleared on this device to prevent reuse.');
      }
    } catch { setStatus('Context was not changed. Try again when Mira is online.'); }
  }

  async function feedbackAction(id: string, action: 'reuse' | 'delete', enabled?: boolean) {
    try {
      const session = await getSession();
      await request(`/sessions/${session.session_id}/feedback/${id}${action === 'reuse' ? `/reuse?reuse_context=${!!enabled}` : ''}`,
        session, undefined, action === 'delete' ? 'DELETE' : 'PATCH');
      setFeedback(items => items.flatMap(item => item.id !== id ? [item] : action === 'delete'
        ? [] : [{ ...item, reuse_context: enabled ? 1 : 0 }]));
      if (action === 'delete' || !enabled) onContextRevoked();
    } catch { setStatus('Feedback context was not changed. Try again when Mira is online.'); }
  }

  async function resetDemo() {
    try {
      const session = await getSession();
      await request(`/sessions/${session.session_id}/reset`, session, {});
      setEntries([]); setMemories([]); setFeedback([]); setSelectedEntry(undefined); setDraft('');
      discardFile(uri); setUri(undefined); retainedUri.current = undefined; onReset();
      setStatus('Demo data cleared.');
    } catch { setStatus('Demo data was not cleared. Try again.'); }
  }

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
      form.append('file', new File(path), 'journal.m4a');
      const response = await expoFetch(`${API_URL}/sessions/${session.session_id}/transcriptions`, {
        method: 'POST', headers: { Authorization: `Bearer ${session.capability}` }, body: form, signal: abort.signal,
      });
      if (!response.ok) {
        const reason = response.status === 401 ? 'Journal session expired. Reopen Journal and try again.'
          : response.status === 413 ? 'Recording is too large. Record a shorter note.'
          : `Transcription unavailable (HTTP ${response.status}). The recording is kept for retry or discard.`;
        throw new Error(reason);
      }
      const result = await response.json();
      if (!active.current) return;
      setDraft(result.text);
      setVoiceDraft(true);
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

  return <View style={{ gap: 18 }}>
    <Surface style={{ gap: 14, padding: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Eyebrow>A PRIVATE NOTE</Eyebrow>
        <StatusPill tone={recording ? 'warn' : 'neutral'}>{recording ? 'Recording' : voiceDraft ? 'Voice draft' : 'Draft'}</StatusPill>
      </View>
      <Text style={ui.heading}>What’s on your mind?</Text>
      <Text accessibilityLiveRegion="polite" style={ui.muted}>{status}</Text>
      <TextInput accessibilityLabel="Editable journal draft" multiline value={draft} onChangeText={setDraft}
      editable={!busy && !recording} placeholder="A few words about your day…"
      style={ui.input} />
      <View style={{ flexDirection: 'row', gap: 9 }}>
        <ActionButton label="Save entry" loading={busy && !recording} disabled={recording || !draft.trim()} onPress={() => void saveEntry()} style={{ flex: 1 }} />
        <ActionButton label={recording ? 'Stop' : 'Record'} variant="secondary" loading={busy && recording} disabled={!!uri} onPress={() => void (recording ? stop() : start())} style={{ flex: 1 }} />
      </View>
      {uri && <View style={{ flexDirection: 'row', gap: 8 }}><ActionButton label="Retry transcription" variant="secondary" loading={busy} onPress={() => void transcribe(uri)} style={{ flex: 1 }} />
      <ActionButton label="Discard" variant="quiet" disabled={busy} onPress={() => {
        discardFile(uri); retainedUri.current = undefined; setUri(undefined); setStatus('Recording discarded. Your text draft is kept.');
      }} style={{ flex: 1 }} /></View>}
    </Surface>
    {!!entries.length && <View style={{ gap: 12 }}><Eyebrow>YOUR ENTRIES</Eyebrow>
    {entries.map(entry => <Surface key={entry.id} style={{ gap: 12 }}>
      <Text style={ui.body}>{entry.text}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}><ActionButton label="Choose excerpt for Talk" variant="secondary" onPress={() => { setSelectedEntry(entry); setExcerpt(entry.text.slice(0, 500)); }} style={{ flex: 1 }} />
      <ActionButton label="Delete" variant="quiet" onPress={() => void (async () => {
        const session = await getSession();
        await request(`/sessions/${session.session_id}/journal/${entry.id}`, session, undefined, 'DELETE');
        setEntries(items => items.filter(item => item.id !== entry.id));
        setMemories(items => items.filter(item => item.source_entry_id !== entry.id));
        onContextRevoked();
      })()} /></View>
    </Surface>)}</View>}
    {selectedEntry && <Surface style={{ gap: 10 }}>
      <Eyebrow>SHARE WITH TALK</Eyebrow><Text style={ui.heading}>Review this excerpt</Text>
      <Text style={ui.muted}>It stays private until you approve it.</Text>
      <TextInput accessibilityLabel="Editable memory excerpt" multiline maxLength={500} value={excerpt}
        onChangeText={setExcerpt} style={[ui.input, { minHeight: 90 }]} />
      <ActionButton label="Save pending excerpt" disabled={busy || !excerpt.trim()} onPress={() => void createMemory()} />
      <ActionButton label="Cancel" variant="quiet" onPress={() => setSelectedEntry(undefined)} />
    </Surface>}
    {!!memories.length && <View style={{ gap: 12 }}><Eyebrow>MIRA’S CONTEXT</Eyebrow>{memories.map(item => <Surface key={item.id} style={{ gap: 9 }}>
      <Text style={ui.body}>{item.excerpt}</Text>
      <StatusPill tone={item.approved && !item.revoked ? 'good' : 'neutral'}>{item.revoked ? 'Revoked' : item.approved ? 'Approved for Talk' : 'Pending approval'}</StatusPill>
      {!item.approved && !item.revoked && <ActionButton label="Approve for Talk" onPress={() => void memoryAction(item.id, 'approve')} />}
      {item.approved === 1 && <ActionButton label="Revoke future use" variant="secondary" onPress={() => void memoryAction(item.id, 'revoke')} />}
      <ActionButton label="Delete context" variant="quiet" onPress={() => void memoryAction(item.id, 'delete')} />
    </Surface>)}</View>}
    {!!feedback.length && <View style={{ gap: 12 }}><Eyebrow>OUTCOMES MIRA CAN REMEMBER</Eyebrow>{feedback.map(item => <Surface key={item.id} style={{ gap: 9 }}>
      <Text style={ui.body}>{item.helpful_lesson || `Private rating: ${item.action_id.replaceAll('_', ' ')} · ${item.rating.replaceAll('_', ' ')}`}</Text>
      <ActionButton label={item.reuse_context ? 'Stop future use' : 'Allow future use'} variant="secondary" onPress={() => void feedbackAction(item.id, 'reuse', !item.reuse_context)} />
      <ActionButton label="Delete feedback context" variant="quiet" onPress={() => void feedbackAction(item.id, 'delete')} />
    </Surface>)}</View>}
    <ActionButton label="Reset demo data" variant="quiet" disabled={busy || recording} onPress={() => Alert.alert('Reset this demo?',
      'This deletes saved journal entries, approved context, action runs, and feedback from this demo.', [
        { text: 'Cancel', style: 'cancel' }, { text: 'Reset', style: 'destructive', onPress: () => void resetDemo() },
      ])} />
    <View style={{ gap: 8, paddingTop: 4 }}><Eyebrow>ABOUT YOUR NOTES</Eyebrow><Text style={ui.muted}>Only saved entries stay in this demo. Your short voice note is sent to OpenAI for transcription; Mira deletes the local recording after it returns. The text stays a draft until you save it.</Text></View>
    {!!memories.length && <Text style={ui.muted}>Revoking or deleting context blocks future retrieval. A source already used in the active Talk session may remain until that session ends.</Text>}
  </View>;
}
