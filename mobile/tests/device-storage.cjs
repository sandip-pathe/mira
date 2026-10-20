// Exercise actual SQLite migration/rollback SQL; only native module and legacy files are mocked.
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { createSQLiteHarness } = require('./helpers/sqlite.cjs');
const src = path.resolve(__dirname, '../src');
const files = new Map();
let modules = new Map();
let missingNative = false;
let failInsert;
let insertCount = 0;
let generated = 0;
let failDelete = false;
const sqlite = createSQLiteHarness({ beforeRun: sql => {
  if (failInsert && sql.startsWith(`INSERT INTO ${failInsert.table}`) && ++insertCount === failInsert.at) {
    throw new Error('Synthetic interrupted write');
  }
} });

function load(filename) {
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = new Module(filename); modules.set(filename, loaded); loaded.filename = filename;
  loaded.require = name => {
    if (name === 'expo-sqlite') {
      if (missingNative) throw new Error('Missing native module');
      return sqlite.module;
    }
    if (name === 'expo-file-system') return { Paths: { document: 'device' }, File: class {
      constructor(...parts) { this.uri = parts.join('/'); }
      get exists() { return files.has(this.uri); }
      async text() { return files.get(this.uri); }
      delete() { if (failDelete) throw new Error('Synthetic cleanup failure'); files.delete(this.uri); }
    } };
    if (name === 'expo-crypto') return { randomUUID: () => `new-letter-${++generated}` };
    assert.ok(name.startsWith('.'), `Unexpected dependency: ${name}`);
    const resolved = path.resolve(path.dirname(filename), name);
    return load(resolved.endsWith('.json') ? resolved : `${resolved}.ts`);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return loaded.exports;
}
const api = name => load(path.join(src, name));
const restart = () => { sqlite.closeConnections(); modules = new Map(); };
const legacyContinue = 'device/mira.actions.continue.v1.json';
const legacyLetters = 'device/mira.saved-letters.v1.json';
const legacyPreferences = 'device/mira.activity-preferences.v1.json';
const kept = { id: 'kept', source_run_id: 'kept', intervention_id: 'one_small_step', kind: 'one_small_step',
  title: 'One Small Step', content: 'A synthetic action', created_at: 123, source_task: 'A task', cue: 'Later' };
const letter = { id: 'letter', title: 'A synthetic letter', recipient: 'Someone', body: 'Synthetic text', createdAt: 124, updatedAt: 125 };
const pref = { id: 'pref', action_id: 'grounding', rating: 'yes', reuse_context: 0,
  helpful_lesson: 'An explicitly approved synthetic preference', created_at: 126, storage: 'device' };

(async () => {
  files.set(legacyContinue, JSON.stringify([kept]));
  files.set(legacyLetters, 'invalid legacy synthetic data');
  files.set(legacyPreferences, JSON.stringify([pref, { ...pref, id: 'pref-2' }]));
  const originalContinue = files.get(legacyContinue);
  const storage = api('shared/interventions.ts');
  const imported = await storage.loadContinueItems();
  assert.equal(imported.length, 1); assert.equal(imported[0].id, kept.id);
  assert.equal(imported[0].created_at, kept.created_at); assert.equal(imported[0].schema_version, 0);
  assert.equal(files.has(legacyContinue), false, 'verified committed import retires the redundant source');
  const letters = api('shared/letters.ts');
  await assert.rejects(letters.loadSavedLetters());
  assert.equal(files.get(legacyLetters), 'invalid legacy synthetic data');
  assert.equal((await storage.loadContinueItems()).length, 1, 'one bad collection does not block other data');
  files.set(legacyLetters, JSON.stringify([letter, { ...letter }]));
  await assert.rejects(letters.loadSavedLetters(), /duplicate/);
  files.set(legacyLetters, JSON.stringify([letter]));
  failDelete = true;
  await assert.rejects(letters.deleteSavedLetter(letter.id), /cleanup/);
  assert.equal(files.get(legacyLetters), JSON.stringify([letter]), 'failed cleanup retains the source and prevents a delete');
  failDelete = false;
  assert.deepEqual(await letters.loadSavedLetters(), [letter]);
  assert.equal(files.has(legacyLetters), false);

  const preferences = api('features/actions/data/preferenceRepository.ts');
  failInsert = { table: 'activity_preferences', at: 2 }; insertCount = 0;
  await assert.rejects(preferences.loadActivityPreferences()); failInsert = undefined;
  const { withDeviceTransaction } = api('shared/storage/database.ts');
  await withDeviceTransaction(async db => {
    assert.equal((await db.getFirstAsync('SELECT count(*) AS total FROM activity_preferences')).total, 0);
    assert.equal(await db.getFirstAsync('SELECT name FROM storage_migrations WHERE name = ?', 'legacy-files-v1:activity_preferences'), null);
  });
  assert.equal((await preferences.loadActivityPreferences()).length, 2, 'interrupted import retries atomically');
  assert.equal((await preferences.loadActivityPreferences())[0].reuse_context, 0, 'revocation survives import');
  assert.equal(files.has(legacyPreferences), false);

  failInsert = { table: 'saved_letters', at: 1 }; insertCount = 0;
  await assert.rejects(letters.saveLetter({ id: letter.id, title: letter.title, recipient: letter.recipient, body: 'Failed edit' }));
  failInsert = undefined;
  assert.deepEqual(await letters.loadSavedLetters(), [letter], 'failure after DELETE rolls back the whole change');
  await Promise.all([
    letters.saveLetter({ title: 'Concurrent one', recipient: '', body: 'First' }),
    letters.saveLetter({ title: 'Concurrent two', recipient: '', body: 'Second' }),
  ]);
  assert.equal((await letters.loadSavedLetters()).length, 3, 'concurrent saves are serialized');
  await storage.removeContinueItem(kept.id);
  await preferences.changeActivityPreference(pref.id, 'delete');
  await letters.deleteSavedLetter(letter.id);
  files.set(legacyContinue, originalContinue); // A stale file must not restore deleted data.
  restart();
  assert.deepEqual(await api('shared/interventions.ts').loadContinueItems(), [], 'source file cannot resurrect deleted records after restart');
  assert.equal((await api('shared/letters.ts').loadSavedLetters()).length, 2);
  assert.equal((await api('features/actions/data/preferenceRepository.ts').loadActivityPreferences()).length, 1);
  assert.equal(files.has(legacyContinue), false);

  restart(); missingNative = true;
  const oldBuildStorage = api('shared/interventions.ts'); // importing the app must not load native SQLite
  await assert.rejects(oldBuildStorage.loadContinueItems(), error => error.name === 'StorageBuildRequiredError');
  missingNative = false;
  assert.deepEqual(await oldBuildStorage.loadContinueItems(), [], 'failed initialization can be retried safely');
  await api('shared/storage/database.ts').withDeviceTransaction(db => db.execAsync('PRAGMA user_version = 99'));
  restart();
  await assert.rejects(api('shared/letters.ts').loadSavedLetters(), /newer version/);
  assert.equal(files.has(legacyLetters), false);
  console.log('Device storage checks passed: actual SQLite import, rollback, concurrency, restart, no resurrection, and old-build guard.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => sqlite.close());
