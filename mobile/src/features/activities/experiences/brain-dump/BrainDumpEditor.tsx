import React from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { randomUUID } from 'expo-crypto';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ExcerptHandoff } from '../../components/ExcerptHandoff';
import { ThoughtThreads } from '../../art/ThoughtThreads';
import { DumpUntangling } from './DumpUntangling';
import { BrainDumpVoiceControl } from './BrainDumpVoiceControl';
import { styles } from './brainDumpStyles';
import {
  TranscriptCapture,
  type TranscriptCaptureState,
  type TranscriptFailureKind,
  transformInsertionAnchor,
} from '../../../../shared/transcriptCapture';
import type { ActivityFinishState } from '../../runtime/contracts';

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

export type BrainDumpEditorProps = {
  runId: string;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  onTalkTransfer: (runId: string, text: string) => boolean;
  onFinish: (state: ActivityFinishState) => void;
  onBack: () => void;
};

export function BrainDumpEditor({ runId, draft, setDraft, onTalkTransfer, onFinish, onBack }: BrainDumpEditorProps) {
  const { colors, typography } = useTheme();
  const [reviewing, setReviewing] = React.useState(false);
  const [promptsOpen, setPromptsOpen] = React.useState(false);
  const [selection, setSelection] = React.useState({ start: 0, end: 0 });
  const selectionRef = React.useRef(selection);
  const draftRef = React.useRef(draft);
  const editRevision = React.useRef(0);
  const [renderRevision, setRenderRevision] = React.useState(0);
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
  const captureRef = React.useRef<TranscriptCapture | undefined>(undefined);
  const handlers = React.useRef<CaptureHandlers>({
    state: () => {},
    transcript: () => {},
    failure: () => {},
    cancelled: () => {},
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
      if (value.runId !== runId || !chunk || chunk.requestId !== value.requestId || handledRequests.current.has(value.requestId)) return;
      handledRequests.current.add(value.requestId);
      if (handledRequests.current.size > 64) handledRequests.current.delete(handledRequests.current.values().next().value!);
      const text = draftRef.current;
      const at = Math.max(0, Math.min(chunk.anchor, text.length));
      const before = text.slice(0, at);
      const after = text.slice(at);
      const inserted = `${before && !before.endsWith('\n') ? '\n' : ''}${value.text}${after && !after.startsWith('\n') ? '\n' : ''}`;
      const next = before + inserted + after;
      draftRef.current = next;
      setDraft(next);
      editRevision.current++;
      setRenderRevision(editRevision.current);
      const cursor = at + inserted.length;
      selectionRef.current = { start: cursor, end: cursor };
      setSelection(selectionRef.current);
      updatePending(undefined);
      setCaptureMessage('Voice text added. You can edit it like the rest of your draft.');
      setCaptureState('idle');
    },
    failure: (value) => {
      const chunk = pendingRef.current;
      if (value.runId !== runId || !chunk || chunk.requestId !== value.requestId) return;
      updatePending({ ...chunk, status: 'failed' });
      setFailureKind(value.kind);
      setCaptureMessage(value.message);
      setCaptureState('failed');
    },
    cancelled: (cancelledRunId, requestId) => {
      const chunk = pendingRef.current;
      if (cancelledRunId === runId && chunk?.requestId === requestId) updatePending(undefined);
    },
  }), [runId, setDraft, updatePending]);

  React.useEffect(() => { handlers.current = nextHandlers; }, [nextHandlers]);
  React.useEffect(() => { draftRef.current = draft; }, [draft]);
  React.useEffect(() => {
    const instance = new TranscriptCapture(runId, {
      state: (value, requestId) => handlers.current.state(value, requestId),
      transcript: (value) => handlers.current.transcript(value),
      failure: (value) => handlers.current.failure(value),
      cancelled: (valueRunId, requestId) => handlers.current.cancelled(valueRunId, requestId),
    });
    captureRef.current = instance;
    return () => { captureRef.current = undefined; instance.close(); };
  }, [runId]);

  function startVoiceAttempt() {
    const capture = captureRef.current;
    if (!capture || ['permission', 'connecting', 'starting', 'recording', 'transcribing'].includes(captureState)) return;
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
      if (chunk) updatePending({ ...chunk, anchor: transformInsertionAnchor(previous, next, chunk.anchor), editRevision: editRevision.current + 1 });
      editRevision.current++;
      setRenderRevision(editRevision.current);
    }
    draftRef.current = next;
    setDraft(next);
  }

  function insertPrompt(prompt: string) {
    const start = selection.start;
    const end = selection.end;
    const text = draft.slice(0, start) + prompt + draft.slice(end);
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
        setDraft('');
        onFinish('stopped');
        onBack();
      } },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Eyebrow>{reviewing ? 'READ IT BACK' : 'BRAIN DUMP'}</Eyebrow>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>
          {reviewing ? 'Your words, as they are' : 'Get it out. Keep it messy.'}
        </Text>
        <Text style={[typography.support, { color: colors.muted }]}>
          {reviewing ? 'Nothing needs to be sorted or solved.' : 'Write whatever is on your mind. This draft is temporary and will not be saved to Journal.'}
        </Text>
        {!reviewing && <ThoughtThreads height={112} />}
        {!reviewing ? <>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: promptsOpen }}
            onPress={() => setPromptsOpen((open) => !open)}
            style={({ pressed }) => [styles.promptToggle, { opacity: pressed ? 0.65 : 1 }]}>
            <Text style={[typography.button, { color: colors.primary }]}>{promptsOpen ? 'Hide starting lines' : 'Need a starting line?'}</Text>
            <MaterialDesignIcons name={promptsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
          </Pressable>
          {promptsOpen && <View style={styles.prompts}>
            {prompts.map((prompt) => <ActionButton key={prompt} label={prompt} variant="secondary" onPress={() => insertPrompt(prompt)} />)}
          </View>}
          <TextInput ref={input} accessibilityLabel="Temporary brain dump" multiline maxLength={12000} value={draft}
            selection={selection} onSelectionChange={(event) => { selectionRef.current = event.nativeEvent.selection; setSelection(event.nativeEvent.selection); }}
            onChangeText={handleDraftChange} placeholder="Start anywhere…" textAlignVertical="top"
            placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
            style={[typography.journalWriting, styles.writing, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
          <BrainDumpVoiceControl state={captureState} pendingStatus={pendingChunk?.status} message={captureMessage}
            failureKind={failureKind} onStart={startVoiceAttempt} onRelease={releaseVoice} onDiscard={discardVoiceChunk} />
          <ActionButton label={pendingChunk && pendingChunk.status !== 'failed' ? 'Wait for voice text…' : 'Done · read it back'}
            disabled={!!pendingChunk && pendingChunk.status !== 'failed'}
            onPress={() => { Keyboard.dismiss(); setReviewing(true); setPromptsOpen(false); }} />
          <ActionButton label="Clear and leave" variant="quiet" onPress={clearAndLeave} />
        </> : <>
          <View accessibilityLabel="Brain Dump review" style={[styles.readback, { backgroundColor: colors.surface }]}>
            <Text selectable style={[typography.journalWriting, { color: colors.ink }]}>{draft || 'You have not written anything yet.'}</Text>
          </View>
          <ActionButton label="Edit" variant="secondary" onPress={() => setReviewing(false)} />
          {!!draft.trim() && <DumpUntangling runId={runId} source={draft} sourceRevision={renderRevision} onTalkTransfer={onTalkTransfer} />}
          {!pendingChunk && <ExcerptHandoff source={draft} onOpenInTalk={(text) => onTalkTransfer(runId, text)} />}
          <ActionButton label="Clear and leave" variant="quiet" onPress={clearAndLeave} />
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
