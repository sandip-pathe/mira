/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { spawnSync } = require('node:child_process');
let manifestMod;
let resourceMod;
const filename = path.resolve(__dirname, '../plugins/withDeviceOnlyData.js');
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.require = name => name === 'expo/config-plugins' ? {
  withAndroidManifest: (config, fn) => { manifestMod = fn; return config; },
  withDangerousMod: (config, [platform, fn]) => { assert.equal(platform, 'android'); resourceMod = fn; return config; },
} : require(name);
loaded._compile(fs.readFileSync(filename, 'utf8'), filename);

(async () => {
  loaded.exports({});
  const config = manifestMod({ modResults: { manifest: { application: [{ $: {} }] } } });
  const attributes = config.modResults.manifest.application[0].$;
  assert.equal(attributes['android:allowBackup'], 'false');
  assert.equal(attributes['android:fullBackupContent'], '@xml/mira_backup_rules');
  assert.equal(attributes['android:dataExtractionRules'], '@xml/mira_data_extraction_rules');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mira-backup-test-'));
  try {
    await resourceMod({ modRequest: { platformProjectRoot: root } });
    const xml = path.join(root, 'app/src/main/res/xml');
    const backup = fs.readFileSync(path.join(xml, 'mira_backup_rules.xml'), 'utf8');
    const extraction = fs.readFileSync(path.join(xml, 'mira_data_extraction_rules.xml'), 'utf8');
    for (const domain of ['root', 'file', 'database', 'sharedpref', 'external']) {
      assert.ok(backup.includes(`domain="${domain}" path="."`));
      assert.equal(extraction.split(`domain="${domain}" path="."`).length - 1, 2);
    }
    assert.ok(extraction.includes('<cloud-backup>') && extraction.includes('<device-transfer>'));
  } finally {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('mira-backup-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
  // Check the real composed Expo manifest too, without generating android/ or dumping environment/config.
  const result = spawnSync(process.execPath, ['node_modules/expo/bin/cli', 'config', '--type', 'introspect', '--json'],
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', env: { ...process.env, EXPO_NO_DOTENV: '1' } });
  assert.equal(result.status, 0, result.stderr);
  const introspected = JSON.parse(result.stdout);
  const app = introspected._internal.modResults.android.manifest.manifest.application[0].$;
  assert.equal(app['android:allowBackup'], 'false');
  assert.equal(app['android:dataExtractionRules'], '@xml/mira_data_extraction_rules');
  console.log('Android backup checks passed: cloud backup, device transfer, resources, and composed Expo manifest.');
})().catch(error => { console.error(error); process.exitCode = 1; });
