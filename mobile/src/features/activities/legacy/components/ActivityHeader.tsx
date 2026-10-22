import React from 'react';
import { Text, View } from 'react-native';
import { Eyebrow, StatusPill, useTheme } from '../../../../components/ui';
import { Intervention } from '../../../../shared/interventions';

export function ActivityHeader({
  intervention,
  phase,
  status,
}: {
  intervention: Intervention;
  phase: 'loading' | 'ready' | 'active' | 'paused' | 'outcome';
  status: string;
}) {
  const { colors, typography } = useTheme();
  const label =
    phase === 'outcome'
      ? 'Finished'
      : phase === 'ready'
        ? 'Ready'
        : phase === 'paused'
          ? 'Paused'
          : phase === 'active'
            ? 'In progress'
            : 'Loading';
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Eyebrow>DO Â· {intervention.category.toUpperCase()}</Eyebrow>
        <StatusPill tone={phase === 'active' ? 'good' : 'neutral'}>{label}</StatusPill>
      </View>
      <Text style={[typography.screenTitle, { color: colors.ink }]}>{intervention.title}</Text>
      <Text style={[typography.body, { color: colors.ink }]}>{intervention.summary}</Text>
      <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>
        {status}
      </Text>
    </>
  );
}

