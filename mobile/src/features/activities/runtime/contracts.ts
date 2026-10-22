import type React from 'react';

export type ActivityOrigin = 'talk' | 'actions_library' | 'actions_continue';
export type ActivityFinishState = 'completed' | 'skipped' | 'stopped';

export type ActivityExperienceProps = {
  id: string;
  origin: ActivityOrigin;
  continueItemId?: string;
  handoffId?: string;
  letterId?: string;
  contextId?: string;
  draftId?: string;
  onBack: () => void;
  onTalkTransfer: (runId: string, text: string) => boolean;
};

export type ActivityExperienceDefinition = {
  component: React.ComponentType<ActivityExperienceProps>;
};
