const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Las migraciones de Drizzle son archivos .sql que entran al bundle.
config.resolver.sourceExts.push('sql');

module.exports = config;
