import type { SQLiteDatabase } from 'expo-sqlite';
import { deviceCollectionsMigration } from './migrations/001-device-collections';
import { journalMigration } from './migrations/002-journal';
import { consentMigration } from './migrations/003-consent';
import { activityTakeawaysMigration } from './migrations/004-activity-takeaways';
import { savedActionsMigration } from './migrations/005-saved-actions';
import { breathingPreferencesMigration } from './migrations/006-breathing-preferences';
import { savedWordingsMigration } from './migrations/007-saved-wordings';
import { savedReachOutDraftsMigration } from './migrations/008-saved-reach-out-drafts';
import { moveScenePreferencesMigration } from './migrations/009-move-scene-preferences';
import { soundscapePreferencesMigration } from './migrations/010-soundscape-preferences';
import { themePreferenceMigration } from './migrations/011-theme-preference';

const migrations = [deviceCollectionsMigration, journalMigration, consentMigration, activityTakeawaysMigration, savedActionsMigration, breathingPreferencesMigration, savedWordingsMigration, savedReachOutDraftsMigration, moveScenePreferencesMigration, soundscapePreferencesMigration, themePreferenceMigration];
let opening: Promise<SQLiteDatabase> | undefined;
let operations: Promise<unknown> = Promise.resolve();

export class StorageBuildRequiredError extends Error {
  constructor() {
    super('Install the updated Mira build to open saved data. Your existing saves are unchanged.');
    this.name = 'StorageBuildRequiredError';
  }
}

export function storageErrorMessage(error: unknown, fallback: string) {
  return error instanceof StorageBuildRequiredError ? error.message : fallback;
}

async function openDatabase(): Promise<SQLiteDatabase> {
  let sqlite: typeof import('expo-sqlite');
  try {
    // Keep an older development APK usable: a missing native module must not crash imports.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sqlite = require('expo-sqlite') as typeof import('expo-sqlite');
  } catch {
    throw new StorageBuildRequiredError();
  }
  // SDK 57 registers default connections with the development database inspector.
  // This private connection deliberately stays outside that export/inspection channel.
  const db = await sqlite.openDatabaseAsync('mira-private.db', { useNewConnection: true });
  try {
    await db.execAsync(
      'PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;',
    );
    const current =
      (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
    if (current > migrations[migrations.length - 1].version) {
      throw new Error('This saved data needs a newer version of Mira.');
    }
    for (const migration of migrations) {
      if (migration.version <= current) continue;
      await db.withTransactionAsync(async () => {
        await db.execAsync(migration.sql);
        await db.execAsync(`PRAGMA user_version = ${migration.version}`);
      });
    }
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

function database() {
  if (!opening) {
    opening = openDatabase().catch((error) => {
      opening = undefined;
      throw error;
    });
  }
  return opening;
}

/** Every read/write shares this queue and connection; queries cannot enter another transaction. */
export function withDeviceTransaction<T>(work: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  const operation = operations.then(async () => {
    const db = await database();
    let result!: T;
    await db.withTransactionAsync(async () => {
      result = await work(db);
    });
    return result;
  });
  operations = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}
