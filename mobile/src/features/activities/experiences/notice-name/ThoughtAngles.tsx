import React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import type { NoticeNameExperience } from './useNoticeNameExperience';
import { styles } from './noticeNameStyles';

export function ThoughtAngles({ experience }: { experience: NoticeNameExperience }) {
  const { colors, typography } = useTheme();
  const inputColors = { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line };
  if (experience.stage === 'thought_inputs') return <>
    <Eyebrow>OPTIONAL · TWO OTHER ANGLES</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>What happened, and what is your mind telling you?</Text>
    <Text style={[typography.support, { color: colors.muted }]}>Mira will offer two possible readings for you to consider. The original stays yours to keep or change.</Text>
    <TextInput accessibilityLabel="Situation for another perspective" multiline maxLength={2000}
      value={experience.situation} onChangeText={experience.setSituation} placeholder="What happened?"
      placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.input, styles.thoughtInput, inputColors]} />
    <TextInput accessibilityLabel="Your interpretation" multiline maxLength={2000}
      value={experience.interpretation} onChangeText={experience.setInterpretation} placeholder="What does it seem to mean to you?"
      placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.input, styles.thoughtInput, inputColors]} />
    <Text style={[typography.support, { color: colors.muted }]}>Only these two entries are sent for this suggestion. They are not saved by this activity.</Text>
    {experience.assistance === 'requesting' && <>
      <ActivityIndicator color={colors.primary} />
      <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Thinking of two possible angles…</Text>
      <ActionButton label="Cancel" variant="quiet" onPress={() => { experience.cancelAngles(); experience.setStage('phrase'); }} />
    </>}
    {experience.assistance === 'failed' && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>The two angles are unavailable right now. Your wording is still here.</Text>}
    <ActionButton label="Offer two other angles" loading={experience.assistance === 'requesting'}
      disabled={!experience.situation.trim() || !experience.interpretation.trim() || experience.situation.length > 2000 || experience.interpretation.length > 2000}
      onPress={() => void experience.offerAngles()} />
    <ActionButton label="Return to my sentence" variant="quiet" onPress={() => { experience.cancelAngles(); experience.setStage('phrase'); }} />
  </>;

  if (experience.stage !== 'thought_results' || !experience.angles) return null;
  return <>
    <Eyebrow>YOU DECIDE WHAT FITS</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Two possible angles</Text>
    <Text style={[typography.activityTitle, { color: colors.ink }]}>Your interpretation</Text>
    <Text style={[typography.body, { color: colors.ink }]}>{experience.interpretation}</Text>
    {experience.angles.map((angle, index) => {
      const id = index === 0 ? 'one' : 'two';
      const selected = experience.selectedAngles.includes(id);
      return <Pressable key={id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}
        onPress={() => experience.toggleAngle(id)}
        style={({ pressed }) => [styles.angle, { borderBottomColor: colors.line, opacity: pressed ? 0.65 : 1 }]}>
        <MaterialDesignIcons name={selected ? 'checkbox-marked-outline' : 'checkbox-blank-outline'} size={24} color={colors.primary} />
        <Text style={[typography.body, styles.angleText, { color: selected ? colors.primary : colors.ink }]}>{angle}</Text>
      </Pressable>;
    })}
    <View style={styles.actions}>
      <ActionButton label="Use one selected angle" variant="secondary" disabled={experience.selectedAngles.length !== 1}
        onPress={() => experience.applySelectedAngles(false)} style={styles.action} />
      <ActionButton label="Combine both" variant="secondary" disabled={experience.selectedAngles.length !== 2}
        onPress={() => experience.applySelectedAngles(true)} style={styles.action} />
    </View>
    <Text style={[typography.activityTitle, { color: colors.ink }]}>Edit the wording you want to keep</Text>
    <TextInput accessibilityLabel="Edit selected perspective wording" multiline value={experience.angleDraft}
      onChangeText={experience.setAngleDraft} placeholder="Choose an angle, then edit it here"
      placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.input, styles.writing, inputColors]} />
    <ActionButton label="Use this wording" disabled={!experience.angleDraft.trim()} onPress={experience.acceptAngles} />
    <ActionButton label="Reject both and keep my wording" variant="quiet" onPress={experience.rejectAngles} />
    <ActionButton label="Ask again" variant="quiet" onPress={() => experience.setStage('thought_inputs')} />
  </>;
}
