// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNative = require('eslint-plugin-react-native');

// --- Restricciones de importación ------------------------------------------
// Ojo: en flat config, dos bloques que configuran `no-restricted-imports` sobre
// el mismo archivo NO se fusionan; gana el último. Por eso el bloque de domain/
// repite las restricciones de drizzle/tablas.

const mensajeDrizzle =
  'drizzle-orm y data/tablas solo se usan dentro de src/data/ (AD-3). Usa un comando de data/commands o una consulta de data/queries.';

const patronesDrizzle = [
  { regex: '^drizzle-orm(/.*)?$', message: mensajeDrizzle },
  { regex: '(^|/)data/tablas(/.*)?$', message: mensajeDrizzle },
];

const mensajeDomain =
  'domain/ es puro y no depende de nadie (AD-1): nada de React, Expo, Drizzle, SQLite, red ni otras capas. Recibe los datos y `hoy` como parámetros.';

const patronesDomain = [
  { regex: '^react($|[-/])', message: mensajeDomain },
  { regex: '^expo($|[-/])', message: mensajeDomain },
  { regex: '^@expo/', message: mensajeDomain },
  { regex: '^better-sqlite3$', message: mensajeDomain },
  { regex: '^axios($|/)', message: mensajeDomain },
  { regex: '^@/(app|hooks|data|services|textos)($|/)', message: mensajeDomain },
  { regex: '^(\\.\\./)+(app|hooks|data|services|textos)($|/)', message: mensajeDomain },
];

const mensajeFecha =
  'domain/ no lee el reloj: recibe `hoy` (YYYY-MM-DD) como parámetro; usa services/reloj desde hooks/ (AD-1).';
const mensajeTexto =
  'Las pantallas no llevan texto literal (AD-17): ponlo en src/textos/ y úsalo como {textos.x}.';
const mensajeRed ='domain/ no llama a la red (AD-1); eso es trabajo de services/.';

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['drizzle/*', 'android/*', 'ios/*', '.expo/*', 'node_modules/*', 'dist/*'],
  },
  {
    // AD-23: el registro va solo por services/log.
    rules: {
      'no-console': 'error',
    },
  },
  {
    // AD-3: drizzle-orm y las tablas solo dentro de src/data/.
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    ignores: ['src/data/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: patronesDrizzle }],
    },
  },
  {
    // AD-1: núcleo puro.
    files: ['src/domain/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...patronesDrizzle, ...patronesDomain] }],
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: mensajeFecha },
        { name: 'fetch', message: mensajeRed },
        { name: 'XMLHttpRequest', message: mensajeRed },
        { name: 'WebSocket', message: mensajeRed },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: mensajeFecha },
        { selector: "CallExpression[callee.name='Date']", message: mensajeFecha },
        { selector: "MemberExpression[object.name='Date']", message: mensajeFecha },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'domain/ es determinista (AD-1): recibe los valores aleatorios como parámetro.',
        },
      ],
    },
  },
  {
    // AD-17: todo texto de pantalla sale de src/textos/.
    // react-native/no-raw-text solo detecta texto FUERA de <Text>; por eso
    // no-restricted-syntax cubre el texto literal dentro de <Text>.
    files: ['src/app/**/*.{ts,tsx,js,jsx}'],
    plugins: { 'react-native': reactNative },
    rules: {
      'react-native/no-raw-text': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: 'JSXText[value=/\\S/]', message: mensajeTexto },
        {
          selector: ':matches(JSXElement, JSXFragment) > JSXExpressionContainer > Literal[value=/\\S/]',
          message: mensajeTexto,
        },
        {
          selector: ':matches(JSXElement, JSXFragment) > JSXExpressionContainer > TemplateLiteral',
          message: mensajeTexto,
        },
      ],
    },
  },
]);
