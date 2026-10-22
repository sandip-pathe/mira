import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ThoughtThreads } from '../../art/ThoughtThreads';
import { ActivityFrame } from '../../runtime/ActivityFrame';
import type { ActivityExperienceProps } from '../../runtime/contracts';
import { BrainDumpEditor } from './BrainDumpEditor';
import { useBrainDumpExperience } from './useBrainDumpExperience';
import { styles } from './brainDumpStyles';

export function BrainDumpScreen({ origin, continueItemId, onBack, onTalkTransfer }: ActivityExperienceProps) {
  const { colors, typography } = useTheme();
  const experience = useBrainDumpExperience({ origin, continueItemId });

  if (experience.phase === 'loading') {
    return (
      <ActivityFrame>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Opening your saved writing…</Text>
        </View>
      </ActivityFrame>
    );
  }

  if (experience.phase === 'error') {
    return (
      <ActivityFrame>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>
          <ActionButton label="Back to Activities" onPress={onBack} />
        </ScrollView>
      </ActivityFrame>
    );
  }

  if (experience.phase === 'ready') {
    return (
      <ActivityFrame>
        <ScrollView contentContainerStyle={styles.content}>
          <Eyebrow>EXPRESS</Eyebrow>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Brain Dump</Text>
          <Text style={[typography.support, { color: colors.muted }]}>A private, temporary space to get your thoughts out. You can write or hold to speak, then read it back or bring an excerpt into Talk.</Text>
          <ThoughtThreads height={132} />
          <View style={styles.spacer} />
          <ActionButton label="Start writing" onPress={experience.start} />
        </ScrollView>
      </ActivityFrame>
    );
  }

  if (experience.phase === 'active' && experience.run) {
    return (
      <ActivityFrame>
        <BrainDumpEditor
          key={experience.clientRunId}
          runId={experience.clientRunId}
          draft={experience.draft}
          setDraft={experience.setDraft}
          onTalkTransfer={onTalkTransfer}
          onFinish={experience.finish}
          onBack={onBack}
        />
      </ActivityFrame>
    );
  }

  return <ActivityFrame><View style={{ flex: 1 }} /></ActivityFrame>;
}
