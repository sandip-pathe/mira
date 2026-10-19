import React from 'react';
import { InterventionRunnerView } from './components/InterventionRunnerView';
import { useInterventionRun } from './hooks/useInterventionRun';

export function InterventionRunner(props: {
  id: string;
  origin?: 'talk' | 'actions_library' | 'actions_continue';
  continueItemId?: string;
  letterId?: string;
  onBack: () => void;
  onTalkTransfer: (runId: string, text: string) => boolean;
}) {
  const run = useInterventionRun(props);
  return (
    <InterventionRunnerView
      run={run}
      origin={props.origin ?? 'talk'}
      letterId={props.letterId}
      onTalkTransfer={(text) => props.onTalkTransfer(run.clientRunId, text)}
      onBack={props.onBack}
    />
  );
}
