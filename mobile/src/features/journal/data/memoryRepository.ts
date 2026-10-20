import { randomUUID } from 'expo-crypto';
import { withDeviceTransaction } from '../../../shared/storage/database';
import type { MemoryItem } from '../types';
import { emitContextRevoked } from '../../../shared/demoEvents';

export function listLocalMemories() {
  return withDeviceTransaction((db) =>
    db.getAllAsync<MemoryItem>('SELECT * FROM memory_items ORDER BY rowid DESC'),
  );
}

export function createLocalMemory(sourceId: string, excerpt: string) {
  const text = excerpt.trim();
  if (!text || text.length > 500) return Promise.reject(new Error('Choose a short excerpt first.'));
  return withDeviceTransaction(async (db) => {
    if (!(await db.getFirstAsync('SELECT id FROM journal_entries WHERE id = ?', sourceId)))
      throw new Error('This entry no longer exists.');
    const item: MemoryItem = {
      id: randomUUID(),
      source_entry_id: sourceId,
      excerpt: text,
      approved: 0,
      revoked: 0,
    };
    await db.runAsync(
      'INSERT INTO memory_items (id, source_entry_id, excerpt, approved, revoked) VALUES (?, ?, ?, 0, 0)',
      item.id,
      sourceId,
      text,
    );
    return item;
  });
}

export function changeLocalMemory(id: string, action: 'approve' | 'revoke' | 'delete') {
  return withDeviceTransaction(async (db) => {
    if (!(await db.getFirstAsync('SELECT id FROM memory_items WHERE id = ?', id)))
      throw new Error('This excerpt no longer exists.');
    if (action === 'delete') await db.runAsync('DELETE FROM memory_items WHERE id = ?', id);
    else
      await db.runAsync(
        'UPDATE memory_items SET approved = ?, revoked = ? WHERE id = ?',
        action === 'approve' ? 1 : 0,
        action === 'revoke' ? 1 : 0,
        id,
      );
    await db.runAsync('UPDATE consent_state SET revision = revision + 1 WHERE id = 1');
  }).then(() => {
    if (action !== 'approve') emitContextRevoked();
  });
}
