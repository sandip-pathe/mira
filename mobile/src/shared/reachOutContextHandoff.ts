import { randomUUID } from 'expo-crypto';

const staged = new Map<string, { context: string; expiresAt: number }>();

export function stageReachOutContext(context: string) {
  const text = context.trim().slice(0, 2400);
  if (!text) return undefined;
  const id = randomUUID();
  staged.set(id, { context: text, expiresAt: Date.now() + 2 * 60 * 1000 });
  for (const [key, value] of staged) if (value.expiresAt < Date.now()) staged.delete(key);
  return id;
}

/** One-time in-memory handoff. Conversation text is never placed in a route URL or persisted. */
export function consumeReachOutContext(id: string) {
  const value = staged.get(id);
  staged.delete(id);
  if (!value || value.expiresAt < Date.now()) return '';
  return value.context;
}
