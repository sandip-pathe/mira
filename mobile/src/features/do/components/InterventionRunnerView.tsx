import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { ActionButton, ui } from '../../../components/ui';
import { ActivityHeader } from './ActivityHeader';
import { ActivityOutcome } from './ActivityOutcome';
import {
  PausedPanel,
  ReadyPanel,
  SortActivityPanel,
  StepsActivityPanel,
} from './ActivityPanels';
import { useInterventionRun } from '../hooks/useInterventionRun';
import { LetterActivityPanel } from './LetterActivityPanel';
import { GroundingActivityPanel } from './GroundingActivityPanel';
import { OneSmallStepPanel } from './OneSmallStepPanel';
import { NoticeNamePanel } from './NoticeNamePanel';
import { PacedBreathingPanel } from './PacedBreathingPanel';
import { ReachOutPanel } from './ReachOutPanel';
import { MoveScenePanel } from './MoveScenePanel';
import { OneSongPanel } from './OneSongPanel';
import { BrainDumpPanel } from './BrainDumpPanel';
import { ActivityPanel } from './ActivityPanel';

type RunState = ReturnType<typeof useInterventionRun>;
export function InterventionRunnerView({
  run,
  origin,
  letterId,
  onBack,
  onTalkTransfer,
}: {
  run: RunState;
  origin: string;
  letterId?: string;
  onBack: () => void;
  onTalkTransfer: (text: string) => boolean;
}) {
  if (!run.intervention || run.phase === 'loading') {
    const loading = run.status.toLowerCase().startsWith('loading');
    return (
      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 24 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator color="#3C805E" />
            <Text accessibilityLiveRegion="polite" style={[ui.muted, { textAlign: 'center' }]}>
              Opening activity…
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Text accessibilityLiveRegion="polite" style={ui.muted}>
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
      <SortActivityPanel run={run} onKeep={run.confirmKeepInActions} />
      <BrainDumpPanel run={run} onTalkTransfer={onTalkTransfer} onBack={onBack} />
      {!['short_movement', 'one_song_break'].includes(run.activeId) && <StepsActivityPanel run={run} onKeep={run.confirmKeepInActions} />}
      <LetterActivityPanel run={run} letterId={letterId} onTalkTransfer={onTalkTransfer} />
      <GroundingActivityPanel run={run} onBack={onBack} />
      <OneSmallStepPanel run={run} onBack={onBack} />
      <NoticeNamePanel run={run} onTalkTransfer={onTalkTransfer} onBack={onBack} origin={origin} />
      <PacedBreathingPanel run={run} origin={origin} onBack={onBack} />
      <ReachOutPanel run={run} origin={origin} onBack={onBack} />
      <MoveScenePanel run={run} origin={origin} onBack={onBack} />
      <OneSongPanel run={run} origin={origin} onBack={onBack} />
      <PausedPanel run={run} />
      {run.finished && run.activeId === 'grounding' && !!run.groundingSummary && (
        <ActivityPanel style={{ gap: 8 }}>
          <Text style={ui.heading}>What you noticed</Text>
          <Text style={ui.body}>{run.groundingSummary}</Text>
        </ActivityPanel>
      )}
      {run.finished && run.activeId !== 'one_song_break' && (
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
          checkInSkipLabel={run.activeId === 'short_movement' ? 'Skip' : undefined}
          checkInThanks={run.activeId === 'short_movement' ? 'Thanks for letting Mira know.' : undefined}
          simpleCheckIn={run.activeId === 'reach_out' || run.activeId === 'short_movement'}
          checkInPrompt={run.activeId === 'short_movement' ? 'What would you like to report?' : run.activeId === 'reach_out' ? 'Did you reach out?' : undefined}
          checkInYesLabel={run.activeId === 'short_movement' ? 'Tried it' : run.activeId === 'reach_out' ? 'I reached out' : undefined}
          checkInNoLabel={run.activeId === 'short_movement' ? 'Changed my mind' : run.activeId === 'reach_out' ? 'Not yet' : undefined}
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
          <Text accessibilityLiveRegion="polite" style={ui.muted}>
            {run.localStatus}
          </Text>
        </ActivityPanel>
      )}
    </ScrollView>
  );
}
