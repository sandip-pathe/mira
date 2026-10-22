import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { ActionButton, useTheme } from '../../../../components/ui';
import { ActivityHeader } from './ActivityHeader';
import { ActivityOutcome } from './ActivityOutcome';
import { PausedPanel, ReadyPanel, SortActivityPanel } from './ActivityPanels';
import { useInterventionRun } from '../hooks/useInterventionRun';
import { ActivityPanel } from './ActivityPanel';

type RunState = ReturnType<typeof useInterventionRun>;
export function InterventionRunnerView({
  run,
  origin,
  onBack,
}: {
  run: RunState;
  origin: string;
  onBack: () => void;
}) {
  const { colors, typography } = useTheme();
  if (!run.intervention || run.phase === 'loading') {
    const loading = run.status.toLowerCase().startsWith('loading');
    return (
      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 24, backgroundColor: colors.canvas }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator color={colors.primary} />
            <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted, textAlign: 'center' }]}>
              Opening activityâ€¦
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>
              {run.status}
            </Text>
            <ActionButton
              label={`Back to ${origin === 'talk' ? 'Talk' : 'Actions'}`}
              onPress={onBack}
            />
          </View>
        )}
      </View>
    );
  }
  return (
    <ScrollView
      style={{ backgroundColor: colors.canvas }}
      contentContainerStyle={{
        padding: 22,
        paddingBottom: 32,
        gap: 16,
        maxWidth: 704,
        width: '100%',
        alignSelf: 'center',
      }}
      keyboardShouldPersistTaps="handled"
    >
      <ActivityHeader intervention={run.intervention} phase={run.phase} status={run.status} />
      {!['short_movement', 'one_song_break'].includes(run.activeId) && <ReadyPanel run={run} origin={origin} onBack={onBack} />}
      {run.activeId === 'task_reset_60s' && <SortActivityPanel run={run} onKeep={run.confirmKeepInActions} />}
      <PausedPanel run={run} />
      {run.finished && run.activeId === 'task_reset_60s' && (
        <ActivityOutcome
          tried={run.tried}
          setTried={run.setTried}
          rating={run.rating}
          setRating={run.setRating}
          reuse={run.reuse}
          setReuse={run.setReuse}
          saved={run.saved}
          busy={run.busy}
          title={run.intervention.title}
          origin={origin as 'talk' | 'actions_library' | 'actions_continue'}
          feedbackStatus={run.feedbackStatus}
          feedbackRetry={run.feedbackRetry}
          onSave={(allow) => void run.savePreference(allow)}
          onBack={async () => {
            if (await run.resolveCompletedContinue()) onBack();
          }}
        />
      )}
      {!!run.localStatus && (
        <ActivityPanel>
          <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>
            {run.localStatus}
          </Text>
        </ActivityPanel>
      )}
    </ScrollView>
  );
}

