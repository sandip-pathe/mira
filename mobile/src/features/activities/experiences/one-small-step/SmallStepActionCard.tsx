import React from 'react';
import { Keyboard, Text, TextInput } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { SmallStepScene } from '../../art/SmallStepScene';
import type { OneSmallStepExperience } from './useOneSmallStepExperience';
import { styles } from './smallStepStyles';

export function SmallStepActionCard({ experience, onBack }: { experience: OneSmallStepExperience; onBack: () => void }) {
  const { colors, typography } = useTheme();
  const [pending, setPending] = React.useState<'saved' | 'continue'>();
  const inputColors = { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line };
  const valid = !!experience.task.trim() && !!experience.firstMove.trim();
  async function keep(destination: 'saved' | 'continue') {
    Keyboard.dismiss(); setPending(destination);
    try {
      if (destination === 'saved') await experience.saveCurrentAction('kept');
      else await experience.keepInContinue();
    } finally { setPending(undefined); }
  }
  return <>
    <SmallStepScene state="action" />
    <Eyebrow>YOUR NEXT ACTION</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>A first move you can change.</Text>
    <Text style={[typography.activityTitle, { color: colors.ink }]}>Task</Text>
    <TextInput accessibilityLabel="Edit task" multiline maxLength={12000} value={experience.task} editable={!experience.busy}
      onChangeText={experience.setTask} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.input, styles.task, inputColors]} />
    <Text style={[typography.activityTitle, { color: colors.ink }]}>First move</Text>
    <TextInput accessibilityLabel="Edit first move" multiline maxLength={500} value={experience.firstMove} editable={!experience.busy}
      onChangeText={experience.setFirstMove} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.input, styles.firstMove, inputColors]} />
    <TextInput accessibilityLabel="Optional timing cue" value={experience.cue} editable={!experience.busy} maxLength={300}
      onChangeText={experience.setCue} placeholder="When might this fit? (Optional)" placeholderTextColor={colors.muted}
      cursorColor={colors.primary} selectionColor={colors.primary} style={[typography.body, styles.input, inputColors]} />
    <Text style={[typography.support, { color: colors.muted }]}>This is a cue for you, not a reminder.</Text>
    {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
    <ActionButton label="Try this move" onPress={() => { Keyboard.dismiss(); experience.beginTrying(); }} disabled={!valid || experience.busy} />
    <ActionButton label="Save in Saved actions" variant="secondary" loading={experience.busy && pending === 'saved'}
      disabled={!valid || experience.busy} onPress={() => void keep('saved')} />
    <ActionButton label={experience.continueItem ? 'Update in Continue' : 'Keep in Continue'} variant="outline"
      loading={experience.busy && pending === 'continue'} disabled={!valid || experience.busy} onPress={() => void keep('continue')} />
    <ActionButton label="Edit task or first move" variant="quiet" disabled={experience.busy}
      onPress={() => experience.setStatus('Edit the action card above, then try or save it.')} />
    <ActionButton label="Return to where you started" variant="quiet" disabled={experience.busy} onPress={onBack} />
  </>;
}
