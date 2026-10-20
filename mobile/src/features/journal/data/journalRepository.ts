import type { SQLiteDatabase } from 'expo-sqlite';
import { withDeviceTransaction } from '../../../shared/storage/database';
import { emitContextRevoked } from '../../../shared/demoEvents';
import type { JournalDraftSnapshot, JournalSessionSummary, LocalJournalSession } from '../types';

type SessionRow = {
  id: string;
  title: string;
  initial_prompt: string;
  created_at: number;
  updated_at: number;
  saved: number;
  revision: number;
  presentation: string;
};
const now = () => Date.now() / 1000;

export async function readJournalTx(
  db: SQLiteDatabase,
  id: string,
): Promise<LocalJournalSession | undefined> {
  const row = await db.getFirstAsync<SessionRow>('SELECT * FROM journal_sessions WHERE id = ?', id);
  if (!row) return;
  const entries = await db.getAllAsync<LocalJournalSession['entries'][number]>(
    'SELECT id, text, input_type, created_at FROM journal_entries WHERE session_id = ? ORDER BY created_at, rowid',
    id,
  );
  const messages = await db.getAllAsync<LocalJournalSession['messages'][number]>(
    'SELECT id, session_id AS journal_session_id, role, content, entry_id, created_at FROM journal_messages WHERE session_id = ? ORDER BY sequence',
    id,
  );
  const notes = await db.getAllAsync<LocalJournalSession['voice_notes'][number]>(
    'SELECT id, uri, created_at FROM journal_attachments WHERE session_id = ? ORDER BY created_at DESC',
    id,
  );
  const draft = await db.getFirstAsync<{ text: string }>(
    'SELECT text FROM journal_drafts WHERE session_id = ?',
    id,
  );
  return {
    ...row,
    saved: !!row.saved,
    presentation: JSON.parse(row.presentation),
    entries,
    messages,
    voice_notes: notes,
    draft: draft?.text ?? '',
    entry_count: entries.length,
    attachment_count: notes.length,
  };
}

/** Stale autosaves cannot reopen a saved or deleted session. */
export async function applyJournalDraftTx(
  db: SQLiteDatabase,
  snapshot: JournalDraftSnapshot,
): Promise<boolean> {
  if (
    !snapshot.id ||
    !snapshot.prompt.trim() ||
    snapshot.prompt.length > 300 ||
    snapshot.text.length > 12000 ||
    !Number.isSafeInteger(snapshot.revision) ||
    snapshot.revision < 0
  ) {
    throw new Error('Journal draft is invalid.');
  }
  if (await db.getFirstAsync('SELECT id FROM journal_deleted_sessions WHERE id = ?', snapshot.id))
    return false;
  let row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM journal_sessions WHERE id = ?',
    snapshot.id,
  );
  if (row?.saved || (row && row.revision > snapshot.revision)) return false;
  if (!row) {
    const timestamp = now();
    await db.runAsync(
      'INSERT INTO journal_sessions (id, title, initial_prompt, created_at, updated_at, presentation) VALUES (?, ?, ?, ?, ?, ?)',
      snapshot.id,
      `Journal · ${new Date().toLocaleDateString()}`,
      snapshot.prompt,
      timestamp,
      timestamp,
      JSON.stringify(snapshot.presentation),
    );
    await db.runAsync(
      'INSERT INTO journal_messages (id, session_id, role, content, created_at, sequence) VALUES (?, ?, ?, ?, ?, 0)',
      `${snapshot.id}:initial`,
      snapshot.id,
      'assistant',
      snapshot.prompt,
      timestamp,
    );
    row = (await db.getFirstAsync<SessionRow>(
      'SELECT * FROM journal_sessions WHERE id = ?',
      snapshot.id,
    ))!;
  }
  const count = await db.getFirstAsync<{ total: number }>(
    'SELECT count(*) AS total FROM journal_entries WHERE session_id = ?',
    snapshot.id,
  );
  if (!count?.total) {
    await db.runAsync(
      'UPDATE journal_sessions SET initial_prompt = ? WHERE id = ?',
      snapshot.prompt,
      snapshot.id,
    );
    await db.runAsync(
      'UPDATE journal_messages SET content = ? WHERE id = ?',
      snapshot.prompt,
      `${snapshot.id}:initial`,
    );
  }
  await db.runAsync(
    'INSERT INTO journal_drafts (session_id, text) VALUES (?, ?) ON CONFLICT(session_id) DO UPDATE SET text = excluded.text',
    snapshot.id,
    snapshot.text,
  );
  await db.runAsync(
    'UPDATE journal_sessions SET revision = ?, presentation = ?, updated_at = ? WHERE id = ?',
    snapshot.revision,
    JSON.stringify(snapshot.presentation),
    now(),
    snapshot.id,
  );
  return true;
}

