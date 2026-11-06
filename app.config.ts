import type { ExpoConfig } from 'expo/config';

// AD-16: dos variantes instalables a la vez. Sin APP_VARIANT se asume 'dev',
// para que un run olvidadizo nunca toque la app con los datos reales. Un valor
// desconocido (p. ej. 'prod' o 'Release') detiene el build en vez de caer en dev.
const variantesValidas = ['dev', 'release'] as const;
const varianteEnv = process.env.APP_VARIANT || undefined; // '' cuenta como sin definir
if (varianteEnv !== undefined && !(variantesValidas as readonly string[]).includes(varianteEnv)) {
  throw new Error(`APP_VARIANT='${varianteEnv}' no es válida: usa 'dev' o 'release'.`);
}
const variante = varianteEnv === 'release' ? 'release' : 'dev';
const esRelease = variante === 'release';

const paqueteBase = 'com.priettos.moneytrack';

export default (): ExpoConfig => ({
  name: esRelease ? 'MoneyTrack' : 'MoneyTrack Dev',
  slug: 'moneytrack',
  // AD-24: version y versionCode solo se definen aquí.
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: esRelease ? 'moneytrack' : 'moneytrack-dev',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
  },
  android: {
    package: esRelease ? paqueteBase : `${paqueteBase}.dev`,
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    // Agregados por `npx expo install` (T4).
    'expo-sqlite',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  // Sin secretos aquí (AD-12). AD-14 lee la variante desde extra.
  extra: {
    variante,
  },
});
