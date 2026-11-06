// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNative = require('eslint-plugin-react-native');

// --- Restricciones de importación ------------------------------------------
// Ojo: en flat config, dos bloques que configuran `no-restricted-imports` sobre
// el mismo archivo NO se fusionan; gana el último. Por eso los bloques de domain/
// y de las pantallas (AD-8) repiten las restricciones de data/.

const mensajeData =
  'Fuera de src/data/ no se toca la base (AD-3): nada de drizzle-orm, tablas, schema, db, SQLite ni el helper de pruebas. Usa un comando de data/commands o una consulta de data/queries.';

const patronesData = [
  { regex: '^drizzle-orm(/.*)?$', message: mensajeData },
  { regex: '(^|/)data/tablas(/.*)?$', message: mensajeData },
  { regex: '(^|/)data/(schema|db)$', message: mensajeData },
  { regex: '(^|/)data/pruebas(/.*)?$', message: mensajeData },
  { regex: '^expo-sqlite(/.*)?$', message: mensajeData },
  { regex: '^better-sqlite3$', message: mensajeData },
];

const mensajeDomain =
  'domain/ es puro y no depende de nadie (AD-1): nada de React, Expo, Drizzle, SQLite, red, Node ni otras capas. Recibe los datos y `hoy` como parámetros.';

const patronesDomain = [
  { regex: '^react($|[-/])', message: mensajeDomain },
  { regex: '^expo($|[-/])', message: mensajeDomain },
  { regex: '^@expo/', message: mensajeDomain },
  { regex: '^axios($|/)', message: mensajeDomain },
  { regex: '^node:', message: mensajeDomain },
  { regex: '^@/(app|hooks|data|services|textos|components)($|/)', message: mensajeDomain },
  // Las rutas relativas a otras capas las cubre import/no-restricted-paths,
  // que resuelve la ruta real (./../data, ../../src/data, etc.).
];

const mensajeReloj = "Las pantallas leen 'hoy' con useHoy() (AD-8), no con services/reloj.";

// Cubre '@/services/reloj', '../services/reloj', etc.
const patronesReloj = [{ regex: '(^|/)services/reloj$', message: mensajeReloj }];

const mensajeComando =
  'Las pantallas escriben solo con ejecutar() de hooks/use-comando (AD-3, AD-18): así pasan por el log y el post-comando.';

// ejecutarComando y la señal de cambios son internos de data/ y hooks/.
const patronesComando = [{ regex: '(^|/)data/(ejecutar-comando|cambios)$', message: mensajeComando }];

const mensajeFecha =
  'domain/ no lee el reloj: recibe `hoy` (YYYY-MM-DD) como parámetro; usa services/reloj desde hooks/ (AD-1).';
const mensajeTexto =
  'Las pantallas no llevan texto literal (AD-17): ponlo en src/textos/ y úsalo como {textos.x}.';
const mensajeRed = 'domain/ no llama a la red (AD-1); eso es trabajo de services/.';
const mensajeAzar = 'domain/ es determinista (AD-1): recibe los valores aleatorios como parámetro.';
const mensajeGlobal =
  'domain/ no usa el objeto global (AD-1): por ahí se cuelan el reloj, el azar y la red.';

// Texto literal: un string con algo visible o cualquier template literal.
const literal = ':matches(Literal[value=/\\S/], TemplateLiteral)';
// Expresiones que pueden producir texto: ternarios, &&, ||, ?? y concatenación.
const expresion = ":matches(ConditionalExpression, LogicalExpression, BinaryExpression[operator='+'])";
const hijoJsx = ':matches(JSXElement, JSXFragment) > JSXExpressionContainer';
// Props y opciones que el usuario ve o escucha (lector de pantalla).
const propsVisibles = '/^(title|placeholder|accessibilityLabel|accessibilityHint)$/';
const opcionesVisibles = '/^(title|headerTitle)$/';

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
    // AD-3: la base solo se toca dentro de src/data/.
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    ignores: ['src/data/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: patronesData }],
    },
  },
  {
    // AD-8: las pantallas leen "hoy" con useHoy(). Repite patronesData: este
    // bloque reemplaza al anterior en estos archivos (ver la nota de arriba).
    files: ['src/app/**/*.{ts,tsx,js,jsx}', 'src/components/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...patronesData, ...patronesReloj, ...patronesComando] }],
    },
  },
  {
    // AD-1: núcleo puro.
    files: ['src/domain/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...patronesData, ...patronesDomain] }],
      'import/no-nodejs-modules': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/domain',
              from: ['./src/app', './src/hooks', './src/data', './src/services', './src/textos', './src/components'],
              message: mensajeDomain,
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: mensajeFecha },
        { name: 'Temporal', message: mensajeFecha },
        { name: 'performance', message: mensajeFecha },
        { name: 'crypto', message: mensajeAzar },
        { name: 'fetch', message: mensajeRed },
        { name: 'XMLHttpRequest', message: mensajeRed },
        { name: 'WebSocket', message: mensajeRed },
        { name: 'globalThis', message: mensajeGlobal },
        { name: 'global', message: mensajeGlobal },
        { name: 'window', message: mensajeGlobal },
        { name: 'self', message: mensajeGlobal },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: mensajeFecha },
        { selector: "CallExpression[callee.name='Date']", message: mensajeFecha },
        { selector: "MemberExpression[object.name='Date']", message: mensajeFecha },
        // Ni siquiera como tipo: las fechas son string 'YYYY-MM-DD'.
        { selector: "TSTypeReference[typeName.name='Date']", message: mensajeFecha },
        { selector: 'ImportExpression', message: mensajeDomain },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: mensajeAzar },
        { object: 'Intl', property: 'DateTimeFormat', message: mensajeFecha },
      ],
    },
  },
  {
    // AD-17: todo texto de pantalla sale de src/textos/.
    // react-native/no-raw-text solo detecta texto FUERA de <Text>; por eso
    // no-restricted-syntax cubre el texto literal dentro de <Text>, en
    // expresiones, en las props visibles y en Alert.
    files: ['src/app/**/*.{ts,tsx,js,jsx}', 'src/components/**/*.{ts,tsx,js,jsx}'],
    plugins: { 'react-native': reactNative },
    rules: {
      'react-native/no-raw-text': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: 'JSXText[value=/\\S/]', message: mensajeTexto },
        { selector: `${hijoJsx} > ${literal}`, message: mensajeTexto },
        { selector: `${hijoJsx} > ${expresion} > ${literal}`, message: mensajeTexto },
        { selector: `${hijoJsx} > ${expresion} > ${expresion} > ${literal}`, message: mensajeTexto },
        {
          selector: `${hijoJsx} > ${expresion} > ${expresion} > ${expresion} > ${literal}`,
          message: mensajeTexto,
        },
        { selector: `JSXAttribute[name.name=${propsVisibles}] > ${literal}`, message: mensajeTexto },
        {
          selector: `JSXAttribute[name.name=${propsVisibles}] > JSXExpressionContainer ${literal}`,
          message: mensajeTexto,
        },
        { selector: `Property[key.name=${opcionesVisibles}] > ${literal}`, message: mensajeTexto },
        {
          selector: `CallExpression[callee.object.name='Alert'][callee.property.name=/^(alert|prompt)$/] > ${literal}`,
          message: mensajeTexto,
        },
      ],
    },
  },
]);
