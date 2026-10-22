import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { withDeviceTransaction } from './storage/database';

export type ReachOutDraft = { id: string; sourceRunId: string; message: string; intent: string; tone: string; createdAt: number; updatedAt: number };
function valid(value: unknown): value is ReachOutDraft {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ReachOutDraft>;
  return typeof item.id === 'string' && !!item.id && item.id.length <= 80 &&
    typeof item.sourceRunId === 'string' && !!item.sourceRunId && item.sourceRunId.length <= 80 &&
    typeof item.message === 'string' && !!item.message.trim() && item.message.length <= 2000 &&
    typeof item.intent === 'string' && item.intent.length <= 40 && typeof item.tone === 'string' && item.tone.length <= 40 &&
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) && typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt);
}

async function readRows(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ id: string; payload: string }>('SELECT id, payload FROM saved_reach_out_drafts ORDER BY position');
  const values: unknown[] = rows.map((row) => JSON.parse(row.payload));
  if (!values.every(valid) || values.some((item, index) => item.id !== rows[index].id)) throw new Error('Saved messages could not be verified.');
  return values;
}
async function rewrite(db: SQLiteDatabase, drafts: ReachOutDraft[]) {
  await db.runAsync('DELETE FROM saved_reach_out_drafts');
  for (const [position, item] of drafts.entries()) await db.runAsync(
    'INSERT INTO saved_reach_out_drafts (id, payload, position) VALUES (?, ?, ?)', item.id, JSON.stringify(item), position,
  );
}

export async function loadReachOutDrafts() {
  return withDeviceTransaction(async (db) => (await readRows(db)).sort((a, b) => b.updatedAt - a.updatedAt));
}
export async function loadReachOutDraft(id: string) {
  return (await loadReachOutDrafts()).find((item) => item.id === id);
}
export async function saveReachOutDraft(input: { id?: string; sourceRunId: string; message: string; intent: string; tone: string }) {
  const message = input.message.trim();
  if (!message || message.length > 2000 || !input.sourceRunId) throw new Error('Add a message before saving.');
  return withDeviceTransaction(async (db) => {
    const drafts = await readRows(db);
    const previous = input.id ? drafts.find((draft) => draft.id === input.id) : undefined;
    if (input.id && !previous) throw new Error('This saved draft is no longer available.');
    const now = Date.now();
    const item: ReachOutDraft = { id: previous?.id ?? randomUUID(), sourceRunId: input.sourceRunId, message, intent: input.intent, tone: input.tone, createdAt: previous?.createdAt ?? now, updatedAt: now };
    await rewrite(db, [item, ...drafts.filter((draft) => draft.id !== item.id)]);
    return item;
  });
}
export async function deleteReachOutDraft(id: string) {
  return withDeviceTransaction(async (db) => {
    const drafts = await readRows(db);
    await rewrite(db, drafts.filter((draft) => draft.id !== id));
  });
}
