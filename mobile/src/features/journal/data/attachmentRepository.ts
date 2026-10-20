import { File, Paths } from 'expo-file-system';
import { withDeviceTransaction } from '../../../shared/storage/database';
import type { JournalDraftSnapshot, JournalVoiceNote } from '../types';
import { applyJournalDraftTx, readJournalTx } from './journalRepository';

function ownedFile(uri: string) {
  const root = new URL(Paths.document.uri);
  const target = new URL(uri);
  if (
    target.protocol !== 'file:' ||
    target.host !== root.host ||
    !target.pathname.startsWith(root.pathname.endsWith('/') ? root.pathname : root.pathname + '/')
  ) {
    throw new Error('This voice note is outside Mira storage.');
  }
  return new File(uri);
}

export async function saveJournalAttachment(
  snapshot: JournalDraftSnapshot,
  note: JournalVoiceNote,
) {
  if (!ownedFile(note.uri).exists) throw new Error('This recording is no longer available.');
  return withDeviceTransaction(async (db) => {
    if (!(await applyJournalDraftTx(db, snapshot)))
      throw new Error('This Journal session changed.');
    await db.runAsync(
      'INSERT INTO journal_attachments (id, session_id, uri, created_at) VALUES (?, ?, ?, ?)',
      note.id,
      snapshot.id,
      note.uri,
      note.created_at,
    );
    await db.runAsync(
      'UPDATE journal_sessions SET revision = revision + 1, updated_at = ? WHERE id = ?',
      Date.now() / 1000,
      snapshot.id,
    );
    return (await readJournalTx(db, snapshot.id))!;
  });
}

export function deleteJournalAttachment(id: string) {
  return withDeviceTransaction(async (db) => {
    const note = await db.getFirstAsync<{ session_id: string; uri: string }>(
      'SELECT session_id, uri FROM journal_attachments WHERE id = ?',
      id,
    );
    if (!note) return;
    await db.runAsync('INSERT OR IGNORE INTO journal_file_cleanup (uri) VALUES (?)', note.uri);
    await db.runAsync('DELETE FROM journal_attachments WHERE id = ?', id);
    await db.runAsync(
      'UPDATE journal_sessions SET revision = revision + 1, updated_at = ? WHERE id = ?',
      Date.now() / 1000,
      note.session_id,
    );
    return readJournalTx(db, note.session_id);
  });
}

/** Only recorded, unreferenced owned paths are eligible; never sweep the documents directory. */
export async function retryJournalFileCleanup(): Promise<boolean> {
  return withDeviceTransaction(async (db) => {
    let complete = true;
    const rows = await db.getAllAsync<{ uri: string }>('SELECT uri FROM journal_file_cleanup');
    for (const { uri } of rows) {
      if (await db.getFirstAsync('SELECT id FROM journal_attachments WHERE uri = ?', uri)) continue;
      try {
        const file = ownedFile(uri);
        if (file.exists) file.delete();
        if (file.exists) throw new Error('File cleanup needs retry.');
        await db.runAsync('DELETE FROM journal_file_cleanup WHERE uri = ?', uri);
      } catch {
        complete = false;
      }
    }
    return complete;
  });
}
