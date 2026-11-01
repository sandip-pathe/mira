const staticConfig = require('./app.json');

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const appConfig = { ...config, ...staticConfig.expo };
  appConfig.extra = { ...staticConfig.expo.extra, ...config.extra };

  // Private LAN HTTP is available only to the development client. Standalone
  // APKs must carry an explicitly configured HTTPS API origin.
  appConfig.plugins = [...staticConfig.expo.plugins].filter(
    (plugin) => plugin !== './plugins/withPrivateDemoHttp',
  );
  if (profile === 'development') {
    appConfig.plugins.push('./plugins/withPrivateDemoHttp');
  } else {
    // The WebRTC config plugin requests this overlay permission for debugging;
    // the standalone app has no overlay feature and should not ship it.
    appConfig.android = {
      ...appConfig.android,
      blockedPermissions: [...new Set([
        ...(appConfig.android?.blockedPermissions ?? []),
        'android.permission.SYSTEM_ALERT_WINDOW',
      ])],
    };
  }

  const apiUrl = (process.env.EXPO_PUBLIC_API_URL || appConfig.extra.apiUrl || '').trim();
  if (profile && profile !== 'development' && !/^https:\/\//i.test(apiUrl)) {
    throw new Error('Set EXPO_PUBLIC_API_URL or expo.extra.apiUrl to the HTTPS backend origin before building a standalone APK.');
  }
  if (apiUrl) appConfig.extra.apiUrl = apiUrl;
  return appConfig;
};
