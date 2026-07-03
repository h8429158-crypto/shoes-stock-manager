module.exports = function (api) {
  // Cache key includes DEMO_BUILD so demo and normal builds don't reuse each
  // other's cached transforms.
  api.cache.using(() => process.env.DEMO_BUILD || 'normal');
  const plugins = [];
  // DEMO preview build only: redirect firebase imports to local mocks so the
  // app runs with no backend. Enabled by DEMO_BUILD=1.
  if (process.env.DEMO_BUILD === '1') {
    plugins.push([
      'module-resolver',
      {
        alias: {
          'firebase/app': './src/compat/app',
          'firebase/auth': './src/compat/auth',
          'firebase/firestore': './src/compat/firestore',
        },
      },
    ]);
  }
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
