---
title: 'Revisión por rúbrica — Architecture Spine MoneyTrack v1'
reviewed: ARCHITECTURE-SPINE.md (updated 2026-10-19)
inputs: [ARCHITECTURE-SPINE.md, .memlog.md, prd.md, addendum.md]
date: 2026-10-19
verdict: 'Aprobable con cambios'
---

# Revisión por rúbrica — Spine MoneyTrack v1

## Veredicto

**Aprobable con cambios.** El núcleo de dominio (AD-1..AD-10) es de buena calidad: fija los puntos de divergencia reales entre historias (cálculo único, solo hechos, escrituras por comando, ocurrencias derivadas, amortización, dinero entero, fechas), con reglas concretas y mayormente verificables. Las brechas están en el **envolvente operacional**: observabilidad/diagnóstico de fallos está en silencio total, la firma de release y el `versionCode` bajo CNG no están decididos (la decisión del keystore quedó en el memlog y no subió al spine), las variantes dev/release comparten la carpeta de respaldo de Drive, y la estrategia de pruebas de `data/` no es ejecutable tal como está escrita. Hay además tres huecos de FR que dos historias resolverían distinto.

## Resultado por criterio

| Criterio | Resultado | Nota |
| --- | --- | --- |
| Fija los puntos de divergencia reales para épicas/historias | Parcial | Dominio y persistencia muy bien cubiertos; faltan efectos post-comando, cola de fotos, adelanto (FR-9), catálogo de categorías del extractor. |
| Cada Rule es verificable y previene su divergencia | Parcial | AD-1/AD-17/AD-3 dependen de lint no especificado (`no-restricted-imports` no detecta `Date.now()` ni literales de texto). AD-13 no dice quién llama `reprogramar`. |
| Nada en Deferred permite divergencia | Mayormente sí | "Lista de categorías" diferida a una historia es aceptable, pero el contrato del extractor depende de ella (ver H-5). |
| Tecnología verificada y vigente | Parcial | Expo SDK 57 / RN 0.86 / React 19.2 verificados (memlog 2026-10-15). Drizzle, Zod, google-signin y el modelo Gemini "3.x" sin entrada `version`. |
| Cubre FR-1..FR-27 | Mayormente sí | Mapa de capacidades completo; huecos puntuales FR-7 (cola), FR-9, FR-20 (sin Meta activa). |
| Dimensiones de la altitud decididas/diferidas/abiertas | **No** | Observabilidad y crash diagnostics: silencio total. Firma/versionado de release: silencio. Migraciones: decididas, pero falla de migración y restauración de versión menor sin mecanismo. |
| Mermaid válido | Sí | Los tres diagramas son sintácticamente válidos (aristas a subgraph, `[( )]`, cardinalidades `}o--o|` correctas). Semántica menor: `RASTRO }o--|| GASTO` sugiere que el rastro solo apunta a Gasto, cuando es polimórfico. |
| Sin bloat de rationale / sin comentarios de plantilla | Sí | Rationale contenido en "Prevents". Detalle menor: "(para que no entrene con los datos)" en AD-11 es rationale. Sin comentarios de plantilla. |
| Decisiones, no rationale | Sí | — |

## Hallazgos

### H-1 — ALTA — Observabilidad y diagnóstico de fallos: dimensión en silencio

Ni AD, ni Deferred, ni pregunta abierta sobre crash reporting, logging o diagnóstico. Con código 100 % escrito por agentes y un único usuario sin acceso a logcat en el día a día, un crash en `calcularEstado` o una migración fallida deja la app inutilizable sin pista. Además, sin regla, cada historia loguea a su manera (`console.log` con montos, o nada), lo cual choca con §8 Privacidad.

**Fix:** añadir un AD "Diagnóstico": (a) `services/log` único (niveles, buffer local rotativo en archivo, exportable desde Configuración); prohibido `console.*` fuera de él (lint `no-console`); (b) nunca se registran montos, comercios ni la clave de IA; (c) decidir explícitamente Crashlytics (`@react-native-firebase/crashlytics`, encaja en el proyecto Firebase ya existente) **o** "sin crash reporting remoto en v1" en Deferred, con `ErrorBoundary` raíz que muestre el error y ofrezca exportar log + datos.

### H-2 — ALTA — Firma de release y `versionCode` no decididos bajo CNG

AD-16 dice que `android/` se regenera y no se versiona, pero no dice cómo se firma el APK release (prebuild regenera `build.gradle` con firma debug) ni quién incrementa `versionCode`. Firebase App Distribution y la instalación sobre la versión previa exigen misma firma y `versionCode` creciente. El memlog decidió "keystore fuera del repo, en gestor de contraseñas, respaldado" pero esa decisión no está en el spine.

