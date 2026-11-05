---
review: tech-currency
target: ARCHITECTURE-SPINE.md (MoneyTrack v1)
date: 2026-10-19
lens: "Cada decisión comprometida fue verificada en la web / contra la realidad, no afirmada desde memoria"
method: búsquedas web dirigidas + consulta directa al registro npm (dist-tags) + descarga del paquete expo-template-default
---

# Revisión de vigencia tecnológica — MoneyTrack v1

## Veredicto

El stack sigue siendo válido (todas las tecnologías existen y encajan), pero **el pin a Expo SDK 57 quedó desactualizado el mismo día en que se verificó**: SDK 58 salió estable el 15-oct-2026, y la regla del spine ("usar el SDK estable que instale create-expo-app") ya no lleva a un resultado único. Además, la versión de Drizzle "la que fije npm" es ambigua (la documentación oficial manda a instalar `@rc`), y la estrategia de pruebas con "SQLite en memoria" no funciona con expo-sqlite dentro de Jest. Hay que hacer correcciones concretas antes del scaffolding.

## Hallazgos

### H1 — ALTA: Expo SDK 58 ya es estable; el pin "57" y la regla de scaffolding se contradicen

- **Evidencia:**
  - El changelog de Expo publica "Expo SDK 58" el **15-oct-2026** (la beta salió el 15-sep). SDK 58 trae React Native 0.88 y React 19.3.
  - npm `expo`: `latest = 58.0.16`, `sdk-57 = 57.0.30`. En `expo-template-default`, `latest` y `sdk-58` apuntan a `58.0.25`.
  - La página de create-expo-app dice: "sin `--template` crea un proyecto **SDK 57** durante la transición a SDK 58; para SDK 58 usa `--template default@sdk-58`".
  - La entrada `(version)` del memlog del 15-oct dice "SDK 58 en beta". Fue cierta por horas.
- **Impacto:** que el SDK salga 57 o 58 depende del día y de si alguien pasa `--template`. Las historias pueden quedar con SDKs distintos. Si nos quedamos en 57, el proyecto nace un SDK atrás y habrá que migrar en pocos meses (Expo mantiene más o menos los dos o tres últimos SDKs).
- **Cambios de SDK 58 que importan aquí:**
  - `jest-expo` 58 exige **Jest 30**.
  - `File.write()` de expo-file-system pasa a ser **asíncrono**, lo que afecta a la exportación de AD-14.
  - expo-notifications ahora muestra las notificaciones en primer plano por defecto.
  - expo-router rehace su núcleo de navegación.
  - En expo-sqlite se elimina libSQL, que no se usa aquí.
- **Corrección:** elegir de forma explícita y registrar la decisión en el memlog.
  - **Recomendado:** SDK 58, porque el proyecto es greenfield y ya depende de development builds (google-signin no corre en Expo Go), así que la ventaja de "Expo Go compatible" de 57 no aplica. Scaffolding: `npx create-expo-app@latest moneytrack --template default@sdk-58`. Tabla Stack: `Expo SDK 58 (expo ~58.0.16) · React Native 0.88 · React 19.3 · TypeScript ~6.0`.
  - **Alternativa:** quedarse en SDK 57 a propósito, con `--template default@sdk-57` y `expo ≥ 57.0.21` (parche que exige EAS Observe; el mínimo ≥57.0.9 del memlog queda corto).
  - Reemplazar la regla "usar lo que instale create-expo-app" por el comando exacto con `--template`.
- **Fuentes:** https://expo.dev/changelog/sdk-58 · https://expo.dev/changelog · https://docs.expo.dev/more/create-expo/ · `npm view expo dist-tags`

### H2 — MEDIA: Drizzle "la que fije npm" es ambiguo; la documentación oficial manda a la RC 1.0

- **Evidencia:**
  - En npm, `drizzle-orm` tiene `latest = 0.45.4` y `rc = 1.0.0-rc.4`. `drizzle-kit` tiene `latest = 0.31.11` y `rc = 1.0.0-rc.4`.
  - La página oficial "Connect Expo SQLite" instruye `npm i drizzle-orm@rc expo-sqlite@next` y `drizzle-kit@rc`.
  - En la RC, los migradores SQLite se consolidaron (`migrateSync`/`migrateAsync`) y se eliminó RQBv1 en sqlite.