export function persistJournalDraft(snapshot: JournalDraftSnapshot) {
  return withDeviceTransaction((db) => applyJournalDraftTx(db, snapshot));
}

export function getLocalJournal(id: string) {
  return withDeviceTransaction((db) => readJournalTx(db, id));
}

export function listLocalJournals(): Promise<JournalSessionSummary[]> {
  return withDeviceTransaction(async (db) => {
    const rows = await db.getAllAsync<Omit<JournalSessionSummary, 'saved'> & { saved: number }>(`
      SELECT s.id, s.title, s.initial_prompt, s.created_at, s.updated_at, s.saved,
        (SELECT count(*) FROM journal_entries e WHERE e.session_id = s.id) AS entry_count,
        (SELECT count(*) FROM journal_attachments a WHERE a.session_id = s.id) AS attachment_count,
        COALESCE(NULLIF(d.text, ''), (SELECT e.text FROM journal_entries e WHERE e.session_id = s.id ORDER BY e.created_at DESC, e.rowid DESC LIMIT 1), s.initial_prompt) AS preview
      FROM journal_sessions s LEFT JOIN journal_drafts d ON d.session_id = s.id
      WHERE length(COALESCE(d.text, '')) > 0 OR EXISTS(SELECT 1 FROM journal_entries e WHERE e.session_id = s.id)
        OR EXISTS(SELECT 1 FROM journal_attachments a WHERE a.session_id = s.id)
      ORDER BY s.updated_at DESC, s.rowid DESC
    `);
    return rows.map((row) => ({ ...row, saved: !!row.saved }));
  });
}

async function appendEntryTx(db: SQLiteDatabase, snapshot: JournalDraftSnapshot, entryId: string) {
  if (!snapshot.text.trim()) throw new Error('Write an entry first.');
  const existing = await db.getFirstAsync<{ session_id: string; text: string }>(
    'SELECT session_id, text FROM journal_entries WHERE id = ?',
    entryId,
  );
  if (existing) {
    if (existing.session_id !== snapshot.id || existing.text !== snapshot.text.trim())
      throw new Error('Entry save conflict.');
    return;
  }
  if (!(await applyJournalDraftTx(db, snapshot)))
    throw new Error('This Journal session changed. Reopen it before saving.');
  const timestamp = now();
  await db.runAsync(
    'INSERT INTO journal_entries (id, session_id, text, input_type, created_at) VALUES (?, ?, ?, ?, ?)',
    entryId,
    snapshot.id,
    snapshot.text.trim(),
    'text',
    timestamp,
  );
  await db.runAsync(
    `INSERT INTO journal_messages (id, session_id, role, content, entry_id, created_at, sequence)
    VALUES (?, ?, 'user', ?, ?, ?, (SELECT COALESCE(MAX(sequence), -1) + 1 FROM journal_messages WHERE session_id = ?))`,
    `${entryId}:user`,
    snapshot.id,
    snapshot.text.trim(),
    entryId,
    timestamp,
    snapshot.id,
  );
  await db.runAsync('UPDATE journal_drafts SET text = ? WHERE session_id = ?', '', snapshot.id);
  await db.runAsync(
    'UPDATE journal_sessions SET revision = revision + 1, updated_at = ? WHERE id = ?',
    timestamp,
    snapshot.id,
  );
}

