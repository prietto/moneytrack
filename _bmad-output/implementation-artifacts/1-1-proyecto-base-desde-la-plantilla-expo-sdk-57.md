---
baseline_commit: NO_VCS
---

# Story 1.1: Proyecto base desde la plantilla Expo SDK 57

Status: review

<!-- Nota: la validación es opcional. Ejecutar validate-create-story para un control de calidad antes de dev-story. -->

## Story

Como Priettos (desarrollador),
quiero el proyecto creado desde la plantilla oficial, con el stack fijado, las reglas de capas y la verificación automática,
para que cada historia siguiente se construya sobre una base consistente y verificable.

**Requisitos:** Starter template, NFR13; AD-16 (variantes). Toca además AD-1 (lint de `domain/`), AD-3 (lint de `data/`), AD-10, AD-17 (`no-raw-text`), AD-23 (`no-console`) y la convención de Pruebas y Migraciones del spine.

## Acceptance Criteria

1. **Plantilla y estructura.** Dado una máquina con Node y el SDK de Android, cuando se crea el proyecto con `create-expo-app --template default@sdk-57`, entonces el proyecto usa TypeScript y Expo Router en `src/app/`, y `app.json` se reemplaza por `app.config.ts`. Existen las carpetas `src/app`, `src/hooks`, `src/domain`, `src/data` (`schema.ts`, `tablas/`, `commands/`, `queries/`), `src/services` y `src/textos`.
2. **Dependencias.** Las nativas de Expo (expo-sqlite, expo-secure-store, expo-notifications, expo-local-authentication, expo-image-picker, expo-file-system, expo-crypto, expo-network) se instalan con `npx expo install`, sin `@next`. Se fijan drizzle-orm 0.45.x, drizzle-kit 0.31.x y Zod 4.6.x, con `babel-plugin-inline-import` y `sql` en los `sourceExts` de Metro.
3. **Reglas de capas en ESLint** (`eslint-config-expo` + `eslint-plugin-react-native`). ESLint falla cuando un archivo de `src/domain/**` importa React, Expo, Drizzle, SQLite o la red, o usa `Date` o `Math.random`. También falla cuando se importa `drizzle-orm` o `src/data/tablas` fuera de `src/data/`, cuando hay texto literal en `src/app/**` (`react-native/no-raw-text`) o cuando se usa `console` (`no-console`).
4. **Verificación.** Con Jest (jest-expo), better-sqlite3 y @testing-library/react-native, `npm run verificar` corre `tsc --noEmit`, ESLint y Jest, y falla si cualquiera falla. Existe un helper de pruebas que abre una base better-sqlite3 en memoria y aplica las migraciones de `drizzle/`.
5. **Variantes y migraciones.** Con `APP_VARIANT=dev` o `APP_VARIANT=release`, al ejecutar `npx expo prebuild` e instalar, `dev` usa un applicationId con sufijo `.dev` y se puede instalar al mismo tiempo que `release`. `android/` está en `.gitignore`, y `version` y `android.versionCode` se definen solo en `app.config.ts`. Al abrir la app, `useMigrations` aplica las migraciones de Drizzle generadas con `drizzle-kit generate`.

## Tasks / Subtasks

- [x] **T1. Prerrequisitos del entorno** (AC: 1)
  - [x] Verificar que Node cumple el `engines` de `expo@57` / `react-native@0.86` (`npm view expo@sdk-57 engines` y `npm view react-native@0.86 engines`). La máquina tiene **Node 20.19.6**: si el piso exigido es mayor (p. ej. Node 22), detenerse y avisar a Priettos antes de seguir (no actualizar Node por cuenta propia).
  - [x] Confirmar `ANDROID_HOME=/home/lprieto/Android/Sdk` y JDK 17 (ya presentes).
  - [x] La raíz `moneytrack_app/` **no es un repositorio git**. Ejecutar `git init` (rama `main`) para que `.gitignore` tenga efecto. No hacer commits salvo que Priettos lo pida.
- [x] **T2. Crear el proyecto en la raíz existente** (AC: 1)
  - [x] La raíz ya contiene `_bmad/`, `_bmad-output/`, `.claude/` y `docs/`, así que `create-expo-app .` puede negarse. Crear en una carpeta temporal **del scratchpad** y mover el contenido a la raíz: `npx create-expo-app@latest <tmp>/moneytrack --template default@sdk-57 --no-install`, luego copiar todo (incluidos ocultos como `.gitignore`, `.vscode/`) a la raíz **sin sobrescribir** `_bmad*`, `.claude/` ni `docs/`, y ejecutar `npm install` en la raíz.
  - [x] Nunca usar `--template default@sdk-58` ni `@latest` del template: el SDK es 57 por decisión de Priettos (memlog 2026-10-19; migrar a 58 después de v1).
  - [x] Confirmar `expo` ≥ 57.0.21 en `package.json` (`npx expo install expo@^57.0.21` si el template trae uno menor).
  - [x] Eliminar el contenido de ejemplo de la plantilla (pestañas, `components/` de demo, imágenes, `constants/` de demo y `scripts/reset-project.js` con su script en `package.json`). Puede usarse `npm run reset-project` y luego borrar `app-example/` y el script. Dejar solo `src/app/_layout.tsx` y `src/app/index.tsx` mínimos (ver T7).
  - [x] Crear `src/hooks/`, `src/domain/`, `src/data/{tablas,commands,queries}/`, `src/services/` y `src/textos/`. Las carpetas vacías llevan un `.gitkeep` (o el primer archivo real de esta historia).
  - [x] Mantener el alias `@/*` → `./src/*` del `tsconfig.json` de la plantilla y `strict: true`.