- **Sigue vigente:** el driver `drizzle-orm/expo-sqlite`, `useLiveQuery` con `openDatabaseSync(..., { enableChangeListener: true })`, `useMigrations` desde `drizzle-orm/expo-sqlite/migrator` y `drizzle.config` con `dialect: 'sqlite', driver: 'expo'`.
- **Impacto:** un agente que siga la documentación instala la RC (y `expo-sqlite@next`, que rompe el alineamiento con el SDK). Otro que haga `npm i drizzle-orm` instala 0.45. El resultado son APIs de consultas relacionales y de migración distintas entre historias.
- **Corrección:**
  - Fijar en la tabla Stack `drizzle-orm 0.45.x` + `drizzle-kit 0.31.x` (estables). Si se prefiere la v1, fijar la RC de forma explícita.
  - Prohibir `expo-sqlite@next` y usar siempre `npx expo install expo-sqlite`.
  - Añadir a la sección Migraciones los requisitos de bundling que da la documentación: `babel-plugin-inline-import` con `.sql` en babel.config, y `sourceExts.push('sql')` en metro.config.
- **Fuentes:** https://orm.drizzle.team/docs/connect-expo-sqlite · https://newreleases.io/project/github/drizzle-team/drizzle-orm/release/v1.0.0-rc.4 · `npm view drizzle-orm dist-tags`

### H3 — MEDIA: "Cada comando de data/ se prueba con SQLite en memoria" no funciona tal cual con jest-expo

- **Evidencia:** expo-sqlite es un módulo nativo y no se ejecuta en el entorno Node de Jest. `jest-expo` sigue siendo el preset recomendado (`"preset": "jest-expo"`; en SDK 58 requiere Jest 30), pero no trae SQLite.
- **Impacto:** la primera historia de `data/` se va a topar con esto, y cada agente lo resolverá a su modo (mocks, saltarse pruebas…). Es justo el tipo de divergencia que el spine busca prevenir.
- **Corrección:** fijar la convención así: "Las pruebas de `data/commands` usan `better-sqlite3` en memoria con `drizzle-orm/better-sqlite3`, el mismo `schema.ts` y las migraciones aplicadas con `migrate()`. Los comandos reciben `db` por parámetro (tipado contra la interfaz común de SQLite de Drizzle), no lo importan como singleton". Para `domain/` basta Jest con el preset `jest-expo` o `ts-jest`, sin nada nativo. Agregar `jest`, `@types/jest` (30 si es SDK 58) y `@testing-library/react-native` (no `react-test-renderer`, que está deprecado).
- **Fuentes:** https://docs.expo.dev/develop/unit-testing/ · https://orm.drizzle.team/docs/connect-expo-sqlite

### H4 — MEDIA: @react-native-google-signin — el módulo gratuito ("Original") usa un SDK de Android deprecado; el moderno ("Universal", Credential Manager) es de pago

- **Evidencia:**
  - La librería existe y está vigente: `latest = 16.1.5`.
  - Funciona solo con development build o prebuild (no en Expo Go) y tiene config plugin.
  - Los scopes extra se piden con `scopes` en `configure()` o con `addScopes()`, y `getTokens()` devuelve `accessToken`, que sirve para Drive REST `drive.appdata`.
  - La documentación dice que el módulo Original expone "Legacy Google Sign-In for Android… the underlying SDK is deprecated but remains functional".
  - Universal sign in, que se apoya en Credential Manager y `requestAuthorization` (AuthorizationClient en Android), está "available in the licensed version" (de pago).
  - `react-native-cloud-storage` existe (3.2.0).
- **Impacto:** Google puede retirar el SDK legado durante la vida de la app. Si un agente usa la API Universal, necesitará una licencia que no está presupuestada.
- **Corrección:**
  - Registrar en el Stack: "módulo **Original** (gratuito) de `@react-native-google-signin/google-signin` 16.x; riesgo conocido: SDK legado de Google Sign-In deprecado". El token se obtiene con `getTokens()`; ante un 401, `clearCachedAccessToken()` y reintentar.
  - Mantener todo el inicio de sesión dentro de `services/respaldo` para poder cambiar después a AuthorizationClient (Universal con licencia, o un módulo propio) sin tocar el resto. AD-14 ya aísla el respaldo, así que basta una línea.
- **Fuentes:** https://react-native-google-signin.github.io/docs/setting-up/expo · https://react-native-google-signin.github.io/docs/original · https://react-native-google-signin.github.io/docs/one-tap

### H5 — MEDIA: La verificación de desarrolladores Android afecta a Firebase App Distribution, no solo a "distribuir a otras personas"

- **Evidencia:**
  - Firebase App Distribution sigue distribuyendo APK (ya verificado en el memlog del 19-oct).
  - Las preguntas frecuentes de Google sobre la verificación dicen que el requisito cubre explícitamente los APK entregados a testers por Firebase App Distribution o servicios similares. Solo queda exenta la instalación por `adb`.
  - Existe una cuenta gratuita de "aficionado" (hobbyist) para un número limitado de dispositivos.
  - No se encontró una fecha confirmada de enforcement para Colombia.
