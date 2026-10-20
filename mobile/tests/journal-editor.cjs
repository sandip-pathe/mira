const assert = require('node:assert/strict');
const { createJournalRuntime, hookHarness } = require('./helpers/journal-runtime.cjs');
let test;
let hook;
let confirm;
let failWrites = false;
let requested = 0;
let delayed;
let release;
const appListeners = new Set();
const audio = {
  busy: false, recording: false, uri: undefined,
  keep() { const uri = this.uri; this.uri = undefined; return uri; },
  async discardPending() { this.uri = undefined; return true; },
};
const runtime = createJournalRuntime({
  beforeRun: () => { if (failWrites) throw new Error('Synthetic storage failure'); },
  mock: (name) => {
    if (name === 'react') return test.react;
    if (name === 'react-native') return {
      Keyboard: { dismiss() {} },
      Alert: { alert: (_title, _message, buttons) => { confirm = buttons.at(-1).onPress; } },
      AppState: { addEventListener: (_name, listener) => { appListeners.add(listener); return { remove: () => appListeners.delete(listener) }; } },
    };
    if (name === './useJournalRecording') return { useJournalRecording: () => audio };
    if (name === '../data/journalWorker') return { requestJournalFollowUp: async () => {
      requested++;
      if (delayed) return await delayed;
      throw new Error('Synthetic offline provider');
    } };
  },
});
const settle = () => new Promise(resolve => setImmediate(resolve));
async function drain() { await settle(); await settle(); return test.render(); }

(async () => {
  test = hookHarness(() => hook());
  hook = runtime.load('features/journal/hooks/useJournalEditor.ts').useJournalEditor;
  test.render(); await drain();
  assert.equal(requested, 0);
  test.render().startJournal();
  const firstId = test.render().currentJournalId;
  test.render().setDraft('A recovered synthetic draft');
  appListeners.forEach(listener => listener('background')); await drain();
  test.render().closeJournal(); await drain();
  test.render().startJournal();
  const nextId = test.render().currentJournalId;
  assert.notEqual(nextId, firstId);
  assert.equal(test.render().draft, '', 'New entry stays a new editor');
  assert.equal(await test.render().openJournal(firstId), true);
  assert.equal(test.render().draft, 'A recovered synthetic draft');
  assert.equal(requested, 0, 'browse, typing, backgrounding and reopen are local');
  await test.render().saveEntry(); let state = await drain();
  assert.equal(state.entries.length, 1); assert.equal(state.draft, '');
  assert.equal(state.followUpRetry, true, 'model failure offers retry without undoing the local save');
  const repo = runtime.load('features/journal/data/journalRepository.ts');
  assert.equal((await repo.getLocalJournal(firstId)).entries.length, 1);

  state.setDraft('Another local response'); state = test.render(); failWrites = true;
  await state.saveEntry(); state = await drain();
  assert.equal(state.draft, 'Another local response'); assert.equal(state.entries.length, 1);
  assert.equal(state.error, true); failWrites = false;
  assert.equal(await state.saveCurrentSession(), true); state = await drain();
  assert.equal(state.currentSaved, true); assert.equal(state.entries.length, 2);
  assert.equal(requested, 1, 'Save session never invokes the model');

  state.closeJournal(); await drain(); test.render().startJournal();
  const inFlightId = test.render().currentJournalId;
  test.render().setDraft('Save while a model request is pending');
  delayed = new Promise(resolve => { release = resolve; });
  await test.render().saveEntry(); state = await drain();
  assert.equal(state.followingUp, true); assert.equal(state.busy, false);
  assert.equal(await state.saveCurrentSession(), true);
  release({ text: 'A delayed response?' }); delayed = undefined; await drain();
  assert.equal((await repo.getLocalJournal(inFlightId)).messages.filter(item => item.role === 'assistant').length, 1,
    'cancelled reply does not enter a saved session');

  test.render().closeJournal(); await drain(); test.render().startJournal();
  const voiceId = test.render().currentJournalId;
  audio.uri = 'file:///device/documents/controller-note.m4a'; runtime.files.set(audio.uri, 'synthetic audio');
  await test.render().saveVoiceNote(); state = await drain();
  assert.equal(state.voiceNotes.length, 1);
  assert.equal(await state.saveCurrentSession(), true);
  test.render().closeJournal(); await drain();
  assert.equal(await test.render().openJournal(voiceId), true);
  assert.equal(test.render().voiceNotes.length, 1, 'saved audio metadata reopens with its session');
  test.render().closeJournal(); await drain();
  test.render().startJournal(); test.render().setDraft('An older synthetic entry');
  await test.render().saveEntry(); await drain();
  test.render().setDraft('New writing that has not reached its debounce timer');
  test.render().deleteEntry(test.render().entries[0]); confirm(); await drain();
  assert.equal(test.render().draft, 'New writing that has not reached its debounce timer');
  assert.equal(test.render().entries.length, 0, 'deleting an entry preserves the current recovery draft');
  test.render().closeJournal(); await drain();
  test.render().deleteJournal(firstId); confirm(); await drain();
  assert.equal(await repo.getLocalJournal(firstId), undefined);
  const callsBeforeClose = requested;
  test.unmount(); await settle();
  assert.equal(requested, callsBeforeClose);
  console.log('Journal editor checks passed: local navigation/recovery, model failure isolation, save during AI, deletion, and saved audio.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { test?.unmount(); await settle(); runtime.close(); });
