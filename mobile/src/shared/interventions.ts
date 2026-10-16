import { File, Paths } from 'expo-file-system';

export type Intervention = {
  presentation: {
    pattern: 'sort' | 'capture' | 'steps';
    input: 'none' | 'next_step' | 'draft';
    optional_timer: boolean;
  };
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

export type ContinueKind = 'next_step' | 'reach_out' | 'brain_dump';
export type ContinueItem = {
  id: string;
  intervention_id: string;
  kind: ContinueKind;
  title: string;
  content: string;
  created_at: number;
};

const CONTINUE_STORAGE_KEY = 'mira.actions.continue.v1';
const supportedContinueActivities: Record<string, ContinueKind> = {
  task_reset_60s: 'next_step',
  tiny_next_step: 'next_step',
  reach_out: 'reach_out',
  brain_dump: 'brain_dump',
};

export function getContinueKind(interventionId: string) {
  return supportedContinueActivities[interventionId];
}

const continueFile = new File(Paths.document, CONTINUE_STORAGE_KEY + '.json');

export async function loadContinueItems(): Promise<ContinueItem[]> {
  if (!continueFile.exists) return [];
  try {
    const parsed = JSON.parse(await continueFile.text());
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ContinueItem =>
        !!item &&
        typeof item.id === 'string' &&
        typeof item.intervention_id === 'string' &&
        !!getContinueKind(item.intervention_id) &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0,
    );
  } catch {
    return [];
  }
}

async function writeContinueItems(items: ContinueItem[]) {
  continueFile.write(JSON.stringify(items));
}

export async function saveContinueItem(intervention: Intervention, content: string) {
  const kind = getContinueKind(intervention.id);
  const value = content.trim();
  if (!kind || !value) throw new Error('This activity has no saveable follow-through item.');
  const items = await loadContinueItems();
  const item: ContinueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    intervention_id: intervention.id,
    kind,
    title: intervention.title,
    content: value,
    created_at: Date.now(),
  };
  await writeContinueItems([item, ...items]);
  return item;
}

export async function updateContinueItem(
  id: string,
  patch: Partial<Pick<ContinueItem, 'content'>>,
) {
  const items = await loadContinueItems();
  const next = items.map((item) => (item.id === id ? { ...item, ...patch } : item));
  if (!next.some((item) => item.id === id)) return false;
  await writeContinueItems(next);
  return true;
}

export async function removeContinueItem(id: string) {
  await writeContinueItems((await loadContinueItems()).filter((item) => item.id !== id));
}

export async function clearContinueItems() {
  await writeContinueItems([]);
}

const loaded = new Map<string, Intervention>();

export function rememberIntervention(intervention?: Intervention | null) {
  if (intervention) loaded.set(intervention.id, intervention);
}

export function getRememberedIntervention(id: string) {
  return loaded.get(id);
}
