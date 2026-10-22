import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityFrame } from '../../runtime/ActivityFrame';
import type { ActivityExperienceProps } from '../../runtime/contracts';
import { GroundingScene } from '../../art/GroundingScene';
import { useGroundingExperience } from './useGroundingExperience';
import { GroundingGuide } from './GroundingGuide';
import { GroundingCheckIn } from './GroundingCheckIn';
import { styles } from './groundingStyles';

export function GroundingScreen({ origin, onBack }: ActivityExperienceProps) {
  const { colors, typography } = useTheme();
  const experience = useGroundingExperience(origin);
  const { phase, index, rippleKey, feedbackStep } = experience;
  const scroll = React.useRef<ScrollView>(null);
  React.useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [phase, index, feedbackStep]);
  return <ActivityFrame>
    <ScrollView ref={scroll} contentContainerStyle={styles.content}>
      {phase === 'ready' && <>
        <Eyebrow>FOLLOW A GUIDE</Eyebrow>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Grounding</Text>
        <GroundingScene sense={0} rippleKey={0} />
        <Text style={[typography.groupHeading, { color: colors.ink }]}>Notice what is here, one sense at a time.</Text>
        <Text style={[typography.support, { color: colors.muted }]}>Look around, listen, and notice a comfortable point of contact. Skip any part or leave whenever you like.</Text>
        <View style={styles.spacer} />
        <ActionButton label="Begin" onPress={experience.start} />
        <ActionButton label="Back" variant="quiet" onPress={onBack} />
      </>}
      {phase === 'active' && <GroundingGuide experience={experience} onBack={onBack} />}
      {phase === 'done' && <>
        <Eyebrow>GROUNDING COMPLETE</Eyebrow>
        <GroundingScene sense={2} rippleKey={rippleKey + 1} />
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>You moved through the guide.</Text>
        <View style={styles.summary}>
          {experience.senseSummary.map((line) => <Text key={line.label} style={[typography.body, { color: colors.ink }]}>
            {line.label}: {line.skipped ? line.count ? `skipped after ${line.count} of ${line.target}` : 'skipped' : `${line.count} of ${line.target} noticed`}
          </Text>)}
        </View>
        <GroundingCheckIn experience={experience} onBack={onBack} />
      </>}
    </ScrollView>
  </ActivityFrame>;
}
