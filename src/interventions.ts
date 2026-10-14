export type Intervention = {
  id: string;
  title: string;
  category: string;
  goal: string;
  summary: string;
  steps: string[];
  duration_seconds: number;
  effort: string;
  environment: string[];
  prerequisites: string[];
  requires_person: boolean;
  contraindications: string[];
  review_status: string;
  source: string;
  delivery_modes: string[];
  completion_signal: string;
  personalization_signals: string[];
  catalog_version: string;
};

export type SupportDecision = {
  route: 'listen' | 'ask_question' | 'offer_intervention' | 'human_support';
  situation_summary: string;
  question: string;
  offer_reason: string;
  ranked_ids: string[];
  intervention: Intervention | null;
};

const loaded = new Map<string, Intervention>();

export function rememberIntervention(intervention?: Intervention | null) {
  if (intervention) loaded.set(intervention.id, intervention);
}

export function getRememberedIntervention(id: string) {
  return loaded.get(id);
}
