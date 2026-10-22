import React from 'react';
import { canonicalActivityId } from '../../../shared/activityRegistry';
import { LegacyActivityAdapter } from '../legacy/LegacyActivityAdapter';
import type { ActivityExperienceProps } from './contracts';
import { experienceRegistry } from './experienceRegistry';
import { ActivityFrame } from './ActivityFrame';
import { ActionButton, useTheme } from '../../../components/ui';
import { Text, View } from 'react-native';

/** Routes primary activities to independent screens; only the historical task-reset ID uses its adapter. */
export function ActivityHost(props: ActivityExperienceProps) {
  const { colors, typography } = useTheme();
  const canonicalId = canonicalActivityId(props.id);
  const experience = canonicalId ? experienceRegistry[canonicalId] : undefined;
  if (!experience) {
    if (canonicalId === 'task_reset_60s') return <LegacyActivityAdapter {...props} />;
    return <ActivityFrame><View style={{ flex: 1, padding: 22, gap: 14 }}>
      <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>This activity is no longer available in this version.</Text>
      <ActionButton label="Back to Activities" onPress={props.onBack} />
    </View></ActivityFrame>;
  }
  const Screen = experience.component;
  return <Screen key={`${canonicalId}-${props.origin}-${props.continueItemId ?? ''}-${props.handoffId ?? ''}`} {...props} />;
}
