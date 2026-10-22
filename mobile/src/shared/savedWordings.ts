import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { withDeviceTransaction } from './storage/database';

export type SavedWording = { id: string; sourceRunId: string; text: string; bodyLocations: string[]; createdAt: number };

function validWording(value: unknown): value is SavedWording {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SavedWording>;
  return typeof item.id === 'string' && !!item.id && item.id.length <= 80 &&
    typeof item.sourceRunId === 'string' && !!item.sourceRunId && item.sourceRunId.length <= 80 &&
    typeof item.text === 'string' && item.text.trim().length > 0 && item.text.length <= 2000 &&
    Array.isArray(item.bodyLocations) && item.bodyLocations.length <= 8 && item.bodyLocations.every((part) => typeof part === 'string' && part.length <= 40) &&
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt);
}

async function readWordings(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ id: string; payload: string }>('SELECT id, payload FROM saved_wordings ORDER BY position');
  const items = rows.map((row) => JSON.parse(row.payload) as unknown);
  if (!items.every(validWording) || items.some((item, index) => item.id !== rows[index].id)) throw new Error('Saved wording could not be opened safely.');
  return items;
}

export async function loadSavedWordings() {
  return withDeviceTransaction(async (db) => (await readWordings(db)).sort((a, b) => b.createdAt - a.createdAt));
}

export async function loadSavedWording(id: string) {
  return (await loadSavedWordings()).find((item) => item.id === id);
}

export async function saveWording(input: Omit<SavedWording, 'id' | 'createdAt'>) {
  const text = input.text.trim();
  if (!text || text.length > 2000 || !input.sourceRunId) throw new Error('Add the wording you want to keep.');
  const item: SavedWording = { ...input, text, bodyLocations: input.bodyLocations.slice(0, 8), id: randomUUID(), createdAt: Date.now() };
  return withDeviceTransaction(async (db) => {
    const items = await readWordings(db);
    const next = [item, ...items];
    await db.runAsync('DELETE FROM saved_wordings');
    for (const [position, wording] of next.entries()) await db.runAsync(
      'INSERT INTO saved_wordings (id, payload, position) VALUES (?, ?, ?)', wording.id, JSON.stringify(wording), position,
    );
    return item;
  });
}

export function deleteSavedWording(id: string) {
  return withDeviceTransaction(async (db) => {
    await db.runAsync('DELETE FROM saved_wordings WHERE id = ?', id);
    const rows = await db.getAllAsync<{ id: string; payload: string }>('SELECT id, payload FROM saved_wordings ORDER BY position');
    for (const [position, row] of rows.entries()) await db.runAsync('UPDATE saved_wordings SET position = ? WHERE id = ?', position, row.id);
  });
}
