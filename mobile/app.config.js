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
  if (profile && profile !== 'development' && !/^https:\/\//i.test(apiUrl)) {
    throw new Error('Set the hosted HTTPS API URL in expo.extra.apiUrl in mobile/app.json before building a standalone APK.');
  }
  if (apiUrl) appConfig.extra.apiUrl = apiUrl;
  return appConfig;
};
