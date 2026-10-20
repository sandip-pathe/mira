// Controller/storage checks with network disabled and native filesystem mocked.
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { createSQLiteHarness } = require('./helpers/sqlite.cjs');

const src = path.resolve(__dirname, '../src');
const files = new Map();
const timers = new Map();
const modules = new Map();
const appListeners = new Set();
let uuid = 0;
let timerId = 0;
let current;
let confirm;
let failWrite = false;
let networkCalls = 0;
const sqlite = createSQLiteHarness({ beforeRun: () => {
  if (failWrite) throw new Error('Synthetic storage failure');
} });
const settle = () => new Promise((resolve) => setImmediate(resolve));

class File {
  constructor(...parts) { this.uri = parts.join('/'); }
  get exists() { return files.has(this.uri); }
  async text() { return files.get(this.uri); }
  create() { files.set(this.uri, ''); }
  write(content) { files.set(this.uri, content); }
  async move(destination) {
    files.set(destination.uri, files.get(this.uri)); files.delete(this.uri);
  }
}

const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
function harness(hook, options) {
  const slots = [];
  const effects = [];
  let dirty = false;
  const runtime = {
    index: 0,
    state(initial) {
      const i = this.index++;
      if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, (next) => {
        const value = typeof next === 'function' ? next(slots[i].value) : next;
        if (!Object.is(value, slots[i].value)) { slots[i].value = value; dirty = true; }
      }];
    },
    ref(initial) { return slots[this.index++] ??= { current: initial }; },
    callback(fn, deps) {
      const i = this.index++;
      if (!same(slots[i]?.deps, deps)) slots[i] = { fn, deps };
      return slots[i].fn;
    },
    effect(fn, deps) {
      const i = this.index++;
      if (!same(slots[i]?.deps, deps)) {
        const old = slots[i];
        slots[i] = { deps };
        effects.push(() => { old?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  return {
    render() {
      for (let pass = 0; pass < 30; pass++) {
        dirty = false; current = runtime; runtime.index = 0;
        const result = hook(options);
        effects.splice(0).forEach((effect) => effect());
        if (!dirty) return result;
      }
      throw new Error('Controller did not settle.');
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}

function load(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const loaded = new Module(filename);
  modules.set(filename, loaded);
  loaded.filename = filename;
  loaded.require = (name) => {
    if (name === 'react') return {
      useState: (v) => current.state(v), useRef: (v) => current.ref(v),
      useCallback: (fn, deps) => current.callback(fn, deps),
      useEffect: (fn, deps) => current.effect(fn, deps),
    };
    if (name === 'react-native') return {
      Alert: { alert: (_title, _message, buttons) => { confirm = buttons.at(-1).onPress; } },
      AppState: { addEventListener: (_name, listener) => {
        appListeners.add(listener); return { remove: () => appListeners.delete(listener) };
      } },
    };
    if (name === 'expo-crypto') return { randomUUID: () => `test-run-${++uuid}` };
    if (name === 'expo-file-system') return { File, Paths: { document: 'device' } };
    if (name === 'expo-sqlite') return sqlite.module;
    if (name === '__clock__') return {
      setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
      clearTimeout: (id) => timers.delete(id),
    };
    if (name.endsWith('/shared/api')) return {
      getDemoSession: async () => { networkCalls++; throw new Error('Network disabled'); },
      request: async () => { networkCalls++; throw new Error('Network disabled'); },
    };
    assert.ok(name.startsWith('.'), `Unexpected dependency: ${name}`);
    const resolved = path.resolve(path.dirname(filename), name);
    return load(resolved.endsWith('.json') ? resolved : `${resolved}.ts`);
  };
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  loaded._compile("const { setTimeout, clearTimeout } = require('__clock__');\n" + output, filename);
  return loaded.exports;
}

const { useInterventionRun } = load(path.join(src, 'features/do/hooks/useInterventionRun.ts'));
const { getBundledActivities, getBundledIntervention } = load(path.join(src, 'features/do/catalog.ts'));
const storage = load(path.join(src, 'shared/interventions.ts'));
const preferences = load(path.join(src, 'features/actions/data/preferenceRepository.ts'));
const make = (id, extra = {}) => harness(useInterventionRun, { id, origin: 'actions_library', ...extra });

(async () => {
  for (const activity of getBundledActivities()) {
    const test = make(activity.id);
    let run = test.render();
    assert.equal(run.phase, 'ready', 'normal entry has its content on the first render');
    assert.equal(run.activeId, activity.id);
    run.startActivity(); run.startActivity();
    run = test.render();
    assert.equal(run.run.id, run.clientRunId);
    run.setDraft('Temporary synthetic writing');
    run.pauseActivity(); assert.equal(test.render().phase, 'paused');
    test.render().resumeActivity(); assert.equal(test.render().phase, 'active');
    await Promise.all([test.render().finishRun('completed'), test.render().finishRun('stopped')]);
    run = test.render();
    assert.equal(run.phase, 'outcome');
    assert.equal(run.run.state, 'completed', 'repeated completion cannot change the outcome');
    run.pauseActivity(); run.resumeActivity();
    assert.equal(test.render().phase, 'outcome', 'finished runs cannot be resumed');
    test.unmount();
  }
  assert.equal(files.size, 0, 'opening, writing, and finishing never automatically persist private inputs');
  assert.equal(networkCalls, 0);

  const accepted = make('grounding', { origin: 'talk' });
  assert.equal(accepted.render().phase, 'active', 'accepted Talk activity skips the intro');
  accepted.unmount();
  const setup = make('paced_breathing', { origin: 'talk' });
  assert.equal(setup.render().phase, 'ready', 'breathing retains its setup step'); setup.unmount();

  const timer = make('short_movement');
  timer.render().startActivity(); timer.render().setTimerState('running');
  assert.equal(timer.render().timerRunning, true);
  appListeners.forEach((listener) => listener('background'));
  assert.equal(timer.render().timerPaused, true, 'backgrounding pauses the existing timer');
  await timer.render().finishRun('stopped'); timer.unmount();

  for (const id of ['one_small_step', 'reach_out', 'short_movement', 'task_reset_60s']) {
    const item = await storage.saveContinueItem(getBundledIntervention(id), 'A synthetic saved action', `saved-${id}`,
      { source_task: 'A task', cue: 'After lunch' });
    const resume = make(id, { origin: 'actions_continue', continueItemId: item.id });
    resume.render(); await settle();
    let run = resume.render();
    assert.equal(run.phase, 'active', 'Continue resumes without another intro');
    if (id === 'one_small_step') {
      assert.equal(run.step, 3); assert.equal(run.selectedTask, 'A task');
      assert.equal(run.smallStepCue, 'After lunch'); run.setTinyStep('An edited first move');
    } else if (id === 'reach_out') assert.equal(run.draft, item.content);
    await resume.render().finishRun('stopped');
    assert.equal((await storage.loadContinueItems()).find((value) => value.id === item.id).content,
      id === 'one_small_step' ? 'An edited first move' : item.content);
    resume.unmount();
  }

  const completed = make('one_small_step', { origin: 'actions_continue', continueItemId: 'saved-one_small_step' });
  completed.render(); await settle();
  await completed.render().finishRun('completed');
  assert.equal(await completed.render().resolveCompletedContinue(), true);
  assert.equal((await storage.loadContinueItems()).some((item) => item.id === 'saved-one_small_step'), false);
  completed.unmount();

  const wrong = make('grounding', { origin: 'actions_continue', continueItemId: 'saved-reach_out' });
  wrong.render(); await settle();
  assert.equal(wrong.render().phase, 'loading');
  assert.match(wrong.render().status, /invalid/);
  assert.ok((await storage.loadContinueItems()).some((item) => item.id === 'saved-reach_out'));
  wrong.unmount();
  const missing = make('reach_out', { origin: 'actions_continue' });
  assert.match(missing.render().status, /incomplete/); missing.unmount();

  const keep = make('reach_out'); keep.render().startActivity();
  const beforeKeep = await storage.loadContinueItems();
  keep.render().confirmKeepInActions('An explicitly kept synthetic message');
  assert.deepEqual(await storage.loadContinueItems(), beforeKeep, 'confirmation alone does not save');
  confirm(); await settle();
  assert.equal(keep.render().continueSaved, true);
  keep.unmount();

  const beforeFailure = await storage.loadContinueItems();
  failWrite = true;
  await assert.rejects(storage.removeContinueItem('saved-reach_out'));
  failWrite = false;
  assert.deepEqual(await storage.loadContinueItems(), beforeFailure, 'failed writes preserve prior records');

  const privateRating = make('grounding'); privateRating.render().startActivity();
  await privateRating.render().finishRun('completed');
  privateRating.render().setRating('yes');
  await privateRating.render().savePreference(false);
  assert.deepEqual(await preferences.loadActivityPreferences(), [], 'a private rating is never written'); privateRating.unmount();

  const optedIn = make('grounding'); optedIn.render().startActivity();
  await optedIn.render().finishRun('completed'); optedIn.render().setRating('a_little');
  failWrite = true;
  await optedIn.render().savePreference(true);
  assert.equal(optedIn.render().feedbackRetry, true);
  failWrite = false;
  assert.deepEqual(await preferences.loadActivityPreferences(), [], 'failed preference save is not reported as saved');
  await optedIn.render().savePreference(true);
  assert.equal(optedIn.render().saved, true);
  const pref = (await preferences.loadActivityPreferences())[0];
  assert.equal(pref.helpful_lesson, 'Mira may suggest Grounding again in a similar moment.');
  assert.equal(pref.rating, 'a_little');
  const preferenceModule = path.join(src, 'features/actions/data/preferenceRepository.ts');
  modules.delete(preferenceModule);
  assert.deepEqual(await load(preferenceModule).loadActivityPreferences(), [pref], 'saved preferences survive module restart');
  await preferences.changeActivityPreference(pref.id, 'reuse', false);
  await preferences.saveActivityPreference(optedIn.render().run, 'yes', pref.helpful_lesson);
  assert.equal((await preferences.loadActivityPreferences())[0].reuse_context, 0, 'retry cannot undo revocation');
  await preferences.changeActivityPreference(pref.id, 'delete');
  assert.equal((await preferences.loadActivityPreferences()).length, 0); optedIn.unmount();

  assert.equal(networkCalls, 0, 'all activity lifecycle, Continue and preference operations are offline');

  const sorting = make('task_reset_60s'); sorting.render().startActivity();
  sorting.render().setDraft('First task\nSecond task');
  await sorting.render().organize();
  assert.deepEqual(sorting.render().groups, { now: ['First task', 'Second task'], later: [], ignore: [] });
  assert.equal(networkCalls, 1, 'only explicit AI sorting attempted the network'); sorting.unmount();
  assert.equal(timers.size, 0);
  console.log('Activity checks passed: nine local lifecycles, Continue, timers, consent, storage failure, and no lifecycle network calls.');
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => sqlite.close());
