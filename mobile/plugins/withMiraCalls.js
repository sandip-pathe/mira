/* global __dirname */
const fs = require('node:fs/promises');
const path = require('node:path');
const { withAndroidManifest, withMainApplication, withDangerousMod } = require('expo/config-plugins');

module.exports = config => {
  config = withAndroidManifest(config, mod => {
    const manifest = mod.modResults.manifest;
    const app = manifest.application[0];
    manifest['uses-permission'] ??= [];
    for (const name of ['MANAGE_OWN_CALLS', 'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_PHONE_CALL',
      'FOREGROUND_SERVICE_MICROPHONE', 'BLUETOOTH_CONNECT', 'POST_NOTIFICATIONS']) {
      const permission = `android.permission.${name}`;
      if (!manifest['uses-permission'].some(item => item.$['android:name'] === permission)) {
        manifest['uses-permission'].push({ $: { 'android:name': permission } });
      }
    }
    // Self-managed calls do not read the person's cellular numbers or place PSTN calls.
    for (const name of ['CALL_PHONE', 'READ_PHONE_NUMBERS', 'READ_PHONE_STATE']) {
      const permission = `android.permission.${name}`;
      const item = manifest['uses-permission'].find(entry => entry.$['android:name'] === permission);
      if (item) item.$['tools:node'] = 'remove';
      else manifest['uses-permission'].push({ $: { 'android:name': permission, 'tools:node': 'remove' } });
    }
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    app.service ??= [];
    const name = 'io.wazo.callkeep.VoiceConnectionService';
    const service = app.service.find(item => item.$['android:name'] === name) ?? { $: { 'android:name': name } };
    Object.assign(service.$, { 'android:label': 'Mira', 'android:permission': 'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
      'android:exported': 'true', 'android:foregroundServiceType': 'phoneCall|microphone' });
    service['intent-filter'] = [{ action: [{ $: { 'android:name': 'android.telecom.ConnectionService' } }] }];
    if (!app.service.includes(service)) app.service.push(service);
    app.receiver ??= [];
    const receiver = 'com.sandi.mira.calls.MiraCallPackage$EndCallReceiver';
    if (!app.receiver.some(item => item.$['android:name'] === receiver)) {
      app.receiver.push({ $: { 'android:name': receiver, 'android:exported': 'false' } });
    }
    return mod;
  });
  config = withMainApplication(config, mod => {
    const registration = 'add(com.sandi.mira.calls.MiraCallPackage())';
    if (!mod.modResults.contents.includes(registration)) {
      const anchor = 'PackageList(this).packages.apply {';
      if (!mod.modResults.contents.includes(anchor)) throw new Error('Mira call package: unsupported MainApplication template');
      mod.modResults.contents = mod.modResults.contents.replace(anchor, `${anchor}\n              ${registration}`);
    }
    return mod;
  });
  return withDangerousMod(config, ['android', async mod => {
    const directory = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/java/com/sandi/mira/calls');
    await fs.mkdir(directory, { recursive: true });
    await fs.copyFile(path.join(__dirname, 'android/MiraCallPackage.java'), path.join(directory, 'MiraCallPackage.java'));
    return mod;
  }]);
};