- [x] **T3. `app.json` → `app.config.ts` con variantes** (AC: 1, 5)
  - [x] Pasar todo el contenido de `app.json` a `app.config.ts` (`ExpoConfig` tipado, `export default (): ExpoConfig => ({...})`) y **borrar `app.json`**.
  - [x] `const variante = process.env.APP_VARIANT === 'release' ? 'release' : 'dev'` (por defecto `dev`, para que nunca se toque la app con datos reales por accidente; AD-16).
  - [x] `android.package`: `<base>` en release y `<base>.dev` en dev. `name`: "MoneyTrack" / "MoneyTrack Dev". `scheme` distinto por variante (`moneytrack` / `moneytrack-dev`) para que los deep links no choquen. Ver la pregunta abierta sobre `<base>` (propuesta: `com.priettos.moneytrack`).
  - [x] `version: '0.1.0'` y `android.versionCode: 1`, **solo** aquí (AD-24). No hay `ios` que configurar (solo Android, NFR12); se puede dejar la sección que traiga la plantilla, pero no se mantiene.
  - [x] Exponer la variante en `extra: { variante }` para que AD-14 la lea más adelante (sin secretos en `extra`, AD-12).
  - [x] Mantener los `plugins` de la plantilla (`expo-router`, splash, etc.) y agregar los que pidan las librerías instaladas en T4 **solo si** `npx expo install` los agrega o la documentación de SDK 57 los exige. No configurar permisos ni textos de las librerías aquí: cada historia los añade cuando usa la función (p. ej. H1.2 la biometría, H6.1 las notificaciones).
- [x] **T4. Dependencias** (AC: 2)
  - [x] `npx expo install expo-sqlite expo-secure-store expo-notifications expo-local-authentication expo-image-picker expo-file-system expo-crypto expo-network` (nunca `@next`, nunca `npm i` directo para estas).
  - [x] `npm i drizzle-orm@~0.45.4 zod@~4.6.7` y `npm i -D drizzle-kit@~0.31.11 babel-plugin-inline-import`. **No** usar `@rc` aunque la documentación de Drizzle lo diga (tech-currency H2). Fijar con `~` para quedarse en la menor.
  - [x] `babel.config.js`: si la plantilla no lo trae, crearlo con `presets: ['babel-preset-expo']` y `plugins: [['inline-import', { extensions: ['.sql'] }]]`.
  - [x] `metro.config.js`: `const { getDefaultConfig } = require('expo/metro-config'); const config = getDefaultConfig(__dirname); config.resolver.sourceExts.push('sql'); module.exports = config;`.
  - [x] Agregar `src/types/sql.d.ts` (o equivalente incluido en `tsconfig`) con `declare module '*.sql' { const contenido: string; export default contenido; }`.
- [x] **T5. Drizzle: esquema, primera migración, conexión** (AC: 4, 5)
  - [x] `drizzle.config.ts` en la raíz: `defineConfig({ schema: './src/data/schema.ts', out: './drizzle', dialect: 'sqlite', driver: 'expo' })`. El `driver: 'expo'` es obligatorio: genera `drizzle/migrations.js` que el bundle necesita.
  - [x] `src/data/schema.ts`: helper de columnas comunes de AD-10 (`id` texto PK con UUID v4, `createdAt`, `updatedAt` en ISO UTC no nulos, `deletedAt` ISO UTC nullable; columnas `snake_case` en SQL, camelCase en TS) y **una sola tabla, `rastro`**, con la forma de AD-3: `entidad`, `entidadId`, `operacion` (`'editar' | 'borrar' | 'restaurar'`), `antes` (JSON texto), `despues` (JSON texto, nullable), `fecha` (ISO UTC). Motivo: `drizzle-kit generate` no produce migración con un esquema vacío, y sin migración no se puede probar `useMigrations` ni el helper. `rastro` es la tabla que H1.3 necesita primero; H1.3 agrega su helper de escritura, no la redefine.
  - [x] `npx drizzle-kit generate` → `drizzle/0000_*.sql`, `drizzle/meta/_journal.json` y `drizzle/migrations.js`. Nunca escribir migraciones a mano. Agregar el script `"db:generar": "drizzle-kit generate"`.
  - [x] `src/data/db.ts`: `openDatabaseSync('moneytrack.db', { enableChangeListener: true })` (necesario para `useLiveQuery` en H1.3) y `drizzle(expoDb, { schema })`. Exportar `db` y su tipo.
  - [x] `src/data/migraciones.ts`: exporta `useMigraciones()`, que envuelve `useMigrations(db, migrations)` de `drizzle-orm/expo-sqlite/migrator` con `import migrations from '../../drizzle/migrations'`. Así `src/app/` no importa `drizzle-orm` (regla del T6).
