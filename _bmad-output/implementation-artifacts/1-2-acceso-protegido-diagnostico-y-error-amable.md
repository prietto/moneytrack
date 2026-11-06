---
baseline_commit: adbab6da34ec55c9d9c584d461a743f449d34c17
---

# Story 1.2: Acceso protegido, diagnóstico y error amable

Status: done

<!-- Nota: la validación es opcional. Ejecutar validate-create-story para un control de calidad antes de dev-story. -->

## Story

Como Priettos,
quiero que la app me pida la huella o el bloqueo del teléfono antes de mostrar cualquier dato, y que los fallos se muestren con amabilidad y queden registrados,
para que nadie con mi celular desbloqueado vea mis finanzas y yo pueda reconstruir cualquier error.

**Requisitos:** NFR1, NFR5, NFR6, UX-DR1, UX-DR13; AD-15, AD-17, AD-23. Cierra además el primer ítem de `deferred-work.md` (apertura de la base y fallo de migración sin registro ni reintento), que el code review de H1.1 asignó a esta historia.

## Acceptance Criteria

1. **Bloqueo al abrir (AD-15, UX-DR1).** Dado la app cerrada, cuando Priettos la abre, entonces `expo-local-authentication` exige biometría o el bloqueo del teléfono **antes** de montar cualquier pantalla con datos (el `<Stack />` de Expo Router no se monta hasta desbloquear). Si la autenticación falla o se cancela, se muestra una pantalla sin datos con la opción de reintentar.
2. **Bloqueo al volver (AD-15).** Dado la app en segundo plano, cuando vuelve a primer plano después de **más de 5 minutos**, entonces se exige de nuevo la autenticación; si vuelve antes de 5 minutos (o exactamente a los 5:00), no se exige.
3. **Log rotativo sin datos sensibles (AD-23).** Dado `services/log` con `info`, `aviso` y `error`, cuando se registran más de 500 entradas, entonces el buffer local conserva solo las 500 más recientes, y cada entrada lleva solo ids, operación y error: nunca montos, comercios, fotos ni secretos.
4. **ErrorBoundary raíz (UX-DR13, AD-17, AD-23).** Dado un error no controlado en una pantalla, cuando el ErrorBoundary raíz lo captura, entonces muestra un mensaje amable con la Voz del socio, tomado de `src/textos/`, sin detalles técnicos, y registra el error con `services/log.error`.
5. **`Resultado<T>` (AD-23).** Dado el tipo `Resultado<T> = {ok: true, valor} | {ok: false, error}`, cuando un servicio falla, entonces devuelve `{ok: false, error}` y no lanza la excepción hacia `src/app/`.
6. **`formatearDinero` (NFR6, AD-7).** Dado `src/textos/`, existe `formatearDinero(monto)`, que devuelve COP sin decimales con punto como separador de miles (`1350000` → `"1.350.000"`), probado incluso con negativos y con 0.
7. **Base y migraciones con diagnóstico (deferred de H1.1).** Si abrir la base o aplicar las migraciones falla, la app no se cae antes de montar el layout: muestra `textosApp.errorMigracion` con un botón para reintentar y registra el fallo con `log.error`.

## Tasks / Subtasks

- [x] **T1. `Resultado<T>` en `domain/`** (AC: 5)
  - [x] Crear `src/domain/resultado.ts`: `export type Resultado<T, E = string> = { ok: true; valor: T } | { ok: false; error: E };` más los constructores puros `ok(valor)` y `fallo(error)`. El error es un **código** (unión de literales por servicio, p. ej. `'cancelado' | 'sinBloqueo'`), nunca un `Error` con texto libre: así no viajan datos ni detalles técnicos hacia `app/`.
  - [x] Vive en `domain/` porque todas las capas pueden importarlo (`data/` solo tipos, AD-1). Es puro: nada de `Date`, React ni Expo; borrar `src/domain/.gitkeep`.
  - [x] `src/domain/resultado.test.ts`: los constructores y el estrechamiento por `ok`.
- [x] **T2. `formatearDinero` en `textos/`** (AC: 6)
  - [x] `src/textos/dinero.ts`: `export function formatearDinero(monto: number): string`. Implementación manual, **sin `Intl` ni `toLocaleString`** (el ICU de Hermes en Android y el de Node en Jest pueden diferir): signo `-` (guion ASCII) si `monto < 0`, `Math.abs(monto).toString()` y `replace(/\B(?=(\d{3})+(?!\d))/g, '.')`. Sin símbolo `$` (lo pone el texto que lo use, si lo necesita).
  - [x] Precondición AD-7: el monto es un entero de pesos. Si `!Number.isSafeInteger(monto)` (decimales, `NaN`, `Infinity`), lanzar `RangeError('formatearDinero espera un entero de pesos')` **sin incluir el valor** en el mensaje. Es un error de programación: el ErrorBoundary lo muestra amable y lo registra; nunca se redondea en silencio.
  - [x] `-0` → `"0"` (no `"-0"`).
  - [x] `src/textos/dinero.test.ts` con, como mínimo: `0`→`"0"`, `-0`→`"0"`, `5`, `999`→`"999"`, `1000`→`"1.000"`, `1350000`→`"1.350.000"`, `-1350000`→`"-1.350.000"`, `-500`→`"-500"`, `1000000000`→`"1.000.000.000"`, `Number.MAX_SAFE_INTEGER`→`"9.007.199.254.740.991"`, y que `1.5`, `NaN` e `Infinity` lanzan `RangeError`.
