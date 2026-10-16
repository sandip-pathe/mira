import React from 'react';
import { Text, View } from 'react-native';
import { Eyebrow, StatusPill, ui } from '../../../components/ui';
import { Intervention } from '../../../shared/interventions';

export function ActivityHeader({
  intervention,
  phase,
  status,
}: {
  intervention: Intervention;
  phase: 'loading' | 'ready' | 'active' | 'paused' | 'outcome';
  status: string;
}) {
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
        <Eyebrow>DO · {intervention.category.toUpperCase()}</Eyebrow>
        <StatusPill tone={phase === 'active' ? 'good' : 'neutral'}>{label}</StatusPill>
      </View>
      <Text style={ui.title}>{intervention.title}</Text>
      <Text style={ui.body}>{intervention.summary}</Text>
      <Text accessibilityLiveRegion="polite" style={ui.muted}>
        {status}
      </Text>
    </>
  );
}