- [x] **T6. ESLint con las reglas de capas** (AC: 3)
  - [x] `npx expo install eslint eslint-config-expo -- --save-dev` (o `npx expo lint`, que lo configura) y `npm i -D eslint-plugin-react-native`. Usar **flat config** (`eslint.config.js` con `require('eslint-config-expo/flat')` y `defineConfig` de `eslint/config`), que es el formato por defecto desde SDK 53.
  - [x] Global: `no-console: 'error'`. Ignorar `drizzle/`, `android/`, `ios/`, `.expo/`, `node_modules/`, `dist/`.
  - [x] `src/domain/**`:
    - `no-restricted-imports` con `patterns` para `react`, `react-*`, `react-native*`, `expo`, `expo-*`, `@expo/*`, `drizzle-orm*`, `expo-sqlite*`, `better-sqlite3`, `axios`, `@/app/*`, `@/hooks/*`, `@/data/*`, `@/services/*`, `@/textos/*` y sus rutas relativas (`../data/*`, etc.). `domain/` no depende de nadie.
    - `no-restricted-globals` para `Date` y `fetch`, `XMLHttpRequest`, `WebSocket` (la red).
    - `no-restricted-syntax` para `NewExpression[callee.name='Date']` y `CallExpression[callee.name='Date']` (cubre `new Date()` y `Date.now()` aun si `no-restricted-globals` no lo detecta por `typeof`), y `no-restricted-properties` con `{ object: 'Math', property: 'random' }`.
    - Mensajes en español que digan qué usar en su lugar (p. ej. "domain/ recibe `hoy` como parámetro; usa services/reloj desde hooks/").
  - [x] Todo `src/**` **excepto** `src/data/**`: `no-restricted-imports` de `drizzle-orm`, `drizzle-orm/*` y `@/data/tablas`, `@/data/tablas/*` (y las rutas relativas a `data/tablas`). **Ojo:** en flat config, dos bloques que configuran `no-restricted-imports` sobre el mismo archivo **no se fusionan**, el último gana. Para `src/domain/**` el bloque de domain debe incluir también estas restricciones. Verificarlo con las pruebas del T8.
  - [x] `src/app/**`: `react-native/no-raw-text: 'error'` (registrando el plugin `react-native`). Si el plugin no trae configuración flat, registrarlo a mano: `plugins: { 'react-native': reactNative }`.
  - [x] Las pruebas `*.test.ts(x)` siguen las mismas reglas de su carpeta (las de `domain/` usan fechas `'YYYY-MM-DD'` en texto, nunca `Date`).
- [x] **T7. Pantallas mínimas sin texto literal** (AC: 3, 5)
  - [x] `src/textos/app.ts` (primer módulo de textos, AD-17): `nombreApp`, `preparandoDatos`, `errorMigracion` con la Voz del socio: honesto, amable, sin jerga ni detalles técnicos. Ejemplo: "No pude preparar tus datos. Cierra la app y ábrela de nuevo; si sigue igual, avísale al desarrollador."
  - [x] `src/app/_layout.tsx`: llama `useMigraciones()`. Si hay `error` → pantalla con `textos.errorMigracion` (sin el mensaje técnico; el registro con `services/log` llega en H1.2, aquí no usar `console`). Si `!success` → nada o un indicador con `textos.preparandoDatos`. Si `success` → `<Stack />` de Expo Router.
  - [x] `src/app/index.tsx`: muestra `textos.nombreApp`. Es un marcador de posición que H1.4 reemplaza. Todo texto de pantalla sale de `src/textos/`.
