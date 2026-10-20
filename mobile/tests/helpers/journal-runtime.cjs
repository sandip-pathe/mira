/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { createSQLiteHarness } = require('./sqlite.cjs');
exports.createJournalRuntime = (options = {}) => {
  const src = path.resolve(__dirname, '../../src');
  const files = new Map();
  const sqlite = createSQLiteHarness(options);
  let modules = new Map();
  let uuid = 0;
  let failDelete = false;
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename).exports;
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    const loaded = new Module(filename); modules.set(filename, loaded); loaded.filename = filename;
    loaded.require = name => {
      const mock = options.mock?.(name, filename);
      if (mock !== undefined) return mock;
      if (name === 'expo-sqlite') return sqlite.module;
      if (name === 'expo-crypto') return { randomUUID: () => `synthetic-${++uuid}` };
      if (name === 'expo-file-system') return {
        Paths: { document: { uri: 'file:///device/documents/' } },
        File: class {
          constructor(...parts) { this.uri = parts.map(part => typeof part === 'string' ? part : part.uri).join('/'); }
          get exists() { return files.has(this.uri); }
          async text() { return files.get(this.uri); }
          delete() { if (failDelete) throw new Error('Synthetic file failure'); files.delete(this.uri); }
        },
      };
      assert.ok(name.startsWith('.'), `Unexpected dependency: ${name}`);
      const resolved = path.resolve(path.dirname(filename), name);
      return load(resolved.endsWith('.json') ? resolved : `${resolved}.ts`);
    };
    loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText, filename);
    return loaded.exports;
  }
  return {
    load: relative => load(path.join(src, relative)), files,
    failDeletes: value => { failDelete = value; },
    restart: () => { sqlite.closeConnections(); modules = new Map(); },
    close: () => sqlite.close(),
  };
};

exports.hookHarness = (hook) => {
  const slots = [], effects = [];
  let index = 0, dirty = false;
  const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useState(initial) {
      const i = index++;
      if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, next => {
        const value = typeof next === 'function' ? next(slots[i].value) : next;
        if (!Object.is(value, slots[i].value)) { slots[i].value = value; dirty = true; }
      }];
    },
    useRef(initial) { return slots[index++] ??= { current: initial }; },
    useCallback(fn, deps) { const i = index++; if (!same(slots[i]?.deps, deps)) slots[i] = { fn, deps }; return slots[i].fn; },
    useEffect(fn, deps) {
      const i = index++;
      if (!same(slots[i]?.deps, deps)) {
        const old = slots[i]; slots[i] = { deps };
        effects.push(() => { old?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  react.useLayoutEffect = react.useEffect;
  return {
    react,
    render() {
      for (let pass = 0; pass < 40; pass++) {
        index = 0; dirty = false;
        const value = hook(); effects.splice(0).forEach(effect => effect());
        if (!dirty) return value;
      }
      throw new Error('Journal controller did not settle.');
    },
    unmount: () => slots.forEach(slot => slot?.cleanup?.()),
  };
};
