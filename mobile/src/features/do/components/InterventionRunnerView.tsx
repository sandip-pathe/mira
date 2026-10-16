import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ActionButton, Surface, ui } from '../../../components/ui';
import { ActivityHeader } from './ActivityHeader';
import { ActivityOutcome } from './ActivityOutcome';
import {
  CaptureActivityPanel,
  PausedPanel,
  ReadyPanel,
  SortActivityPanel,
  StepsActivityPanel,
} from './ActivityPanels';
import { useInterventionRun } from '../hooks/useInterventionRun';

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
  if (!run.intervention || run.phase === 'loading')
    return (
      <View style={{ gap: 14 }}>
        <Text accessibilityLiveRegion="polite" style={ui.muted}>
          {run.status}
        </Text>
        <ActionButton
          label={`Back to ${origin === 'talk' ? 'Talk' : 'Actions'}`}
          onPress={onBack}
        />
      </View>
    );
  return (
    <ScrollView
      contentContainerStyle={{ padding: 22, paddingBottom: 32, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <ActivityHeader intervention={run.intervention} phase={run.phase} status={run.status} />
      <ReadyPanel run={run} origin={origin} onBack={onBack} />
      <SortActivityPanel run={run} onKeep={run.confirmKeepInActions} />
      <CaptureActivityPanel run={run} onKeep={run.confirmKeepInActions} />
      <StepsActivityPanel run={run} onKeep={run.confirmKeepInActions} />
      <PausedPanel run={run} />
      {run.finished && (
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
        <Surface>
          <Text accessibilityLiveRegion="polite" style={ui.muted}>
            {run.localStatus}
          </Text>
        </Surface>
      )}
    </ScrollView>
  );
}
