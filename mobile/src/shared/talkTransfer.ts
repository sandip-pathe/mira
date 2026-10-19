import { randomUUID } from 'expo-crypto';

type Transfer = { id: string; runId: string; text: string };

const stagedByRun = new Map<string, Transfer>();
const completedByRun = new Map<string, string>();
const completedIds = new Set<string>();
let pending: Transfer | undefined;

export function stageTalkTransfer(runId: string, text: string): string {
  const exactText = text.trim();
  if (!runId || !exactText || exactText.length > 12000)
    throw new Error('Select a short piece of text before opening Talk.');
  const existing = stagedByRun.get(runId);
  if (existing) {
    if (existing.text !== exactText)
      throw new Error('A transfer from this activity is already waiting in Talk.');
    pending = existing;
    return existing.id;
  }
  if (completedByRun.has(runId))
    throw new Error('Text from this activity has already been added to Talk.');
  if (pending)
    throw new Error('Another excerpt is still waiting to open in Talk.');
  const transfer = { id: randomUUID(), runId, text: exactText };
  stagedByRun.set(runId, transfer);
  pending = transfer;
  return transfer.id;
}

export function peekTalkTransfer() {
  return pending && !completedIds.has(pending.id) ? pending : undefined;
}

export function acknowledgeTalkTransfer(id: string) {
  if (!pending || pending.id !== id) return false;
  completedIds.add(id);
  completedByRun.set(pending.runId, id);
  stagedByRun.delete(pending.runId);
  pending = undefined;
  while (completedIds.size > 32) {
    const oldest = completedIds.values().next().value!;
    completedIds.delete(oldest);
    for (const [runId, transferId] of completedByRun) {
      if (transferId === oldest) completedByRun.delete(runId);
    }
  }
  return true;
}

