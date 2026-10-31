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
  }

  const apiUrl = (process.env.EXPO_PUBLIC_API_URL || appConfig.extra.apiUrl || '').trim();
  const apiConfigUrl = (process.env.EXPO_PUBLIC_API_CONFIG_URL || appConfig.extra.apiConfigUrl || '').trim();
  if (profile && profile !== 'development' && !/^https:\/\//i.test(apiUrl) && !/^https:\/\//i.test(apiConfigUrl)) {
    throw new Error('Set an HTTPS backend API URL or runtime API config URL before building a standalone APK.');
  }
  if (apiUrl) appConfig.extra.apiUrl = apiUrl;
  if (apiConfigUrl) appConfig.extra.apiConfigUrl = apiConfigUrl;
  return appConfig;
};
