// Public-catalog parity checks. No native modules, API service, or provider calls.
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const dataPath = path.join(root, 'mobile/assets/catalog/activities.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const registryPath = path.join(root, 'mobile/src/shared/activityRegistry.ts');
const catalogPath = path.join(root, 'mobile/src/features/do/catalog.ts');
const modules = new Map();

function load(file) {
  if (file === dataPath) return data;
  assert.ok([registryPath, catalogPath].includes(file), `Unexpected runtime dependency: ${file}`);
  if (modules.has(file)) return modules.get(file).exports;
  const module = new Module(file);
  modules.set(file, module);
  module.filename = file;
  module.require = (name) => {
    const resolved = path.resolve(path.dirname(file), name);
    return load(resolved.endsWith('.json') ? resolved : `${resolved}.ts`);
  };
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  module._compile(output, file);
  return module.exports;
}

const registry = load(registryPath);
const catalog = load(catalogPath);
const primary = catalog.getBundledActivities();
assert.equal(primary.length, 9);
assert.deepEqual(primary.map((item) => item.id), data.primary_activity_ids);
assert.equal(new Set(data.activities.map((item) => item.id)).size, data.activities.length);
for (const item of data.activities) {
  const bundled = catalog.getBundledIntervention(item.id);
  assert.deepEqual(bundled, { ...item, catalog_version: data.catalog_version });
  assert.equal(registry.isCompatibleActivity(bundled), true);
  assert.equal(registry.isCompatibleActivity({ ...bundled, catalog_version: 'unsupported' }), false);
}
for (const [alias, id] of Object.entries(data.aliases)) {
  assert.equal(registry.canonicalActivityId(alias), id);
  assert.deepEqual(catalog.getBundledIntervention(alias), catalog.getBundledIntervention(id));
}
for (const id of ['missing', 'constructor', '__proto__', 'toString']) {
  assert.equal(catalog.getBundledIntervention(id), undefined);
}
for (const group of catalog.activityGroups) {
  for (const id of group.ids) assert.equal(catalog.getBundledIntervention(id).category, group.title);
}
const original = catalog.getBundledIntervention('grounding');
const edited = catalog.getBundledIntervention('grounding');
edited.steps[0] = 'Changed in a live activity';
edited.presentation.pattern = 'capture';
assert.deepEqual(catalog.getBundledIntervention('grounding'), original);

const python = process.env.MIRA_TEST_PYTHON ?? path.join(root, 'server/.venv',
  process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const backend = spawnSync(python, ['-c',
  'import json; from server.interventions.catalog import all_interventions, get_intervention; ' +
  'print(json.dumps({"items": all_interventions(), "aliases": {key: get_intervention(key) for key in ' +
  JSON.stringify(Object.keys(data.aliases)) + '}}))',
], { cwd: root, encoding: 'utf8' });
assert.equal(backend.status, 0, backend.stderr || backend.error?.message);
const server = JSON.parse(backend.stdout);
assert.deepEqual(server.items, data.activities.map((item) => catalog.getBundledIntervention(item.id)));
for (const [alias, item] of Object.entries(server.aliases)) {
  assert.deepEqual(item, catalog.getBundledIntervention(alias));
}
console.log('Catalog checks passed: nine primary activities, 13 definitions, aliases, isolation, and Python/mobile parity.');
