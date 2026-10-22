import React from 'react';
import { Text } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { SmallStepScene } from '../../art/SmallStepScene';
import type { OneSmallStepExperience } from './useOneSmallStepExperience';
import { SMALL_STEP_SECONDS, useSmallStepTimer } from './useSmallStepTimer';
import { styles } from './smallStepStyles';

export function SmallStepTrying({ experience }: { experience: OneSmallStepExperience }) {
  const { colors, typography } = useTheme();
  const timer = useSmallStepTimer(experience.finishTimer);
  return <>
    <SmallStepScene state="trying" timerProgress={timer.seconds / SMALL_STEP_SECONDS} />
    <Eyebrow>TRY THE FIRST MOVE</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>{experience.firstMove}</Text>
    <Text style={[typography.support, { color: colors.muted }]}>You decide how long to spend. There is no need to finish the whole task.</Text>
    {timer.running ? <>
      <Text accessibilityLiveRegion="polite" style={[typography.screenTitle, styles.timer, { color: colors.primary }]}>
        {Math.floor(timer.seconds / 60)}:{String(timer.seconds % 60).padStart(2, '0')}
      </Text>
      <ActionButton label="Stop timer and check in" variant="secondary" onPress={timer.checkIn} />
    </> : <>
      <ActionButton label="Start optional 2-minute timer" variant="secondary" onPress={timer.start} />
      <ActionButton label="Skip timer" variant="quiet" onPress={timer.checkIn} />
    </>}
    <ActionButton label="I’m ready to check in" onPress={timer.checkIn} />
    <ActionButton label="Back to action card" variant="quiet" onPress={() => { timer.cancel(); experience.backToCard(); }} />
  </>;
}
