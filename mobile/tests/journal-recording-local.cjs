const assert = require('node:assert/strict');
const { createJournalRuntime, hookHarness } = require('./helpers/journal-runtime.cjs');
let test, hook, permission;
let records = 0;
let status = '';
const uri = 'file:///device/documents/pending-note.m4a';
const recorder = {
  uri, isRecording: false,
  async prepareToRecordAsync() {},
  record() { records++; this.isRecording = true; runtime.files.set(uri, 'synthetic audio'); },
  async stop() { this.isRecording = false; },
};
const runtime = createJournalRuntime({ mock: name => {
  if (name === 'react') return test.react;
  if (name === 'react-native') return { AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } };
  if (name === 'expo-audio') return {
    RecordingPresets: { HIGH_QUALITY: {} }, useAudioRecorder: () => recorder,
    requestRecordingPermissionsAsync: async () => permission ? await permission : { granted: true },
    setAudioModeAsync: async () => {},
  };
} });

(async () => {
  test = hookHarness(() => hook({ visible: true, setStatus: value => { status = value; } }));
  hook = runtime.load('features/journal/hooks/useJournalRecording.ts').useJournalRecording;
  test.render();
  let release;
  permission = new Promise(resolve => { release = resolve; });
  const starting = test.render().start();
  const leaving = test.render().discardPending();
  release({ granted: true }); await starting; await leaving; permission = undefined;
  assert.equal(records, 0, 'leaving cancels a pending microphone permission request');
  await test.render().start(); await test.render().stop();
  assert.equal(test.render().uri, uri);
  runtime.failDeletes(true);
  assert.equal(await test.render().discardPending(), false);
  assert.equal(test.render().uri, uri, 'failed discard retains a retryable recording');
  assert.match(status, /could not be deleted/);
  runtime.failDeletes(false); assert.equal(await test.render().discardPending(), true);
  assert.equal(runtime.files.has(uri), false);
  await test.render().start(); await test.render().stop();
  assert.equal(test.render().keep(), uri);
  await test.render().discardPending();
  assert.equal(runtime.files.has(uri), true, 'a kept attachment is no longer owned by the recorder');
  test.unmount();
  console.log('Journal recording checks passed: pending permission cancellation, discard retry, and kept-file ownership.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => runtime.close());
