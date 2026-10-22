import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton, Eyebrow, Surface, useTheme } from '../../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { useInterventionRun } from '../hooks/useInterventionRun';

type RunState = ReturnType<typeof useInterventionRun>;
type CommonProps = { run: RunState; onKeep: (content: string) => void };

/** Temporary renderer for task_reset_60s records created by older app versions. */
export function ReadyPanel({ run, origin, onBack }: { run: RunState; origin: string; onBack: () => void }) {
  const { colors, typography } = useTheme();
  if (!run.readyToStart || run.busy) return null;
  const destination = origin === 'talk' ? 'Talk' : 'Activities';
  return (
    <ActivityPanel style={{ gap: 12 }}>
      <Eyebrow>LEGACY SAVED ACTIVITY</Eyebrow>
      <Text style={[typography.groupHeading, { color: colors.ink }]}>{run.intervention?.title ?? 'Task Reset'}</Text>
      <Text style={[typography.body, { color: colors.ink }]}>This saved activity uses its original format. Your entry stays on this device unless you explicitly request an AI suggestion.</Text>
      <ActionButton label="Start activity" loading={run.busy} onPress={() => void run.startActivity()} />
      <ActionButton label="Skip" variant="secondary" onPress={onBack} />
      <ActionButton label={`Return to ${destination}`} variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );
}

export function SortActivityPanel({ run, onKeep }: CommonProps) {
  const { colors, typography } = useTheme();
  if (run.phase !== 'active' || run.intervention?.id !== 'task_reset_60s') return null;
  const group = (label: string, key: 'now' | 'later' | 'ignore') => (
    <View style={{ gap: 8 }} key={key}>
      <Eyebrow>{label}</Eyebrow>
      {(run.groups?.[key] ?? []).map((item, index) => (
        <Surface key={`${key}-${index}`} style={{ gap: 7 }}>
          <Text style={[typography.body, { color: colors.ink }]}>{item}</Text>
          {key === 'now' && <ActionButton label="Use as tiny next step" variant="secondary" onPress={() => run.setTinyStep(item)} />}
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {(['now', 'later', 'ignore'] as const).filter((target) => target !== key).map((target) => (
              <ActionButton key={target} label={`Move to ${target === 'ignore' ? 'not for now' : target}`} variant="quiet" onPress={() => run.move(item, key, target)} style={{ flex: 1 }} />
            ))}
          </View>
        </Surface>
      ))}
    </View>
  );
  return (
    <ActivityPanel style={{ gap: 12 }}>
      <Eyebrow>GET IT OUT OF YOUR HEAD</Eyebrow>
      <Text style={[typography.groupHeading, { color: colors.ink }]}>What is taking up space?</Text>
      <TextInput accessibilityLabel="Temporary task list" multiline value={run.draft} onChangeText={run.setDraft} placeholder="One thing per line" placeholderTextColor={colors.muted} selectionColor={colors.primary} style={[styles.input, { minHeight: 110, color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
      <Text style={[typography.support, { color: colors.muted }]}>This entry is temporary. "Sort it for me" sends these lines for one-time AI suggestions.</Text>
      {!run.groups ? <>
        <ActionButton label="Sort it for me" loading={run.busy} disabled={!run.draft.trim()} onPress={() => void run.organize()} />
        <ActionButton label="Choose one without sorting" variant="quiet" onPress={() => run.setGroups({ now: run.draft.split('\n').map((value) => value.trim()).filter(Boolean), later: [], ignore: [] })} />
      </> : <>
        {group('NOW', 'now')}{group('LATER', 'later')}{group('NOT FOR NOW', 'ignore')}
        <TextInput accessibilityLabel="One tiny next step" value={run.tinyStep} onChangeText={run.setTinyStep} placeholder="One small next step" placeholderTextColor={colors.muted} selectionColor={colors.primary} style={[styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
        {!!run.tinyStep.trim() && <ActionButton label={run.continueSaved ? 'Update saved item in Activities' : 'Keep this next step in Activities'} variant="secondary" loading={run.busy} onPress={() => onKeep(run.tinyStep)} />}
        <ActionButton label="Done" disabled={run.busy} onPress={() => void run.finishRun('completed')} />
        <ActionButton label="Stop" variant="quiet" disabled={run.busy} onPress={() => void run.finishRun('stopped')} />
      </>}
    </ActivityPanel>
  );
}

export function PausedPanel({ run }: { run: RunState }) {
  const { colors, typography } = useTheme();
  if (run.phase !== 'paused') return null;
  return (
    <ActivityPanel style={{ gap: 12 }}>
      <Eyebrow>PAUSED</Eyebrow>
      <Text style={[typography.body, { color: colors.ink }]}>Your saved activity is paused. Continue whenever you are ready.</Text>
      <ActionButton label="Resume activity" onPress={run.resumeActivity} />
      <ActionButton label="Stop" variant="quiet" onPress={() => void run.finishRun('stopped')} />
    </ActivityPanel>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 50, padding: 16, borderWidth: 1, borderRadius: 16, fontSize: 17, lineHeight: 25, textAlignVertical: 'top' },
});