- [x] **T3. `services/log`** (AC: 3)
  - [x] `src/services/log.ts` con una fábrica testeable y una instancia por defecto:
    - `crearLog({ almacen, ahora, capacidad = 500 })`, donde `almacen: { leer(): string | null; escribir(contenido: string): void }` y `ahora: () => string` (ISO 8601 UTC, AD-8: `() => new Date().toISOString()`).
    - Devuelve `{ info, aviso, error, entradas }`. Firma de los tres niveles: `(operacion: string, detalle?: { ids?: Record<string, string>; error?: unknown }) => void`. **No hay campo libre** (`datos`, `mensaje`, `extra`): la forma del API es la que impide registrar montos o comercios (AC 3).
    - Entrada: `{ fecha: string; nivel: 'info' | 'aviso' | 'error'; operacion: string; ids?: Record<string, string>; error?: { nombre: string; mensaje: string; pila?: string } }`. `operacion` con forma `capa.accion` (p. ej. `'migraciones.aplicar'`, `'biometria.autenticar'`, `'app.errorBoundary'`).
    - Saneo del `error` (`unknown`): `nombre` = `error.name` o `'NoEsError'`; `mensaje` truncado a 300 caracteres y con las cifras tapadas (`/\d{1,3}(?:[.,]\d{3})+|\d{4,}/g` → `'[n]'`, defensa extra por si un mensaje trae un monto); `pila` = primeras 10 líneas de `error.stack` (solo ubicaciones de código, sin datos). Si no es un `Error`, no se serializa el valor (podría ser un objeto con montos): solo `{ nombre: 'NoEsError', mensaje: typeof error }`.
    - Buffer FIFO: al pasar de `capacidad`, se descartan las más antiguas. `entradas()` devuelve una **copia** en orden de la más antigua a la más reciente (la usará la exportación del diagnóstico, H7.1).
    - Carga perezosa: en la primera llamada a cualquier método se lee `almacen.leer()`, se hace `JSON.parse` y se validan la forma (array) y el tamaño (se queda con las últimas `capacidad`). Si el archivo no existe → buffer vacío; si está corrupto → buffer vacío y una entrada `aviso('log.archivoIlegible')`.
    - Persistencia: tras cada entrada, `almacen.escribir(JSON.stringify(buffer))` (síncrono; el volumen del log es bajo y así sobrevive a un cierre forzado justo después de un error).
    - **El log nunca lanza**: todo acceso al almacén va en `try/catch` y un fallo de escritura se ignora en silencio (no hay a dónde registrarlo, y `console` está prohibido).
  - [x] Instancia por defecto `export const log = crearLog({ almacen: almacenEnArchivo, ahora: () => new Date().toISOString() })`, con `almacenEnArchivo` sobre la API nueva de `expo-file-system` 57: `const archivo = new File(Paths.document, 'moneytrack-log.json')`; `leer`: `archivo.exists ? archivo.textSync() : null`; `escribir`: `if (!archivo.exists) archivo.create(); archivo.write(contenido)`. Crear el `File` dentro de las funciones (o de forma perezosa), no al importar el módulo, para que importar `log` en Jest no toque el módulo nativo. `Paths.document` y no `Paths.cache` (el sistema puede vaciar la caché). Cada variante (dev/release) es otra app, así que cada una tiene su propio archivo.
  - [x] `instalarRegistroDeErroresGlobales()`: envuelve `ErrorUtils.getGlobalHandler()` (global tipado por React Native) con uno que registra `log.error(esFatal ? 'app.errorFatal' : 'app.errorNoControlado', { error })` y luego llama al manejador anterior (no lo reemplaza: en desarrollo sigue la pantalla roja). Idempotente (una bandera interna). Así quedan registrados también los errores fuera del render (manejadores de eventos, timers), que el ErrorBoundary no captura.
  - [x] `src/services/log.test.ts` (con un almacén en memoria y un `ahora` fijo): 501 entradas → quedan 500 y la primera se descartó; el orden; `entradas()` devuelve copia; persistencia tras cada entrada; carga desde un almacén con contenido previo, vacío y corrupto; un almacén que lanza al escribir no rompe el log; el saneo (mensaje con `1.350.000` → `[n]`, truncado a 300, pila a 10 líneas, un no-`Error` no se serializa); los tres niveles; y el manejador global (registra y encadena al anterior, idempotente).
  - [x] Borrar `src/services/.gitkeep`.
- [x] **T4. `services/biometria`** (AC: 1, 2, 5)
  - [x] `src/services/biometria.ts` (nombre del spine, Structural Seed):
    - `export type ErrorAcceso = 'cancelado' | 'sinBloqueo' | 'bloqueoTemporal' | 'fallo';`
    - `autenticar(mensajes: { promptMessage: string; cancelLabel: string }): Promise<Resultado<void, ErrorAcceso>>`. Los textos llegan por parámetro porque `services/` no importa `textos/` (diagrama de capas del spine).
    - Primero `getEnrolledLevelAsync()`: si es `SecurityLevel.NONE` → `fallo('sinBloqueo')` sin abrir el diálogo. Luego `authenticateAsync({ promptMessage, cancelLabel, disableDeviceFallback: false })`: con `disableDeviceFallback: false` se acepta el PIN, patrón o contraseña del teléfono (AD-15: "biometría **o** el bloqueo del teléfono"). Dejar `biometricsSecurityLevel` en su valor por defecto (`'weak'`).
    - Mapeo de `LocalAuthenticationError` (57.0.3): `user_cancel | system_cancel | app_cancel | user_fallback` → `'cancelado'`; `not_enrolled | passcode_not_set | not_available` → `'sinBloqueo'`; `lockout` → `'bloqueoTemporal'`; el resto (`authentication_failed`, `timeout`, `unknown`, `unable_to_process`, `no_space`, `invalid_context`) → `'fallo'`.
    - Cualquier excepción del módulo nativo se atrapa: `log.error('biometria.autenticar', { error })` y `fallo('fallo')`. **Nunca lanza** (AC 5). Los fallos esperados (cancelar, `sinBloqueo`) se registran como `aviso` con el código como operación (p. ej. `'biometria.sinBloqueo'`), sin más datos.
    - Función pura `requiereAutenticacion(desdeMs: number | null, ahoraMs: number): boolean` = `desdeMs !== null && ahoraMs - desdeMs > UMBRAL_REAUTENTICACION_MS`, con `export const UMBRAL_REAUTENTICACION_MS = 5 * 60 * 1000`. **Estrictamente mayor** ("más de 5 minutos").
  - [x] `src/services/biometria.test.ts` con `jest.mock('expo-local-authentication')` (y `jest.mock('@/services/log')` o un espía): éxito → `ok`; cada familia de códigos → su `ErrorAcceso`; `SecurityLevel.NONE` → `sinBloqueo` sin llamar a `authenticateAsync`; `authenticateAsync` que lanza → `{ok: false, error: 'fallo'}` sin propagar y con `log.error`; que se pasa `disableDeviceFallback: false`. `requiereAutenticacion`: `null` → false; 4:59 → false; **5:00 exactos → false**; 5:00 + 1 ms → true.
- [x] **T5. Hook `useAcceso`** (AC: 1, 2)
  - [x] `src/hooks/use-acceso.ts`: `useAcceso(mensajes) → { estado: 'bloqueado' | 'verificando' | 'desbloqueado'; error?: ErrorAcceso; cubierto: boolean; haDesbloqueado: boolean; desbloquear: () => void }`.
    - Al montar: `estado = 'bloqueado'` y lanza `desbloquear()` automáticamente una vez (el diálogo aparece sin un toque extra; cuenta para los ≤ 5 s de NFR9).
    - `desbloquear()`: si ya hay un intento en curso, no hace nada (ref `autenticandoRef`); pasa a `'verificando'`, llama `autenticar(mensajes)`; con `ok` → `'desbloqueado'`, `haDesbloqueado = true`, `cubierto = false`; con fallo → `'bloqueado'` y `error` = el código. Nunca vuelve a lanzar el diálogo solo tras un fallo o cancelación: espera el toque en "Desbloquear" (evita un bucle de diálogos si el usuario cancela).
    - `AppState.addEventListener('change', …)` (quitarlo con `.remove()` al desmontar):
      - `'background'` con `estado === 'desbloqueado'` y **sin** intento en curso → guarda `desdeMsRef = Date.now()` y `cubierto = true` (cubre el contenido al instante, para que al volver no se vea ni un cuadro de datos antes de decidir).
      - `'active'` sin intento en curso → si `requiereAutenticacion(desdeMsRef, Date.now())` → `estado = 'bloqueado'` y `desbloquear()` automático; si no → `cubierto = false`. En ambos casos `desdeMsRef = null`.
      - Ignorar `'inactive'` y **todo evento mientras `autenticandoRef` es true**: en Android, el PIN/patrón del teléfono abre otra actividad y la app recibe `background`/`active`; sin este guardia, la autenticación misma dispararía otra autenticación.
    - El hook no guarda datos ni cifras; es solo el estado del acceso. `Date.now()` está permitido fuera de `domain/`.
  - [x] `src/hooks/use-acceso.test.ts(x)` con `renderHook` de `@testing-library/react-native`, `jest.mock('@/services/biometria')` (manteniendo el `requiereAutenticacion` real con `jest.requireActual`), un espía de `AppState.addEventListener` que capture el manejador, y `jest.useFakeTimers()` + `jest.setSystemTime()` para mover el reloj. Casos: arranque → un solo intento automático; éxito → desbloqueado; cancelado → bloqueado con `error: 'cancelado'` y sin nuevo intento automático; `desbloquear()` doble → una sola llamada; background → `cubierto`; vuelta a los 4 min → descubierto sin autenticar; vuelta a los 5 min + 1 ms → bloqueado y nuevo intento; eventos durante un intento en curso → ignorados; desmontar → `remove()` llamado.
