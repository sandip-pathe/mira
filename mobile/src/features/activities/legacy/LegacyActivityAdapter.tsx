import React from 'react';
import { InterventionRunnerView } from './components/InterventionRunnerView';
import { useInterventionRun } from './hooks/useInterventionRun';

export function LegacyActivityAdapter(props: {
  id: string;
  origin?: 'talk' | 'actions_library' | 'actions_continue';
  continueItemId?: string;
  onBack: () => void;
}) {
  const run = useInterventionRun(props);
  return (
    <InterventionRunnerView
      run={run}
      origin={props.origin ?? 'talk'}
      onBack={props.onBack}
    />
  );
}

