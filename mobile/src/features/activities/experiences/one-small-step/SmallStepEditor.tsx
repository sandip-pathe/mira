import React from 'react';
import { ActivityIndicator, Keyboard, Text, TextInput } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { SmallStepScene } from '../../art/SmallStepScene';
import type { OneSmallStepExperience } from './useOneSmallStepExperience';
import { styles } from './smallStepStyles';

export function SmallStepEditor({ experience, onBack }: { experience: OneSmallStepExperience; onBack: () => void }) {
  const { colors, typography } = useTheme();
  const inputColors = { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line };
  const generating = experience.phase === 'generating';
  return <>
    <SmallStepScene state="thought" />
    <Eyebrow>YOUR TASK</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>What do you want to move forward?</Text>
    {!!experience.sourceRunId && <Text style={[typography.support, { color: colors.muted }]}>Starting from a thread you selected in Brain Dump. Edit it as a task if you like.</Text>}
    <TextInput accessibilityLabel="Task you want to start" multiline maxLength={12000} value={experience.task}
      onChangeText={experience.setTask} placeholder="Name the task in your own words" placeholderTextColor={colors.muted}
      cursorColor={colors.primary} selectionColor={colors.primary} style={[typography.body, styles.input, styles.task, inputColors]} />
    <Text style={[typography.activityTitle, { color: colors.ink }]}>Your first move</Text>
    <TextInput accessibilityLabel="Editable first small move" multiline maxLength={500} value={experience.firstMove}
      onChangeText={(value) => { if (generating) experience.cancelSuggestion(); experience.setFirstMove(value); }}
      placeholder="Write one small, clear action, or ask Mira for an idea" placeholderTextColor={colors.muted}
      cursorColor={colors.primary} selectionColor={colors.primary} style={[typography.body, styles.input, styles.firstMove, inputColors]} />
    {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
    {generating ? <>
      <ActivityIndicator color={colors.primary} />
      <ActionButton label="Cancel suggestion" variant="quiet" onPress={experience.cancelSuggestion} />
    </> : <>
      <ActionButton label="Suggest a first move" variant="secondary" disabled={!experience.task.trim() || experience.busy}
        onPress={() => { Keyboard.dismiss(); void experience.generate(); }} />
      <ActionButton label="Review my action card" disabled={!experience.task.trim() || !experience.firstMove.trim() || experience.busy}
        onPress={() => { Keyboard.dismiss(); experience.reviewCard(); }} />
    </>}
    <ActionButton label="Back" variant="quiet" onPress={onBack} />
  </>;
}
