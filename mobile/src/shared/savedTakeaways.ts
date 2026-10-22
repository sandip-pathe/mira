import { randomUUID } from 'expo-crypto';
import { mutateDeviceCollection, readDeviceCollection, type CollectionSource } from './storage/collectionStore';

export type DumpSectionId = 'heavy' | 'wait' | 'thread';

export type SavedTakeaway = {
  id: string;
  sourceRunId: string;
  section: DumpSectionId;
  text: string;
  createdAt: number;
};

function validTakeaway(value: unknown): value is SavedTakeaway {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SavedTakeaway>;
  return typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 80 &&
    typeof item.sourceRunId === 'string' && item.sourceRunId.length > 0 && item.sourceRunId.length <= 80 &&
    (item.section === 'heavy' || item.section === 'wait' || item.section === 'thread') &&
    typeof item.text === 'string' && item.text.length > 0 && item.text.length <= 500 &&
    typeof item.createdAt === 'number';
}

const source: CollectionSource<SavedTakeaway> = {
  table: 'activity_takeaways',
  legacyFilename: 'mira.activity-takeaways.v1.json',
  decode(value) {
    if (!Array.isArray(value) || !value.every(validTakeaway)) throw new Error('Saved Brain Dump takeaways could not be read.');
    return value;
  },
};

export async function loadSavedTakeaways() {
  return (await readDeviceCollection(source)).sort((a, b) => b.createdAt - a.createdAt);
}

export async function loadSavedTakeaway(id: string) {
  return (await loadSavedTakeaways()).find((item) => item.id === id);
}

export async function saveTakeaway(input: Omit<SavedTakeaway, 'id' | 'createdAt'>) {
  const text = input.text.trim();
  if (!text || text.length > 500 || !input.sourceRunId) throw new Error('Choose a short thread to save.');
  const item: SavedTakeaway = { ...input, text, id: randomUUID(), createdAt: Date.now() };
  return mutateDeviceCollection(source, (items) => ({ items: [item, ...items], result: item }));
}

export function deleteTakeaway(id: string) {
  return mutateDeviceCollection(source, (items) => ({ items: items.filter((item) => item.id !== id), result: undefined }));
}