- [x] **T6. Textos con la Voz del socio** (AC: 1, 4, 7)
  - [x] `src/textos/acceso.ts` (`textosAcceso`): `dialogo: { promptMessage, cancelLabel }`, `titulo`, `bloqueado` (estado inicial y tras volver), `reintentar` (botón "Desbloquear") y un mensaje por `ErrorAcceso`: `cancelado`, `sinBloqueo` (explica que el celular necesita huella o bloqueo de pantalla y que se configura en los ajustes del teléfono), `bloqueoTemporal` (demasiados intentos, esperar un momento) y `fallo`. Propuesta de tono: "Confirma que eres tú para ver tus finanzas.", "Tus finanzas están protegidas. Desbloquea para verlas.", "Tu celular no tiene huella ni bloqueo de pantalla. Configura uno en los ajustes del teléfono y vuelve a intentarlo."
  - [x] `src/textos/errores.ts` (`textosError`): `titulo`, `mensaje` y `reintentar` para el ErrorBoundary. Honesto, amable, sin jerga ni culpa, y sin detalles técnicos. Propuesta: "Algo falló de mi lado." / "Lo que ya guardaste sigue a salvo. Toca Reintentar; si vuelve a pasar, cierra la app y ábrela de nuevo." (Es verdad: las escrituras son transaccionales, AD-3.)
  - [x] En `src/textos/app.ts` agregar `reintentar` para la pantalla de error de migración. Mantener `nombreApp`, `preparandoDatos` y `errorMigracion` (los usa la prueba de humo de H1.1).
  - [x] Ningún texto lleva cifras; si algún día las lleva, reciben valores ya formateados por `formatearDinero()` (AD-17).
- [x] **T7. Base perezosa y migraciones con reintento** (AC: 7)
  - [x] `src/data/db.ts`: reemplazar el `openDatabaseSync` al importar el módulo por `export function obtenerDb()` memoizada (abre `openDatabaseSync('moneytrack.db', { enableChangeListener: true })` y `drizzle(expoDb, { schema })` en la primera llamada). `export type BaseDeDatos = ReturnType<typeof obtenerDb>`. Quitar `export const db` (hoy nadie lo importa fuera de `db.ts`; verificar con `grep -rn "data/db" src pruebas`). H1.3 usará `obtenerDb()`.
  - [x] `src/data/migraciones.ts`: reescribir `useMigraciones()` sin `useMigrations` de drizzle (no permite reintentar): `useEffect` que llama `migrate(obtenerDb(), migrations)` de `drizzle-orm/expo-sqlite/migrator` (exportado en 0.45.4, y transaccional: `BEGIN`/`COMMIT`/`ROLLBACK`, así que reintentar es seguro) dentro de `try/catch`, con un contador `intento` en las dependencias. Devuelve `{ exito: boolean; error?: Error; reintentar: () => void }`; `reintentar` limpia el error y vuelve a intentar. `obtenerDb()` va **dentro** del `try`, para que un fallo al abrir la base también caiga aquí. Cuidar que un efecto que termina después de desmontar no actualice estado.
  - [x] `useMigraciones()` **no** registra: el diagrama del spine tiene `services → data`, no `data → services`. Devuelve el `error` y quien registra es el layout (`src/app/_layout.tsx`) con `log.error('migraciones.aplicar', { error })` en un `useEffect` cuando cambia `error`. `data/` no importa `services/`.
  - [x] Actualizar `deferred-work.md`: marcar el primer ítem (`src/data/db.ts:7` / migraciones) como resuelto en H1.2.
- [x] **T8. Layout raíz: ErrorBoundary, bloqueo y migraciones** (AC: 1, 2, 4, 7)
  - [x] `src/components/error-amable.tsx`: pantalla con `textosError.titulo`, `textosError.mensaje` y un botón `textosError.reintentar` que llama `onReintentar`. Nunca muestra `error.message` ni la pila.
  - [x] `src/components/pantalla-bloqueo.tsx`: fondo opaco que ocupa toda la pantalla (`StyleSheet.absoluteFill` cuando se usa como capa), sin ningún dato; muestra `textosAcceso.titulo`, el mensaje según `error` (o `bloqueado` si no hay error), un indicador mientras `estado === 'verificando'`, y el botón `textosAcceso.reintentar` (deshabilitado mientras verifica) que llama `desbloquear()`.
  - [x] `src/app/_layout.tsx`:
    - `export function ErrorBoundary({ error, retry }: ErrorBoundaryProps)` (tipo de `expo-router`): registra `log.error('app.errorBoundary', { error })` en un `useEffect` y renderiza `<ErrorAmable onReintentar={retry} />`. Verificado en `expo-router` 57.0.29 (`build/useScreens.js`): el `ErrorBoundary` exportado por una ruta envuelve **también al propio componente del layout** (`<Try catch={ErrorBoundary}>`), así que captura errores del render de `RootLayout` y de todas las pantallas hijas. `Try` no tiene `componentDidCatch`: el registro tiene que hacerlo el componente `ErrorBoundary`. El boundary se renderiza **fuera** del layout: no puede depender de nada que el layout provea.
    - Llamar `instalarRegistroDeErroresGlobales()` una vez a nivel de módulo.
    - `RootLayout`: `const acceso = useAcceso(textosAcceso.dialogo)` y `const migraciones = useMigraciones()` (las migraciones corren en paralelo al diálogo: no muestran datos). Orden de render:
      1. `!acceso.haDesbloqueado` → `<PantallaBloqueo … />` sola. El `<Stack />` **no se monta** (AC 1: ninguna pantalla con datos antes de desbloquear).
      2. `migraciones.error` → pantalla con `textosApp.errorMigracion` y botón `textosApp.reintentar` → `migraciones.reintentar()`. Registrar con `log.error` (ver T7).
      3. `!migraciones.exito` → indicador con `textosApp.preparandoDatos` (como hoy).
      4. Si no → `<Stack />` y, encima, `<PantallaBloqueo …/>` como capa absoluta cuando `acceso.estado !== 'desbloqueado' || acceso.cubierto`. Al re-bloquear se cubre en lugar de desmontar, para conservar la navegación.
  - [x] Pruebas en `pruebas/pantallas/layout.test.tsx` (las pruebas de `src/app/` viven fuera de esa carpeta, convención de H1.1). Mockear `@/hooks/use-acceso`, `@/data/migraciones` (no cargar `expo-sqlite` en Jest), `@/services/log` y `expo-router` (`Stack` como un componente con `testID`). Casos: bloqueado → se ve la pantalla de bloqueo y **no** el `Stack`; desbloqueado + migraciones OK → `Stack`; desbloqueado y luego `estado: 'bloqueado'` o `cubierto: true` → `Stack` y capa de bloqueo a la vez; error de migración → texto de error + reintentar llama `reintentar` + `log.error`. `ErrorBoundary` renderizado con `error = new Error('detalle técnico 1.350.000')`: muestra `textosError.mensaje`, **no** muestra `'detalle técnico'`, llama `log.error('app.errorBoundary', …)` y el botón llama `retry`.
  - [x] Pruebas de componentes junto al archivo (`src/components/pantalla-bloqueo.test.tsx`, `error-amable.test.tsx`), sin texto literal en JSX (la regla de AD-17 cubre `src/components/**`, pruebas incluidas): mensaje por cada `ErrorAcceso`, botón deshabilitado al verificar.
