import {
  mutateDeviceCollection,
  readDeviceCollection,
  type CollectionSource,
} from './storage/collectionStore';
import { ACTIVITY_CATALOG_VERSION } from './activityRegistry';

export type Intervention = {
  presentation: {
    pattern: 'sort' | 'capture' | 'steps' | 'letter' | 'grounding' | 'breathing';
    input: 'none' | 'next_step' | 'draft' | 'choice_or_text' | 'reflection' | 'letter';
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

export type ContinueKind =
  'next_step' | 'one_small_step' | 'reach_out' | 'brain_dump' | 'short_movement';
export type ContinueItem = {
  id: string;
  intervention_id: string;
  kind: ContinueKind;
  title: string;
  content: string;
  created_at: number;
  schema_version: 0 | 1 | 2;
  catalog_version: string;
  source_task?: string;
  cue?: string;
  source_run_id?: string;
};

const CONTINUE_STORAGE_KEY = 'mira.actions.continue.v1';
const CONTINUE_SCHEMA_VERSION = 2;
const supportedContinueCatalogVersions = new Set([
  '0.04',
  '0.05',
  '0.06',
  '0.07',
  '0.08',
  '0.09',
  '0.10',
  '0.11',
  '0.12',
  '0.13',
  '0.14',
]);
export function isSupportedContinueCatalogVersion(version: string) {
  return supportedContinueCatalogVersions.has(version);
}
const supportedContinueActivities: Record<string, ContinueKind> = {
  task_reset_60s: 'next_step',
  one_small_step: 'one_small_step',
  tiny_next_step: 'next_step',
  reach_out: 'reach_out',
  brain_dump: 'brain_dump',
  short_movement: 'short_movement',
};

export function getContinueKind(interventionId: string) {
  return supportedContinueActivities[interventionId];
}

const continueSource: CollectionSource<ContinueItem> = {
  table: 'continue_items',
  legacyFilename: CONTINUE_STORAGE_KEY + '.json',
  decode(value) {
    if (!Array.isArray(value)) throw new Error('Saved items could not be opened.');
    return value.map((item): ContinueItem => {
      if (
        !item ||
        typeof item.id !== 'string' ||
        !item.id ||
        typeof item.intervention_id !== 'string' ||
        !getContinueKind(item.intervention_id) ||
        typeof item.title !== 'string' ||
        typeof item.content !== 'string' ||
        !item.content.trim() ||
        typeof item.created_at !== 'number' ||
        !Number.isFinite(item.created_at) ||
        (item.schema_version !== undefined &&
          ![0, 1, CONTINUE_SCHEMA_VERSION].includes(item.schema_version)) ||
        (item.catalog_version !== undefined &&
          !supportedContinueCatalogVersions.has(item.catalog_version)) ||
        !Object.values(supportedContinueActivities).includes(item.kind)
      ) {
        throw new Error(
          'Saved items could not be imported safely. Your original file is unchanged.',
        );
      }
      return {
        ...item,
        schema_version: item.schema_version ?? 0,
        catalog_version: item.catalog_version ?? ACTIVITY_CATALOG_VERSION,
      } as ContinueItem;
    });
  },
};

export function loadContinueItems(): Promise<ContinueItem[]> {
  return readDeviceCollection(continueSource);
}

export async function saveContinueItem(
  intervention: Intervention,
  content: string,
  sourceRunId: string,
  details?: { source_task?: string; cue?: string },
) {
  const kind = getContinueKind(intervention.id);
  const value = content.trim();
  if (!kind || !value || !sourceRunId)
    throw new Error('This activity has no saveable follow-through item.');
  return mutateContinueItems((items) => {
    const prior = items.find((item) => item.source_run_id === sourceRunId);
    if (prior) {
      const item = { ...prior, content: value, ...details };
      return { items: items.map((entry) => (entry.id === prior.id ? item : entry)), result: item };
    }
    const item: ContinueItem = {
      id: sourceRunId,
      source_run_id: sourceRunId,
      intervention_id: intervention.id,
      kind,
      title: intervention.title,
      content: value,
      created_at: Date.now(),
      schema_version: CONTINUE_SCHEMA_VERSION,
      catalog_version: ACTIVITY_CATALOG_VERSION,
      ...details,
    };
    return { items: [item, ...items], result: item };
  });
}

export async function updateContinueItem(
  id: string,
  patch: Partial<Pick<ContinueItem, 'content' | 'source_task' | 'cue'>>,
) {
  return mutateContinueItems((items) => {
    if (!items.some((item) => item.id === id)) return { items, result: false };
    return {
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      result: true,
    };
  });
}

export async function removeContinueItem(id: string) {
  await mutateContinueItems((items) => ({
    items: items.filter((item) => item.id !== id),
    result: undefined,
  }));
}

export async function clearContinueItems() {
  await mutateContinueItems(() => ({ items: [], result: undefined }));
}

function mutateContinueItems<T>(
  update: (items: ContinueItem[]) => { items: ContinueItem[]; result: T },
): Promise<T> {
  return mutateDeviceCollection(continueSource, update);
}

const loaded = new Map<string, Intervention>();

export function rememberIntervention(intervention?: Intervention | null) {
  if (intervention) loaded.set(intervention.id, intervention);
}

export function getRememberedIntervention(id: string) {
  return loaded.get(id);
}
