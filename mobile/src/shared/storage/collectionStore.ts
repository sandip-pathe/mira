import { File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { withDeviceTransaction } from './database';

type Collection = 'continue_items' | 'saved_letters' | 'activity_preferences' | 'activity_takeaways' | 'saved_actions';
export type CollectionSource<T extends { id: string }> = {
  table: Collection;
  legacyFilename: string;
  decode: (value: unknown) => T[];
};

function tableName<T extends { id: string }>(source: CollectionSource<T>) {
  if (!['continue_items', 'saved_letters', 'activity_preferences', 'activity_takeaways', 'saved_actions'].includes(source.table)) {
    throw new Error('Unknown device collection.');
  }
  return source.table;
}

async function read<T extends { id: string }>(
  db: SQLiteDatabase,
  source: CollectionSource<T>,
): Promise<T[]> {
  const rows = await db.getAllAsync<{ id: string; payload: string }>(
    `SELECT id, payload FROM ${tableName(source)} ORDER BY position`,
  );
  const items = source.decode(rows.map((row) => JSON.parse(row.payload)));
  if (items.length !== rows.length || items.some((item, i) => item.id !== rows[i].id)) {
    throw new Error('Saved data could not be verified.');
  }
  return items;
}

function checked<T extends { id: string }>(source: CollectionSource<T>, value: unknown) {
  const items = source.decode(value);
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error('Saved data contains duplicate IDs.');
  }
  return items;
}

async function write<T extends { id: string }>(
  db: SQLiteDatabase,
  source: CollectionSource<T>,
  items: T[],
) {
  const table = tableName(source);
  await db.runAsync(`DELETE FROM ${table}`);
  for (const [position, item] of items.entries()) {
    await db.runAsync(
      `INSERT INTO ${table} (id, payload, position) VALUES (?, ?, ?)`,
      item.id,
      JSON.stringify(item),
      position,
    );
  }
}

async function importLegacy<T extends { id: string }>(
  db: SQLiteDatabase,
  source: CollectionSource<T>,
) {
  const key = `legacy-files-v1:${tableName(source)}`;
  if (await db.getFirstAsync('SELECT name FROM storage_migrations WHERE name = ?', key)) return;
  const legacy = new File(Paths.document, source.legacyFilename);
  const items = checked(source, legacy.exists ? JSON.parse(await legacy.text()) : []);
  const existing = await read(db, source);
  if (existing.length) throw new Error('Existing device data requires migration review.');
  await write(db, source, items);
  const verified = await read(db, source);
  if (JSON.stringify(verified) !== JSON.stringify(items))
    throw new Error('Saved data import could not be verified.');
  await db.runAsync(
    'INSERT INTO storage_migrations (name, source_count, completed_at) VALUES (?, ?, ?)',
    key,
    items.length,
    Date.now(),
  );
  // Source cleanup happens only after this transaction has committed and verified every record.
}

async function ready<T extends { id: string }>(source: CollectionSource<T>) {
  await withDeviceTransaction((db) => importLegacy(db, source));
  const legacy = new File(Paths.document, source.legacyFilename);
  if (legacy.exists) legacy.delete();
  if (legacy.exists) throw new Error('Imported data is safe, but the old file could not be removed. Try again.');
  // Do not allow edits/deletes until redundant legacy copies have been retired.
}

export async function readDeviceCollection<T extends { id: string }>(source: CollectionSource<T>) {
  await ready(source);
  return withDeviceTransaction((db) => read(db, source));
}

export async function mutateDeviceCollection<T extends { id: string }, R>(
  source: CollectionSource<T>,
  update: (items: T[]) => { items: T[]; result: R },
  afterWrite?: (db: SQLiteDatabase) => Promise<void>,
): Promise<R> {
  await ready(source);
  return withDeviceTransaction(async (db) => {
    const next = update(await read(db, source));
    await write(db, source, checked(source, next.items));
    if (afterWrite) await afterWrite(db);
    return next.result;
  });
}