- [x] **T9. Verificación en el dispositivo** (AC: 1, 2, 4, 7)
  - [x] `expo-local-authentication` ya está en el build de desarrollo de H1.1 y su `AndroidManifest.xml` declara `USE_BIOMETRIC` y `USE_FINGERPRINT`: **no** hace falta agregar su config plugin a `app.config.ts` (solo configura Face ID de iOS, y el proyecto es solo Android). Si por cualquier motivo se regenera `android/`, se hace con `npx expo prebuild`, nunca a mano (AD-16).
  - [x] En el emulador `Pixel_8_Pro_API_35` (variante `dev`): configurar un PIN y una huella en Ajustes del emulador; abrir la app → diálogo; `adb -e emu finger touch 1` → entra. Cancelar → pantalla de bloqueo con "Desbloquear". Mandar a segundo plano < 5 min → vuelve sin pedir; > 5 min → pide de nuevo (para no esperar, se puede bajar el umbral **temporalmente** en una copia local y revertir; nunca dejarlo cambiado). Sin PIN configurado → mensaje `sinBloqueo`.
  - [x] Forzar un error de render temporal (p. ej. `throw` en `src/app/index.tsx`) → pantalla amable sin detalles; revertir. Comprobar que `moneytrack-log.json` tiene la entrada (`adb shell run-as com.priettos.moneytrack.dev cat files/moneytrack-log.json`) y que no contiene montos.
  - [x] Trampa conocida de H1.1: Gradle pide JDK 17 y el perfil exporta `JAVA_HOME` de Java 11; si hay que compilar, usar `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64` solo en ese comando.
- [x] **T10. Cierre**
  - [x] `npm run verificar` en verde (hoy: 103 pruebas en verde antes de empezar). Sin `console`, sin texto literal en `src/app/**` ni `src/components/**`.
  - [x] Llenar "Dev Agent Record" con la lista de archivos y cualquier desvío.

### Review Findings

- [x] [Review][Patch] Saneo del mensaje de error insuficiente (AD-23): cortar el mensaje en `params:` (Drizzle trae montos y comercios en claro) y ampliar `CIFRAS` a separadores de espacio y NBSP [src/services/log.ts:43,59]
- [x] [Review][Patch] Las líneas de la pila que empiezan con "at " no se tapan ni se truncan, aunque vengan del mensaje (`new Error("x\n  at 1350000 pesos")` queda en claro) [src/services/log.ts:45,67]
- [x] [Review][Patch] `error.name` se guarda sin tapar cifras ni truncar; el respaldo es `'Error'` y no `'NoEsError'` como dice T3 [src/services/log.ts:57]
- [x] [Review][Patch] Un archivo de log vacío (crash entre `create()` y `write()`) se trata como ilegible en vez de como buffer vacío [src/services/log.ts:96-104]
- [x] [Review][Patch] Al cargar el log no se validan las entradas: cualquier array (`[null, 5]`) llega tal cual a `entradas()` (H7.1) [src/services/log.ts:99]
- [x] [Review][Patch] Si `autenticar` rechaza o el `.then` lanza, `autenticandoRef` queda en `true` para siempre: la app queda bloqueada en "verificando" [src/hooks/use-acceso.ts:58]
- [x] [Review][Patch] Si el reloj del teléfono se atrasa con la app en segundo plano, la diferencia es negativa y no se pide la reautenticación; una diferencia negativa debe exigirla [src/services/biometria.ts:71]
- [x] [Review][Patch] En iOS, VoiceOver puede leer el `Stack` tapado (`importantForAccessibility` solo aplica en Android); faltan `accessibilityElementsHidden` y `accessibilityViewIsModal` [src/app/_layout.tsx:66]
- [x] [Review][Patch] El botón atrás de Android llega al `Stack` bajo la capa de bloqueo (saca pantallas o la app); falta un `BackHandler` mientras está tapado [src/app/_layout.tsx:63-72]
- [x] [Review][Patch] La prueba "desmontado" de `useMigraciones` pasa aunque se quite el guardia `vigente` (`result.current` se congela al desmontar) [src/data/migraciones.test.tsx:59-65]
- [x] [Review][Defer] Miniatura de "recientes" (Android) y snapshot en `inactive` (iOS) muestran datos [src/hooks/use-acceso.ts:89,104] — deferred, fuera de alcance por decisión de la historia (sin FLAG_SECURE)
- [x] [Review][Defer] La capa de bloqueo no tapa ventanas nativas (`presentation: 'modal'`/`formSheet`, `Modal`, `Alert`) [src/app/_layout.tsx:63-69] — deferred, ninguna pantalla las usa todavía
- [x] [Review][Defer] Los rechazos de promesas no controlados no se registran (el manejador global solo ve errores síncronos) [src/services/log.ts:173] — deferred, los servicios devuelven `Resultado<T>`
- [x] [Review][Defer] El log reescribe el archivo completo de forma síncrona y no atómica en cada entrada (~1,5 MB con el buffer lleno; un kill a mitad lo deja ilegible) [src/services/log.ts:109-160] — deferred, decisión de T3; revisar con volumen real
- [x] [Review][Defer] Reglas ESLint de AD-17, de pureza de domain/ y de AD-3 con huecos y falsos positivos [eslint.config.js] — deferred, pre-existente (H1.1)
- [x] [Review][Defer] Las pantallas de error de migración y de carga no fijan colores, y la app usa `userInterfaceStyle: 'automatic'` [src/app/_layout.tsx:46-51] — deferred, el tema llega con H1.4

#### Segunda pasada (2026-11-05)

