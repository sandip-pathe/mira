import React from 'react';
import { Text, View } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import type { GroundingExperience } from './useGroundingExperience';
import { styles } from './groundingStyles';

const ratingOptions = [
  { value: 'no', label: 'Not at all' },
  { value: 'a_little', label: 'A little' },
  { value: 'yes', label: 'Quite a bit' },
  { value: 'not_sure', label: 'Not sure' },
] as const;

export function GroundingCheckIn({ experience: x, onBack }: { experience: GroundingExperience; onBack: () => void }) {
  const { colors, typography } = useTheme();
  return <View style={[styles.feedback, { borderTopColor: colors.line }]}>
    {x.feedbackStep === 'rating' && <>
      <Eyebrow>OPTIONAL CHECK-IN</Eyebrow>
      <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>Did this help?</Text>
      <View style={styles.actions}>{ratingOptions.map((option) => <ActionButton key={option.value} label={option.label}
        variant="secondary" disabled={x.busy} style={styles.action} onPress={() => x.chooseRating(option.value)} />)}</View>
      <ActionButton label="Skip check-in" variant="quiet" disabled={x.busy} onPress={() => { x.skipFeedback(); onBack(); }} />
    </>}
    {x.feedbackStep === 'reuse' && <>
      <Eyebrow>YOUR CHOICE</Eyebrow>
      <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>Would you like Mira to suggest Grounding again?</Text>
      <ActionButton label="Use again" disabled={x.busy} onPress={x.reviewPreference} />
      <ActionButton label="No, keep it private" variant="secondary" disabled={x.busy} onPress={x.keepPrivate} />
    </>}
    {x.feedbackStep === 'review' && <>
      <Eyebrow>REVIEW BEFORE SAVING</Eyebrow>
      <Text style={[typography.body, { color: colors.ink }]}>Mira may suggest Grounding again in a similar moment.</Text>
      {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
      <ActionButton label="Save this preference" loading={x.busy} onPress={() => void x.savePreference()} />
      <ActionButton label="Keep it private" variant="quiet" disabled={x.busy} onPress={x.keepPrivate} />
    </>}
    {x.feedbackStep === 'saved' && <>
      {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
      <ActionButton label="Return to where you started" onPress={onBack} />
    </>}
  </View>;
}