- **Impacto:** el Deferred del spine ubica la verificación "antes de distribuir a otras personas". Pero cuando llegue el enforcement a Colombia, también bloquearía el flujo actual del propio usuario (APK → FAD → su celular).
- **Corrección:**
  - Mover a Deferred/AD-16 la nota: "La verificación de desarrollador (o cuenta hobbyist) y el registro del `applicationId` de **ambas** variantes (`.dev` y release) son requisito para seguir instalando vía FAD cuando el enforcement llegue a la región; plan B: `adb install`".
  - Revisar la fecha oficial en developer.android.com antes de la primera entrega.
- **Fuentes:** https://heise.de/-10688972 · https://piefed.jeena.net/post/248531 (repost del blog oficial de Android; confirmar en developer.android.com)

### H6 — BAJA: Gemini — la política de no entrenamiento en el nivel de pago está confirmada; falta precisar el modelo y qué significa "plan de pago"

- **Evidencia:**
  - Los términos de la Gemini API (Paid Services) dicen: "Google doesn't use your prompts or responses to improve our products". Se registran por tiempo limitado solo para abuso.
  - En el nivel gratuito sí se usan los datos para entrenar y hay revisión humana.
  - Modelos vigentes: `gemini-3.8-flash` (estable nuevo) y `gemini-3.6-flash` (generación anterior). `gemini-3-flash-preview` sigue en preview, y `gemini-2.0-flash` está apagado.
- **Impacto:**
  - "Plan de pago" significa **facturación de Cloud activa en el proyecto de la API key**, no una suscripción de la app Gemini (Google AI Pro). El memlog ya registra esta confusión del usuario sin resolverla. Si la clave está en el nivel gratuito, las fotos de facturas sí entran a entrenamiento, lo que viola PRD §8.
  - El nombre de la familia "3.x" es vago y los modelos se retiran.
- **Corrección:**
  - En AD-11/Stack: "`gemini-3.8-flash` (estable; el id del modelo es un ajuste del adaptador, no un literal disperso); la clave debe pertenecer a un proyecto con facturación de Cloud activa; nunca modelos `-preview`".
  - Añadir una verificación manual en la historia de configuración del extractor.
- **Fuentes:** https://ai.google.dev/gemini-api/terms · https://ai.google.dev/gemini-api/docs/models

## Confirmado sin cambios

| Decisión | Estado verificado 2026-10-19 | Fuente |
| --- | --- | --- |
| Plantilla por defecto de create-expo-app incluye Expo Router + TypeScript | Sí. Rutas en **`src/app/`** (`src/app/_layout.tsx`, `index.tsx`), coincide con el spine. Trae `app.json` (no `app.config.ts`): la primera historia debe convertirlo, como exige AD-16. Incluye `scripts/reset-project.js` para limpiar el ejemplo. | paquete `expo-template-default@58.0.25` (npm pack); https://docs.expo.dev/more/create-expo/ |
| jest-expo como preset | Vigente (`sdk-57 = 57.0.6`, `latest = 58.0.11`). SDK 58 ⇒ Jest 30. | https://docs.expo.dev/develop/unit-testing/ |
| expo-local-authentication, expo-secure-store, expo-notifications (programación local) | Publicados para SDK 57 (57.0.3 / 57.0.4 / 57.0.23) y SDK 58. Sin rupturas en secure-store (58 añade `requireConfirmation` en Android). En notifications 58 cambia el comportamiento en primer plano por defecto: AD-13 debe fijar `setNotificationHandler` de forma explícita. | npm dist-tags; https://expo.dev/changelog/sdk-58 |
| Drizzle `useLiveQuery` + `enableChangeListener`, `useMigrations` | Vigentes en la documentación oficial. | https://orm.drizzle.team/docs/connect-expo-sqlite |
| Zod | Vigente, `latest = 4.6.7` (Zod 4). Conviene fijar la major 4 en el Stack. | `npm view zod dist-tags` |
| Firebase App Distribution con APK | Vigente (memlog 19-oct). Ver H5. | memlog |

## Correcciones propuestas a la tabla Stack (resumen)

| Name | Versión propuesta |
| --- | --- |
| Expo SDK | **58** (`expo ~58.0.16`), scaffolding `create-expo-app@latest --template default@sdk-58`. Si se queda en 57: `--template default@sdk-57`, `expo ≥ 57.0.21` |
| React Native / React / TypeScript | 0.88 / 19.3 / ~6.0 (SDK 58) |
| Drizzle | `drizzle-orm 0.45.x`, `drizzle-kit 0.31.x` (no `@rc`, no `expo-sqlite@next`) + `babel-plugin-inline-import` |
| Pruebas | Jest 30 + `jest-expo` 58; `better-sqlite3` + `drizzle-orm/better-sqlite3` para `data/`; `@testing-library/react-native` |
| Google Sign-In | `@react-native-google-signin/google-signin` 16.x, módulo Original (gratuito), riesgo de deprecación anotado |
| IA | `gemini-3.8-flash`, proyecto con facturación de Cloud activa |
| Zod | 4.x |