- [x] [Review][Defer] El guardia contra el reloj atrasado se puede burlar en parte: solo detecta `ahora < desde`, así que atrasarlo menos que el tiempo transcurrido evita la huella [src/services/biometria.ts:72-74] — deferred, exige tener el teléfono desbloqueado y cambiar la hora a mano; cerrarlo requiere un módulo nativo con `elapsedRealtime`. El límite se documenta en el comentario y en las Decisiones
- [x] [Review][Patch] La pila conserva líneas del mensaje: un valor con "\n at …" corta antes el saneo de `params:`; una línea `at X:1:2` del mensaje pasa como ubicación; un mensaje largo desplaza las ubicaciones fuera de las 10 líneas. Reconstruir `pila` solo con las ubicaciones de código, ya que el mensaje saneado está en `mensaje` [src/services/log.ts:46,80-86]
- [x] [Review][Patch] En el mensaje, `params:` se corta solo hasta un "\n at"; debe cortarse hasta el final. Tapar también los literales de texto SQL (`'…'`) de un `Failed query:` [src/services/log.ts:53,74]
- [x] [Review][Patch] `esEntradaLog` no valida `ids` ni `error` y conserva claves extra (`monto`); reconstruir cada entrada solo con las claves conocidas [src/services/log.ts:56-64]
- [x] [Review][Patch] El `BackHandler` también se traga el botón atrás en la primera pantalla de bloqueo (sin `Stack`); con `sinBloqueo` el usuario queda atrapado. Limitarlo a `haDesbloqueado` [src/app/_layout.tsx:43-47]
- [x] [Review][Patch] Si se re-bloquea mientras se ve el error de migración o la carga, no se dibuja la capa: no hay "Desbloquear" tras cancelar, y "Reintentar" funciona bloqueado [src/app/_layout.tsx:54-69]
- [x] [Review][Patch] El teclado y un `TextInput` enfocado sobreviven al tapado (el teclado es otra ventana); llamar `Keyboard.dismiss()` al tapar [src/app/_layout.tsx:43]
- [x] [Review][Patch] El `.catch` de `desbloquear` descarta el motivo sin registrarlo (AD-23) [src/hooks/use-acceso.ts:57]
- [x] [Review][Patch] Faltan pruebas de `accessibilityViewIsModal` (capa) y de `importantForAccessibility` (Android) [src/components/pantalla-bloqueo.test.tsx, pruebas/pantallas/layout.test.tsx]
- [x] [Review][Patch] Documentar los desvíos de la primera pasada: el reloj atrasado ya no cumple el "5 min estricto" de las Decisiones, y la carga conserva las entradas válidas en lugar de "corrupto → vacío" (T3). Actualizar también las líneas citadas en `deferred-work.md` [historia: Decisiones / Dev Agent Record; deferred-work.md]
- [x] [Review][Defer] Un error transitorio al leer el log (no de parseo) deja el buffer vacío, y la siguiente escritura borra el historial [src/services/log.ts:109-127] — deferred, raro; considerar reintentar la lectura o apartar el archivo
- [x] [Review][Defer] Las actividades que abre la propia app (`expo-image-picker`, compartir) mandan `background`: cubren la pantalla y re-bloquean si tardan más de 5 min [src/hooks/use-acceso.ts:89-92] — deferred, llega con la historia de fotos
- [x] [Review][Defer] Los `BackHandler` son LIFO: una pantalla que registre el suyo mientras está tapado corre antes que el del layout [src/app/_layout.tsx:45] — deferred, ninguna pantalla registra uno todavía
- [x] [Review][Defer] `@types/node` `^26.6.6` con Node 20.19 en local [package.json:34] — deferred, viene de H1.1

## Dev Notes

### Qué es y qué no es esta historia

- Es transversal: acceso, diagnóstico, errores entre capas y el formato del dinero. No hay lógica de negocio ni tablas nuevas.
- **Fuera de alcance:** `services/reloj`, `useHoy`, `useEstado`, `ejecutar()`, `Hechos`, `calcularEstado` y el helper del rastro (H1.3); navegación base, títulos de pantalla y pantalla principal (H1.4); exportar el log desde Ajustes (H1.8 / H7.1: aquí solo se deja `log.entradas()` listo); `formatearMillones` (H3.2); `FLAG_SECURE` o tapar la miniatura de "recientes" de Android (no lo pide AD-15; no agregar dependencias para eso); Crashlytics u otro reporte remoto (Deferred del spine: solo diagnóstico local).
- **No agregar dependencias.** Todo lo necesario ya está instalado desde H1.1: `expo-local-authentication` 57.0.3, `expo-file-system` 57.0.7, `expo-router` 57.0.29, `drizzle-orm` 0.45.4, `@testing-library/react-native` 14.1.0. Nada de `expo-dev-client`, librerías de UI ni de logging.

### Estado actual de los archivos que se modifican

| Archivo | Hoy | Cambia | Preservar |
| --- | --- | --- | --- |
| `src/app/_layout.tsx` | `useMigraciones()`; error → texto `errorMigracion`; cargando → `ActivityIndicator` con `accessibilityLabel={textosApp.preparandoDatos}`; éxito → `<Stack />`. Comentario "El registro técnico… llega con services/log (H1.2)". | Agrega `ErrorBoundary`, `useAcceso`, capa de bloqueo, reintento y `log.error`. Quitar el comentario pendiente. | Sin texto literal; `Stack` solo tras migrar. |
| `src/data/db.ts` | `openDatabaseSync` **al importar** + `export const db`, `BaseDeDatos`. | `obtenerDb()` perezosa. | `enableChangeListener: true` (lo necesita `useLiveQuery` en H1.3); nombre `moneytrack.db`. |
| `src/data/migraciones.ts` | `useMigrations(db, migrations)` → `{ exito, error }`. | `migrate()` propio con `reintentar`. | Firma `{ exito, error }` (+ `reintentar`); `import migrations from '../../drizzle/migrations'`. |
| `src/textos/app.ts` | `nombreApp`, `preparandoDatos`, `errorMigracion`. | + `reintentar`. | Las tres claves (las usa `pruebas/pantallas/inicio.test.tsx`). |

No se tocan `eslint.config.js`, `jest.config.js`, `app.config.ts` ni `package.json`. La prueba `src/data/pruebas/base-en-memoria.test.ts` comprueba que `drizzle/migrations.js` está sincronizado con el journal: no se generan migraciones en esta historia.

### Capas y lint (ya vigentes desde H1.1; no aflojarlos)

- `src/app/` → `hooks/`, `textos/`, `components/`, y `services/log` solo para registrar. Nunca `drizzle-orm`, `@/data/db`, `@/data/schema` ni `expo-sqlite` (lint AD-3).
- `src/hooks/` une `services/` y `data/`; `src/services/` puede importar `domain/` (p. ej. `Resultado`); **`data/` no importa `services/`** (por eso el layout registra el error de migración, T7).
- `src/domain/resultado.ts` es puro: el lint de `domain/` prohíbe `Date`, React, Expo, `globalThis`, etc.
- `no-console` global: el único registro es `services/log`. No hay "fallback" a `console` si falla el archivo.
- AD-17 en `src/app/**` **y** `src/components/**`: texto literal en JSX, en ternarios/`&&`/concatenaciones, y en `title`, `placeholder`, `accessibilityLabel`, `accessibilityHint` y `Alert.alert` falla. Todo sale de `src/textos/` como `{textosX.clave}`.
- Las rutas de `src/app/` son archivos de Expo Router: no poner componentes auxiliares ni pruebas dentro; los componentes van en `src/components/` (kebab-case) y las pruebas de rutas en `pruebas/pantallas/`.

