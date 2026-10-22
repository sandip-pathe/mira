import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { GroundingScene } from '../../art/GroundingScene';
import type { GroundingExperience } from './useGroundingExperience';
import { styles } from './groundingStyles';

export function GroundingGuide({ experience: x, onBack }: { experience: GroundingExperience; onBack: () => void }) {
  const { colors, typography } = useTheme();
  const { index, counts, sense, skipped } = x;
  const unavailable = counts[index] >= sense.target || skipped[index];
  return <>
    <Eyebrow>NOTICE AT YOUR PACE · {index + 1} OF 3</Eyebrow>
    <Pressable accessibilityRole="button" accessibilityLabel={index === 2 ? 'Notice a comfortable point of contact' : `Notice one thing you can ${sense.label.toLowerCase()}`}
      accessibilityHint="Adds one to this sense. Navigation controls are separate." accessibilityState={{ disabled: unavailable }}
      disabled={unavailable} onPress={x.noticeOne} style={({ pressed }) => [styles.artworkButton, { opacity: pressed ? 0.75 : 1 }]}>
      <GroundingScene sense={index as 0 | 1 | 2} rippleKey={x.rippleKey} />
    </Pressable>
    <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[typography.groupHeading, styles.centered, { color: colors.ink }]}>{sense.prompt}</Text>
    <Text accessibilityLiveRegion="polite" style={[typography.support, styles.centered, { color: colors.muted }]}>{skipped[index] ? 'Skipped for now' : `${counts[index]} of ${sense.target} noticed`}</Text>
    <View accessibilityLabel={`${counts[index]} of ${sense.target} noticed`} accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: sense.target, now: counts[index] }} style={styles.progress}>
      {Array.from({ length: sense.target }, (_, at) => <View key={at} style={[styles.dot, { backgroundColor: at < counts[index] ? colors.primary : colors.line }]} />)}
    </View>
    <Text style={[typography.support, styles.centered, { color: colors.muted }]}>Tap the illustration or use the button below for each thing you notice.</Text>
    <ActionButton label={index === 2 ? 'I noticed a point of contact' : 'I noticed one'} disabled={unavailable} onPress={x.noticeOne} />
    <View style={styles.actions}>
      {index > 0 && <ActionButton label="Previous sense" variant="secondary" onPress={x.previous} style={styles.action} />}
      <ActionButton label={index === 2 ? 'Finish' : 'Continue'} disabled={!x.canAdvance} onPress={x.next} style={styles.action} />
    </View>
    <View style={styles.actions}>
      <ActionButton label={skipped[index] ? 'Undo skip' : 'Undo last notice'} variant="quiet" disabled={counts[index] === 0 && !skipped[index]} onPress={x.undo} style={styles.action} />
      <ActionButton label="Skip this sense" variant="quiet" disabled={unavailable} onPress={x.skipSense} style={styles.action} />
    </View>
    <ActionButton label="Leave grounding" variant="quiet" onPress={onBack} />
  </>;
}
