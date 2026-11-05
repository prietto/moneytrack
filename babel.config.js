module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Permite importar las migraciones .sql de drizzle/ dentro del bundle.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
