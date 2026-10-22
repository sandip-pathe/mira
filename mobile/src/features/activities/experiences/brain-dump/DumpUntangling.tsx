import React from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { styles } from './brainDumpStyles';
import {
  requestActivityAssistance,
  type DumpSectionId,
  type DumpSections,
} from '../../assistance/assistanceClient';
import { storageErrorMessage } from '../../../../shared/storage/database';
import { saveTakeaway } from '../../../../shared/savedTakeaways';
import { stageActivityHandoff } from '../../../../shared/activityHandoff';
import { ThoughtThreads } from '../../art/ThoughtThreads';

type Status = 'idle' | 'requesting' | 'ready' | 'failed' | 'cancelled' | 'stale';
const sectionLabels: Record<DumpSectionId, string> = {
  heavy: 'What seems heavy',
  wait: 'Could wait for now',
  thread: 'One thread to follow',
};

export function DumpUntangling({ runId, source, sourceRevision, onTalkTransfer }: {
  runId: string;
  source: string;
  sourceRevision: number;
  onTalkTransfer: (runId: string, text: string) => boolean;
}) {
  const { colors, typography } = useTheme();
  const [status, setStatusState] = React.useState<Status>('idle');
  const [sections, setSections] = React.useState<DumpSections>();
  const [dismissed, setDismissed] = React.useState<DumpSectionId[]>([]);
  const [instruction, setInstruction] = React.useState('');
  const [selected, setSelected] = React.useState<DumpSectionId>();
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState('');
  const controller = React.useRef<AbortController | undefined>(undefined);
  const generation = React.useRef(0);
  const sourceKey = React.useRef(`${runId}:${sourceRevision}:${source}`);
  const statusRef = React.useRef(status);
  const setStatus = (next: Status) => { statusRef.current = next; setStatusState(next); };

  React.useEffect(() => {
    const nextKey = `${runId}:${sourceRevision}:${source}`;
    if (sourceKey.current !== nextKey) {
      controller.current?.abort();
      controller.current = undefined;
      generation.current++;
      if (statusRef.current === 'requesting' || statusRef.current === 'ready') {
        setSections(undefined);
        setDismissed([]);
        setInstruction('');
        setSelected(undefined);
        setSaveMessage('');
        setStatus('stale');
      }
      sourceKey.current = nextKey;
    }
    return () => {
      controller.current?.abort();
      controller.current = undefined;
    };
  }, [runId, sourceRevision, source]);

  async function request(operation: 'untangle_dump' | 'refine_dump') {
    if (!source.trim()) return;
    controller.current?.abort();
    const abortController = new AbortController();
    controller.current = abortController;
    const currentGeneration = ++generation.current;
    const requestId = randomUUID();
    setStatus('requesting');
    try {
      const base = { contract_version: 1 as const, request_id: requestId, activity_run_id: runId, source_revision: sourceRevision, source_text: source };
      const response = await requestActivityAssistance(operation === 'untangle_dump'
        ? { ...base, operation }
        : { ...base, operation, current_sections: sections!, dismissed_sections: dismissed, instruction: instruction.trim() }, abortController.signal);
      if (response.operation === 'shrink_task' || response.operation === 'thought_angles' || response.operation === 'letter_takeaway' || response.operation === 'reach_out_rewrite') throw new Error('Unexpected assistance response');
      if (abortController.signal.aborted || currentGeneration !== generation.current ||
          sourceKey.current !== `${runId}:${sourceRevision}:${source}` || response.request_id !== requestId) return;
      setSections(response.sections);
      setDismissed(operation === 'refine_dump' ? dismissed : []);
      setInstruction('');
      setStatus('ready');
    } catch {
      if (abortController.signal.aborted || currentGeneration !== generation.current) return;
      setStatus('failed');
    } finally {
      if (controller.current === abortController) controller.current = undefined;
    }
  }

  function cancel() {
    generation.current++;
    controller.current?.abort();
    controller.current = undefined;
    setStatus('cancelled');
  }

  async function keepSelected() {
    if (!selected || !sections || dismissed.includes(selected) || !sections[selected].trim()) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const item = await saveTakeaway({ sourceRunId: runId, section: selected, text: sections[selected] });
      router.push({ pathname: '/saved-takeaway', params: { id: item.id } });
    } catch (error) {
      setSaveMessage(storageErrorMessage(error, 'This thread could not be saved on this device.'));
    } finally {
      setSaving(false);
    }
  }

  function talkAboutSelected() {
    if (!selected || !sections?.[selected]?.trim()) return;
    try {
      const opened = onTalkTransfer(`${runId}:thread:${selected}`, sections[selected]);
      if (!opened) setSaveMessage('The thread is still here. Try opening Talk again.');
    } catch {
      setSaveMessage('The thread is still here. Try opening Talk again.');
    }
  }

  function makeSmallStep() {
    if (!selected || !sections?.[selected]?.trim()) return;
    const handoffId = stageActivityHandoff(runId, sections[selected]);
    router.push({ pathname: '/do', params: { id: 'one_small_step', origin: 'actions_library', handoffId } });
  }

  const busy = status === 'requesting';
  return (
    <View style={[styles.reflection, { borderTopColor: colors.line }]}>
      <Eyebrow>OPTIONAL REFLECTION</Eyebrow>
      <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>Untangle this</Text>
      <Text style={[typography.support, { color: colors.muted }]}>Mira can offer three tentative notes from this writing. Your original words stay above.</Text>
      <ThoughtThreads gathered={status === 'ready'} selected={selected} height={116} />
      {status === 'idle' || status === 'cancelled' || status === 'stale' ? (
        <ActionButton label={status === 'stale' ? 'Untangle updated writing' : 'Untangle this'}
          variant="secondary" disabled={!source.trim()} onPress={() => void request('untangle_dump')} />
      ) : null}
      {busy && <>
        <ActivityIndicator color={colors.primary} />
        <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Looking for three threads…</Text>
        <ActionButton label="Cancel" variant="quiet" onPress={cancel} />
      </>}
      {status === 'failed' && <>
        <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>Couldn’t untangle this just now. Your writing is still here.</Text>
        <ActionButton label="Try again" variant="secondary" onPress={() => void request(sections ? 'refine_dump' : 'untangle_dump')} />
      </>}
      {status === 'stale' && <Text style={[typography.support, { color: colors.muted }]}>The writing changed while notes were being made. Request new notes from the updated draft.</Text>}
      {status === 'ready' && sections && <>
        {(Object.keys(sectionLabels) as DumpSectionId[]).map((key) => dismissed.includes(key) ? (
          <View key={key} style={[styles.note, { borderTopColor: colors.line }]}>
            <Text style={[typography.activityTitle, { color: colors.ink }]}>{sectionLabels[key]}</Text>
            <ActionButton label="Bring this note back" variant="quiet" disabled={saving}
              onPress={() => setDismissed((value) => value.filter((item) => item !== key))} />
          </View>
        ) : (
          <View key={key} style={[styles.note, { borderTopColor: colors.line }]}>
            <Text accessibilityRole="header" style={[typography.activityTitle, { color: colors.ink }]}>{sectionLabels[key]}</Text>
            <ActionButton label={selected === key ? 'Selected thread' : 'Choose this thread'}
              variant={selected === key ? 'primary' : 'secondary'} disabled={saving}
              onPress={() => { setSelected(key); setSaveMessage(''); }} />
            <TextInput accessibilityLabel={sectionLabels[key]} multiline value={sections[key]} editable={!saving}
              onChangeText={(value) => setSections((current) => current ? { ...current, [key]: value } : current)}
              placeholder="Nothing to add here" placeholderTextColor={colors.muted} textAlignVertical="top"
              cursorColor={colors.primary} selectionColor={colors.primary}
              style={[typography.body, styles.noteInput, { color: colors.ink, backgroundColor: colors.surface, borderColor: selected === key ? colors.primary : colors.line }]} />
            <ActionButton label="That doesn’t fit" variant="quiet" disabled={saving}
              onPress={() => { setDismissed((value) => [...value, key]); if (selected === key) setSelected(undefined); }} />
          </View>
        ))}
        <TextInput accessibilityLabel="How should Mira adjust these notes?" value={instruction} onChangeText={setInstruction}
          editable={!saving} maxLength={300} placeholder="Optional: what should change?" placeholderTextColor={colors.muted}
          cursorColor={colors.primary} selectionColor={colors.primary}
          style={[typography.body, styles.instruction, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
        <ActionButton label="Refine notes" variant="secondary" disabled={!instruction.trim() || saving} onPress={() => void request('refine_dump')} />
        {!!selected && !!sections[selected].trim() && <>
          <Text style={[typography.support, { color: colors.muted }]}>Selected: {sectionLabels[selected]}</Text>
          <ActionButton label="Make this a small step" variant="secondary" disabled={saving} onPress={makeSmallStep} />
          <ActionButton label="Talk about this thread" variant="outline" disabled={saving} onPress={talkAboutSelected} />
          <ActionButton label="Save this takeaway" loading={saving} onPress={() => void keepSelected()} />
        </>}
        {!!saveMessage && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>{saveMessage}</Text>}
        <ActionButton label="Start over" variant="quiet" disabled={saving}
          onPress={() => { setSections(undefined); setDismissed([]); setInstruction(''); setSelected(undefined); setStatus('idle'); }} />
      </>}
    </View>
  );
}
