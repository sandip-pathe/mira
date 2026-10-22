import { randomUUID } from 'expo-crypto';
import { mutateDeviceCollection, readDeviceCollection, type CollectionSource } from './storage/collectionStore';

export type SavedActionOutcome = 'kept' | 'tried' | 'not_tried';
export type SavedAction = {
  id: string;
  sourceRunId: string;
  task: string;
  firstMove: string;
  cue?: string;
  outcome: SavedActionOutcome;
  createdAt: number;
  updatedAt: number;
};

function validAction(value: unknown): value is SavedAction {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SavedAction>;
  return typeof item.id === 'string' && !!item.id && item.id.length <= 80 &&
    typeof item.sourceRunId === 'string' && !!item.sourceRunId && item.sourceRunId.length <= 120 &&
    typeof item.task === 'string' && item.task.length > 0 && item.task.length <= 12000 &&
    typeof item.firstMove === 'string' && item.firstMove.length > 0 && item.firstMove.length <= 500 &&
    (item.cue === undefined || (typeof item.cue === 'string' && item.cue.length <= 300)) &&
    (item.outcome === 'kept' || item.outcome === 'tried' || item.outcome === 'not_tried') &&
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) &&
    typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt);
}

const source: CollectionSource<SavedAction> = {
  table: 'saved_actions',
  legacyFilename: 'mira.saved-actions.v1.json',
  decode(value) {
    if (!Array.isArray(value) || !value.every(validAction)) throw new Error('Saved actions could not be opened safely.');
    return value;
  },
};

export async function loadSavedActions() {
  return (await readDeviceCollection(source)).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadSavedAction(id: string) {
  return (await loadSavedActions()).find((item) => item.id === id);
}

export async function saveAction(input: Omit<SavedAction, 'id' | 'createdAt' | 'updatedAt'>) {
  const task = input.task.trim();
  const firstMove = input.firstMove.trim();
  if (!task || task.length > 12000 || !firstMove || firstMove.length > 500 || !input.sourceRunId)
    throw new Error('Add a task and first move before saving.');
  return mutateDeviceCollection(source, (items) => {
    const prior = items.find((item) => item.sourceRunId === input.sourceRunId);
    const now = Date.now();
    const item: SavedAction = {
      ...input, task, firstMove, id: prior?.id ?? randomUUID(), createdAt: prior?.createdAt ?? now, updatedAt: now,
    };
    return { items: [item, ...items.filter((entry) => entry.id !== item.id)], result: item };
  });
}

export async function updateSavedActionOutcome(id: string, outcome: SavedActionOutcome) {
  return mutateDeviceCollection(source, (items) => {
    const found = items.find((item) => item.id === id);
    if (!found) return { items, result: undefined };
    const updated = { ...found, outcome, updatedAt: Date.now() };
    return { items: items.map((item) => item.id === id ? updated : item), result: updated };
  });
}

export function deleteSavedAction(id: string) {
  return mutateDeviceCollection(source, (items) => ({ items: items.filter((item) => item.id !== id), result: undefined }));
}
