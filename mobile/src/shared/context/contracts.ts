export type ContextMatch = {
  id: string;
  source_type: 'journal' | 'action' | 'feedback';
  source_id: string;
  excerpt: string;
  label?: string;
  scope: 'shared_context' | 'reuse_preference';
};

export type ApprovedActivityPreference = {
  intervention_id: string;
  rating: string;
  preference: string;
};

export type ContextSnapshot = {
  revision: number;
  matches: ContextMatch[];
  preferences: ApprovedActivityPreference[];
};