**Fix:** extender AD-16: firma release vía config plugin propio (`plugins/firma-release`) que lee ruta y contraseñas del keystore desde `~/.gradle/gradle.properties` (nunca del repo); `version` y `android.versionCode` viven solo en `app.config.ts` y `versionCode` sube en 1 por cada APK distribuido; keystore guardado y respaldado fuera del repo. Añadir a Stack las versiones de Node y JDK requeridas.

### H-3 — ALTA — Las variantes dev y release comparten el `appDataFolder` de Drive

`appDataFolder` está aislado por proyecto OAuth de Google, no por applicationId. Con "un solo proyecto de Google Cloud" (Structural Seed), la variante `dev` sube respaldos a la misma carpeta que `release`: con la retención de 7 (AD-14), los respaldos de prueba pueden desplazar los reales, y una restauración en `release` podría cargar datos de prueba. Esto rompe el "Prevents" de AD-16. Además, el cliente OAuth Android es por par (paquete, SHA-1), y `dev` tiene paquete distinto: se necesitan dos clientes.

**Fix:** en AD-14: el nombre del archivo de respaldo incluye la variante (`moneytrack-{APP_VARIANT}-{exportadoEn}.json`), la retención y la restauración filtran por la variante propia, y `MoneyTrackExport` lleva `variante`; restaurar rechaza una copia de otra variante. En el Seed: "dos clientes OAuth Android (paquete `.dev` + SHA-1 debug; paquete release + SHA-1 release)".

### H-4 — ALTA — "Cada comando se prueba con SQLite en memoria" no es ejecutable tal cual

`expo-sqlite` es un módulo nativo y no corre en Jest/Node. Sin decidir el driver de pruebas ni cómo reciben los comandos la conexión, cada historia improvisará (mocks de `expo-sqlite`, pruebas omitidas, o un `db` global importado que no se puede sustituir).

**Fix:** en Consistency Conventions → Pruebas: los comandos reciben `db` como primer parámetro (tipo común de Drizzle SQLite); en pruebas se usa `better-sqlite3` + `drizzle-orm/better-sqlite3` en memoria con las mismas migraciones de `drizzle/`; prohibido mockear `expo-sqlite`. Añadir `better-sqlite3` al Stack (dev). Verificar en la primera historia que el SQL de expo-sqlite y better-sqlite3 es compatible (ambos SQLite) y anotar la versión en el memlog.

### H-5 — MEDIA — Huecos de FR que dos historias resolverían distinto

1. **FR-7, cola de fotos:** AD-11 dice que la foto "se guarda primero" y la extracción pendiente se reintenta, pero AD-2 no lista ninguna tabla para extracciones pendientes y el Gasto no existe hasta confirmar. ¿Dónde vive la cola? ¿Qué pasa con la foto si se borra el Gasto o se restaura un respaldo (las fotos no viajan, AD-14)?
   **Fix:** añadir a AD-2 la tabla `fotos` (id, uri en `documentDirectory/fotos/`, estado `pendiente | extraida | descartada`, propuesta JSON) como hecho; la foto de un Gasto borrado se elimina al purgar; tras restaurar, `fotoId` sin archivo se muestra como "foto no disponible".
2. **FR-9, adelanto:** no se dice si "se marca como adelanto" es una columna o una derivación. Por AD-2 debería ser derivado.
   **Fix:** en AD-1/AD-2: el adelanto y su descuento al mes siguiente los calcula `domain/` a partir de Gastos Esenciales vs. Presupuesto del mes; no hay columna `esAdelanto`.
3. **Extractor ↔ categorías:** el esquema Zod de AD-11 devuelve `categoria` sin decir si es texto libre o id del catálogo sembrado (AD-9).
   **Fix:** `extraerFactura(fotoUri, categorias)` recibe el catálogo y devuelve `categoriaId` de esa lista o `null`; igual para `vehiculoSugerido` (`vehiculoId | null`).
4. **FR-20, sin Meta activa:** `Estado` no declara que Meta/Ritmo/Impacto en días son anulables. **Fix:** en AD-1, `estado.meta` es `null` cuando no hay Deuda objetivo y `impactoEnDias` devuelve `null`; el Semáforo funciona solo con color.

### H-6 — MEDIA — Reglas de AD-1, AD-3, AD-13 y AD-17 sin mecanismo de cumplimiento completo

