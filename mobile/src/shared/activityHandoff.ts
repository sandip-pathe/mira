import { randomUUID } from 'expo-crypto';

type ActivityHandoff = { id: string; sourceRunId: string; sourceText: string };
const pending = new Map<string, ActivityHandoff>();

export function stageActivityHandoff(sourceRunId: string, sourceText: string) {
  const text = sourceText.trim();
  if (!sourceRunId || !text || text.length > 12000) throw new Error('Choose a thread before opening One Small Step.');
  const handoff = { id: randomUUID(), sourceRunId, sourceText: text };
  pending.set(handoff.id, handoff);
  return handoff.id;
}

export function consumeActivityHandoff(id: string) {
  const value = pending.get(id);
  if (!value) return undefined;
  pending.delete(id);
  return value;
}

export function peekActivityHandoff(id: string) {
  return pending.get(id);
}

export function discardActivityHandoff(id: string) {
  pending.delete(id);
}
