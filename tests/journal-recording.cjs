// Focused lifecycle checks with native modules mocked; device audio still needs a phone.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

let current;
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
function harness(hook, options) {
  const slots = [];
  const effects = [];
  const runtime = {
    index: 0,
    state(value) {
      const i = this.index++;
      if (!slots[i]) slots[i] = { value };
      return [slots[i].value, next => { slots[i].value = next; }];
    },
    ref(value) {
      const i = this.index++;
      return slots[i] ??= { current: value };
    },
    callback(fn, deps) {
      const i = this.index++;
      if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { fn, deps };
      return slots[i].fn;
    },
    effect(fn, deps) {
      const i = this.index++;
      if (!slots[i] || !same(slots[i].deps, deps)) effects.push(() => {
        slots[i]?.cleanup?.();
        slots[i] = { deps, cleanup: fn() };
      });
    },
  };
  return {
    render() {
      current = runtime; runtime.index = 0;
      const result = hook(options);
      effects.splice(0).forEach(run => run());
      return result;
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

let listener;
let stopCalls = 0;
let releaseStop;
let delayedStop = false;
let prepare;
let recordCalls = 0;
let failDelete = false;
let response = { ok: true, json: async () => ({ text: 'Editable transcript' }) };
const files = new Set();
const modes = [];
const recorder = {
  uri: 'cache://journal.m4a', isRecording: false,
  prepareToRecordAsync: async () => { if (prepare) await prepare; },
  record() { recordCalls++; this.isRecording = true; files.add(this.uri); },
  async stop() {
    stopCalls++;
    if (delayedStop) await new Promise(resolve => { releaseStop = resolve; });
    this.isRecording = false;
  },
};
const appState = { currentState: 'active', addEventListener: (_, callback) => {
  listener = callback; return { remove() { listener = undefined; } };
} };
const originalLoad = Module._load;
Module._load = function(name, parent, isMain) {
  if (parent?.filename.endsWith('useJournalRecording.ts')) {
    if (name === 'react') return {
      useState: v => current.state(v), useRef: v => current.ref(v),
      useCallback: (fn, deps) => current.callback(fn, deps),
      useEffect: (fn, deps) => current.effect(fn, deps), useLayoutEffect: (fn, deps) => current.effect(fn, deps),
    };
    if (name === 'react-native') return { AppState: appState };
    if (name === 'expo-audio') return { RecordingPresets: { HIGH_QUALITY: {} }, useAudioRecorder: () => recorder,
      requestRecordingPermissionsAsync: async () => ({ granted: true }), setAudioModeAsync: async mode => modes.push(mode) };
    if (name === 'expo/fetch') return { fetch: async () => response };
    if (name === './api') return { API_URL: 'http://test' };
    if (name === 'expo-file-system') return { File: class {
      constructor(uri) { this.uri = uri; }
      get exists() { return files.has(this.uri); }
      delete() { if (failDelete) throw new Error('Cannot delete'); files.delete(this.uri); }
    } };
  }
  return originalLoad.call(this, name, parent, isMain);
};
const originalFormData = global.FormData;
global.FormData = class { append() {} };
const filename = path.resolve(__dirname, '../src/features/you/hooks/useJournalRecording.ts');
const loaded = new Module(filename, module);
loaded.filename = filename; loaded.paths = module.paths;
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const settle = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  let status;
  let draft;
  const options = { visible: true, getSession: async () => ({ session_id: 's', capability: 'c' }),
    setStatus: value => { status = value; }, setDraft: value => { draft = value; }, setVoiceDraft() {} };
  const test = harness(loaded.exports.useJournalRecording, options);
  await test.render().start();
  delayedStop = true;
  appState.currentState = 'background'; listener('background'); listener('inactive');
  assert.equal(stopCalls, 1, 'overlapping lifecycle exits share one native stop');
  releaseStop(); await settle(); delayedStop = false;
  assert.equal(test.render().recording, false);
  assert.equal(modes.at(-1).allowsRecording, false);
  assert.equal(test.render().uri, recorder.uri, 'interrupted recording stays available for retry');

  response = { ok: false, status: 503 };
  await test.render().transcribe(recorder.uri);
  assert.equal(test.render().uri, recorder.uri, 'failed transcription retains recording');
  response = { ok: true, json: async () => ({ text: 'Editable transcript' }) };
  failDelete = true;
  await test.render().transcribe(recorder.uri);
  assert.equal(draft, 'Editable transcript');
  assert.equal(test.render().uri, recorder.uri, 'failed cleanup retains a discard action');
  assert.equal(test.render().discard(), false);
  assert.match(status, /could not be deleted/);
  failDelete = false;
  assert.equal(test.render().discard(), true);
  assert.equal(files.has(recorder.uri), false);
  assert.equal(test.render().uri, undefined);

  appState.currentState = 'active';
  let finishPrepare;
  prepare = new Promise(resolve => { finishPrepare = resolve; });
  const starting = test.render().start();
  await settle();
  const before = recordCalls;
  test.unmount(); finishPrepare(); await starting;
  assert.equal(recordCalls, before, 'leaving during preparation never starts capture');
  assert.equal(modes.at(-1).allowsRecording, false);
  console.log('Journal recording lifecycle checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => { Module._load = originalLoad; global.FormData = originalFormData; });