- `no-restricted-imports` (AD-1) no detecta `Date.now()` / `new Date()` en `domain/`; hace falta `no-restricted-globals`/`no-restricted-syntax`.
- AD-3 ("pantallas y servicios nunca usan Drizzle para escribir") y AD-17 ("sin literales de texto en pantallas") no tienen regla de lint.
- AD-13 dice "se llama después de cada comando" sin dueño: si lo llama `data/` viola el grafo de dependencias; si lo llama cada pantalla, una historia lo olvidará. Lo mismo para la marca "hubo cambios" del respaldo (AD-14), que no está definida (el rastro solo cubre ediciones y borrados).
- ESLint no está en el Stack y no hay paso de verificación que los agentes deban correr.

**Fix:** (a) un único `ejecutar(comando, args)` en `src/hooks/` (o `services/`) que corre el comando, luego `notificaciones.reprogramar(estado)` y guarda `ultimoCambioEn` en ajustes; las pantallas solo invocan comandos a través de él. (b) Config ESLint fija: `no-restricted-imports` por carpeta (`drizzle-orm`/`expo-sqlite` prohibidos fuera de `src/data/`; todo lo externo prohibido en `src/domain/`), `no-restricted-syntax` para `Date.now`/`new Date()` en `domain/`, `react-native/no-raw-text` (o equivalente) en `src/app/`, `no-console`. (c) Script `npm run verificar` = `tsc --noEmit && expo lint && jest`, obligatorio en el Definition of Done de cada historia.

## Hallazgos menores

- **M-1 — Versiones sin verificar.** Drizzle, Zod, `@react-native-google-signin/google-signin` y "Gemini Flash 3.x" no tienen entrada `(version)` en el memlog. google-signin en particular: confirmar que la edición gratuita sigue soportando autorización de scopes (`drive.appdata`) con la API vigente de Google en Android antes de la historia de respaldo. Fijar el id exacto del modelo Gemini en una constante del adaptador. **Fix:** entradas `version` al hacer scaffolding; ítem en Open Questions mientras tanto.
- **M-2 — Plan pago de Gemini no confirmado.** El memlog registra que el usuario no confirmó tener facturación de API; AD-11 depende de ello para la promesa de no-entrenamiento. **Fix:** pregunta abierta explícita o precondición en la historia de foto.
- **M-3 — Restaurar versión menor sin mecanismo.** AD-14 dice "una menor se migra antes de cargarse" sin definir cómo se relaciona `schemaVersion` con las migraciones de Drizzle. **Fix:** `schemaVersion` = índice de la última migración del journal de drizzle-kit; restaurar crea una base vacía, aplica migraciones hasta ese índice, carga las tablas y luego aplica las restantes. Además: antes de aplicar migraciones al abrir, exportar copia local de seguridad; si una migración falla, la app muestra el error y ofrece exportar, nunca arranca con base a medias.
- **M-4 — Desvío del PRD §8 sin cerrar.** El respaldo en Drive contradice "los datos viven en el celular; solo la foto sale" y "Respaldo: exportación manual". El memlog anotó ofrecer actualizar el PRD. **Fix:** Open Question "actualizar PRD §8 Privacidad/Respaldo" o nota en AD-14.
- **M-5 — UUID sin librería fijada.** AD-10 no dice con qué se generan (Hermes no garantiza `crypto.randomUUID`). **Fix:** `expo-crypto.randomUUID()` como única fuente.
- **M-6 — Marcadores `[ADOPTED]` inconsistentes.** AD-5, AD-6 y AD-14 no lo llevan sin explicar si están pendientes de aceptación. **Fix:** marcar o declarar su estado.
- **M-7 — Notificaciones y privacidad.** Nada impide que una notificación muestre montos en la pantalla bloqueada (AD-15 protege solo la app). **Fix:** textos de notificación sin cifras (vía `src/textos/`).
- **M-8 — ER semántico.** `RASTRO }o--|| GASTO` comunica un vínculo solo con Gasto; el rastro es polimórfico (`entidad`, `id`). **Fix:** quitar la relación o anotar `RASTRO` aislado con atributo `entidad`.
- **M-9 — Sin sección de Open Questions.** El spine no tiene un lugar para lo abierto (M-1, M-2, M-4, decisión de crash reporting). **Fix:** añadir la sección.

## Cobertura FR (resumen)

FR-1..FR-6, FR-8, FR-10..FR-19, FR-21..FR-27: cubiertos por el mapa y por AD-1..AD-17. FR-7, FR-9, FR-20: cubiertos parcialmente (ver H-5). PRD §8: Voz (AD-17), Honestidad (AD-6/AD-7), Sin conexión (AD-11), Privacidad (AD-11/12/15, con desvío M-4), Respaldo (AD-14), Moneda (AD-7). Preguntas abiertas del PRD §10: 10.1 diferida a historia, 10.2 resuelta (AD-11/AD-12), 10.3 resuelta (AD-6).