- [x] **T8. Jest y pruebas de la base** (AC: 3, 4)
  - [x] `npx expo install jest-expo jest @types/jest -- --save-dev` (con SDK 57 queda en Jest 29; no forzar Jest 30, que es de SDK 58). `npm i -D @testing-library/react-native better-sqlite3 @types/better-sqlite3`. **No** instalar `react-test-renderer` (deprecado).
  - [x] Config de Jest en `package.json` o `jest.config.js`: `preset: 'jest-expo'`, `testPathIgnorePatterns` para `android/`, `drizzle/` y `app-example/` si quedara. El alias `@/` debe resolver en Jest (`moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }` si el preset no lo hace).
  - [x] `src/data/pruebas/base-en-memoria.ts` (helper; ubicación dentro de `src/data/` para poder importar `drizzle-orm` sin romper la regla del T6): `crearBaseDePrueba()` → `new Database(':memory:')`, `drizzle(sqlite, { schema })` de `drizzle-orm/better-sqlite3` y `migrate(db, { migrationsFolder: <ruta absoluta a drizzle/> })` de `drizzle-orm/better-sqlite3/migrator`. Devuelve `{ db, cerrar }`. Usa los **mismos** `schema.ts` y migraciones que la app; nunca mockear `expo-sqlite`. Este archivo nunca se importa desde código de la app.
  - [x] `src/data/pruebas/base-en-memoria.test.ts` con docblock `/** @jest-environment node */` (better-sqlite3 es un addon de Node): aplica migraciones, inserta y lee una fila de `rastro` y verifica que la tabla `__drizzle_migrations` tiene una entrada por cada archivo de `drizzle/meta/_journal.json`.
  - [x] `pruebas/eslint-reglas.test.ts` (entorno node; incluir `pruebas/` en `tsconfig` y en ESLint): usa la API `new ESLint()` de `eslint` y `lintText(codigo, { filePath })` para probar **cada** regla del AC 3 con un caso que falla y uno que pasa:
    - `src/domain/x.ts` con `import React from 'react'`, `import { openDatabaseSync } from 'expo-sqlite'`, `import { eq } from 'drizzle-orm'`, `new Date()`, `Date.now()`, `Math.random()`, `fetch('...')` → error; un archivo puro → sin errores.
    - `src/hooks/x.ts` con `import { eq } from 'drizzle-orm'` y `import { x } from '@/data/tablas/rastro'` → error; `src/data/x.ts` con lo mismo → sin errores de `no-restricted-imports`.
    - `src/app/x.tsx` con `<Text>Hola</Text>` → `react-native/no-raw-text`; con `{textos.x}` → sin error.
    - cualquier archivo con `console.log` → `no-console`.
  - [x] Una prueba de humo de pantalla con `@testing-library/react-native` (renderiza `src/app/index.tsx` y encuentra `textos.nombreApp`), para dejar probado que la librería funciona con jest-expo. **No ponerla dentro de `src/app/`**: Expo Router trata todo archivo de esa carpeta como una ruta. Va en `pruebas/pantallas/inicio.test.tsx` (carpeta `pruebas/` en la raíz, junto a `eslint-reglas.test.ts`). Esta es la única excepción a "pruebas junto al archivo" y aplica a todas las pantallas.
- [x] **T9. `npm run verificar`** (AC: 4)
  - [x] Scripts: `"typecheck": "tsc --noEmit"`, `"lint": "eslint . --max-warnings=0"`, `"test": "jest"`, `"verificar": "npm run typecheck && npm run lint && npm run test -- --ci"`. El `&&` hace que falle si falla cualquiera.
  - [x] Comprobar a mano que falla: introducir temporalmente un error de tipos, un `console.log` y una prueba rota (uno a la vez), ver que `verificar` sale con código ≠ 0, y revertir.
- [x] **T10. `.gitignore` y prebuild de ambas variantes** (AC: 5)
  - [x] `.gitignore` incluye `android/`, `ios/`, `.expo/`, `node_modules/`, `*.keystore`, `*.jks`, `.env*` y `*.db` (además de lo que trae la plantilla). Confirmar con `git check-ignore android`.
  - [x] `APP_VARIANT=dev npx expo prebuild --platform android --clean` → `android/app/build.gradle` con `applicationId '<base>.dev'`, `versionCode 1`, `versionName "0.1.0"`. Repetir con `APP_VARIANT=release` → `applicationId '<base>'`. Nunca editar `android/` a mano (AD-16).
  - [x] Instalar ambas en un dispositivo o emulador (`APP_VARIANT=dev npx expo run:android` y `APP_VARIANT=release npx expo run:android --variant release`; en 1.1 el release usa la firma de depuración, la firma real es H1.9) y confirmar con `adb shell pm list packages | grep moneytrack` que **coexisten**. Abrir cada una: carga sin error, lo que demuestra que `useMigraciones` aplicó la migración.
  - [x] `npx expo-doctor` sin errores (en especial, sin versiones desalineadas con SDK 57).
- [x] **T11. Cierre**
  - [x] `npm run verificar` en verde.
  - [x] Llenar "Dev Agent Record": versiones exactas instaladas (expo, react-native, drizzle-orm, drizzle-kit, zod, jest, jest-expo, eslint, eslint-config-expo), el `engines` de Node verificado y la lista de archivos.

## Dev Notes

### Qué es y qué no es esta historia

