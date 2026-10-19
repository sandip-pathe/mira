import React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { ActionButton, Eyebrow, Surface, colors, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { ExcerptHandoff } from './ExcerptHandoff';
import { useInterventionRun } from '../hooks/useInterventionRun';
import { TranscriptCapture, TranscriptCaptureState, TranscriptFailureKind, transformInsertionAnchor } from '../../../shared/transcriptCapture';

type RunState = ReturnType<typeof useInterventionRun>;
const prompts = [
  'What is taking up the most space in my head right now?',
  'What am I tired of carrying today?',
  "If I didn't have to make sense or be polite, what would I say?",
];
type VoiceChunk = {
  chunkId: string;
  requestId: string;
  anchor: number;
  editRevision: number;
  status: 'permission' | 'connecting' | 'starting' | 'recording' | 'transcribing' | 'failed';
};
type CaptureHandlers = {
  state: (value: TranscriptCaptureState, requestId?: string) => void;
  transcript: (value: { runId: string; requestId: string; itemId: string; text: string }) => void;
  failure: (value: { runId: string; requestId: string; kind: TranscriptFailureKind; message: string }) => void;
  cancelled: (runId: string, requestId: string) => void;
};

export function BrainDumpPanel({ run, onTalkTransfer, onBack }: {
  run: RunState;
  onTalkTransfer: (text: string) => boolean;
  onBack: () => void;
}) {
  const activityRunId = run.clientRunId;
  const setRunDraft = run.setDraft;
  const [reviewing, setReviewing] = React.useState(false);
  const [promptsOpen, setPromptsOpen] = React.useState(false);
  const [selection, setSelection] = React.useState({ start: 0, end: 0 });
  const selectionRef = React.useRef(selection);
  const draftRef = React.useRef(run.draft);
  const editRevision = React.useRef(0);
  const pendingRef = React.useRef<VoiceChunk | undefined>(undefined);
  const [pendingChunk, setPendingChunk] = React.useState<VoiceChunk>();
  const [captureState, setCaptureState] = React.useState<TranscriptCaptureState>('idle');
  const [captureMessage, setCaptureMessage] = React.useState('');
  const [failureKind, setFailureKind] = React.useState<TranscriptFailureKind>();
  const handledRequests = React.useRef(new Set<string>());
  const input = React.useRef<TextInput>(null);

  const updatePending = React.useCallback((value: VoiceChunk | undefined) => {
    pendingRef.current = value;
    setPendingChunk(value);
  }, []);

  const handlers = React.useRef<CaptureHandlers>({
    state: () => {}, transcript: () => {}, failure: () => {}, cancelled: () => {},
  });
  const nextHandlers = React.useMemo<CaptureHandlers>(() => ({
    state: (value, requestId) => {
      setCaptureState(value);
      const chunk = pendingRef.current;
      if (chunk && (!requestId || chunk.requestId === requestId) && value !== 'idle')
        updatePending({ ...chunk, status: value as VoiceChunk['status'] });
      if (value === 'idle' && !pendingRef.current) setCaptureMessage('');
    },
    transcript: (value) => {
      const chunk = pendingRef.current;
      if (value.runId !== activityRunId || !chunk || chunk.requestId !== value.requestId || handledRequests.current.has(value.requestId)) return;
      handledRequests.current.add(value.requestId);
      if (handledRequests.current.size > 64) handledRequests.current.delete(handledRequests.current.values().next().value!);
      const text = draftRef.current;
      const at = Math.max(0, Math.min(chunk.anchor, text.length));
      const before = text.slice(0, at);
      const after = text.slice(at);
      const inserted = `${before && !before.endsWith('\n') ? '\n' : ''}${value.text}${after && !after.startsWith('\n') ? '\n' : ''}`;
      const next = before + inserted + after;
      draftRef.current = next;
      setRunDraft(next);
      editRevision.current++;
      const cursor = at + inserted.length;
      selectionRef.current = { start: cursor, end: cursor };
      setSelection(selectionRef.current);
      updatePending(undefined);
      setCaptureMessage('Voice text added. You can edit it like the rest of your draft.');
      setCaptureState('idle');
    },
    failure: (value) => {
      const chunk = pendingRef.current;
      if (value.runId !== activityRunId || !chunk || chunk.requestId !== value.requestId) return;
      updatePending({ ...chunk, status: 'failed' });
      setFailureKind(value.kind);
      setCaptureMessage(value.message);
      setCaptureState('failed');
    },
    cancelled: (transcriptRunId, requestId) => {
      const chunk = pendingRef.current;
      if (transcriptRunId === activityRunId && chunk?.requestId === requestId) updatePending(undefined);
    },
  }), [activityRunId, setRunDraft, updatePending]);
  React.useEffect(() => { handlers.current = nextHandlers; }, [nextHandlers]);
  React.useEffect(() => { draftRef.current = run.draft; }, [run.draft]);
  const captureRef = React.useRef<TranscriptCapture | undefined>(undefined);
  React.useEffect(() => {
    const instance = new TranscriptCapture(run.clientRunId, {
      state: (value, requestId) => handlers.current.state(value, requestId),
      transcript: (value) => handlers.current.transcript(value),
      failure: (value) => handlers.current.failure(value),
      cancelled: (runId, requestId) => handlers.current.cancelled(runId, requestId),
    });
    captureRef.current = instance;
    return () => { captureRef.current = undefined; instance.close(); };
  }, [run.clientRunId]);

  if (run.phase !== 'active' || run.activeId !== 'brain_dump' || run.intervention?.presentation.pattern !== 'capture') return null;

  function startVoiceAttempt() {
    const capture = captureRef.current;
    if (!capture) return;
    if (['permission', 'connecting', 'starting', 'recording', 'transcribing'].includes(captureState)) return;
    const prior = pendingRef.current;
    const requestId = randomUUID();
    const chunk: VoiceChunk = prior?.status === 'failed'
      ? { ...prior, requestId, editRevision: editRevision.current, status: 'starting' }
      : { chunkId: randomUUID(), requestId, anchor: selectionRef.current.end, editRevision: editRevision.current, status: 'starting' };
    updatePending(chunk);
    setCaptureMessage('Starting microphone and transcription connection…');
    setFailureKind(undefined);
    void capture.hold(requestId);
  }

  function releaseVoice() {
    const capture = captureRef.current;
    const chunk = pendingRef.current;
    if (capture && chunk && ['permission', 'connecting', 'starting', 'recording'].includes(chunk.status)) void capture.release(chunk.requestId);
  }

  function discardVoiceChunk() {
    const chunk = pendingRef.current;
    if (!chunk) return;
    captureRef.current?.discard(chunk.requestId);
    updatePending(undefined);
    setCaptureState('idle');
    setCaptureMessage('Voice chunk discarded. Your accepted text is still here.');
  }

  function handleDraftChange(next: string) {
    const previous = draftRef.current;
    if (next !== previous) {
      const chunk = pendingRef.current;
      if (chunk) {
        updatePending({ ...chunk, anchor: transformInsertionAnchor(previous, next, chunk.anchor), editRevision: editRevision.current + 1 });
      }
      editRevision.current++;
    }
    draftRef.current = next;
    run.setDraft(next);
  }

  function insertPrompt(prompt: string) {
    const start = selection.start;
    const end = selection.end;
    const text = run.draft.slice(0, start) + prompt + run.draft.slice(end);
    handleDraftChange(text);
    const cursor = start + prompt.length;
    setSelection({ start: cursor, end: cursor });
    setPromptsOpen(false);
    requestAnimationFrame(() => input.current?.focus());
  }

  function clearAndLeave() {
    Alert.alert('Clear and leave?', 'This clears your temporary writing. There is no undo after leaving.', [
      { text: 'Keep writing', style: 'cancel' },
      { text: 'Clear and leave', style: 'destructive', onPress: () => {
        const chunk = pendingRef.current;
        if (chunk) captureRef.current?.discard(chunk.requestId);
        updatePending(undefined);
        captureRef.current?.close();
        draftRef.current = '';
        run.setDraft('');
        void run.finishRun('stopped').then(onBack);
      } },
    ]);
  }

  return <ActivityPanel style={{ gap: 14 }}>
    <Eyebrow>{reviewing ? 'READ IT BACK' : 'BRAIN DUMP'}</Eyebrow>
    <Text style={ui.heading}>{reviewing ? 'Your words, as they are' : 'Get it out. Keep it messy.'}</Text>
    <Text style={ui.muted}>{reviewing ? 'Nothing needs to be sorted or solved.' : 'Write whatever is on your mind. This draft is temporary and will not be saved to Journal.'}</Text>
    {!reviewing ? <>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 34, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 4 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <View key={i} style={{ width: i === 3 ? 13 : 7, height: i === 3 ? 13 : 7, borderRadius: 8, backgroundColor: i === 3 ? colors.accent : '#A8B9AD', opacity: i === 3 ? 0.9 : 0.55 }} />)}
        <Text style={[ui.muted, { marginLeft: 5 }]}>A little space for your thoughts</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: promptsOpen }} onPress={() => setPromptsOpen((open) => !open)} style={{ minHeight: 48, justifyContent: 'center' }}>
        <Text style={ui.label}>{promptsOpen ? 'Hide starting lines  ▴' : 'Need a starting line?  ▾'}</Text>
      </Pressable>
      {promptsOpen && <View style={{ gap: 8 }}>{prompts.map((prompt) => <ActionButton key={prompt} label={prompt} variant="secondary" onPress={() => insertPrompt(prompt)} />)}</View>}
      <TextInput
        ref={input}
        accessibilityLabel="Temporary brain dump"
        multiline
        maxLength={12000}
        value={run.draft}
        selection={selection}
        onSelectionChange={(event) => { selectionRef.current = event.nativeEvent.selection; setSelection(event.nativeEvent.selection); }}
        onChangeText={handleDraftChange}
        placeholder="Start anywhere…"
        textAlignVertical="top"
        style={[ui.input, { minHeight: 270, lineHeight: 29, padding: 20, borderRadius: 10, borderColor: '#D8D0BD', backgroundColor: '#FFFEFA' }]}
      />
      {pendingChunk && <Surface style={{ gap: 6, borderColor: pendingChunk.status === 'recording' ? colors.accent : colors.line }}>
        <Eyebrow>VOICE CHUNK</Eyebrow>
        <Text accessibilityLiveRegion="polite" style={ui.label}>
          {pendingChunk.status === 'permission' ? 'Waiting for microphone permission' : pendingChunk.status === 'connecting' ? 'Connecting to transcription' : pendingChunk.status === 'starting' ? 'Starting microphone' : pendingChunk.status === 'recording' ? 'Recording now · release to finish' : pendingChunk.status === 'transcribing' ? 'Transcribing this paragraph' : 'This voice chunk needs another try'}
        </Text>
        {pendingChunk.status === 'transcribing' && <Text style={ui.muted}>You can keep typing. The words will be placed at the capture point.</Text>}
        {pendingChunk.status === 'failed' && <Text style={ui.muted}>Hold the voice button to retry this chunk, or discard it. Your accepted writing stays unchanged.</Text>}
      </Surface>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={captureState === 'recording' ? 'Recording. Release to transcribe.' : ['permission', 'connecting', 'starting'].includes(captureState) ? `${captureState === 'permission' ? 'Requesting microphone permission' : captureState === 'connecting' ? 'Connecting transcription' : 'Starting microphone'}. Activate to cancel.` : captureState === 'transcribing' ? 'Transcribing voice chunk.' : pendingChunk?.status === 'failed' ? 'Hold to retry voice capture.' : 'Hold to speak. Release to transcribe.'}
        accessibilityHint="Hold while speaking and release when finished. Typed writing remains available."
        accessibilityState={{ disabled: captureState === 'transcribing', busy: ['permission', 'connecting', 'starting', 'transcribing'].includes(captureState) }}
        accessibilityActions={[{ name: 'activate', label: captureState === 'recording' || ['permission', 'connecting', 'starting'].includes(captureState) ? 'Stop or cancel voice capture' : 'Start voice capture' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') {
            if (captureState === 'recording' || ['permission', 'connecting', 'starting'].includes(captureState)) releaseVoice();
            else startVoiceAttempt();
          }
        }}
        disabled={captureState === 'transcribing'}
        onPressIn={startVoiceAttempt}
        onPressOut={releaseVoice}
        style={{ minHeight: 54, paddingHorizontal: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: captureState === 'recording' ? colors.accent : colors.accentSoft, borderWidth: 1, borderColor: colors.accent }}
      >
        <Text style={[ui.label, captureState === 'recording' ? { color: colors.white } : undefined]}>
          {captureState === 'recording' ? 'Recording · release to finish' : captureState === 'permission' ? 'Requesting mic permission…' : captureState === 'connecting' ? 'Connecting transcription…' : captureState === 'starting' ? 'Starting microphone…' : captureState === 'transcribing' ? 'Transcribing…' : pendingChunk?.status === 'failed' ? 'Hold to retry voice' : 'Hold to speak'}
        </Text>
      </Pressable>
      <Text style={ui.muted}>Speech is sent for transcription while you hold the button. Only accepted words join this temporary draft.</Text>
      {!!captureMessage && <Text accessibilityLiveRegion="polite" style={ui.muted}>{failureKind ? `${failureKind === 'permission' ? 'Microphone permission' : failureKind === 'transport' ? 'Connection' : failureKind === 'interrupted' ? 'Capture interrupted' : 'Transcription'}: ` : ''}{captureMessage}</Text>}
      {pendingChunk?.status === 'failed' && <ActionButton label="Discard voice chunk" variant="secondary" onPress={discardVoiceChunk} />}
      <ActionButton label={pendingChunk && pendingChunk.status !== 'failed' ? 'Wait for voice text…' : 'Done · read it back'} disabled={!!pendingChunk && pendingChunk.status !== 'failed'} onPress={() => { setReviewing(true); setPromptsOpen(false); }} />
      <ActionButton label="Clear and leave" variant="quiet" onPress={clearAndLeave} />
    </> : <>
      <View accessibilityLabel="Brain Dump review" style={{ minHeight: 150, padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#D8D0BD', backgroundColor: '#FFFEFA' }}>
        <Text selectable style={[ui.body, { lineHeight: 29 }]}>{run.draft || 'You have not written anything yet.'}</Text>
      </View>
      <ActionButton label="Edit" variant="secondary" onPress={() => setReviewing(false)} />
      {!pendingChunk && <ExcerptHandoff source={run.draft} onOpenInTalk={onTalkTransfer} />}
      <ActionButton label="Clear and leave" variant="quiet" onPress={clearAndLeave} />
    </>}
  </ActivityPanel>;
}