export function appendJournalEntry(snapshot: JournalDraftSnapshot, entryId: string) {
  return withDeviceTransaction(async (db) => {
    await appendEntryTx(db, snapshot, entryId);
    return (await readJournalTx(db, snapshot.id))!;
  });
}

export function appendJournalFollowUp(
  id: string,
  entryId: string,
  revision: number,
  text: string,
  isCurrent = () => true,
) {
  return withDeviceTransaction(async (db) => {
    const row = await db.getFirstAsync<SessionRow>(
      'SELECT * FROM journal_sessions WHERE id = ?',
      id,
    );
    const last = await db.getFirstAsync<{ entry_id: string; role: string }>(
      'SELECT entry_id, role FROM journal_messages WHERE session_id = ? ORDER BY sequence DESC LIMIT 1',
      id,
    );
    if (
      !isCurrent() ||
      !row ||
      row.saved ||
      row.revision !== revision ||
      last?.entry_id !== entryId ||
      last.role !== 'user'
    )
      return;
    if (!text.trim() || text.length > 300) throw new Error('Invalid Journal follow-up.');
    await db.runAsync(
      `INSERT INTO journal_messages (id, session_id, role, content, entry_id, created_at, sequence)
      VALUES (?, ?, 'assistant', ?, ?, ?, (SELECT MAX(sequence) + 1 FROM journal_messages WHERE session_id = ?))`,
      `${entryId}:follow-up`,
      id,
      text,
      entryId,
      now(),
      id,
    );
    await db.runAsync('UPDATE journal_sessions SET updated_at = ? WHERE id = ?', now(), id);
    return readJournalTx(db, id);
  });
}

export function saveLocalJournal(snapshot: JournalDraftSnapshot, entryId: string) {
  return withDeviceTransaction(async (db) => {
    if (snapshot.text.trim()) await appendEntryTx(db, snapshot, entryId);
    else if (!(await applyJournalDraftTx(db, snapshot)))
      throw new Error('This Journal session changed. Reopen it before saving.');
    const document = (await readJournalTx(db, snapshot.id))!;
    if (!document.entries.length && !document.voice_notes.length)
      throw new Error('Add writing or a voice note first.');
    await db.runAsync(
      'UPDATE journal_sessions SET saved = 1, revision = revision + 1, updated_at = ? WHERE id = ?',
      now(),
      snapshot.id,
    );
    await db.runAsync('DELETE FROM journal_drafts WHERE session_id = ?', snapshot.id);
    return (await readJournalTx(db, snapshot.id))!;
  });
}

export function deleteLocalJournalEntry(id: string) {
  return withDeviceTransaction(async (db) => {
    const entry = await db.getFirstAsync<{ session_id: string }>(
      'SELECT session_id FROM journal_entries WHERE id = ?',
      id,
    );
    if (!entry) return;
    await db.runAsync('DELETE FROM journal_entries WHERE id = ?', id);
    await db.runAsync('UPDATE consent_state SET revision = revision + 1 WHERE id = 1');
    await db.runAsync(
      'UPDATE journal_sessions SET revision = revision + 1, updated_at = ? WHERE id = ?',
      now(),
      entry.session_id,
    );
    return readJournalTx(db, entry.session_id);
  }).then((document) => {
    if (document) emitContextRevoked();
    return document;
  });
}

export function deleteLocalJournal(id: string) {
  return withDeviceTransaction(async (db) => {
    const existed = !!(await db.getFirstAsync('SELECT id FROM journal_sessions WHERE id = ?', id));
    if (existed) await db.runAsync('UPDATE consent_state SET revision = revision + 1 WHERE id = 1');
    await db.runAsync('INSERT OR IGNORE INTO journal_deleted_sessions (id) VALUES (?)', id);
    await db.runAsync(
      'INSERT OR IGNORE INTO journal_file_cleanup (uri) SELECT uri FROM journal_attachments WHERE session_id = ?',
      id,
    );
    await db.runAsync('DELETE FROM journal_sessions WHERE id = ?', id);
    return existed;
  }).then((existed) => {
    if (existed) emitContextRevoked();
  });
}