### Decisiones fijadas en esta historia

- **Umbral de 5 min estricto** (`>`), contado desde el evento `background`. "Al abrir la app" = cada arranque en frío. *(Code review)* Si el reloj quedó antes de la marca (lo atrasaron), también se pide. Límite conocido: se mide con el reloj de pared, así que atrasarlo menos que el tiempo transcurrido evita la huella. Cerrarlo requiere un reloj monótono que cuente el sueño profundo (`elapsedRealtime`), sin API en Expo: diferido en `deferred-work.md`.
- **Se acepta el bloqueo del teléfono** como alternativa a la biometría (`disableDeviceFallback: false`). En Android, con credencial del dispositivo permitida, el sistema puede ignorar `cancelLabel`: no depender de él.
- **Celular sin ningún bloqueo:** la app no entra y lo dice (`sinBloqueo`). No hay "modo sin protección" ni bypass en la variante `dev` (en el emulador se configura un PIN y una huella).
- **Primer arranque:** montar el `Stack` solo tras desbloquear. **Re-bloqueo:** capa opaca encima del `Stack` (no se pierde la navegación) y cubierta inmediata al pasar a segundo plano.
- **Errores como códigos**, no como `Error`: `Resultado<T, E = string>` con `E` = unión de literales por servicio.
- **Log en archivo** `Paths.document/moneytrack-log.json` (no en SQLite: el log no es un hecho de AD-2, no va en `MoneyTrackExport`, y `services/` no escribe en la base salvo por comandos).
- **`formatearDinero` estricto:** solo enteros seguros; lanza `RangeError` en otro caso. Guion ASCII para negativos, sin `$`, sin `Intl`.

### Trampas conocidas

- **Bucle de autenticación en Android:** el PIN del teléfono abre otra actividad → `AppState` pasa a `background` y luego a `active`. Ignorar los eventos mientras hay un intento en curso (T5).
- **Diálogos en cadena:** tras cancelar, no relanzar solo; esperar el toque en "Desbloquear".
- **React Compiler activo** (`experiments.reactCompiler: true` en `app.config.ts`): no leer ni escribir `ref.current` durante el render; solo en efectos y manejadores. El intento automático al montar debe ser idempotente (guardado por `autenticandoRef`), por si un efecto corre dos veces en desarrollo.
- **`ErrorBoundary` y errores asíncronos:** un boundary de React solo captura errores de render, ciclo de vida y constructores; no los de manejadores de eventos, promesas ni timers. Para esos están `Resultado<T>` (servicios) y `instalarRegistroDeErroresGlobales()`.
- **Errores al evaluar módulos:** si un `import` de `_layout.tsx` lanza al cargarse (como hoy `openDatabaseSync` en `db.ts`), ningún boundary lo captura. Por eso `obtenerDb()` es perezosa y el `File` del log se crea dentro de las funciones.
- **En desarrollo**, React Native muestra además su pantalla roja o LogBox sobre el boundary; la prueba visual del error amable se hace cerrando el LogBox o con la variante `release`.
- **Mocks en Jest:** `expo-local-authentication`, `expo-file-system` y `expo-sqlite` son nativos; las pruebas de `services/` los mockean con `jest.mock(...)` y las del layout mockean los hooks y servicios propios. Nunca mockear `expo-sqlite` para probar `data/` (para eso está `crearBaseDePrueba()`), pero aquí no hay pruebas de `data/` contra la base.
- **`@testing-library/react-native` 14** usa `render` asíncrono (`await render(...)`, ver `pruebas/pantallas/inicio.test.tsx`) y `renderHook` desde el mismo paquete.
- **TypeScript 6** con `types: ["jest", "node"]` en `tsconfig.json`: `ErrorUtils` llega tipado como global desde `react-native/src/types/globals.d.ts`.

### Testing

- Jest con `jest-expo`. Pruebas nuevas: `src/domain/resultado.test.ts`, `src/textos/dinero.test.ts`, `src/services/log.test.ts`, `src/services/biometria.test.ts`, `src/hooks/use-acceso.test.ts(x)`, `src/components/*.test.tsx` y `pruebas/pantallas/layout.test.tsx`.
- Las pruebas que no usan React pueden ir con `/** @jest-environment node */`.
- Definition of Done: `npm run verificar` (`tsc --noEmit` + ESLint + Jest) en verde (NFR13), más la verificación manual del T9 en el emulador.

### Project Structure Notes

```text
src/
  app/_layout.tsx              # UPDATE: ErrorBoundary, useAcceso, capa de bloqueo, reintento de migraciones
  components/                  # NUEVA carpeta (ya cubierta por el lint de AD-17)
    error-amable.tsx (+ .test.tsx)
    pantalla-bloqueo.tsx (+ .test.tsx)
  data/db.ts                   # UPDATE: obtenerDb() perezosa
  data/migraciones.ts          # UPDATE: migrate() con reintentar
  domain/resultado.ts (+ .test.ts)
  hooks/use-acceso.ts (+ .test.ts)
  services/biometria.ts (+ .test.ts)
  services/log.ts (+ .test.ts)
  textos/acceso.ts             # NUEVO
  textos/errores.ts            # NUEVO
  textos/dinero.ts (+ .test.ts)
  textos/app.ts                # UPDATE: + reintentar
pruebas/pantallas/layout.test.tsx
```

- Variante respecto al spine: el spine no menciona `src/components/`; se usa porque `src/app/` solo admite rutas de Expo Router y el lint de H1.1 ya la contempla.
- `formatearDinero` vive en `textos/` (AC 6 de la épica): `textos/` puede importar `domain/`, y las pantallas solo importan `textos/`.
- Borrar los `.gitkeep` de `src/domain/`, `src/services/` y `src/hooks/` al crear el primer archivo real.

### Previous Story Intelligence (H1.1)

- `npm run verificar` está en verde con 103 pruebas (comprobado al crear esta historia).
- El code review de H1.1 endureció el lint: AD-3 bloquea `@/data/db`, `@/data/schema`, `@/data/pruebas`, `expo-sqlite` y `better-sqlite3` fuera de `src/data/`; AD-17 cubre expresiones, props visibles, `Alert` y `src/components/`. Escribir el código pensando en esas reglas desde el inicio.
- Pruebas de pantallas en `pruebas/pantallas/` (Expo Router trata todo archivo de `src/app/` como ruta). Las de ESLint en `pruebas/eslint-reglas.test.ts` pasan la config ya cargada porque Jest no soporta `import()` dinámico.
- `@testing-library/react-native` 14.1.0 (usa `test-renderer`, no `react-test-renderer`).
- Paquete `com.priettos.moneytrack` (`.dev` en dev); el archivo de la base es `files/SQLite/moneytrack.db`.
- Hay cambios sin commit del code review de H1.1 en el árbol (`git status`); no forman parte de esta historia y no hay que revertirlos.

