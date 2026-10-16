const { withAndroidManifest } = require('expo/config-plugins');

// Private LAN demo only. No public deployment; no provider key is in the app.
module.exports = config => withAndroidManifest(config, config => {
  const application = config.modResults.manifest.application?.[0];
  if (application) application.$['android:usesCleartextTraffic'] = 'true';
  return config;
});
