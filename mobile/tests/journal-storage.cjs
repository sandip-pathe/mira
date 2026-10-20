const assert = require('node:assert/strict');
const { createJournalRuntime } = require('./helpers/journal-runtime.cjs');
let failEntry = false;
const runtime = createJournalRuntime({ beforeRun: (sql, params) => {
  if (failEntry && sql.startsWith('INSERT INTO journal_messages') && params[0] === 'failed:user') throw new Error('Synthetic transaction failure');
} });
const get = () => runtime.load('features/journal/data/journalRepository.ts');
const snapshot = (id, text, revision = 1) => ({ id, text, revision, prompt: 'A local prompt?',
  presentation: { palette: { light: '#FFFFFF', dark: '#123456' }, fontSize: 19 } });
const from = doc => ({ id: doc.id, text: doc.draft, prompt: doc.initial_prompt, revision: doc.revision, presentation: doc.presentation });

(async () => {
  let repo = get();
  await repo.persistJournalDraft(snapshot('draft', 'Recover this synthetic writing'));
  runtime.restart(); repo = get();
  let doc = await repo.getLocalJournal('draft');
  assert.equal(doc.draft, 'Recover this synthetic writing'); assert.equal(doc.saved, false);
  assert.equal(doc.presentation.fontSize, 19);
  failEntry = true;
  await assert.rejects(repo.appendJournalEntry(from(doc), 'failed')); failEntry = false;
  doc = await repo.getLocalJournal('draft');
  assert.equal(doc.entries.length, 0); assert.equal(doc.draft, 'Recover this synthetic writing');
  doc = await repo.appendJournalEntry(from(doc), 'entry');
  assert.equal(doc.entries.length, 1); assert.equal(doc.draft, '');
  assert.equal((await repo.appendJournalEntry(snapshot('draft', 'Recover this synthetic writing'), 'entry')).entries.length, 1);
  assert.equal(await repo.appendJournalFollowUp(doc.id, 'entry', doc.revision, 'A stale response?', () => false), undefined);
  const followed = await repo.appendJournalFollowUp(doc.id, 'entry', doc.revision, 'What would you like to write next?');
  assert.equal(followed.messages.length, 3);
  const memory = runtime.load('features/journal/data/memoryRepository.ts');
  const excerpt = await memory.createLocalMemory('entry', 'Work has felt scattered all week');
  assert.equal(excerpt.approved, 0); await memory.changeLocalMemory(excerpt.id, 'approve');
  assert.equal((await memory.listLocalMemories())[0].approved, 1);
  const context = runtime.load('features/talk/data/contextRepository.ts');
  const journalContext = await context.selectTalkContext('scattered work');
  assert.equal(journalContext.matches[0].id, excerpt.id);
  assert.equal((await context.selectTalkContext('today')).matches[0].id, excerpt.id);
  const preferences = runtime.load('features/actions/data/preferenceRepository.ts');
  await preferences.saveActivityPreference({ id: 'pref-1', action_id: 'pause_60s', state: 'completed' },
    'yes', 'A short pause helped me reset');
  const optedIn = await context.selectTalkContext('pause reset');
  assert.equal(optedIn.preferences[0].intervention_id, 'pause_60s');
  await preferences.changeActivityPreference('pref-1', 'reuse', false);
  assert.equal((await context.selectTalkContext('pause reset')).preferences.length, 0);
  await memory.changeLocalMemory(excerpt.id, 'revoke');
  assert.equal((await context.selectTalkContext('scattered work')).matches.length, 0);
  await repo.deleteLocalJournalEntry('entry');
  assert.deepEqual(await memory.listLocalMemories(), []);
  assert.equal((await repo.getLocalJournal('draft')).messages.length, 1, 'entry deletion cascades to its follow-up');
  assert.equal(await repo.appendJournalFollowUp(doc.id, 'entry', doc.revision, 'Delayed answer?'), undefined);

  const saved = await repo.saveLocalJournal(snapshot('saved', 'Save without waiting for any model'), 'saved-entry');
  assert.equal(saved.saved, true); assert.equal(saved.entries.length, 1);
  assert.equal(await repo.persistJournalDraft(snapshot('saved', 'Late autosave', 99)), false);
  assert.equal((await repo.getLocalJournal('saved')).draft, '');
  await repo.deleteLocalJournal('saved');
  assert.equal(await repo.persistJournalDraft(snapshot('saved', 'Late autosave', 100)), false);
  assert.equal(await repo.getLocalJournal('saved'), undefined);

  const { JournalDraftWriter } = runtime.load('features/journal/data/draftWriter.ts');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const writer = new JournalDraftWriter(async value => { await gate; return repo.persistJournalDraft(value); }, () => {});
  writer.queue(snapshot('discarded', 'Delayed recovery text'), 60000);
  const flushing = writer.flush('discarded');
  writer.forget('discarded'); await repo.deleteLocalJournal('discarded'); release(); await flushing;
  assert.equal(await repo.getLocalJournal('discarded'), undefined, 'late flush cannot recreate a discarded session');

  let failDraft = true;
  const recovery = new JournalDraftWriter(value => failDraft ? Promise.reject(new Error('Synthetic storage failure')) : repo.persistJournalDraft(value), () => {});
  recovery.queue(snapshot('retry', 'Keep this draft in memory'), 60000);
  assert.equal(await recovery.flush('retry'), false); assert.equal(recovery.snapshots().length, 1);
  failDraft = false; await recovery.flushAll(); assert.equal((await repo.getLocalJournal('retry')).draft, 'Keep this draft in memory');

  const audio = runtime.load('features/journal/data/attachmentRepository.ts');
  const uri = 'file:///device/documents/kept.m4a';
  runtime.files.set(uri, 'synthetic audio');
  let voice = await audio.saveJournalAttachment(snapshot('voice', ''), { id: 'note', uri, created_at: 100 });
  voice = await repo.saveLocalJournal(from(voice), 'unused');
  assert.equal(voice.saved, true); assert.equal(voice.voice_notes.length, 1);
  await assert.rejects(audio.saveJournalAttachment(snapshot('bad', ''), { id: 'bad', uri: 'file:///outside.m4a', created_at: 1 }));
  runtime.restart(); repo = get();
  assert.equal((await repo.getLocalJournal('voice')).voice_notes[0].uri, uri);
  await repo.deleteLocalJournal('voice'); runtime.failDeletes(true);
  assert.equal(await runtime.load('features/journal/data/attachmentRepository.ts').retryJournalFileCleanup(), false);
  assert.equal(runtime.files.has(uri), true);
  runtime.restart(); runtime.failDeletes(false);
  const unrelated = 'file:///device/documents/unowned.m4a'; runtime.files.set(unrelated, 'unowned');
  assert.equal(await runtime.load('features/journal/data/attachmentRepository.ts').retryJournalFileCleanup(), true);
  assert.equal(runtime.files.has(uri), false); assert.equal(runtime.files.has(unrelated), true, 'cleanup never scans unowned files');
  console.log('Journal storage checks passed: recovery, atomic saves, stale writes/replies, linked deletion, and durable owned audio cleanup.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => runtime.close());