### Git Intelligence

- Un solo commit: `adbab6d H1.1: proyecto base desde la plantilla Expo SDK 57` (autor con el noreply de GitHub de prietto; mantenerlo así en cualquier commit futuro). Mensajes en español con prefijo `H<n>.<m>:` y viñetas por decisión de arquitectura.

### Información técnica verificada (node_modules del proyecto, 2026-11-05)

- **expo-local-authentication 57.0.3:** `hasHardwareAsync`, `isEnrolledAsync`, `getEnrolledLevelAsync(): SecurityLevel` (`NONE=0`, `SECRET=1`, `BIOMETRIC_WEAK=2`, `BIOMETRIC_STRONG=3`), `authenticateAsync(opciones): Promise<{success: true} | {success: false; error; warning?}>`, `cancelAuthenticate`. Opciones: `promptMessage`, `promptSubtitle`, `promptDescription`, `cancelLabel`, `disableDeviceFallback` (por defecto `false`), `requireConfirmation`, `biometricsSecurityLevel` (`'weak'` por defecto). Errores: `not_enrolled | user_cancel | app_cancel | not_available | lockout | no_space | timeout | unable_to_process | unknown | system_cancel | user_fallback | invalid_context | passcode_not_set | authentication_failed`. El manifiesto de la librería ya trae `USE_BIOMETRIC` y `USE_FINGERPRINT`.
- **expo-file-system 57.0.7 (API nueva):** `new File(Paths.document, 'nombre')`, `.exists`, `.textSync()`, `.write(string | Uint8Array)` (síncrono), `.create()`. Las funciones heredadas (`writeAsStringAsync`, etc.) lanzan en tiempo de ejecución salvo que se importen de `expo-file-system/legacy`: no usarlas.
- **expo-router 57.0.29:** `export function ErrorBoundary({ error, retry }: ErrorBoundaryProps)` desde una ruta o layout; `ErrorBoundaryProps = { error: Error; retry: () => Promise<void> }`. El layout queda envuelto por su propio boundary (`useScreens.js`, `fromImport`).
- **drizzle-orm 0.45.4:** `drizzle-orm/expo-sqlite/migrator` exporta `migrate(db, { journal, migrations }): Promise<void>` y `useMigrations`; el dialecto SQLite aplica las migraciones entre `BEGIN` y `COMMIT` con `ROLLBACK` si falla.
- **React Native 0.86:** `AppState.addEventListener('change', cb)` devuelve una suscripción con `.remove()`; estados `active | background | inactive` (`inactive` es de iOS). `ErrorUtils.getGlobalHandler()` / `setGlobalHandler(fn(error, isFatal))`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/planning-artifacts/epics.md#Requirements Inventory (NFR1, NFR5, NFR6, UX-DR1, UX-DR13)]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md (Design Paradigm, AD-1, AD-7, AD-8, AD-12, AD-15, AD-17, AD-23, Consistency Conventions, Structural Seed, Deferred)]
- [Source: _bmad-output/planning-artifacts/prds/prd-moneytrack_app-2026-10-14/prd.md#8. Requisitos transversales (Voz del socio, Privacidad)]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/reviews/review-rubric.md (brecha de diagnóstico que originó AD-23)]
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-11-04.md (H1.2 cubre NFR-4, NFR-7, NFR-8, NFR-10, UX-DR1, UX-DR13; ≤ 5 s con biometría)]
- [Source: _bmad-output/implementation-artifacts/1-1-proyecto-base-desde-la-plantilla-expo-sdk-57.md (Review Findings, Dev Agent Record)]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md (ítem `src/data/db.ts:7`)]
- Expo LocalAuthentication (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/local-authentication/
- Expo FileSystem (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/
- Expo Router, manejo de errores: https://docs.expo.dev/router/error-handling/

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (`claude-opus-5-5`), Claude Code, workflow `bmad-dev-story`.

### Debug Log References

- Lint: `@typescript-eslint/no-require-imports` en el `require('./log')` dentro de `jest.isolateModules` → se cambió por `jest.requireActual<typeof import('./log')>('./log')`.
- Prueba del layout: con la capa de re-bloqueo, `getByTestId('stack')` fallaba porque el `View` que envuelve el `Stack` lleva `importantForAccessibility="no-hide-descendants"` (Testing Library omite por defecto los elementos ocultos). Es el comportamiento buscado: la prueba ahora comprueba que el `Stack` sigue montado (`includeHiddenElements: true`) y que no es accesible.
- Emulador: `android/` estaba generado con la variante `release`; se regeneró con `APP_VARIANT=dev npx expo prebuild --platform android --clean` (CNG, sin tocar a mano) y se compiló con `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 APP_VARIANT=dev npx expo run:android --no-bundler`. `android/` queda en la variante `dev` (está en `.gitignore`).

### Completion Notes List

- **T1** `Resultado<T, E = string>` con `ok()` y `fallo()` en `src/domain/resultado.ts` (puro).
- **T2** `formatearDinero` manual, sin `Intl`: guion ASCII, `-0` → `"0"`, `RangeError` sin el valor para no enteros seguros. 16 casos, incluido `MIN_SAFE_INTEGER`.
- **T3** `crearLog` con buffer FIFO de 500, carga perezosa, persistencia síncrona tras cada entrada y sin lanzar nunca. Saneo: cifras tapadas **antes** de truncar (para no dejar medio monto), y también en las líneas de la pila que no son ubicaciones de código (en Hermes la primera línea repite el mensaje), mientras que las líneas `at …` se dejan intactas para conservar línea y columna. `instalarRegistroDeErroresGlobales` acepta `registro` y `utilidades` inyectables (por defecto `log` y `ErrorUtils`) para poder probarla.
- **T4** `autenticar` con `getEnrolledLevelAsync` → `sinBloqueo` sin diálogo; mapeo completo de los 14 códigos; `disableDeviceFallback: false`; nunca lanza. `requiereAutenticacion` es estricta (`>`), y en 5:00 exactos no pide.
- **T5** `useAcceso` con refs solo en efectos y manejadores (React Compiler): intento automático único al montar, guardia `autenticandoRef` contra diálogos en cadena y contra el bucle de AppState de Android, cubierta inmediata en `background`, y `mensajes` en una ref.
- **T6** `textosAcceso` (diálogo, título, bloqueado, `verificando` para el `accessibilityLabel` del indicador, reintentar y un mensaje por `ErrorAcceso`), `textosError` y `textosApp.reintentar`.
- **T7** `obtenerDb()` memoizada (si abrir falla, no memoiza y el reintento vuelve a abrir); `useMigraciones()` con `migrate()` propio, contador `intento`, guardia `vigente` contra actualizar tras desmontar y `reintentar`. `data/` no importa `services/`. `deferred-work.md` marca el ítem como resuelto.
- **T8** `ErrorBoundary` exportado por `_layout.tsx` (registra `app.errorBoundary` y muestra `ErrorAmable`); `RootLayout` en el orden pedido: bloqueo sin `Stack` → error de migración con reintento y `log.error('migraciones.aplicar')` → indicador → `Stack` con capa absoluta al re-bloquear o cubrir.
- **T9 en el emulador `Pixel_8_Pro_API_35`, variante `dev`** (PIN y huella configurados por adb y con el asistente de Ajustes):
  - Arranque en frío → el diálogo aparece solo → `adb -e emu finger touch 1` → entra.
  - A segundo plano 5 s → vuelve sin pedir.
  - A segundo plano **5 min 15 s con el umbral real** (sin bajarlo en el código) → pide de nuevo; cancelar → capa opaca con el mensaje `cancelado` y "Desbloquear" (captura revisada: no se ve ningún dato).
  - "Desbloquear" → "Use PIN" → 1234 → entra, y no se abre un segundo diálogo (sin bucle de AppState).
  - `throw` temporal en `src/app/index.tsx` → LogBox de desarrollo y, al cerrarlo, "Algo falló de mi lado." con "Reintentar" y sin detalles. `files/moneytrack-log.json` tiene `app.errorBoundary` con el mensaje `…con monto [n]`, sin el monto. Se revirtió el `throw` (sin diff).
  - Sin PIN (`locksettings clear`) → mensaje `sinBloqueo`, y el log registra `aviso biometria.sinBloqueo`.
  - El fallo de migración (AC 7) no se forzó en el dispositivo: está cubierto por `src/data/migraciones.test.tsx` y `pruebas/pantallas/layout.test.tsx`.
- **T10** `npm run verificar` en verde: **200 pruebas** (antes 103), sin `console` ni texto literal en `src/app/**` ni `src/components/**`.
- **Desvíos menores respecto a la historia:**
  - `src/components/boton.tsx`: un botón compartido por la pantalla de bloqueo, el error amable y el error de migración, para no repetir estilos.
  - `src/data/migraciones.test.tsx`: pruebas del hook con `./db` y `migrate` mockeados; no carga `expo-sqlite`.
  - El texto `errorMigracion` ahora menciona "Toca Reintentar"; se mantiene la clave.
  - `textosAcceso.verificando` es un texto extra para el lector de pantalla.
  - El `Stack` va dentro de un `View` que lo oculta al lector de pantalla mientras está tapado.
  - `pantalla-bloqueo.tsx` toma sus tipos de `@/hooks/use-acceso` (`Acceso['estado']`, `Acceso['error']`) para no importar `services/` desde `components/`.
  - `textos/acceso.ts` no importa `ErrorAcceso`: TypeScript verifica las claves al indexar `textosAcceso.errores[error]`.
  - *(Code review)* Al cargar el log, un archivo con algunas entradas inválidas conserva las válidas (reconstruidas solo con las claves conocidas) y deja el aviso `log.archivoIlegible`, en lugar de "corrupto → buffer vacío" de T3. Un archivo vacío cuenta como inexistente.
  - *(Code review)* `pila` guarda solo las ubicaciones de código (hasta 10), sin la cabecera que repite el mensaje; el mensaje saneado va en `mensaje`. Los `params:` de Drizzle se omiten y, en un `Failed query:`, también los literales de texto.
  - *(Code review)* La capa de bloqueo tapa también las pantallas de error y de carga de las migraciones. El botón atrás se bloquea y el teclado se cierra solo mientras hay capa, no en la primera pantalla de bloqueo.
- **Observación para el review:** en desarrollo, las líneas de la pila incluyen la URL completa del bundle de Metro, así que cada entrada de error pesa unos 3 KB; en release las ubicaciones son cortas.

### File List

- `src/domain/resultado.ts` (nuevo)
- `src/domain/resultado.test.ts` (nuevo)
- `src/domain/.gitkeep` (borrado)
- `src/textos/dinero.ts` (nuevo)
- `src/textos/dinero.test.ts` (nuevo)
- `src/textos/acceso.ts` (nuevo)
- `src/textos/errores.ts` (nuevo)
- `src/textos/app.ts` (modificado)
- `src/services/log.ts` (nuevo)
- `src/services/log.test.ts` (nuevo)
- `src/services/biometria.ts` (nuevo)
- `src/services/biometria.test.ts` (nuevo)
- `src/services/.gitkeep` (borrado)
- `src/hooks/use-acceso.ts` (nuevo)
- `src/hooks/use-acceso.test.ts` (nuevo)
- `src/hooks/.gitkeep` (borrado)
- `src/data/db.ts` (modificado)
- `src/data/migraciones.ts` (modificado)
- `src/data/migraciones.test.tsx` (nuevo)
- `src/components/boton.tsx` (nuevo)
- `src/components/error-amable.tsx` (nuevo)
- `src/components/error-amable.test.tsx` (nuevo)
- `src/components/pantalla-bloqueo.tsx` (nuevo)
- `src/components/pantalla-bloqueo.test.tsx` (nuevo)
- `src/app/_layout.tsx` (modificado)
- `pruebas/pantallas/layout.test.tsx` (nuevo)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modificado)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modificado)
- `_bmad-output/implementation-artifacts/1-2-acceso-protegido-diagnostico-y-error-amable.md` (modificado)