- Es **solo el andamiaje**: plantilla, stack, reglas de capas, verificación, variantes y migraciones. No hay lógica de negocio.
- **Fuera de alcance** (no adelantar, cada una tiene su historia): biometría, `services/log`, ErrorBoundary, `Resultado<T>` y `formatearDinero` (H1.2); `services/reloj`, `useHoy`, `useEstado`, `ejecutar()`, `Hechos`, `calcularEstado` y el helper de escritura del rastro (H1.3); navegación base y pantalla principal (H1.4); tablas de negocio (H1.4 en adelante); firma real, config plugin de firma y Firebase App Distribution (H1.9).
- La tabla `rastro` se crea aquí solo para tener una primera migración real (ver T5). Si el dev prefiere otra tabla, debe ser una que el spine ya defina; nunca una tabla inventada.

### Decisiones fijadas (no reabrir)

- **Expo SDK 57** (`expo` ≥ 57.0.21, RN 0.86, React 19.2), con `--template default@sdk-57`. SDK 58 está estable desde el 15-oct-2026, pero Priettos eligió 57 por plazo y compatibilidad, y migrar después de v1. `create-expo-app` sin `--template` puede crear 57 o 58 según el día; por eso el template va explícito. [Source: ARCHITECTURE-SPINE.md#Stack; architecture/.memlog.md (2026-10-19); reviews/review-tech-currency.md#H1]
- **Drizzle 0.45.x / drizzle-kit 0.31.x, no la 1.0 rc**, y nunca `expo-sqlite@next`. La documentación oficial de Drizzle manda a `@rc` y a `expo-sqlite@next`: ignorarla en ese punto. La API vigente en 0.45 que se usará: `drizzle-orm/expo-sqlite` (`drizzle`), `drizzle-orm/expo-sqlite/migrator` (`useMigrations`), `useLiveQuery` con `enableChangeListener: true`, y `drizzle-orm/better-sqlite3` + `drizzle-orm/better-sqlite3/migrator` (`migrate`) para pruebas. [Source: review-tech-currency.md#H2]
- **Pruebas de `data/` con better-sqlite3 en memoria**, mismo esquema y mismas migraciones; expo-sqlite no corre en Jest. Los comandos (desde H1.3) reciben `db` por parámetro, no lo importan como singleton. [Source: review-tech-currency.md#H3; ARCHITECTURE-SPINE.md#Consistency Conventions]
- **`android/` no se versiona ni se edita a mano**; todo va en `app.config.ts` o en config plugins. [Source: AD-16]
- **`version` y `android.versionCode` solo en `app.config.ts`**; `versionCode` sube +1 por cada APK distribuido (desde H1.9). [Source: AD-24]
- **No hay store global** (Redux/Zustand) para datos de negocio: no instalar ninguno. [Source: Consistency Conventions]
- Sin `expo-dev-client`, Crashlytics, librerías de UI ni otras dependencias fuera del stack. Si hace falta alguna, preguntar.

### Arquitectura de capas que el lint debe hacer cumplir

| Capa | Carpeta | Nunca |
| --- | --- | --- |
| Pantallas | `src/app/` | Calcular cifras, usar Drizzle, llamar a la red, texto literal |
| Hooks | `src/hooks/` | Lógica de negocio propia |
| Persistencia | `src/data/` | Calcular cifras derivadas |
| Servicios | `src/services/` | Escribir en la base salvo vía comandos de `data/` |
| Núcleo | `src/domain/` | Importar React, Expo, Drizzle, SQLite, la red; usar `Date` o `Math.random` |

`domain/` no depende de nadie. `data/` solo importa **tipos** de `domain/` (`import type`); no hace falta una regla de lint para esto en 1.1, pero no la contradigas. [Source: ARCHITECTURE-SPINE.md#Design Paradigm]

### Convenciones que nacen aquí y todas las historias heredan

- Nombres de dominio en español, camelCase y sin tildes (`dineroLibre`, `saldoProyectado`). Archivos en `kebab-case.ts`. Pruebas junto al archivo (`*.test.ts`). Tablas en plural `snake_case`; columnas `snake_case` en SQL y camelCase en TS.
- Ids UUID v4 en texto (`expo-crypto` `randomUUID()` en la app). Fechas de negocio `YYYY-MM-DD`; marcas técnicas ISO 8601 UTC.
- Migraciones solo con `drizzle-kit generate`; se aplican al abrir con `useMigrations`; una migración publicada en un APK nunca se edita (hasta H1.9 aún no hay APK publicado, pero la costumbre empieza ya).
- [Source: ARCHITECTURE-SPINE.md#Consistency Conventions; AD-8; AD-10]

### Trampas conocidas

- **`create-expo-app` en carpeta no vacía:** ver T2. No borrar ni pisar `_bmad/`, `_bmad-output/`, `.claude/` ni `docs/`.
- **Flat config y `no-restricted-imports`:** los bloques no se fusionan por regla; el último que aplica gana. Si `src/domain/**` cae en dos bloques, el segundo borra las restricciones del primero. Las pruebas del T8 son la red de seguridad.
- **`Date` en `domain/`:** `no-restricted-globals` cubre las referencias a `Date`; añadir `no-restricted-syntax` evita huecos. Los tipos (`string` con formato `YYYY-MM-DD`) son la forma correcta; nada de `Date` ni siquiera en pruebas de domain.
- **`.sql` en Jest:** el helper usa `migrate()` con `migrationsFolder`, que lee los `.sql` del disco; no importa `drizzle/migrations.js`. Así Jest no necesita transformar `.sql`. No importar `@/data/db` (expo-sqlite) desde pruebas.
- **better-sqlite3** es un addon nativo de Node: con Node 20 hay binarios precompilados; si `npm i` intenta compilar, hacen falta `python3`, `make` y `g++`. Las pruebas que lo usan van con `@jest-environment node`.
- **`APP_VARIANT` sin definir** = `dev`. Así un `npx expo run:android` olvidadizo nunca instala sobre la app con datos reales.
- **Node 20.19.6:** ver T1. No suponer el piso de Node de SDK 57; verificar `engines`.
- La plantilla puede traer `expo-router` con `typedRoutes`/`reactCompiler` en `experiments`: mantener lo que traiga por defecto, sin activar experimentos nuevos.

### Testing

- Jest con `jest-expo` (preset de SDK 57). Pruebas que deben existir al cerrar: helper de base en memoria (T8), reglas de ESLint (T8) y humo de pantalla (T8).
- `npm run verificar` (`tsc --noEmit` + ESLint + Jest) es la Definition of Done de esta y de todas las historias (NFR13). No hay CI: la verificación es local.

### Project Structure Notes

Estructura objetivo al cerrar la historia (raíz = `moneytrack_app/`; el spine dibuja `moneytrack/` como nombre genérico del proyecto, aquí es la raíz del repo):

```text
moneytrack_app/
  _bmad/ _bmad-output/ .claude/ docs/   # existentes, no tocar
  app.config.ts          # variantes dev/release, version, versionCode (AD-16, AD-24)
  babel.config.js        # inline-import .sql
  metro.config.js        # sourceExts += sql
  drizzle.config.ts      # dialect sqlite, driver expo
  eslint.config.js       # reglas de capas
  drizzle/               # migraciones generadas (0000_*.sql, meta/, migrations.js)
  src/
    app/_layout.tsx      # useMigraciones + Stack
    app/index.tsx        # marcador de posición
    hooks/
    domain/
    data/
      schema.ts          # columnas AD-10 + tabla rastro
      db.ts              # openDatabaseSync + drizzle
      migraciones.ts     # useMigraciones()
      tablas/ commands/ queries/
      pruebas/base-en-memoria.ts (+ .test.ts)
    services/
    textos/app.ts
    types/sql.d.ts
  pruebas/
    eslint-reglas.test.ts
    pantallas/inicio.test.tsx   # pruebas de pantallas fuera de src/app (Expo Router)
```

- Variante detectada respecto al spine: el spine no ubica el helper de pruebas ni `db.ts`; se ponen en `src/data/` para respetar la regla "drizzle-orm solo dentro de `src/data/`".
- El spine dice `.gitignore` de `android/`; también se ignora `ios/` porque el proyecto es solo Android.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: _bmad-output/planning-artifacts/epics.md#Additional Requirements (Starter template, Estructura y reglas de capas)]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md (Design Paradigm, AD-1, AD-3, AD-10, AD-16, AD-17, AD-23, AD-24, Consistency Conventions, Stack, Structural Seed)]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/reviews/review-tech-currency.md (H1, H2, H3, "Confirmado sin cambios")]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/.memlog.md (decisión SDK 57, 2026-10-19)]
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-11-04.md (H1.1 puede empezar; `expo-network` en el stack)]
- Drizzle con Expo SQLite (bundling `.sql`, `driver: 'expo'`, `useMigrations`): https://orm.drizzle.team/docs/connect-expo-sqlite
- ESLint en Expo (flat config, `eslint-config-expo/flat`): https://docs.expo.dev/guides/using-eslint
- Pruebas unitarias en Expo (jest-expo): https://docs.expo.dev/develop/unit-testing/

### Información técnica reciente (verificada)

- npm a 2026-10-19: `expo` `sdk-57` = 57.0.30; `jest-expo` `sdk-57` = 57.0.6; `drizzle-orm` latest 0.45.4 (rc 1.0.0-rc.4: no usar); `drizzle-kit` latest 0.31.11; `zod` 4.6.7. Usar `npx expo install` para lo de Expo y que resuelva las versiones de SDK 57.
- La plantilla `default` trae rutas en `src/app/` (`_layout.tsx`, `index.tsx`), `app.json` (hay que convertirlo) y `scripts/reset-project.js`.
- ESLint en Expo usa flat config desde SDK 53 (`eslint.config.js` + `eslint-config-expo/flat`).
- No se encontró en la web el piso de Node de SDK 57: verificarlo con `engines` (T1).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (`claude-opus-5-5`) vía Claude Code, workflow bmad-dev-story.

### Debug Log References

- **Node / engines:** Node 20.19.6. `expo@57.0.31` no declara `engines`; `react-native@0.86.x` exige `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0` → cumple.
- **git 2.25.1** no soporta `git init -b`: se usó `git init` + `git symbolic-ref HEAD refs/heads/main`. Sin commits (`baseline_commit: NO_VCS`).
- **better-sqlite3 12.11.1** no tiene binario precompilado para Node 20 (node-v115) y el g++ 9.4 del sistema no soporta `-std=c++20`. Se fijó `better-sqlite3@~12.9.0`, la última con binario precompilado para Node 20 linux-x64.
- **@testing-library/react-native:** sin versión, npm resolvía 13.3.3, que pide `react-test-renderer@19.3.1` (choque de peer con React 19.2.3). Se instaló `^14.1.0`, que usa `test-renderer` y no `react-test-renderer` (cumple "no instalar react-test-renderer"; jest-expo sigue trayéndolo como dependencia propia).
- **`npx expo install jest-expo jest @types/jest -- --save-dev`** dejó los tres en `dependencies`; se movieron a `devDependencies`.
- **TypeScript 6:** `types` por defecto es `[]`, así que `tsc` no veía `describe`/`expect` ni `node:path`. Se agregó `"types": ["jest", "node"]` a `tsconfig.json` (`@types/node` llega por `@types/better-sqlite3`; no se agregó dependencia).
- **ESLint en Jest:** la prueba pasa la config ya cargada (`overrideConfigFile: true` + `overrideConfig: require('../eslint.config.js')`) porque Jest no soporta el `import()` dinámico con el que ESLint carga `eslint.config.js`.
- **Gradle 9.3.1 pide JVM 17**, pero el perfil exporta `JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64` (aunque `java` del PATH es 17). Los builds se corrieron con `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64` solo en ese comando; no se tocó la configuración global.
- **`npx expo prebuild`** cambió los scripts `android`/`ios` de `package.json` a `expo run:android`/`expo run:ios` (comportamiento estándar de prebuild).

### Completion Notes List

- **Versiones instaladas:** expo 57.0.31, react-native 0.86.3, react 19.2.3, typescript 6.0.3, drizzle-orm 0.45.4 (`~0.45.4`), drizzle-kit 0.31.11 (`~0.31.11`), zod 4.6.7 (`~4.6.7`), jest 29.7.0, jest-expo 57.0.6, eslint 9.39.5, eslint-config-expo 57.0.2, eslint-plugin-react-native 5.0.0, @testing-library/react-native 14.1.0, better-sqlite3 12.9.0. Nativas de Expo con `npx expo install`: expo-sqlite 57.0.4, expo-secure-store 57.0.4, expo-notifications 57.0.24, expo-local-authentication 57.0.3, expo-image-picker 57.0.20, expo-file-system 57.0.7, expo-crypto 57.0.4, expo-network 57.0.3.
- **Plantilla:** `create-expo-app --template default@sdk-57` en el scratchpad y copiada a la raíz con `rsync --ignore-existing`, sin `.git/` ni `.claude/` de la plantilla (no se tocaron `_bmad*`, `.claude/`, `docs/`). Se quitó el contenido de ejemplo (pestañas, `components/`, `constants/`, `hooks/` de demo, `global.css`, imágenes de demo, `scripts/reset-project.js` y su script). Se conservaron `CLAUDE.md`/`AGENTS.md`, `README.md` y `LICENSE` de la plantilla.
- **`app.config.ts`:** paquete base `com.priettos.moneytrack` (la propuesta de la pregunta abierta; `.dev` en la variante dev), `name` y `scheme` por variante, `version: '0.1.0'` y `versionCode: 1` solo aquí, `extra.variante`. `npx expo install` pidió los plugins `expo-sqlite` y `expo-secure-store` (no pudo editar el config dinámico) y se agregaron a mano. Sin `APP_VARIANT` → `dev`.
- **Drizzle:** `schema.ts` con `columnasComunes` (AD-10) y la tabla `rastro` (AD-3); migración `drizzle/0000_black_lockjaw.sql` + `migrations.js` generadas con `npm run db:generar`. `src/data/db.ts` (`enableChangeListener: true`) y `useMigraciones()` en `src/data/migraciones.ts`.
- **Desviación en ESLint (AC 3):** `react-native/no-raw-text` solo marca texto **fuera** de `<Text>`; `<Text>Hola</Text>` no lo dispara (lo confirmó la prueba roja). Para cumplir AD-17 se mantiene `no-raw-text` y se añade `no-restricted-syntax` en `src/app/**` para `JSXText`, strings y template literals dentro de JSX. La prueba usa `<View>Hola</View>` para `no-raw-text` y `<Text>Hola</Text>` para `no-restricted-syntax`.
- **ESLint de capas:** `no-restricted-imports` con `patterns.regex`; el bloque de `src/domain/**` repite las restricciones de drizzle/tablas porque en flat config gana el último bloque (cubierto por prueba). `Date` (globals + syntax), `Math.random`, `fetch`/`XMLHttpRequest`/`WebSocket` restringidos en domain. `no-console` global.
- **Pruebas (42, todas en verde):** `src/data/pruebas/base-en-memoria.test.ts` (migraciones = entradas del journal, escribir/leer `rastro`, aislamiento entre bases), `pruebas/eslint-reglas.test.ts` (cada regla con caso que falla y que pasa) y `pruebas/pantallas/inicio.test.tsx` (humo con Testing Library).
- **`npm run verificar`:** en verde (exit 0). Comprobado que falla con un error de tipos (exit 2), un `console.log` (exit 1) y una prueba rota (exit 1); los tres revertidos.
- **Prebuild y dispositivo:** `APP_VARIANT=dev` → `applicationId 'com.priettos.moneytrack.dev'`, `versionCode 1`, `versionName "0.1.0"`, nombre "MoneyTrack Dev", scheme `moneytrack-dev`; `APP_VARIANT=release` → `com.priettos.moneytrack`, "MoneyTrack", scheme `moneytrack`. Instaladas ambas en el emulador `Pixel_8_Pro_API_35`: `pm list packages` muestra las dos y cada una abre mostrando "MoneyTrack" (sin pantalla de error, por lo que `useMigraciones` aplicó la migración; en dev se ve `files/SQLite/moneytrack.db`). El release usa firma de depuración (la real es H1.9).
- **`npx expo-doctor`:** 21/21 checks sin problemas.
- `.gitignore` incluye `android/`, `ios/`, `.expo/`, `node_modules/`, `*.keystore`, `*.jks`, `.env*`, `*.db` (verificado con `git check-ignore`).
- **Para H1.4:** el `<Stack />` muestra el título por defecto "index" (nombre de la ruta) en la cabecera; la navegación base y sus títulos (desde `textos/`) quedan para H1.4.
- **Pregunta abierta resuelta con la propuesta:** `<base>` = `com.priettos.moneytrack`. Si Priettos prefiere otro, se cambia solo en `app.config.ts` antes de H1.9 (antes de publicar un APK).

### File List

Nuevos (raíz):
- `.gitignore` (de la plantilla + entradas de H1.1)
- `.vscode/extensions.json`, `.vscode/settings.json` (plantilla)
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `LICENSE` (plantilla)
- `app.config.ts`
- `babel.config.js`
- `metro.config.js`
- `drizzle.config.ts`
- `eslint.config.js`
- `jest.config.js`
- `package.json`, `package-lock.json`
- `tsconfig.json`
- `assets/expo.icon/icon.json`, `assets/expo.icon/Assets/expo-symbol 2.svg`, `assets/expo.icon/Assets/grid.png`
- `assets/images/icon.png`, `assets/images/favicon.png`, `assets/images/splash-icon.png`, `assets/images/android-icon-background.png`, `assets/images/android-icon-foreground.png`, `assets/images/android-icon-monochrome.png`

Migraciones generadas:
- `drizzle/0000_black_lockjaw.sql`
- `drizzle/meta/_journal.json`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/migrations.js`

Código:
- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/data/schema.ts`
- `src/data/db.ts`
- `src/data/migraciones.ts`
- `src/data/pruebas/base-en-memoria.ts`
- `src/data/pruebas/base-en-memoria.test.ts`
- `src/textos/app.ts`
- `src/types/sql.d.ts`
- `src/hooks/.gitkeep`, `src/domain/.gitkeep`, `src/services/.gitkeep`, `src/data/tablas/.gitkeep`, `src/data/commands/.gitkeep`, `src/data/queries/.gitkeep`

Pruebas:
- `pruebas/eslint-reglas.test.ts`
- `pruebas/pantallas/inicio.test.tsx`

Eliminados (venían de la plantilla): `app.json`, `scripts/reset-project.js`, `src/app/explore.tsx`, `src/components/**`, `src/constants/theme.ts`, `src/hooks/use-color-scheme*.ts`, `src/hooks/use-theme.ts`, `src/global.css`, imágenes de demo en `assets/images/` (tabIcons, react-logo, expo-logo, expo-badge, logo-glow, tutorial-web).

Generados e ignorados por git (no versionados): `android/`, `node_modules/`, `.expo/`.

Artefactos BMAD:
- `_bmad-output/implementation-artifacts/1-1-proyecto-base-desde-la-plantilla-expo-sdk-57.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-11-04: Implementación de H1.1. Proyecto base Expo SDK 57 con `app.config.ts` y variantes dev/release, stack fijado (Drizzle 0.45, Zod 4.6), esquema con `rastro` y primera migración, ESLint con reglas de capas (más `no-restricted-syntax` para texto dentro de `<Text>`), Jest con base better-sqlite3 en memoria, `npm run verificar` y prebuild/instalación de ambas variantes verificados. Estado → review.