## Change Log

- 2026-11-05: Implementación de H1.2. Acceso protegido con `expo-local-authentication` (biometría o bloqueo del teléfono, re-bloqueo después de más de 5 min y capa que cubre al pasar a segundo plano), `services/log` rotativo de 500 entradas con saneo, `ErrorBoundary` raíz con error amable, `Resultado<T>`, `formatearDinero`, base perezosa y migraciones con reintento y registro (cierra el primer ítem diferido de H1.1). Se verificó en el emulador. `npm run verificar`: 200 pruebas en verde. Estado → review.
- 2026-11-05: Code review (Blind Hunter, Edge Case Hunter, Acceptance Auditor). 10 patches aplicados: saneo del log (params de Drizzle, cifras agrupadas con espacio, pila con ubicaciones estrictas, nombre del error, archivo vacío y entradas inválidas), guardia de `autenticar` que rechaza, reloj atrasado exige reautenticar, VoiceOver y botón atrás bajo la capa, y prueba real del guardia `vigente` de migraciones. 6 hallazgos diferidos a `deferred-work.md`. `npm run verificar`: 212 pruebas en verde. Estado → done.
- 2026-11-05: Segunda pasada de code review. 9 patches aplicados: `pila` solo con ubicaciones de código, `params:` cortado hasta el final y literales SQL tapados en `Failed query:`, entradas del log reconstruidas con claves conocidas, capa de bloqueo también sobre las pantallas de migración, botón atrás y teclado solo con capa (no en la primera pantalla de bloqueo), `.catch` de `desbloquear` registra el motivo, pruebas de accesibilidad y desvíos documentados. 5 hallazgos diferidos (incluido el reloj monótono). `npm run verificar`: 223 pruebas en verde. Estado → done.
