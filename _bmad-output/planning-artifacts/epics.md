---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-moneytrack_app-2026-10-14/prd.md
  - _bmad-output/planning-artifacts/prds/prd-moneytrack_app-2026-10-14/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md
---

# moneytrack_app - Epic Breakdown

## Overview

Este documento contiene el desglose completo en épicas e historias de moneytrack_app (MoneyTrack v1). Descompone los requisitos del PRD, de su addendum y del Architecture Spine en historias implementables. No existe un contrato de UX: los requisitos de interfaz salen del PRD y del spine. Los términos con mayúscula son los del Glosario del PRD (§3).

> **Revisión 2026-11-04** (tras `implementation-readiness-report-2026-11-04.md`): la historia 1.3 se partió en 1.3 (núcleo de cálculo) y 1.4 (Pagos, saldo inicial, Colchón y pantalla principal); las antiguas 1.4–1.8 pasan a ser 1.5–1.9. Se agregaron la regla de Periodos restantes, la Meta vencida tratada como sin Meta, la proyección que no converge, `formatearMillones`, pagos de cuota distintos al programado, la base del porcentaje del Cuadre, la navegación y la lista de movimientos, `expo-network`, los permisos de notificaciones y las categorías Salud y Combustible.

> **Revisión 2026-11-11** (tras [`sprint-change-proposal-2026-11-11.md`](sprint-change-proposal-2026-11-11.md), Propuesta 3): cambio de rumbo del MVP. Ver la sección siguiente.

## Alcance del MVP (cambio de rumbo 2026-11-11)

Después de terminar las historias 1.1 a 1.6, Priettos probó la app en su celular y la encontró demasiado compleja: había que configurar Pagos, saldo, Colchón, Vehículos, Obligaciones, Presupuestos y fondo antes de registrar el primer Gasto. El MVP se reenfoca así (detalle y justificación en [`sprint-change-proposal-2026-11-11.md`](sprint-change-proposal-2026-11-11.md)):

- **Nuevo foco:** registrar gastos sin esfuerzo con IA, de tres formas: **foto** de la factura (con detalle de ítems), **nota de voz** o **a mano**. En los tres casos la IA sugiere la categoría y Priettos solo confirma o corrige.
- **Inicio con resumen:** total del mes, gasto por categoría y últimos gastos. El Dinero libre, los Presupuestos, el fondo enduro, las Obligaciones, los Vehículos, la Meta y el Semáforo son la evolución que viene después del MVP.
- **Lo ya construido en H1.4 a H1.6 se oculta sin borrarse** (historia 1.10) y se reactiva cuando se descongele.

**Orden del MVP:** 1.10 → 2.1 → 2.2 → 1.9 → 2.3 → 2.4 → 4.1 → 4.2 → 4.3 → 4.4 → 7.1

*(Ajustado el 2026-11-11 tras el readiness check: 2.3 y 2.4 suben antes de la IA para poder corregir Gastos desde que la app se usa con datos reales en 1.9.)*

| # | Historia | Qué deja usable |
| --- | --- | --- |
| 1 | 1.10 Simplificar la app para el MVP | Una app limpia |
| 2 | 2.1 Registrar un Gasto a mano | Ya se puede registrar |
| 3 | 2.2 Inicio con el resumen del mes | Ya se ve cuánto llevas |
| 4 | 1.9 APK release en el celular | En el teléfono, en uso diario |
| 5 | 2.3 Lista y detalle de gastos | Ver qué registré |
| 6 | 2.4 Editar y borrar gastos | Corregir errores con datos reales |
| 7 | 4.1 Clave de IA y extractor | — |
| 8 | 4.2 Fotografiar una factura | Captura por foto |
| 9 | 4.3 Nota de voz | Captura por voz |
| 10 | 4.4 Capturas sin conexión y por confirmar | — |
| 11 | 7.1 Exportar | Respaldo manual |

**Congelada** significa: diseñada, fuera del MVP y retomable sin rehacer. Su contenido se conserva tal cual en este documento; no se crea ni se implementa hasta que se descongele. Están congeladas las historias 1.7 y 1.8, las épicas 3, 5 y 6 completas, las historias 7.2 y 7.3, y las antiguas 2.2, 2.3, 2.4 y 2.6 (más las partes de la antigua 2.1 y 2.5 que dependen del Dinero libre).

**Equivalencias de numeración (vieja → nueva).** Las historias congeladas de la Épica 2 llevan el prefijo **C** con su número original (p. ej. **C2.2**) para no chocar con las nuevas 2.2, 2.3 y 2.4; están en la subsección "Historias congeladas de la Épica 2".

| Antes | Ahora | Estado |
| --- | --- | --- |
| 1.7 Deudas, Deuda objetivo y reserva de Meta | 1.7 | Congelada |
| 1.8 Asistente de primer uso y Ajustes | 1.8 | Congelada |
| 1.9 APK release | 1.9 | MVP |
| — | 1.10 Simplificar la app para el MVP | MVP (nueva) |
| 2.1 Registrar un Gasto manual en segundos | 2.1 Registrar un Gasto a mano (redefinida) | MVP; lo que depende del Dinero libre pasa a C2.1 (congelada) |
| 2.2 Adelanto de un gasto previsto | C2.2 | Congelada |
| 2.3 Confirmar Pagos y registrar Otros ingresos | C2.3 | Congelada |
| 2.4 Pagar Obligaciones con "ya pagamos" | C2.4 | Congelada |
| 2.5 Editar y borrar movimientos con rastro visible | 2.4 Editar y borrar Gastos con rastro visible | MVP; lo que no es Gasto pasa a C2.5 (congelada) |
| 2.6 Cuadrar contra el banco e historial de Cuadres | C2.6 | Congelada |
| — | 2.2 Inicio con el resumen del mes | MVP (nueva) |
| — | 2.3 Lista y detalle de gastos | MVP (nueva) |
| 3.1–3.5 | 3.1–3.5 | Congeladas (épica completa) |
| 4.1 Clave de IA y extractor de facturas | 4.1 Clave de IA y extractor (redefinida) | MVP |
| 4.2 Fotografiar una factura y confirmar la propuesta | 4.2 (con ítems y categoría sugerida) | MVP |
| — | 4.3 Nota de voz y confirmar la propuesta | MVP (nueva) |
| 4.3 Fotos sin conexión, fallos y "Facturas por confirmar" | 4.4 Capturas sin conexión, fallos y por confirmar | MVP |
| 5.1–5.2 | 5.1–5.2 | Congeladas (épica completa) |
| 6.1–6.2 | 6.1–6.2 | Congeladas (épica completa) |
| 7.1 Exportar | 7.1 | MVP |
| 7.2 Restaurar, 7.3 Drive | 7.2, 7.3 | Congeladas |

## Requirements Inventory

### Functional Requirements

**4.1 Configuración inicial**

FR1: Pagos. El usuario registra sus dos Pagos (Pago 1 y Pago 2) con día del mes y monto esperado. Si el día no existe en el mes, se usa el último día del mes.
FR2: Deudas y Meta. El usuario registra cada Deuda (nombre, saldo, cuota, día de pago y tasa opcional de tipo EA o MV) y marca una como Deuda objetivo con su fecha de Meta. Las cuotas se generan como Obligaciones mensuales. Si una Deuda no tiene tasa, sus proyecciones se marcan "aproximado".
FR3: Obligaciones y Presupuestos esenciales. El usuario registra Obligaciones mensuales y anuales (por Vehículo) y los montos de los Presupuestos esenciales (comida y mantenimiento de vehículos).
FR4: Fondo enduro, Colchón y saldo inicial. El usuario fija el aporte mensual al fondo enduro, el Colchón (4.000.000 por defecto) y el Saldo real inicial.
FR5: Vehículos. El usuario registra sus Vehículos con un nombre (p. ej. "Moto azul", "Carro").

**4.2 Registro de movimientos**

FR6: Registro manual (simplificado 2026-11-11). El usuario registra un Gasto con monto, fecha, categoría y, opcionalmente, comercio, nota e ítems. La Clase de gasto y los enlaces se copian en silencio de la categoría al Gasto, sin mostrarse. Con una categoría reciente, se completa en ≤ 3 toques tras escribir el monto. *Nota:* la clase se sigue copiando para que, al descongelar los Presupuestos, el fondo y el Dinero libre, los Gastos ya registrados tengan su clasificación sin rehacer nada.
FR7: Registro por foto (actualizado 2026-11-11). El usuario fotografía una factura o recibo; la app extrae monto, comercio, fecha y el detalle de ítems, y sugiere la categoría. Siempre hay una pantalla de confirmación editable y nada se guarda sin confirmar. Si la extracción falla o no hay conexión, la foto queda adjunta y el usuario completa a mano (o se reintenta al volver la conexión). Con conexión, la propuesta aparece en ≤ 10 s. (Se quitó la sugerencia de Vehículo.)
FR8: Clasificación por defecto. Mantenimiento y consumibles de Vehículo → Esencial (Presupuesto esencial de mantenimiento de vehículos); equipo y accesorios de enduro → Fondo protegido; el resto → Gusto. En el MVP se aplica en silencio desde la categoría (FR6); las categorías nuevas son Gusto. Cambiarla queda congelado.
FR9 *(Congelada)*: Adelanto de gasto previsto. Un Gasto Esencial que excede su Presupuesto esencial del mes se marca como adelanto y el exceso se descuenta del Presupuesto esencial del mes siguiente (en cadena), no como Gusto.
FR10 *(Congelada)*: Impacto al guardar. Tras guardar un Gasto, la app muestra el Dinero libre restante y, si aplica, el Impacto en días.
FR11 *(Congelada)*: Confirmar Pago y Otros ingresos. El usuario confirma cada Pago con el monto recibido y registra Otros ingresos. Mientras un Pago no se confirme, el Saldo calculado no lo incluye y el Saldo proyectado lo sigue tratando como esperado.
FR12: Editar y borrar. El usuario puede editar o borrar cualquier movimiento y todo se recalcula.

**Captura inteligente y resumen (nuevas, cambio de rumbo 2026-11-11)**

FR31: Registro por voz. El usuario dicta una nota de voz de hasta 60 s; la app la convierte en una propuesta de Gasto (monto, comercio, fecha, ítems y categoría sugerida) con la misma pantalla de confirmación editable de la foto. El audio se borra al confirmar o descartar.
FR32: Ítems. Un Gasto puede llevar el detalle de sus ítems (descripción y monto opcional), extraídos por la IA o escritos a mano. Si la suma de los ítems no cuadra con el total, la app avisa sin bloquear el guardado.
FR33: Inicio con resumen. La pantalla de Inicio muestra el resumen del mes: total gastado, gasto por categoría y últimos gastos, con accesos a foto, voz y registro a mano.
FR34: Lista y detalle. El usuario ve la lista de sus Gastos por mes y el detalle de cada uno, con sus ítems y su nota.

**4.3 Dinero libre y Cuadre**

FR13: Pantalla principal. Muestra Dinero libre, Saldo calculado, Avance y Ritmo de la Meta, Fecha de la Meta proyectada (cuenta regresiva en días), Día de Libertad, saldo del fondo enduro y Obligaciones vencidas. Si el Dinero libre es negativo, se muestra en rojo con el día del faltante y el monto.
FR14: Cuadre. El usuario ingresa su Saldo real; la app muestra la diferencia con el Saldo calculado y, con su confirmación, la registra como Gasto sin registrar (si falta dinero) u Otro ingreso (si sobra). La app pide un Cuadre al confirmar cada Pago y, si no se hace, lo recuerda al día siguiente.
FR15: Historial de Cuadres. La app guarda cada Cuadre con su diferencia en monto y en porcentaje (valida SM-2).

**4.4 Meta y Día de Libertad**

FR16: Proyecciones. La app calcula la Fecha de la Meta proyectada y el Día de Libertad, y los recalcula con cada cambio.
FR17: Abono. El usuario registra un Abono a cualquier Deuda, que baja el saldo de la Deuda y el Saldo calculado. La app nunca abona por su cuenta.
FR18: Reserva de Meta. En cada Periodo la app reserva el Ritmo de la Meta como Aporte programado; los Abonos a la Deuda objetivo consumen esa reserva de Meta. Reservar no es abonar.
FR19: Ritmo y aviso. Al confirmar un Pago o hacer un Cuadre, la app muestra el Ritmo de la Meta del Periodo, lo ya abonado y "al día" o "atrasado X". Si el Ritmo de la Meta no cabe sin bajar del Colchón, lo dice explícitamente.
FR20: Meta cumplida o vencida. Cuando la Deuda objetivo llega a cero, la app lo celebra y pide elegir la siguiente Deuda objetivo y su fecha; mientras no se elija, el Semáforo muestra color sin Impacto en días. Si pasa la fecha sin cumplirse, la Meta queda "vencida" y la app pide una nueva fecha.

**4.5 Semáforo de compra**

FR21: Consulta. El usuario escribe un precio y, opcionalmente, elige un Fondo protegido. La consulta no registra un Gasto. Con cualquier color, "Lo compré" la convierte en Gasto con un toque.
FR22: Reglas del Semáforo. Sea R la parte del precio que no cubre el saldo del Fondo protegido elegido. 🟢 si R ≤ Dinero libre y el Impacto en días de R < umbral (7 por defecto, configurable). 🟡 si R ≤ Dinero libre y el Impacto en días ≥ umbral, o si R > Dinero libre pero cabe sumando la reserva de Meta del Periodo ("se come tu reserva de Meta"). 🔴 si R no cabe ni con la reserva de Meta.
FR23: Respuesta. El veredicto muestra color, Dinero libre resultante e Impacto en días en una frase simple. Desde abrir la app hasta ver el veredicto pasan ≤ 5 s.
FR24: Registro de veredictos. La app guarda cada consulta (fecha, monto, color y si se compró). Permite observar SM-C2.

**4.6 Sesión de pagos**

FR25: Agendar. El usuario agenda una Sesión de pagos por Periodo (por defecto, el día siguiente a cada Pago, con hora configurable) y recibe una notificación.
FR26: Lista y "ya pagamos". La Sesión de pagos lista las Obligaciones pendientes hasta el próximo Pago. Marcar "ya pagamos" registra el Gasto con su monto (editable). Si es una cuota, baja el saldo de la Deuda; si es anual, libera su reserva anual. Una Obligación vencida sin marcar sigue visible como vencida en la pantalla principal.
FR27: Vencimientos anuales. La app avisa 30 y 7 días antes del vencimiento de cada Obligación anual de Vehículo.

**Respaldo (PRD §8, incluido en v1)**

FR28: Exportación manual. El usuario exporta todos sus datos a un archivo (formato `MoneyTrackExport`).
FR29: Respaldo automático opcional en Google Drive. Si el usuario lo activa, la app sube una copia a la carpeta privada (`appDataFolder`) de su Drive y conserva las últimas 7.
FR30: Restaurar. El usuario restaura desde un archivo o desde Drive, y la restauración reemplaza todos los datos del celular.

### NonFunctional Requirements

NFR1: Voz del socio. Todo texto de la app es honesto, amable y no complaciente: nunca suaviza un 🔴 ni maquilla una cifra, nunca culpa ni sermonea y celebra los avances. Usa lenguaje simple, sin jerga financiera, y una mirada basta. Todo texto sale de `src/textos/` (AD-17).
NFR2: Honestidad del cálculo. Ningún redondeo a favor del usuario: lo reservado o debido se redondea hacia arriba, lo disponible hacia abajo y el Impacto en días hacia arriba (AD-7). Si falta un dato (p. ej. tasa), el resultado se marca "aproximado".
NFR3: Sin conexión. Todo funciona sin internet excepto la extracción por foto y por voz, que se encola (actualizado 2026-11-11).
NFR4: Privacidad. Los datos viven en el celular. Solo salen la foto y el audio de la nota de voz (al proveedor de IA, que no entrena con los datos) y, si el usuario lo activa, el respaldo a su propio Google Drive (congelado: en el MVP el respaldo se limita a la exportación manual). Las notificaciones no muestran montos.
NFR5: Acceso protegido. La app exige biometría o el bloqueo del teléfono al abrirla y al volver tras más de 5 minutos en segundo plano, antes de mostrar cualquier dato (AD-15).
NFR6: Moneda y formato. COP sin decimales, con punto como separador de miles; el formato sale solo de `formatearDinero()`.
NFR7: Rendimiento del registro. Un registro manual con categoría reciente toma ≤ 3 toques tras escribir el monto (FR6).
NFR8: Rendimiento de la captura. La propuesta de extracción aparece en ≤ 10 s con conexión para la foto (FR7) y en ≤ 15 s para la nota de voz (FR31); al cumplirse el tiempo se aborta (AD-11).
NFR9: Rendimiento del Semáforo. Desde abrir la app hasta ver el veredicto pasan ≤ 5 s (FR23).
NFR10: Rendimiento del cálculo. `calcularEstado` con 12 meses de datos tarda < 200 ms, medido por una prueba (AD-1).
NFR11: Seguridad de secretos. La clave de la API de IA vive solo en `expo-secure-store`; ningún secreto va en el código, la base, la exportación, el respaldo ni el log (AD-12).
NFR12: Plataforma. Solo Android, sin cuentas de usuario y sin backend. La app no mueve dinero ni bloquea compras (PRD §5).
NFR13: Calidad. Cada historia pasa `npm run verificar` (`tsc --noEmit` + ESLint + Jest) antes de cerrarse.

### Additional Requirements

**Starter template (impacta Épica 1, Historia 1)**

- El proyecto arranca con `create-expo-app --template default@sdk-57` (TypeScript + Expo Router en `src/app/`), pasando `app.json` a `app.config.ts`. Usa Expo SDK 57 (expo ≥ 57.0.21) y React Native 0.86 / React 19.2.
- Las dependencias nativas se instalan con `npx expo install` (nunca `@next`): expo-sqlite, expo-secure-store, expo-notifications, expo-local-authentication, expo-image-picker, expo-file-system, expo-crypto y expo-network (detección de conexión para la cola de capturas, H4.4). El módulo de grabación de audio de Expo SDK 57 se elige con la documentación versionada al crear la historia 4.3.
- Se usa drizzle-orm 0.45.x / drizzle-kit 0.31.x (no la 1.0 rc) con el driver expo-sqlite, `babel-plugin-inline-import` y `sql` en los `sourceExts` de Metro. También Zod 4.6.x.
- Las herramientas son Jest con jest-expo, better-sqlite3 y @testing-library/react-native, más ESLint (`eslint-config-expo` + `eslint-plugin-react-native`). El script `npm run verificar` es la Definition of Done.

**Estructura y reglas de capas**

- Se usan las capas `src/app`, `src/hooks`, `src/data` (`schema.ts`, `tablas/`, `commands/`, `queries/`), `src/services`, `src/domain` y `src/textos`. `domain/` es puro y no depende de nadie; `data/` solo importa tipos de `domain/`.
- Las reglas ESLint obligatorias son:
  - `no-restricted-imports` en `src/domain/**` (React, Expo, Drizzle, SQLite y la red).
  - Prohibición de `Date` y `Math.random` en `src/domain/**`.
  - Prohibición de importar `drizzle-orm` y `src/data/tablas` fuera de `src/data/`.
  - `react-native/no-raw-text` en `src/app/**`.
  - `no-console`.
- La convención de nombres usa términos del Glosario en camelCase y sin tildes. Los archivos van en kebab-case, las tablas en plural snake_case y las pruebas junto al archivo (`*.test.ts`).

**Núcleo de cálculo y datos**

- AD-1: `calcularEstado(hechos, hoy): Estado` devuelve todas las cifras derivadas. `evaluarCompra(estado, precio, fondoId?)` e `impactoEnDias(estado, monto)` solo leen un `Estado`. Las cifras que pueden quedar incompletas se devuelven como `{valor, aproximado}`. `domain/` es total y no lanza excepciones.
- AD-2: solo se guardan configuración y movimientos, nunca lo derivado. Los puntos de partida son configuración con fecha: `saldoInicial`, `fondo.saldoInicial`, `obligacionAnual.reservaInicial` y `deuda.saldoInicial`. Las únicas instantáneas son el Cuadre y la consulta del Semáforo, y `domain/` nunca las lee.
- AD-3: hay un módulo dueño por tabla (`insertarX/editarX/borrarX(tx, …)`). Cada comando abre una transacción y no hay comandos genéricos. El borrado se hace en cascada desde el origen. La tabla `rastro` registra toda edición y borrado; `domain/diferencias` arma el texto visible.
- AD-4: el borrado es lógico (`deletedAt`) y el rastro es visible desde el movimiento. Los Cuadres pasados conservan su diferencia. Un Gasto con fecha anterior al último Cuadre genera un aviso.
- AD-5: las ocurrencias de Pagos, Obligaciones y cuotas se derivan y no se guardan. Se referencian por `(definicionId, clave YYYY-MM|YYYY)` único. Las cuotas leen monto y día de la Deuda. El Horizonte va de hoy a hoy+31. Hay reglas para los Pagos atrasados y las Obligaciones vencidas.
- AD-6: amortización francesa. La tasa EA o MV se normaliza a mensual. El capital de una cuota es el pago menos el interés (mínimo 0). Sin tasa, todo es capital y la cifra es `aproximado`.
- AD-7: el dinero se maneja en enteros de pesos y el redondeo es siempre en contra del usuario.
- AD-8: las fechas de negocio son `YYYY-MM-DD` y las técnicas ISO UTC. `services/reloj.hoy()` usa `America/Bogota` y `suscribirHoy` avisa al cruzar la medianoche o al volver a primer plano. `useHoy()` es el único hook que envuelve el reloj.
- AD-9: no hay valores personales en el código; todo es configuración sembrada. Las reglas de FR-8 son columnas de `categorias` (`claseDefault`, `presupuestoId?`, `fondoId?`, `requiereVehiculo`, `esSistema`). La categoría de sistema "Sin registrar" no se borra. El modelo admite N Fondos y N Presupuestos. **La lista inicial de categorías (PRD §10.1) queda definida en la historia 1.6** (Salud → Esencial sin Presupuesto; Combustible → Presupuesto de mantenimiento, decisiones del 2026-11-04).
- AD-10: toda tabla tiene `id` UUID v4 (`expo-crypto`) más `createdAt`, `updatedAt` y `deletedAt`.
- AD-18: `domain/hechos.ts` define el tipo `Hechos` y `data/queries/cargar-hechos.ts` es su único cargador (excluye los borrados y nunca incluye instantáneas). `useEstado()` es reactivo con `useLiveQuery`. Las pantallas ejecutan comandos solo con `ejecutar()` de `hooks/use-comando.ts`, que tras el commit recalcula el Estado y reprograma las notificaciones.
- AD-19: un Gasto es una fila por compra con `clase` y su enlace (`presupuestoId`, `fondoId` u `obligacionPagadaId`). La clasificación se copia de la categoría al registrar. `domain/` consume las bolsas en orden `(fecha, createdAt)`, separa la parte cubierta de la desbordada y calcula los adelantos en cadena. El campo `origen ∈ {manual, foto, voz, obligacion, cuadre, semaforo}` marca el Gasto sin registrar como `origen = cuadre`. **MVP (2026-11-11):** el Gasto suma `nota?`; la tabla `gasto_items {id, gastoId, descripcion, monto?, orden}` se guarda en la misma transacción que el Gasto y los ítems son informativos (no cambian el monto del Gasto).
- AD-20: el Periodo va de la fecha esperada de un Pago a la víspera de la siguiente. El Ritmo de la Meta es fijo dentro del Periodo y se calcula con el capital amortizado. `reservaMeta = max(0, ritmo − Abonos del Periodo)`. El aporte al fondo y el prorrateo anual (÷12, hacia arriba) se acreditan en la fecha del Pago 2.
- AD-21: `metas` es una tabla de solo agregar y la Meta activa es la que tiene `reemplazadaEn` nulo. `fijarMeta` cierra la anterior. Los estados cumplida y vencida se derivan. Sin Meta activa, o con la Meta cumplida o vencida: Ritmo 0, reserva de Meta 0 e Impacto `null`, y el Semáforo solo da 🟢 o 🔴 (vencida añadida el 2026-11-04).
- Hay casos de prueba fijos del addendum:
  - Dinero libre = 1.350.000 (estado al 3-nov).
  - La tabla del Semáforo: 120.000 → 🟢, botas de 600.000 con fondo → 🟡, casco de 1.500.000 → 🟡, llantas de 2.000.000 → 🔴.
  - El Abono de 500.000 del 4-nov.
- Los comandos se prueban con better-sqlite3 en memoria, con el mismo esquema y las mismas migraciones (no se mockea `expo-sqlite`).
- Migraciones: solo se generan con `drizzle-kit generate` y se aplican al abrir la app (`useMigrations`). Una migración ya publicada nunca se edita.

**Integraciones externas**

- AD-11 (actualizado 2026-11-11): `services/extractor.extraerFactura(fotoUri, categorias)` y `extraerNotaDeVoz(audioUri, categorias, hoy)` devuelven `Resultado<PropuestaGasto>`, con `PropuestaGasto {monto: entero | null, comercio | null, fecha | null, categoriaId | null, items: {descripcion, monto | null}[]}`, validado con un esquema Zod único. Gemini recibe la imagen o el audio directamente. Un `categoriaId` que no está en la lista se convierte en `null`. El proveedor `gemini-3.8-flash`, con facturación de Cloud activa, vive en un único adaptador. El tiempo límite es de 10 s para la foto y de 15 s para la voz.
- AD-12: la clave de la API de IA la ingresa el usuario y vive en `expo-secure-store`.
- AD-22 (actualizado 2026-11-11): la tabla `capturas {id, tipo: foto | voz, uri, estado: pendiente|propuesta|confirmada|descartada, propuesta?, gastoId?}` es la cola (antes `fotos`). La foto o el audio se copia al almacenamiento de la app; el audio se borra al confirmar o descartar. Los reintentos ocurren al abrir la app y al volver la conexión, sin tareas en segundo plano. Las extracciones tardías aparecen en la bandeja "Por confirmar" (antes "Facturas por confirmar"). Una foto perdida se muestra sin error.
- AD-13: `services/notificaciones.reprogramar(estado, hoy)` es el único punto de programación: cancela todas las notificaciones y las recrea. Se llama desde `ejecutar()`, al abrir la app y desde `suscribirHoy`.
- AD-14: el formato único es `MoneyTrackExport {schemaVersion, variante, exportadoEn, tablas}`, sin secretos ni fotos. El respaldo a Drive usa `appDataFolder`, sube al pasar a segundo plano si hubo cambios y conserva 7 copias. Restaurar rechaza otra variante o un `schemaVersion` mayor, migra en una base temporal y reemplaza todo en una sola transacción. Se usa `@react-native-google-signin/google-signin` 16.x (módulo Original) con Drive REST v3. Si hay atraso, el respaldo a Drive pasa a v1.1 y la exportación manual se queda en v1.

**Seguridad, operación y distribución**

- AD-15: `expo-local-authentication` al abrir la app y al volver tras más de 5 minutos.
- AD-16: `android/` lo genera `expo prebuild` y no se versiona. `APP_VARIANT` produce dos apps, `dev` (sufijo `.dev`) y `release`, cada una con su propio cliente OAuth y su SHA-1, dentro de un único proyecto de Google Cloud/Firebase.
- AD-23: `services/log` (`info`/`aviso`/`error`) mantiene un buffer rotativo de 500 entradas, exportable desde Ajustes y sin montos ni secretos. Hay un ErrorBoundary raíz y los servicios devuelven `Resultado<T>`.
- AD-24: un config plugin de firma lee el keystore desde `~/.gradle/gradle.properties`. `version` y `versionCode` viven en `app.config.ts`, y `versionCode` sube +1 por cada APK. La distribución es APK de `release` → Firebase App Distribution. Hay que registrar la cuenta de desarrollador y los applicationId (plan B: `adb install`).

**Orden de construcción (PRD §6.1 + spine)**

- ~~4.1 → 4.2 (manual) → 4.3 → 4.4 → 4.2 (foto) → 4.5 → 4.6 → exportación y respaldo.~~ Reemplazado el 2026-11-11 por el orden del MVP: 1.10 → 2.1 → 2.2 → 1.9 → 2.3 → 2.4 → 4.1 → 4.2 → 4.3 → 4.4 → 7.1 (ver "Alcance del MVP").

### UX Design Requirements

No existe un contrato de UX (DESIGN.md/EXPERIENCE.md). El diseño de pantallas y la navegación se decide en las historias, según el spine. Los siguientes requisitos de interfaz se derivan del PRD y del spine. Desde el 2026-11-11 se reescriben UX-DR3, UX-DR5 y UX-DR14, y se congelan UX-DR2, UX-DR6 a UX-DR9, UX-DR11 y UX-DR12 (se conservan sin cambios):

UX-DR1: Bloqueo de acceso. Ninguna pantalla con datos se muestra antes de que la biometría o el bloqueo del teléfono tengan éxito. Esto se exige al abrir la app y al volver tras más de 5 minutos.
UX-DR2 *(Congelada)*: Asistente de configuración inicial. Al primer uso, un asistente corto y por pasos carga Pagos, Deudas y Meta, Obligaciones, Presupuestos, fondo enduro, Colchón, Saldo real inicial y Vehículos. Todo es editable después desde Ajustes.
UX-DR3 (reescrita 2026-11-11): Inicio con el resumen del mes. Muestra de un vistazo el total gastado en el mes, el gasto por categoría y los últimos gastos, con navegación entre meses. Tiene accesos directos a la foto, a la nota de voz y al registro a mano. No muestra el Dinero libre. *(Versión congelada: pantalla principal "¿cómo voy?" con Dinero libre —en rojo, con el día y el monto del faltante, si es negativo—, Saldo calculado, Avance y Ritmo de la Meta, cuenta regresiva a la Fecha de la Meta proyectada, Día de Libertad, saldo del fondo enduro, Obligaciones vencidas y acceso a "¿Puedo?".)*
UX-DR4 (ajustada 2026-11-11): Registro manual rápido. Se muestran las categorías recientes primero, para completar en ≤ 3 toques tras escribir el monto. La clase y los enlaces se copian en silencio desde la categoría: no se muestran ni se piden en el MVP.
UX-DR5 (reescrita 2026-11-11): Pantalla de confirmación de la captura (foto o voz). Muestra la propuesta editable: monto, comercio, fecha, categoría sugerida por la IA e ítems (agregar, editar o quitar). Si la suma de los ítems no cuadra con el total, avisa sin bloquear. Nada se guarda sin confirmar. Hay una vía manual si la extracción falla o vence el tiempo. Existe una bandeja de capturas "Por confirmar".
UX-DR6 *(Congelada)*: Retroalimentación tras guardar. Después de cada Gasto se muestran el Dinero libre restante y el Impacto en días (o "no le cuesta días a tu Meta").
UX-DR7 *(Congelada)*: Pantalla "¿Puedo?" (Semáforo). Tiene un campo de precio y un selector opcional de Fondo protegido. El veredicto se muestra con color, una frase simple, el Dinero libre resultante y el Impacto en días. El botón "Lo compré" registra el Gasto con un toque. Todo en ≤ 5 s desde abrir la app.
UX-DR8 *(Congelada)*: Flujo de confirmar Pago → Cuadre. Al confirmar un Pago, la app pide el Saldo real, muestra la diferencia y la registra con confirmación. Luego muestra el Ritmo de la Meta, lo abonado y "al día" o "atrasado X".
UX-DR9 *(Congelada)*: Pantalla de Sesión de pagos. Lista las Obligaciones pendientes hasta el próximo Pago, cada una con la acción "ya pagamos" y el monto editable.
UX-DR10: Rastro visible. Cada movimiento editado o borrado muestra su historia ("editado 15-oct: 850.000 → 85.000"). *(Congelado: el aviso si un Gasto tiene fecha anterior al último Cuadre.)*
UX-DR11 *(Congelada)*: Celebración y cambio de Meta. Hay una pantalla o modal que celebra la Meta cumplida y pide la nueva Deuda objetivo y su fecha. Para la Meta vencida, pide una nueva fecha.
UX-DR12 *(Congelada)*: Marcas "aproximado". Toda cifra devuelta con `aproximado = true` se marca visiblemente como aproximada.
UX-DR13: Error amable. Un ErrorBoundary raíz muestra un mensaje con la Voz del socio y sin detalles técnicos.
UX-DR14 (reescrita 2026-11-11): Ajustes. En el MVP muestra solo Categorías, Clave de IA y Exportar (datos y diagnóstico). *(Versión congelada: edición de toda la configuración, restauración, respaldo en Drive, hora de la Sesión de pagos y umbral del Semáforo.)*

### FR Coverage Map

> Actualizado 2026-11-11. "(Congelada)" = el requisito queda fuera del MVP; la historia que lo cubre está congelada. FR1, FR3, FR4 y FR5 ya están implementados (H1.4 a H1.6) y quedan ocultos por la historia 1.10.

FR1: Épica 1 - Configurar los dos Pagos (día y monto esperado) — hecho, oculto en el MVP (1.10)
FR2: Épica 1 - Registrar Deudas (con tasa EA/MV opcional) y elegir la Deuda objetivo con su fecha (las proyecciones de la Meta llegan en la Épica 3) — (Congelada, 1.7)
FR3: Épica 1 - Registrar Obligaciones mensuales y anuales y Presupuestos esenciales — hecho, oculto en el MVP (1.10)
FR4: Épica 1 - Fijar el aporte al fondo enduro, el Colchón y el Saldo real inicial — hecho, oculto en el MVP (1.10)
FR5: Épica 1 - Registrar Vehículos — hecho, oculto en el MVP (1.10)
FR6: Épica 2 - Registro manual de Gastos, con la clase copiada en silencio (2.1)
FR7: Épica 4 - Registro por foto con ítems, categoría sugerida, confirmación y cola sin conexión (4.1, 4.2, 4.4)
FR8: Épica 2 - Clasificación por defecto desde la categoría, copiada en silencio (2.1)
FR9: Épica 2 - Adelanto de gasto previsto (en cadena) — (Congelada, C2.2)
FR10: Épica 2 (Dinero libre restante al guardar) + Épica 3 (Impacto en días al guardar) — (Congelada, C2.1 y 3.3)
FR11: Épica 2 - Confirmar Pagos y registrar Otros ingresos — (Congelada, C2.3)
FR12: Épica 2 - Editar y borrar Gastos con rastro visible (2.4); el resto de movimientos, (Congelada, C2.5)
FR13: Épica 1 (Dinero libre, Saldo calculado, fondo enduro, Obligaciones vencidas) + Épica 3 (Avance, Ritmo, cuenta regresiva y Día de Libertad) — (Congelada; la parte de Épica 1 está hecha y oculta por 1.10)
FR14: Épica 2 (Cuadre y su registro) + Épica 6 (recordatorio al día siguiente) — (Congelada, C2.6 y 6.2)
FR15: Épica 2 - Historial de Cuadres — (Congelada, C2.6)
FR16: Épica 3 - Fecha de la Meta proyectada y Día de Libertad — (Congelada)
FR17: Épica 3 - Registrar Abonos — (Congelada)
FR18: Épica 1 (Ritmo y reserva de Meta dentro del cálculo de Dinero libre) + Épica 3 (consumo de la reserva por Abonos) — (Congelada)
FR19: Épica 3 - Ritmo de la Meta y aviso "al día" o "atrasado" — (Congelada)
FR20: Épica 3 - Meta cumplida o vencida — (Congelada)
FR21: Épica 5 - Consulta "¿Puedo?" y "Lo compré" — (Congelada)
FR22: Épica 5 - Reglas del Semáforo — (Congelada)
FR23: Épica 5 - Respuesta en una frase en ≤ 5 s — (Congelada)
FR24: Épica 5 - Registro de veredictos — (Congelada)
FR25: Épica 6 - Agendar la Sesión de pagos con notificación — (Congelada)
FR26: Épica 2 - Lista de Obligaciones pendientes y "ya pagamos" — (Congelada, C2.4)
FR27: Épica 6 - Avisos de vencimientos anuales a 30 y 7 días — (Congelada)
FR28: Épica 7 - Exportación manual a archivo (7.1)
FR29: Épica 7 - Respaldo automático opcional en Google Drive — (Congelada, 7.3)
FR30: Épica 7 - Restaurar desde un archivo o desde Drive — (Congelada, 7.2 y 7.3)
FR31: Épica 4 - Registro por nota de voz (4.1, 4.3, 4.4)
FR32: Épica 2 (ítems a mano y su detalle: 2.1, 2.3, 2.4) + Épica 4 (ítems extraídos por la IA: 4.1, 4.2, 4.3)
FR33: Épica 2 - Inicio con el resumen del mes (2.2)
FR34: Épica 2 - Lista y detalle de Gastos (2.3)

## Epic List

### Epic 1: Tener la app base, protegida e instalada en mi celular
*(Antes: "Configurar mis finanzas y ver mi Dinero libre real".)*
**MVP (2026-11-11):** 1.1–1.6 hechas; entran al MVP la nueva 1.10 (Simplificar la app) y 1.9 (APK). 1.7 y 1.8 quedan Congeladas.
Priettos instala la app protegida con biometría, hace la configuración inicial (Pagos, Deudas y Deuda objetivo, Obligaciones, Presupuestos esenciales, fondo enduro, Colchón, saldo inicial y Vehículos) y ve en la pantalla principal su Dinero libre honesto para los próximos 31 días. La épica incluye el proyecto base (plantilla Expo SDK 57, stack, ESLint, `npm run verificar` y las variantes dev/release), el núcleo `calcularEstado` con la prueba fija de Dinero libre = 1.350.000, la lista inicial de categorías, el bloqueo de acceso, el log, el ErrorBoundary, la firma del APK y su distribución, de modo que el APK release quede instalado en el celular.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR13 (parte base), FR18 (reserva de Meta en el cálculo); en el MVP, FR33 (Inicio sin Dinero libre, vía 1.10)

### Epic 2: Registrar y ver mis gastos
*(Antes: "Registrar el día a día y mantener la app honesta"; redefinida el 2026-11-11.)*
Priettos registra Gastos a mano en segundos (con nota e ítems opcionales), ve en Inicio el resumen del mes (total, por categoría y últimos gastos), consulta la lista y el detalle de sus Gastos y los edita o borra con rastro visible. La épica aplica la forma única del Gasto (AD-19) con `gasto_items`, los comandos transaccionales y el rastro (AD-3 y AD-4). El adelanto, los Pagos, "ya pagamos" y el Cuadre quedan Congelados (C2.2, C2.3, C2.4 y C2.6).
**FRs covered:** FR6, FR8, FR12 (Gastos), FR32 (ítems a mano), FR33, FR34. *Congelados:* FR9, FR10, FR11, FR12 (otros movimientos), FR14, FR15, FR26

### Epic 3: Seguir mi Meta y mi Día de Libertad *(Congelada)*
Priettos ve el Avance, el Ritmo y la cuenta regresiva de su Meta y su Día de Libertad, registra Abonos, sabe si va "al día" o "atrasado" y ve el Impacto en días de cada Gasto. La app celebra la Meta cumplida y pide una nueva fecha si vence. La épica se apoya en la amortización francesa, el Periodo, el Ritmo y la reserva de Meta ya implementados en la historia 1.7 (AD-6, AD-20, AD-21) y agrega Abonos, proyecciones y los estados cumplida y vencida, con la prueba fija del Abono del 4-nov.
**FRs covered:** FR10 (Impacto en días), FR13 (parte de la Meta), FR16, FR17, FR18 (consumo por Abonos), FR19, FR20

### Epic 4: Registrar gastos con IA
*(Antes: "Registrar Gastos con una foto"; ampliada el 2026-11-11.)*
Priettos fotografía una factura o dicta una nota de voz y confirma con un toque la propuesta editable (monto, comercio, fecha, ítems y categoría sugerida). Sin conexión, la captura queda en cola y se reintenta. La épica incluye la clave de IA en secure-store (sin backend), el adaptador de Gemini con el contrato `PropuestaGasto` y esquema Zod, tiempos límite de 10 s (foto) y 15 s (voz), la tabla `capturas` y la bandeja "Por confirmar".
**FRs covered:** FR7, FR31, FR32 (ítems extraídos)

### Epic 5: Preguntar "¿Puedo?" antes de comprar *(Congelada)*
Priettos recibe en ≤ 5 s un veredicto 🟢/🟡/🔴 con el Dinero libre resultante y el Impacto en días en una frase simple, y con "Lo compré" lo convierte en Gasto con un toque. Cada consulta queda registrada. La épica incluye `evaluarCompra` con la tabla fija del addendum.
**FRs covered:** FR21, FR22, FR23, FR24

### Epic 6: Sesión de pagos agendada y avisos a tiempo *(Congelada)*
La app cita a Priettos para pagar el día siguiente a cada Pago (con hora configurable), le recuerda el Cuadre pendiente y le avisa 30 y 7 días antes de los vencimientos anuales de sus Vehículos. Todo se programa desde un único punto (AD-13) y las notificaciones no muestran montos.
**FRs covered:** FR25, FR27, FR14 (recordatorio de Cuadre)

### Epic 7: Proteger mis datos con exportación y respaldo
**MVP (2026-11-11):** solo 7.1 Exportar; 7.2 y 7.3 quedan Congeladas.
Priettos exporta sus datos a un archivo, activa el respaldo automático en su Google Drive y restaura todo si cambia de celular (AD-14). El respaldo a Drive es la última historia: si hay atraso, pasa a v1.1 y la exportación manual se queda en v1.
**FRs covered:** FR28; *Congelados:* FR29, FR30


## Epic 1: Tener la app base, protegida e instalada en mi celular

*(Antes: "Configurar mis finanzas y ver mi Dinero libre real"; renombrada el 2026-11-11. La configuración financiera de 1.4–1.6 queda hecha y oculta.)*

Priettos instala la app protegida con biometría, carga su configuración y ve en la pantalla principal un Dinero libre honesto para los próximos 31 días: descuenta Obligaciones, Presupuestos esenciales, Reservas (incluida la de Meta) y el Colchón. La épica termina con el APK release instalado en su celular.

> **MVP (2026-11-11):** 1.1–1.6 están hechas. La épica se cierra con la nueva **1.10 Simplificar la app para el MVP** (primera del orden del MVP) y con **1.9 APK** (cuarta). **1.7 y 1.8 quedan Congeladas.** Lo construido en 1.4–1.6 se oculta sin borrarse.

### Story 1.1: Proyecto base desde la plantilla Expo SDK 57

Como Priettos (desarrollador),
quiero el proyecto creado desde la plantilla oficial, con el stack fijado, las reglas de capas y la verificación automática,
para que cada historia siguiente se construya sobre una base consistente y verificable.

**Requisitos:** Starter template, NFR13; AD-16 (variantes)

**Acceptance Criteria:**

**Given** una máquina con Node y el SDK de Android
**When** se crea el proyecto con `create-expo-app --template default@sdk-57`
**Then** el proyecto usa TypeScript y Expo Router en `src/app/`, y `app.json` se reemplaza por `app.config.ts`
**And** existen las carpetas `src/app`, `src/hooks`, `src/domain`, `src/data` (`schema.ts`, `tablas/`, `commands/`, `queries/`), `src/services` y `src/textos`

**Given** el proyecto creado
**When** se instalan las dependencias
**Then** las nativas de Expo (expo-sqlite, expo-secure-store, expo-notifications, expo-local-authentication, expo-image-picker, expo-file-system, expo-crypto, expo-network) se instalan con `npx expo install`, sin `@next`
**And** se fijan drizzle-orm 0.45.x, drizzle-kit 0.31.x y Zod 4.6.x, con `babel-plugin-inline-import` y `sql` en los `sourceExts` de Metro

**Given** la configuración de ESLint (`eslint-config-expo` + `eslint-plugin-react-native`)
**When** un archivo de `src/domain/**` importa React, Expo, Drizzle, SQLite o la red, o usa `Date` o `Math.random`
**Then** ESLint falla
**And** ESLint también falla cuando se importa `drizzle-orm` o `src/data/tablas` fuera de `src/data/`, cuando hay texto literal en `src/app/**` (`react-native/no-raw-text`) o cuando se usa `console` (`no-console`)

**Given** Jest con jest-expo, better-sqlite3 y @testing-library/react-native
**When** se ejecuta `npm run verificar`
**Then** corre `tsc --noEmit`, ESLint y Jest, y falla si cualquiera falla
**And** existe un helper de pruebas que abre una base better-sqlite3 en memoria y aplica las migraciones de `drizzle/`

**Given** `APP_VARIANT=dev` o `APP_VARIANT=release`
**When** se ejecuta `npx expo prebuild` y la app se instala
**Then** `dev` usa un applicationId con sufijo `.dev` y se puede instalar al mismo tiempo que `release`
**And** `android/` está en `.gitignore`, y `version` y `android.versionCode` se definen solo en `app.config.ts`
**And** al abrir la app, `useMigrations` aplica las migraciones de Drizzle generadas con `drizzle-kit generate`

### Story 1.2: Acceso protegido, diagnóstico y error amable

Como Priettos,
quiero que la app me pida la huella o el bloqueo del teléfono antes de mostrar cualquier dato, y que los fallos se muestren con amabilidad y queden registrados,
para que nadie con mi celular desbloqueado vea mis finanzas y yo pueda reconstruir cualquier error.

**Requisitos:** NFR1, NFR5, NFR6, UX-DR1, UX-DR13; AD-15, AD-17, AD-23

**Acceptance Criteria:**

**Given** la app cerrada
**When** Priettos la abre
**Then** `expo-local-authentication` exige biometría o el bloqueo del teléfono antes de mostrar cualquier pantalla con datos
**And** si la autenticación falla o se cancela, se muestra una pantalla sin datos con la opción de reintentar

**Given** la app en segundo plano
**When** vuelve a primer plano después de más de 5 minutos
**Then** se exige de nuevo la autenticación
**And** si vuelve antes de 5 minutos, no se exige

**Given** `services/log` con `info`, `aviso` y `error`
**When** se registran más de 500 entradas
**Then** el buffer local conserva solo las 500 más recientes
**And** cada entrada lleva solo ids, operación y error: nunca montos, comercios, fotos ni secretos

**Given** un error no controlado en una pantalla
**When** el ErrorBoundary raíz lo captura
**Then** muestra un mensaje amable con la Voz del socio, tomado de `src/textos/`, sin detalles técnicos
**And** registra el error con `services/log.error`

**Given** el tipo `Resultado<T> = {ok: true, valor} | {ok: false, error}`
**When** un servicio falla
**Then** devuelve `{ok: false, error}` y no lanza la excepción hacia `src/app/`

**Given** `src/textos/`
**When** se crea el primer módulo de textos
**Then** existe `formatearDinero(monto)`, que devuelve COP sin decimales con punto como separador de miles (p. ej. `1350000` → `"1.350.000"`), probado incluso con negativos y con 0

### Story 1.3: Núcleo de cálculo: reloj, Hechos y Estado reactivo

Como Priettos (desarrollador),
quiero el esqueleto del cálculo único (un solo "hoy", un solo cargador de hechos, un solo Estado y un solo ciclo post-comando) probado desde el inicio,
para que todas las cifras de la app salgan del mismo lugar y cada historia siguiente solo agregue reglas al núcleo.

**Requisitos:** NFR2; AD-1, AD-7, AD-8, AD-18

**Acceptance Criteria:**

**Given** `services/reloj`
**When** se pide `hoy()`
**Then** devuelve la fecha `YYYY-MM-DD` en `America/Bogota`
**And** `suscribirHoy(cb)` avisa al cruzar la medianoche de Bogotá y al volver a primer plano, y `useHoy()` es el único hook que lo envuelve

**Given** `domain/hechos.ts` y `data/queries/cargar-hechos.ts`
**When** `useEstado()` calcula `calcularEstado(cargarHechos(db), useHoy())`
**Then** `cargarHechos` es la única función que lee tablas para el cálculo, excluye las filas con `deletedAt` y nunca incluye instantáneas
**And** `useEstado()` es reactivo con `useLiveQuery`

**Given** `domain/calcular-estado.ts`
**When** recibe `Hechos` y `hoy`
**Then** devuelve un `Estado` con, como mínimo, Saldo calculado, Saldo proyectado por día del Horizonte (hoy..hoy+31, inclusive) y Dinero libre = mínimo del Saldo proyectado − Colchón, con el día y el monto de ese mínimo
**And** es total (no lanza excepciones con hechos válidos), todo monto es entero y los redondeos van en contra del usuario (AD-7)
**And** tiene pruebas unitarias sin base de datos ni reloj real

**Given** las pantallas
**When** ejecutan un comando
**Then** lo hacen solo con `ejecutar(comando)` de `hooks/use-comando.ts`, que tras el commit hace que `useEstado` refleje el cambio
**And** `ejecutar` deja un punto de extensión post-comando (allí se conectará `notificaciones.reprogramar` en la Épica 6)

**Given** la tabla `rastro {id, entidad, entidadId, operacion, antes, despues, fecha}`
**When** un comando edita o borra una fila
**Then** escribe la fila de rastro en la misma transacción (helper compartido por los módulos dueños)

### Story 1.4: Configurar Pagos, saldo inicial y Colchón, y ver el primer Dinero libre

Como Priettos,
quiero registrar mis dos Pagos, mi Saldo real inicial y mi Colchón, y ver de inmediato cuánto tengo libre,
para dejar de hacer cuentas de cabeza desde el primer día.

**Requisitos:** FR1, FR4, FR13, NFR2, UX-DR3; AD-5, AD-9

**Acceptance Criteria:**

**Given** la pantalla de configuración de Pagos
**When** Priettos registra Pago 1 (día 10, monto esperado) y Pago 2 (día 30, monto esperado)
**Then** el comando correspondiente los guarda en una sola transacción, con `id` UUID v4 (`expo-crypto`), `createdAt`, `updatedAt` y `deletedAt`
**And** en un mes sin día 30 o 31, la ocurrencia generada por `domain/` cae el último día del mes (p. ej. 28-feb)

**Given** la configuración de Colchón y saldo inicial
**When** Priettos ingresa el Colchón (precargado con 4.000.000, el valor de siembra) y el Saldo real inicial con su fecha
**Then** se guardan como configuración con fecha (`saldoInicial {monto, fecha}`), sin columnas derivadas
**And** toda edición de configuración deja rastro (historia 1.3)

**Given** Pagos esperados dentro del Horizonte
**When** se calcula el Estado
**Then** cada Pago esperado no confirmado suma al Saldo proyectado en su fecha

**Given** un Pago esperado cuya fecha ya pasó sin confirmar
**When** se calcula el Estado
**Then** el Pago se proyecta en `hoy` y se marca `pagoAtrasado`

**Given** la app autenticada
**When** se abre
**Then** existe la navegación base de la app: pantalla principal, Movimientos, Ajustes y accesos rápidos (registro manual, cámara y "¿Puedo?"), que las historias siguientes llenan
**And** los accesos cuya función aún no existe no se muestran

**Given** la pantalla principal
**When** se abre tras configurar
**Then** muestra el Dinero libre y el Saldo calculado formateados con `formatearDinero()`
**And** si el Dinero libre es negativo, se muestra en rojo con el día y el monto del faltante, además de un texto que lo dice (no solo el color)

**Given** la pantalla principal sin configuración suficiente para calcular
**When** se muestra
**Then** presenta un estado vacío amable que lleva al asistente o a Ajustes, sin cifras inventadas

### Story 1.5: Registrar Vehículos y Obligaciones mensuales y anuales

Como Priettos,
quiero registrar mis Vehículos y mis Obligaciones mensuales y anuales (arriendo, servicios, SOAT, tecnomecánica, impuesto),
para que el Dinero libre aparte de antemano lo que debo pagar y la reserva anual crezca mes a mes.

**Requisitos:** FR3, FR5, FR13; AD-5, AD-20

**Acceptance Criteria:**

**Given** la pantalla de Vehículos
**When** Priettos registra "Moto azul" y "Carro"
**Then** quedan guardados con nombre e id, y se pueden editar o borrar (borrado lógico, con rastro)

**Given** la pantalla de Obligaciones
**When** Priettos registra una Obligación mensual (nombre, monto, día) o una anual (nombre, monto, fecha de vencimiento, Vehículo opcional y reserva inicial con fecha)
**Then** se guarda solo la definición, y `domain/` genera las ocurrencias con clave `YYYY-MM` o `YYYY`
**And** un día inexistente pasa al último día del mes

**Given** Obligaciones con vencimiento dentro del Horizonte
**When** se calcula el Estado
**Then** cada ocurrencia pendiente se descuenta del Saldo proyectado en su fecha
**And** una ocurrencia vencida y no pagada se descuenta en `hoy` y aparece en la lista de Obligaciones vencidas del Estado

**Given** una Obligación anual
**When** se calcula el Estado
**Then** la reserva anual = reserva inicial + prorrateo mensual (monto ÷ 12, redondeado hacia arriba) acreditado en cada fecha esperada del Pago 2 desde la fecha de la reserva inicial
**And** los prorrateos futuros dentro del Horizonte se descuentan como Aportes programados en la fecha del Pago 2

**Given** la pantalla principal
**When** hay Obligaciones vencidas
**Then** se listan como vencidas con su nombre y monto

### Story 1.6: Presupuestos esenciales, fondo enduro y categorías iniciales

Como Priettos,
quiero fijar mis Presupuestos de comida y mantenimiento de vehículos y el aporte a mi fondo enduro, con categorías listas para usar,
para que el Dinero libre aparte lo esencial y proteja mi pasión sin culpa.

**Requisitos:** FR3, FR4, FR8; AD-9

**Acceptance Criteria:**

**Given** la primera ejecución
**When** se aplican las migraciones y la siembra
**Then** existen las filas de configuración sembradas: Presupuestos esenciales "comida" y "mantenimiento de vehículos" y Fondo protegido "fondo enduro", editables, en un modelo que admite N de cada uno
**And** existe la tabla `categorias` con `claseDefault`, `presupuestoId?`, `fondoId?`, `requiereVehiculo` y `esSistema`

**Given** la siembra de categorías (lista inicial, PRD §10.1)
**When** se consulta `categorias`
**Then** existen:
  - Mercado y comida → Esencial, presupuesto comida.
  - Mantenimiento de vehículo y Combustible → Esencial, presupuesto mantenimiento, requiere Vehículo (decisión de Priettos, 2026-11-04: el combustible sale del Presupuesto de mantenimiento de vehículos).
  - Equipo de enduro → Fondo protegido, fondo enduro.
  - Salud → Esencial, sin Presupuesto esencial (`presupuestoId` nulo): resta del Saldo calculado, no consume ninguna bolsa y nunca muestra Impacto en días.
  - Comida afuera, Salidas, Compras personales y Otros → Gusto.
  - Pago de Obligación y "Sin registrar" → categorías de sistema (`esSistema`), que no se pueden borrar.
**And** el usuario puede crear, editar o borrar las categorías que no son de sistema

**Given** el paso del asistente o de Ajustes donde se fija el Presupuesto de mantenimiento de vehículos
**When** se muestra
**Then** un texto de ayuda de `src/textos/` recuerda que ese monto debe incluir el combustible del mes, además de aceite, pastillas, llantas y repuestos

**Given** un Gasto Esencial sin Presupuesto (p. ej. Salud)
**When** se calcula el Estado
**Then** resta del Saldo calculado y del Saldo proyectado, no genera adelanto (FR-9) y no tiene Impacto en días

**Given** los montos mensuales de los Presupuestos esenciales
**When** se calcula el Estado
**Then** el Presupuesto esencial pendiente del mes en curso se descuenta completo en `hoy` y el de cada mes siguiente dentro del Horizonte el día 1 de ese mes

**Given** el aporte mensual y el saldo inicial con fecha del fondo enduro
**When** se calcula el Estado
**Then** el saldo del fondo = saldo inicial + aportes acreditados en cada fecha esperada del Pago 2, acumulando lo no usado, y forma parte de las Reservas
**And** los aportes futuros dentro del Horizonte se descuentan como Aportes programados
**And** la pantalla principal muestra el saldo del fondo enduro

### Story 1.7: Deudas, Deuda objetivo y reserva de Meta *(Congelada)*

> **Congelada (2026-11-11):** diseñada, fuera del MVP y retomable sin rehacer.

Como Priettos,
quiero registrar mis Deudas, elegir la Deuda objetivo con su fecha y que la app reserve cada Periodo lo que necesito abonar,
para que el Dinero libre nunca me ofrezca la plata con la que tengo que llegar a mi Meta.

**Requisitos:** FR2, FR18; AD-6, AD-20, AD-21

**Acceptance Criteria:**

**Given** la pantalla de Deudas
**When** Priettos registra una Deuda (nombre, saldo inicial con fecha, cuota, día de pago y tasa opcional de tipo `EA` por defecto o `MV`)
**Then** se guarda la tasa tal como se ingresó, junto con su tipo
**And** la cuota existe como Obligación mensual con `deudaId`, que no guarda monto ni día propios: los lee de la Deuda

**Given** una Deuda registrada
**When** Priettos la marca como Deuda objetivo con fecha de Meta (31-ene-2027)
**Then** el comando `fijarMeta` agrega una fila en `metas {deudaId, fechaObjetivo, fechaInicio, reemplazadaEn?}` y cierra la Meta anterior en la misma transacción
**And** la Meta activa es la única con `reemplazadaEn` nulo

**Given** las Deudas
**When** se calcula el Estado
**Then** `domain/` normaliza la tasa a mensual (`(1+EA)^(1/12) − 1`) y aplica amortización francesa
**And** el saldo de la Deuda se devuelve como `{valor, aproximado}`, con `aproximado = true` si la Deuda no tiene tasa (toda la cuota es capital)
**And** las cuotas dentro del Horizonte se descuentan del Saldo proyectado por su monto programado

**Given** una Meta activa
**When** se calcula el Estado
**Then** el Periodo va de la fecha esperada de un Pago a la víspera de la siguiente
**And** Ritmo de la Meta = (saldo de la Deuda objetivo al inicio del Periodo − capital amortizado por las cuotas programadas hasta la fecha de la Meta) ÷ Periodos restantes, redondeado hacia arriba y con mínimo 0, y fijo dentro del Periodo
**And** Periodos restantes = cantidad de Periodos, contando el actual, cuyo último día (víspera del siguiente Pago esperado) es ≤ `fechaObjetivo`, con mínimo 1 mientras `hoy ≤ fechaObjetivo`. Un Periodo que termina después de la fecha de la Meta no cuenta; esto concentra el Ritmo en menos Periodos (en contra del usuario, AD-7)
**And** la reserva de Meta del Periodo actual entra en las Reservas, y el Ritmo de los Periodos futuros del Horizonte se descuenta como Aporte programado en la fecha de cada Pago

**Given** que no hay Meta activa, o la Meta activa está cumplida o vencida (`hoy > fechaObjetivo`)
**When** se calcula el Estado
**Then** el Ritmo y la reserva de Meta valen 0 y no hay Aportes programados de Meta (sin Meta activa, `Estado.meta = null`; cumplida o vencida, `Estado.meta` expone su estado para la historia 3.5)
**And** el cálculo nunca divide por cero

**Given** el caso del addendum (estado al 3-nov; Pago 1 el día 10 y Pago 2 el día 30; Deuda objetivo sin tasa, saldo 6.000.000, cuota 1.000.000 el día 5; Meta al 31-ene-2027)
**When** se ejecuta la prueba fija de `calcularEstado`
**Then** los Periodos restantes son 6 (30-oct, 10-nov, 30-nov, 10-dic, 30-dic y 10-ene; el que empieza el 30-ene termina después de la Meta)
**And** el Ritmo de la Meta es 500.000, las Reservas suman 1.250.000, el mínimo del Saldo proyectado es 5.350.000 el 8-nov y el Dinero libre es 1.350.000

### Story 1.8: Asistente de primer uso y Ajustes *(Congelada)*

> **Congelada (2026-11-11):** diseñada, fuera del MVP y retomable sin rehacer. En el MVP, Ajustes lo define la historia 1.10 (UX-DR14).

Como Priettos,
quiero un asistente corto que me guíe la primera vez por toda la configuración y un lugar para editarla después,
para empezar a usar la app en minutos sin olvidar ningún dato.

**Requisitos:** FR1–FR5, UX-DR2, UX-DR14

**Acceptance Criteria:**

**Given** una instalación sin configuración
**When** Priettos abre la app (tras autenticarse)
**Then** el asistente recorre en orden: Pagos → Saldo real inicial y Colchón → Vehículos → Obligaciones → Deudas y Meta → Presupuestos esenciales y fondo enduro
**And** al terminar llega a la pantalla principal con el Dinero libre calculado

**Given** el asistente a medio camino
**When** Priettos cierra la app y la vuelve a abrir
**Then** lo ya guardado se conserva y el asistente continúa en el primer paso incompleto

**Given** la configuración completa
**When** Priettos entra a Ajustes
**Then** puede editar cada elemento (Pagos, saldo inicial, Colchón, umbral del Semáforo con 7 por defecto, Vehículos, Obligaciones, Deudas, Meta, Presupuestos, fondo y categorías)
**And** cada edición recalcula el Estado y deja rastro

**Given** cualquier texto visible del asistente y de Ajustes
**When** se revisa el código
**Then** todo sale de `src/textos/` con la Voz del socio, y los montos se muestran con `formatearDinero()`

### Story 1.9: APK release firmado e instalado en el celular

> **MVP (2026-11-11):** cuarta del orden del MVP, después de 2.2, para usar la app a diario mientras se construye el resto.

Como Priettos,
quiero un APK release firmado que se instale y actualice en mi celular,
para usar MoneyTrack con mis datos reales desde inicios de noviembre.

**Requisitos:** NFR12; AD-24

**Acceptance Criteria:**

**Given** el keystore de release y sus contraseñas en `~/.gradle/gradle.properties`
**When** se ejecutan `APP_VARIANT=release npx expo prebuild` y `assembleRelease`
**Then** un config plugin de firma aplica el keystore sin editar `android/` a mano
**And** el keystore y sus contraseñas no están en el repositorio, y el keystore queda respaldado en el gestor de contraseñas

**Given** un APK release nuevo
**When** se distribuye
**Then** `android.versionCode` en `app.config.ts` subió en 1 respecto al último APK distribuido
**And** el APK se publica en Firebase App Distribution y se instala en el celular, al lado de la variante `.dev`

**Given** un APK release ya instalado con datos
**When** se instala una versión nueva
**Then** se actualiza sin perder los datos y las migraciones pendientes se aplican al abrir

**Given** la verificación de desarrolladores de Android
**When** se prepara la distribución
**Then** la cuenta de desarrollador y los dos applicationId (`dev` y `release`) quedan registrados, o se documenta el plan B con `adb install`

### Story 1.10: Simplificar la app para el MVP

Como Priettos,
quiero que la app deje de pedirme configurar Pagos, saldo, Colchón, Vehículos, Obligaciones, Presupuestos y fondo,
para entenderla de un vistazo y concentrarme en registrar mis gastos.

**Requisitos:** FR33 (base), UX-DR3, UX-DR14; sprint-change-proposal-2026-11-11

**Acceptance Criteria:**

**Given** la app autenticada
**When** Priettos abre Ajustes
**Then** solo ve Categorías, Clave de IA y Exportar
**And** Clave de IA y Exportar aparecen cuando su función exista (historias 4.1 y 7.1); mientras tanto no se muestran

**Given** las pantallas de configuración de Pagos, saldo inicial y Colchón, Vehículos, Obligaciones, y Presupuestos esenciales y fondo enduro (historias 1.4 a 1.6)
**When** se navega por la app
**Then** ninguna tiene entrada en la navegación ni acceso desde Inicio o Ajustes
**And** siguen en el código sin borrarse, igual que sus tablas, comandos, siembra y datos ya guardados, para reactivarlas cuando se descongelen

**Given** Ajustes → Categorías (pantallas de la historia 1.6)
**When** Priettos ve la lista o crea o edita una categoría
**Then** la lista muestra solo los nombres, sin clase, Presupuesto, Fondo ni "pide Vehículo"
**And** el formulario pide solo el nombre; una categoría nueva se guarda con `claseDefault = gusto`, sin `presupuestoId`, sin `fondoId` y con `requiereVehiculo = false`
**And** editar el nombre de una categoría existente conserva su clase y sus enlaces
**And** las categorías de sistema siguen sin poder borrarse

**Given** Inicio
**When** se abre
**Then** no muestra el Dinero libre, el Saldo calculado ni el estado vacío "sin configurar" que llevaba al asistente o a Ajustes
**And** muestra un estado vacío amable, con textos de `src/textos/`, que la historia 2.2 reemplaza por el resumen del mes

**Given** las pruebas de lo ocultado (núcleo de cálculo, comandos y pantallas de 1.3 a 1.6)
**When** se ejecuta `npm run verificar`
**Then** se conservan y pasan, junto con el resto (`tsc --noEmit` + ESLint + Jest)

## Epic 2: Registrar y ver mis gastos

*(Antes: "Registrar el día a día y mantener la app honesta"; redefinida el 2026-11-11.)*

Priettos registra Gastos a mano en segundos, con nota e ítems opcionales, ve en Inicio cuánto lleva gastado en el mes y en qué categorías, consulta la lista y el detalle de sus Gastos y los corrige o borra con rastro visible. Al terminar esta épica, la app ya sirve para llevar los gastos del día a día, aun sin IA.

> **MVP (2026-11-11):** 2.1, 2.2, 2.3 y 2.4 son del MVP. Las antiguas 2.2, 2.3, 2.4 y 2.6, y las partes de las antiguas 2.1 y 2.5 que dependen del Dinero libre, están en "Historias congeladas de la Épica 2" con el prefijo **C** y su número original.

### Story 2.1: Registrar un Gasto a mano

*(Redefinida el 2026-11-11: se agregan `nota` y `gasto_items`; la clase se copia en silencio; sin Vehículo ni Dinero libre al guardar.)*

Como Priettos,
quiero registrar un Gasto escribiendo el monto y eligiendo una categoría reciente, con nota e ítems si quiero,
para que registrar me cueste segundos y no se me escape ningún gasto.

**Requisitos:** FR6, FR8, FR32, NFR7, UX-DR4; AD-3, AD-19

**Acceptance Criteria:**

**Given** la tabla `gastos`, con una fila por compra que nunca se parte: `monto`, `fecha`, `categoriaId`, `clase ∈ {esencial, fondo, gusto}`, `presupuestoId?`, `fondoId?`, `obligacionPagadaId?`, `vehiculoId?`, `comercio?`, `nota?` y `origen ∈ {manual, foto, voz, obligacion, cuadre, semaforo}`
**And** la tabla `gasto_items {id, gastoId, descripcion, monto?, orden}`
**And** las columnas de funciones congeladas (`presupuestoId`, `fondoId`, `obligacionPagadaId`, `vehiculoId`) se crean desde ya, a propósito, para no migrar al descongelar (AD-19)
**When** Priettos registra un Gasto desde Inicio
**Then** el comando `registrarGasto` guarda el Gasto y sus ítems en una sola transacción, con `origen = manual`
**And** la fecha por defecto es `useHoy()` y se puede cambiar

**Given** que Priettos escribe el monto
**When** elige una categoría de la lista de recientes (ordenada por uso reciente)
**Then** la clase y los enlaces (`presupuestoId` o `fondoId`) se copian en silencio de la categoría (FR-8), sin mostrarse ni pedirse
**And** el Gasto queda guardado en ≤ 3 toques después de escribir el monto
**And** la app no pide Vehículo en ningún caso

**Given** el formulario
**When** Priettos agrega comercio, nota o ítems (descripción y monto opcional)
**Then** todo es opcional y los ítems se guardan en su orden
**And** si la suma de los montos de los ítems no cuadra con el total, la app avisa sin bloquear el guardado; los ítems son informativos y no cambian el monto del Gasto

**Given** una categoría editada después de registrar Gastos
**When** se leen los Gastos pasados
**Then** conservan la clase y los enlaces copiados al registrarlos

**Given** un Gasto recién guardado
**When** la app vuelve de guardar
**Then** regresa a Inicio con una confirmación breve de `src/textos/` con la Voz del socio, sin Dinero libre ni Impacto en días

### Story 2.2: Inicio con el resumen del mes

*(Nueva, 2026-11-11.)*

Como Priettos,
quiero abrir la app y ver cuánto llevo gastado este mes, en qué categorías y mis últimos gastos,
para saber en qué se me va la plata sin hacer cuentas.

**Requisitos:** FR33, UX-DR3, NFR6; AD-1 (nota MVP)

**Acceptance Criteria:**

**Given** `domain/`
**When** se llama la función pura `resumenGastos(gastos, mes)` con `mes` en formato `YYYY-MM`
**Then** devuelve el total del mes, el total por categoría (de mayor a menor) y los últimos 5 gastos del mes, ordenados por `(fecha, createdAt)` descendente
**And** solo cuenta los Gastos de ese mes y no usa `Date` ni dependencias fuera de `domain/`

**Given** Inicio
**When** se abre
**Then** muestra el total del mes, el gasto por categoría y los últimos gastos, con montos de `formatearDinero()`
**And** tiene accesos directos al registro a mano y, cuando su función exista, a la foto (4.2) y a la nota de voz (4.3)
**And** se puede navegar al mes anterior y al siguiente
**And** cuando exista la lista y el detalle (2.3), tocar uno de los últimos gastos abre su detalle y hay un acceso a "Ver todos"

**Given** un Gasto registrado, editado o borrado
**When** termina el comando
**Then** el resumen se actualiza solo, sin recargar la pantalla
**And** los Gastos borrados no cuentan

**Given** un mes sin Gastos
**When** se muestra
**Then** Inicio presenta un estado vacío amable que invita a registrar el primero

**Given** las pruebas de `domain/`
**When** se ejecutan
**Then** cubren el mes vacío, varias categorías, Gastos de otros meses excluidos y el orden de los últimos

### Story 2.3: Lista y detalle de gastos

*(Nueva, 2026-11-11.)*

Como Priettos,
quiero ver todos mis gastos del mes y abrir cualquiera para ver su detalle,
para recordar qué compré y dónde.

**Requisitos:** FR34, FR32, NFR6

**Acceptance Criteria:**

**Given** la lista de Gastos
**When** Priettos la abre
**Then** ve los Gastos del mes ordenados por fecha descendente, con monto, categoría, comercio y fecha
**And** puede cambiar de mes y filtrar por categoría
**And** si no hay Gastos, ve un estado vacío amable

**Given** un Gasto de la lista
**When** Priettos lo abre
**Then** ve su detalle: monto, fecha, categoría, comercio, nota, origen, sus ítems en orden y la foto, si la tiene
**And** si la suma de los ítems no cuadra con el total, se indica sin tratarlo como error

**Given** un Gasto cuya foto ya no existe en el almacenamiento
**When** se muestra su detalle
**Then** aparece sin foto, sin error

### Story 2.4: Editar y borrar Gastos con rastro visible

*(Antes 2.5; limitada a Gastos e ítems el 2026-11-11.)*

Como Priettos,
quiero corregir o borrar cualquier Gasto y ver qué cambió,
para arreglar errores sin que la historia se reescriba en silencio.

**Requisitos:** FR12, FR32, UX-DR10; AD-3, AD-4

**Acceptance Criteria:**

**Given** el detalle de un Gasto (historia 2.3)
**When** Priettos lo edita (monto, fecha, categoría, comercio, nota o ítems)
**Then** un comando específico (sin comandos genéricos) aplica el cambio al Gasto y a sus ítems en una sola transacción y escribe en `rastro` la fila completa de antes y de después
**And** si cambia la categoría, la clase y los enlaces se vuelven a copiar en silencio de la nueva categoría
**And** el resumen de Inicio y la lista se actualizan

**Given** un Gasto
**When** Priettos lo borra
**Then** el borrado es lógico (`deletedAt`) para el Gasto y sus ítems, en la misma transacción, queda en `rastro` y deja de contar en el resumen y en la lista

**Given** un Gasto con rastro
**When** Priettos abre su detalle
**Then** ve la historia generada por `domain/diferencias(antes, despues)`, p. ej. "editado 15-oct: 850.000 → 85.000"

### Historias congeladas de la Épica 2

Estas historias (y partes de historias) quedan **Congeladas** desde el 2026-11-11: diseñadas, fuera del MVP y retomables sin rehacer. Llevan el prefijo **C** con su número original para no chocar con la nueva numeración; su contenido se conserva sin cambios.

### Story C2.1: Gasto manual con Vehículo, bolsas y Dinero libre (parte congelada de la antigua 2.1) *(Congelada)*

> **Congelada (2026-11-11):** criterios de la antigua 2.1 que dependen del Vehículo, de las bolsas y del Dinero libre. Requisitos originales: FR6, FR8, FR10, UX-DR6; AD-19.

**Acceptance Criteria:**

**Given** una categoría con `requiereVehiculo = true`
**When** Priettos intenta guardar sin Vehículo
**Then** la app le pide elegir el Vehículo antes de guardar

**Given** Gastos registrados
**When** se calcula el Estado
**Then** todo Gasto resta del Saldo calculado
**And** `domain/` consume las bolsas en orden `(fecha, createdAt)`: un Gasto Esencial consume su Presupuesto esencial del mes (y reduce su pendiente), y un Gasto de Fondo protegido consume el saldo del fondo
**And** lo que excede el saldo de un Fondo protegido se trata como Gusto, y el Estado expone por Gasto la parte cubierta y la desbordada

**Given** un Gasto recién guardado
**When** la app vuelve de guardar
**Then** muestra el Dinero libre restante con `formatearDinero()` y un texto de `src/textos/` con la Voz del socio
**And** si el Gasto es Esencial o está cubierto por el fondo, el texto lo dice (p. ej. "sale de tu Presupuesto de mantenimiento")

### Story C2.2: Adelanto de un gasto previsto *(Congelada)*

> **Congelada (2026-11-11):** antes historia 2.2; diseñada, fuera del MVP y retomable sin rehacer.

Como Priettos,
quiero que una compra esencial que excede el Presupuesto del mes (como una llanta en oferta) se descuente del mes siguiente,
para que adelantar algo necesario no se cuente como un Gusto.

**Requisitos:** FR9; AD-19

**Acceptance Criteria:**

**Given** un Presupuesto esencial de mantenimiento de 400.000 con 100.000 disponibles en el mes
**When** Priettos registra un Gasto Esencial de mantenimiento por 300.000
**Then** el Estado marca 100.000 como cubiertos en el mes actual y 200.000 como adelanto
**And** el Presupuesto esencial pendiente del mes siguiente se reduce en 200.000, y el Gasto no se trata como Gusto

**Given** un adelanto que supera el Presupuesto del mes siguiente
**When** se calcula el Estado
**Then** el exceso se encadena al mes posterior, y así sucesivamente

**Given** un Gasto con adelanto
**When** Priettos lo ve en la lista de movimientos o tras guardarlo
**Then** la app indica "adelanto" y el monto que se descuenta del mes siguiente
**And** "adelanto" nunca se guarda como columna: lo deriva `domain/`

**Given** las pruebas de `domain/`
**When** se ejecutan
**Then** cubren el adelanto simple, el encadenado y el Gasto que cabe exacto en el Presupuesto

### Story C2.3: Confirmar Pagos y registrar Otros ingresos *(Congelada)*

> **Congelada (2026-11-11):** antes historia 2.3; diseñada, fuera del MVP y retomable sin rehacer.

Como Priettos,
quiero confirmar cada Pago con el monto que realmente recibí y registrar otros ingresos,
para que el Saldo calculado refleje el dinero real.

**Requisitos:** FR11; AD-5

**Acceptance Criteria:**

**Given** un Pago esperado (Pago 1 o Pago 2)
**When** Priettos lo confirma con el monto recibido y la fecha
**Then** el comando `confirmarPago` crea una fila en `pagos_confirmados` con `(definicionId, clave YYYY-MM)` única
**And** por defecto se asigna a la ocurrencia abierta más antigua, y Priettos puede cambiarla

**Given** un Pago no confirmado
**When** se calcula el Estado
**Then** el Saldo calculado no lo incluye y el Saldo proyectado lo sigue tratando como esperado en su fecha (o en `hoy`, si está atrasado)
**And** al confirmarlo, el Saldo calculado suma el monto recibido y deja de proyectarse como esperado

**Given** la pantalla principal con un Pago atrasado
**When** se muestra
**Then** se indica que el Pago está pendiente de confirmar, con acceso directo a confirmarlo

**Given** la pantalla de Otros ingresos
**When** Priettos registra un Otro ingreso (monto, fecha, descripción)
**Then** se guarda en `otros_ingresos` y suma al Saldo calculado

### Story C2.4: Pagar Obligaciones con "ya pagamos" *(Congelada)*

> **Congelada (2026-11-11):** antes historia 2.4; diseñada, fuera del MVP y retomable sin rehacer.

Como Priettos,
quiero ver las Obligaciones pendientes hasta el próximo Pago y marcarlas "ya pagamos" a medida que las pago,
para que nada se me olvide y el Dinero libre deje de apartar lo que ya pagué.

**Requisitos:** FR26, FR13; AD-6

**Acceptance Criteria:**

**Given** la pantalla de Obligaciones pendientes
**When** se abre
**Then** lista las ocurrencias pendientes y vencidas con vencimiento hasta el próximo Pago esperado, con nombre, fecha y monto
**And** las vencidas aparecen primero y marcadas como vencidas

**Given** una Obligación de la lista
**When** Priettos toca "ya pagamos" y confirma el monto (editable, precargado con el programado; el monto real cierra la ocurrencia aunque difiera del programado)
**Then** el comando `marcarObligacionPagada`, en una sola transacción, crea la fila en `obligaciones_pagadas` con `(definicionId, clave)` y un Gasto `origen = obligacion`, `clase = esencial`, categoría de sistema "Pago de Obligación" y `obligacionPagadaId`
**And** la ocurrencia deja de descontarse en el Saldo proyectado y desaparece de las vencidas en la pantalla principal

**Given** una Obligación que es la cuota de una Deuda
**When** se marca pagada
**Then** el saldo de la Deuda baja por el capital (monto pagado − interés del mes, mínimo 0, AD-6)
**And** si se pagó más que la cuota, el exceso sí baja el saldo como capital, pero no es un Abono: no consume la reserva de Meta ni cuenta como "ya abonado" en el Ritmo
**And** si se pagó menos que la cuota, la ocurrencia queda cerrada igual (pagada por el monto real) y el saldo baja solo por ese capital; la app no crea una deuda pendiente por la diferencia

**Given** una Obligación anual
**When** se marca pagada
**Then** su reserva anual se reinicia y vuelve a acumular el prorrateo desde ese momento

**Given** que no hay Obligaciones pendientes hasta el próximo Pago
**When** se abre la pantalla
**Then** muestra un estado vacío amable ("todo al día")

**Given** una Obligación vencida que no se marca
**When** pasan los días
**Then** sigue visible como vencida en la pantalla principal y descontándose en `hoy`

### Story C2.5: Otros movimientos y rendimiento (parte congelada de la antigua 2.5) *(Congelada)*

> **Congelada (2026-11-11):** criterios de la antigua 2.5 que tocan movimientos distintos de los Gastos o el rendimiento de `calcularEstado`. Requisitos originales: FR12, NFR10, UX-DR10; AD-3, AD-4.

**Acceptance Criteria:**

**Given** la pestaña Movimientos (historia 1.4)
**When** Priettos la abre
**Then** ve la lista de movimientos (Gastos, Pagos confirmados, Otros ingresos y Obligaciones pagadas; luego también Abonos) ordenada por fecha descendente, con monto, categoría o tipo y fecha, y un estado vacío si no hay movimientos
**And** desde cada movimiento puede abrir su detalle, editarlo o borrarlo

**Given** el Gasto de una Obligación pagada
**When** Priettos lo borra
**Then** en la misma transacción se borra la fila de `obligaciones_pagadas` y la ocurrencia vuelve a estar pendiente (o vencida)

**Given** un conjunto generado de 12 meses de datos (Pagos, Gastos, Obligaciones, Deudas)
**When** se ejecuta la prueba de rendimiento
**Then** `calcularEstado` tarda < 200 ms

### Story C2.6: Cuadrar contra el banco e historial de Cuadres *(Congelada)*

> **Congelada (2026-11-11):** antes historia 2.6; diseñada, fuera del MVP y retomable sin rehacer.

Como Priettos,
quiero ingresar mi Saldo real y registrar la diferencia con un toque,
para que la app se mantenga honesta aunque olvide registrar algo.

**Requisitos:** FR14, FR15, UX-DR8; AD-2, AD-4

**Acceptance Criteria:**

**Given** la pantalla de Cuadre
**When** Priettos ingresa su Saldo real
**Then** la app muestra el Saldo calculado y la diferencia en monto y en porcentaje
**And** el porcentaje = |Saldo real − Saldo calculado| ÷ Saldo real × 100, con un decimal (la misma base que SM-2); si el Saldo real es 0 o negativo, el porcentaje se muestra como "—" y se guarda nulo
**And** se llega al Cuadre desde la pantalla principal en cualquier momento, no solo tras confirmar un Pago, y el historial de Cuadres se abre desde la misma pantalla de Cuadre

**Given** que falta dinero (Saldo real < Saldo calculado)
**When** Priettos confirma
**Then** el comando `hacerCuadre`, en una sola transacción, guarda la instantánea en `cuadres` (Saldo real, Saldo calculado, diferencia, porcentaje, fecha) y crea un Gasto `origen = cuadre`, `clase = gusto`, categoría "Sin registrar"
**And** ese Gasto no muestra Impacto en días ni toca Fondos protegidos

**Given** que sobra dinero (Saldo real > Saldo calculado)
**When** Priettos confirma
**Then** se guarda el Cuadre y se crea un Otro ingreso por la diferencia

**Given** una diferencia de 0
**When** Priettos confirma
**Then** se guarda el Cuadre sin crear ningún movimiento

**Given** que Priettos acaba de confirmar un Pago
**When** termina la confirmación
**Then** la app le pide hacer un Cuadre en ese momento (puede posponerlo)

**Given** el historial de Cuadres
**When** Priettos lo abre
**Then** ve cada Cuadre con fecha, diferencia en monto y porcentaje
**And** los Cuadres pasados conservan su diferencia aunque luego se editen movimientos, y `domain/` nunca los lee como entrada

**Given** el Gasto sin registrar de un Cuadre
**When** Priettos lo borra
**Then** en la misma transacción se borra el Cuadre que lo originó

**Given** un último Cuadre con fecha F
**When** Priettos registra un Gasto con fecha anterior a F
**Then** la app avisa que ese Gasto pudo haber quedado contado también en el Gasto sin registrar, sin corregirlo sola

## Epic 3: Seguir mi Meta y mi Día de Libertad *(Congelada)*

> **Congelada (2026-11-11):** diseñada, fuera del MVP y retomable sin rehacer. La épica completa y sus historias se conservan sin cambios.

Priettos ve su Meta como una cuenta regresiva: Avance, Ritmo, Fecha de la Meta proyectada y Día de Libertad. Registra Abonos, sabe si va "al día" o "atrasado" y conoce cuántos días le cuesta cada Gusto. La app celebra cuando cumple la Meta y le pide una nueva fecha si vence.

### Story 3.1: Registrar Abonos a una Deuda

Como Priettos,
quiero registrar un Abono a cualquier Deuda cuando yo lo decida,
para que la Deuda baje y la reserva de Meta se use para lo que fue apartada.

**Requisitos:** FR17, FR18; AD-20

**Acceptance Criteria:**

**Given** la tabla `abonos` (`deudaId`, `monto`, `fecha`)
**When** Priettos registra un Abono a una Deuda
**Then** el comando `registrarAbono` lo guarda en una sola transacción
**And** el Abono baja el saldo de esa Deuda y el Saldo calculado

**Given** un Abono a la Deuda objetivo dentro del Periodo actual
**When** se calcula el Estado
**Then** `reservaMeta = max(0, ritmoMeta − Abonos a la Deuda objetivo dentro del Periodo)`
**And** el Ritmo de la Meta del Periodo no cambia: el Abono cuenta una sola vez, consumiendo la reserva

**Given** un Abono a una Deuda que no es la objetivo
**When** se calcula el Estado
**Then** baja el saldo de esa Deuda y el Saldo calculado, pero no consume la reserva de Meta

**Given** el caso del addendum (estado al 3-nov) más un Abono de 500.000 a la Deuda objetivo el 4-nov
**When** se ejecuta la prueba fija
**Then** la reserva de Meta del Periodo queda en 0, el Saldo calculado baja 500.000, el saldo de la Deuda objetivo baja 500.000 y el Dinero libre sigue en 1.350.000

**Given** cualquier flujo de la app
**When** se revisan los comandos
**Then** ningún comando crea Abonos automáticamente: solo `registrarAbono`, iniciado por Priettos
**And** los Abonos se pueden editar y borrar con rastro, como los demás movimientos

### Story 3.2: Fecha de la Meta proyectada, Día de Libertad y Meta en la pantalla principal

Como Priettos,
quiero ver la cuenta regresiva de mi Meta y mi Día de Libertad en la pantalla principal,
para dormir tranquilo viendo que las Deudas bajan.

**Requisitos:** FR13, FR16, UX-DR3, UX-DR12; AD-6

**Acceptance Criteria:**

**Given** las Deudas con su cronograma real de cuotas (amortización francesa) y los Abonos ya hechos
**When** se calcula el Estado
**Then** la Fecha de la Meta proyectada es la fecha en que la Deuda objetivo llega a cero, sin asumir Abonos futuros
**And** el Día de Libertad es la fecha en que todas las Deudas llegan a cero con sus cuotas y los Abonos ya hechos, sin bola de nieve
**And** ambas fechas se devuelven como `{valor, aproximado}`, con `aproximado = true` si alguna Deuda involucrada no tiene tasa

**Given** una Deuda cuya cuota no alcanza a bajar el saldo (cuota ≤ interés del mes) o que no llega a cero dentro de 600 meses
**When** se proyecta
**Then** la Fecha de la Meta proyectada o el Día de Libertad se devuelven como `{valor: null, aproximado}`, sin bucles infinitos
**And** la pantalla principal lo dice con la Voz del socio (p. ej. "con esta cuota la Deuda no baja"), sin inventar una fecha

**Given** una Meta activa
**When** se calcula el Estado
**Then** el Avance = saldo de la Deuda objetivo en `fechaInicio` de la Meta − saldo actual, como `{valor, aproximado}`

**Given** la pantalla principal con una Meta activa
**When** se muestra
**Then** incluye el Avance (p. ej. "vas 2,1 de 6 millones"), el Ritmo de la Meta del Periodo, la Fecha de la Meta proyectada con la cuenta regresiva en días y el Día de Libertad
**And** toda cifra con `aproximado = true` se marca visiblemente como "aproximado"

**Given** `src/textos/` y la frase del Avance
**When** se formatea "vas X de Y millones"
**Then** se usa `formatearMillones(monto, sentido)`, la única excepción a `formatearDinero()`: un decimal con coma, y el redondeo nunca a favor (el Avance hacia abajo, el total de la Deuda hacia arriba; p. ej. 2.149.999 → "2,1" y 5.950.001 → "6")
**And** tiene pruebas con esos casos, con 0 y con montos menores a un millón

**Given** un cambio en cualquier hecho (Gasto, cuota pagada, Abono, edición)
**When** termina el comando
**Then** las proyecciones se recalculan y la pantalla principal las refleja

**Given** un Abono pequeño que no alcanza el monto de una cuota
**When** se recalcula
**Then** la Fecha de la Meta proyectada puede no moverse: usa el cronograma discreto, no el modelo lineal del Impacto en días

### Story 3.3: Impacto en días al registrar un Gasto

Como Priettos,
quiero saber cuántos días le cuesta a mi Meta cada Gusto que registro,
para sentir el costo real de mis decisiones sin que nadie me sermonee.

**Requisitos:** FR10, UX-DR6

**Acceptance Criteria:**

**Given** una Meta activa
**When** se llama `impactoEnDias(estado, monto)`
**Then** devuelve ⌈monto ÷ cuota mensual de la Deuda objetivo × 30⌉, nunca aproximado
**And** sin Meta activa devuelve `null`

**Given** un Gasto Gusto recién guardado
**When** la app muestra el resultado
**Then** muestra el Dinero libre restante y el Impacto en días del monto (p. ej. "te cuesta 4 días de tu Meta"), con la Voz del socio

**Given** un Gasto de Fondo protegido que excede el saldo del fondo
**When** se guarda
**Then** el Impacto en días se calcula solo sobre la parte desbordada

**Given** un Gasto Esencial o cubierto por completo por un Fondo protegido
**When** se guarda
**Then** la app dice "no le cuesta días a tu Meta"

**Given** un Gasto sin registrar (`origen = cuadre`)
**When** se registra
**Then** no muestra Impacto en días

### Story 3.4: Ritmo de la Meta y aviso al confirmar un Pago o cuadrar

Como Priettos,
quiero ver, al confirmar un Pago o hacer un Cuadre, cuánto debo abonar este Periodo y si voy al día,
para decidir el Abono en el momento en que tengo el dinero.

**Requisitos:** FR19, UX-DR8

**Acceptance Criteria:**

**Given** una Meta activa
**When** Priettos termina de confirmar un Pago o de hacer un Cuadre
**Then** la app muestra el Ritmo de la Meta del Periodo, lo ya abonado en el Periodo y "al día" (abonado ≥ Ritmo) o "atrasado X" (X = Ritmo − abonado)
**And** ofrece un acceso directo para registrar un Abono

**Given** que la reserva de Meta del Periodo no cabe sin que el Saldo proyectado baje del Colchón, es decir, `dineroLibre < 0` y `reservaMeta > 0`
**When** se muestra el aviso
**Then** la app lo dice explícitamente, sin suavizarlo (p. ej. "este Periodo el Ritmo de tu Meta no cabe sin tocar tu Colchón")

**Given** que no hay Meta activa
**When** Priettos confirma un Pago o cuadra
**Then** no se muestra el aviso de Ritmo

### Story 3.5: Meta cumplida o vencida

Como Priettos,
quiero que la app celebre cuando liquido la Deuda objetivo y me ayude a elegir la siguiente, o me avise si la fecha pasó,
para seguir avanzando sin quedarme sin rumbo.

**Requisitos:** FR20, UX-DR11; AD-21

**Acceptance Criteria:**

**Given** una Meta activa cuya Deuda objetivo llega a saldo ≤ 0
**When** se calcula el Estado
**Then** la Meta se deriva como "cumplida", sin guardarlo en ninguna columna
**And** la app muestra una celebración con la Voz del socio y pide elegir la siguiente Deuda objetivo y su fecha

**Given** una Meta cumplida sin una nueva elegida
**When** Priettos sigue usando la app
**Then** el Estado trata la Meta como inexistente para el cálculo: Ritmo y reserva de Meta en 0 e `impactoEnDias` = `null`
**And** la app sigue recordando elegir una nueva Meta

**Given** una Meta activa con `hoy > fechaObjetivo` y la Deuda objetivo aún con saldo
**When** se calcula el Estado
**Then** la Meta se deriva como "vencida" y la app pide una nueva fecha, sin culpar
**And** mientras no haya una nueva fecha, el Estado la trata como inexistente para el cálculo (decisión 2026-11-04): Ritmo y reserva de Meta en 0, `impactoEnDias` = `null` y el Semáforo solo da 🟢 o 🔴, igual que con la Meta cumplida
**And** la pantalla principal sigue mostrando el Avance y la Deuda objetivo, marcada como "vencida"

**Given** que Priettos elige una nueva Deuda objetivo o una nueva fecha
**When** confirma
**Then** `fijarMeta` agrega una nueva fila en `metas` con `fechaInicio = hoy` y cierra la anterior (`reemplazadaEn`) en la misma transacción
**And** el Avance de la nueva Meta parte del saldo de su Deuda objetivo en `fechaInicio`, aunque esa Deuda ya estuviera medio pagada

## Epic 4: Registrar gastos con IA

*(Antes: "Registrar Gastos con una foto"; ampliada el 2026-11-11 con la nota de voz, los ítems y la categoría sugerida.)*

Priettos fotografía una factura o dicta una nota de voz y confirma con un toque la propuesta editable: monto, comercio, fecha, ítems y categoría sugerida. Si no hay conexión o la extracción falla, la captura queda en cola y él completa el Gasto a mano o lo confirma después. No hay backend: la app habla con Gemini usando la clave de Priettos.

> **MVP (2026-11-11):** 4.1, 4.2, 4.3 (nueva) y 4.4 (antes 4.3) son del MVP. Se quitó todo lo relativo al Vehículo y al Dinero libre tras guardar.

### Story 4.1: Clave de IA y extractor

*(Redefinida el 2026-11-11: contrato `PropuestaGasto` con ítems y `extraerNotaDeVoz`; sale `vehiculoSugeridoId`.)*

Como Priettos,
quiero ingresar mi clave de la API de IA de forma segura y que la app sepa leer una factura o una nota de voz,
para que la extracción funcione sin backend y sin exponer mis secretos.

**Requisitos:** FR7, FR31, FR32, NFR4, NFR8, NFR11, UX-DR14; AD-11, AD-12

**Acceptance Criteria:**

**Given** Ajustes
**When** Priettos ingresa su clave de la API de Gemini
**Then** se guarda solo en `expo-secure-store`, sin backend
**And** nunca aparece en el código, en `app.config.ts`, en SQLite, en la exportación, en el respaldo ni en el log
**And** la opción "Clave de IA" aparece en Ajustes (historia 1.10)

**Given** `services/extractor`
**When** se llama `extraerFactura(fotoUri, categorias: {id, nombre}[])` o `extraerNotaDeVoz(audioUri, categorias: {id, nombre}[], hoy)`
**Then** ambas devuelven `Resultado<PropuestaGasto>`, validado con un único esquema Zod: `PropuestaGasto {monto: entero | null, comercio | null, fecha | null, categoriaId | null, items: {descripcion, monto | null}[]}`
**And** Gemini recibe la imagen o el audio directamente, junto con la lista de categorías (y `hoy`, en la voz, para resolver fechas relativas como "ayer")
**And** un `categoriaId` que no está en la lista recibida se convierte en `null`
**And** una respuesta del proveedor que no cumple el esquema devuelve `{ok: false, error}`, sin lanzar excepciones

**Given** el adaptador del proveedor
**When** se revisa
**Then** es el único lugar que conoce a Gemini, y el id del modelo (`gemini-3.8-flash`) es un ajuste de ese adaptador

**Given** una extracción que tarda más de 10 s (foto) o 15 s (voz)
**When** se cumple el tiempo
**Then** se aborta y devuelve `{ok: false, error: timeout}`

**Given** que no hay clave configurada
**When** se intenta extraer
**Then** devuelve un error que la interfaz traduce a un mensaje amable con acceso a Ajustes

**Given** las pruebas
**When** se ejecutan
**Then** cubren, para foto y voz, la respuesta válida (con y sin ítems), la respuesta inválida, el `categoriaId` desconocido, el timeout y la falta de clave, con el adaptador simulado

### Story 4.2: Fotografiar una factura y confirmar la propuesta

*(Actualizada el 2026-11-11: ítems y categoría sugerida; sin Vehículo.)*

Como Priettos,
quiero tomar una foto de la factura y confirmar lo que la app propone con un toque,
para registrar un Gasto al salir del taller en segundos.

**Requisitos:** FR7, FR32, NFR8, UX-DR5; AD-19, AD-22

**Acceptance Criteria:**

**Given** Inicio
**When** Priettos toca la cámara y toma la foto (`expo-image-picker`)
**Then** la foto se copia al almacenamiento de la app y se crea una fila en `capturas {id, tipo = foto, uri, estado = pendiente}` antes de extraer

**Given** una captura pendiente con conexión
**When** la extracción termina bien
**Then** la fila pasa a `estado = propuesta`, guarda la propuesta en JSON y la pantalla de confirmación aparece en ≤ 10 s desde la foto
**And** la pantalla muestra monto, comercio, fecha, la categoría sugerida por la IA y los ítems, todos editables (se pueden agregar, editar o quitar ítems)

**Given** una captura de foto
**When** la extracción falla (sin conexión, timeout, respuesta inválida o sin clave)
**Then** la app lo dice con la Voz del socio y abre el registro a mano con la foto adjunta, sin perder la foto
**And** la captura queda en `estado = pendiente` (los reintentos y la bandeja "Por confirmar" llegan en 4.4)

**Given** la pantalla de confirmación
**When** la suma de los montos de los ítems no cuadra con el total
**Then** la app avisa sin bloquear la confirmación

**Given** una propuesta con `monto = null`
**When** Priettos intenta confirmar
**Then** la app le pide el monto antes de guardar

**Given** la pantalla de confirmación
**When** Priettos confirma
**Then** `registrarGasto` crea el Gasto con `origen = foto`, sus ítems, la foto adjunta y la fila de `capturas` en `estado = confirmada` con `gastoId`, todo en una sola transacción
**And** la clase y los enlaces se copian en silencio de la categoría elegida, como en el registro a mano (2.1)
**And** luego vuelve a Inicio con el resumen actualizado

**Given** la propuesta
**When** Priettos sale sin confirmar
**Then** no se guarda ningún Gasto, y ni `resumenGastos` ni `calcularEstado` leen la tabla `capturas`

### Story 4.3: Nota de voz y confirmar la propuesta

*(Nueva, 2026-11-11.)*

Como Priettos,
quiero dictar un gasto en una nota de voz ("almuerzo en el corrientazo, 18 mil") y confirmar lo que la app propone,
para registrar sin escribir cuando no tengo factura.

**Requisitos:** FR31, FR32, NFR4, NFR8, UX-DR5; AD-11, AD-22

**Acceptance Criteria:**

> **Nota para create-story:** el módulo de audio de Expo SDK 57 se elige verificando la documentación versionada (`https://docs.expo.dev/versions/v57.0.0/`) y se instala con `npx expo install`.

**Given** la grabación de voz
**When** se revisan las dependencias
**Then** usa un módulo de audio de Expo SDK 57 instalado con `npx expo install`

**Given** la primera vez que Priettos toca el botón de voz
**When** la app pide el permiso de micrófono y él lo niega
**Then** la app lo explica con la Voz del socio y sigue funcionando con la foto y el registro a mano

**Given** Inicio
**When** Priettos toca el botón de voz y graba
**Then** ve que está grabando y el tiempo restante, y puede detener o cancelar
**And** la grabación se detiene sola a los 60 s como máximo
**And** si cancela, no se crea captura y el audio se borra
**And** al detener, el audio se copia al almacenamiento de la app y se crea una fila en `capturas {id, tipo = voz, uri, estado = pendiente}` antes de extraer

**Given** una captura de voz pendiente con conexión
**When** `extraerNotaDeVoz` termina bien
**Then** la propuesta aparece en ≤ 15 s en la misma pantalla de confirmación de 4.2, con monto, comercio, fecha, categoría sugerida e ítems editables
**And** si la IA no entendió el monto (`monto = null`), la confirmación lo pide antes de guardar

**Given** una captura de voz
**When** la extracción falla (sin conexión, timeout, respuesta inválida o sin clave)
**Then** la app lo dice con la Voz del socio y abre el registro a mano; la captura queda `pendiente` con su audio para reintentar en 4.4

**Given** la pantalla de confirmación de una nota de voz
**When** Priettos confirma
**Then** `registrarGasto` crea el Gasto con `origen = voz` y sus ítems, y la captura pasa a `estado = confirmada` con `gastoId`, en una sola transacción
**And** el archivo de audio se borra del almacenamiento

**Given** la propuesta de una nota de voz
**When** Priettos la descarta
**Then** no se guarda ningún Gasto, la captura pasa a `estado = descartada` y el archivo de audio se borra

### Story 4.4: Capturas sin conexión, fallos y "Por confirmar"

*(Antes 4.3; ampliada el 2026-11-11 a fotos y audios.)*

Como Priettos,
quiero que una foto o una nota de voz tomada sin señal o mal leída no se pierda,
para registrar siempre, aunque la IA no esté disponible.

**Requisitos:** FR7, FR31, NFR3, UX-DR5; AD-22

**Acceptance Criteria:**

**Given** la tabla `capturas {id, tipo: foto | voz, uri, estado: pendiente | propuesta | confirmada | descartada, propuesta?, gastoId?}`
**When** se toma una foto o se graba una nota de voz sin conexión, o la extracción falla o vence el tiempo
**Then** la captura queda en `estado = pendiente` y la app ofrece completar el Gasto a mano en ese momento (con la foto adjunta, si es foto)

**Given** que Priettos completa el Gasto a mano desde una captura pendiente
**When** lo guarda
**Then** la fila de `capturas` pasa a `confirmada` con su `gastoId` y no se vuelve a extraer
**And** si es una nota de voz, el audio se borra

**Given** capturas pendientes
**When** la app se abre o vuelve la conexión (detectada con `expo-network`, instalado con `npx expo install`)
**Then** se reintenta su extracción, sin tareas en segundo plano

**Given** una extracción tardía que termina sin Gasto asociado
**When** queda en `estado = propuesta`
**Then** aparece en la bandeja "Por confirmar", con acceso desde Inicio y un contador
**And** desde ahí Priettos la confirma con la misma pantalla de 4.2 o la descarta (`estado = descartada`, y el audio se borra si es voz)

**Given** un Gasto cuya foto ya no existe en el almacenamiento (p. ej. tras restaurar)
**When** se muestra
**Then** aparece sin foto, sin error

## Epic 5: Preguntar "¿Puedo?" antes de comprar *(Congelada)*

> **Congelada (2026-11-11):** diseñada, fuera del MVP y retomable sin rehacer. La épica completa y sus historias se conservan sin cambios.

Priettos escribe un precio y en ≤ 5 s recibe un veredicto honesto 🟢/🟡/🔴, con el Dinero libre resultante y el Impacto en días. Con "Lo compré" lo convierte en Gasto con un toque. El Semáforo informa y nunca bloquea.

### Story 5.1: Reglas del Semáforo en el núcleo

Como Priettos,
quiero que el veredicto salga del mismo cálculo que mi Dinero libre,
para confiar en que el Semáforo nunca es complaciente.

**Requisitos:** FR22; AD-1, AD-21

**Acceptance Criteria:**

**Given** `domain/evaluar-compra`
**When** se llama `evaluarCompra(estado, precio, fondoId?)`
**Then** devuelve `{color, r, dineroLibreResultante, impactoEnDias, comeReservaMeta}`, leyendo solo el `Estado`
**And** R = precio − la parte que cubre el saldo del Fondo protegido elegido (mínimo 0)

**Given** una Meta activa y el umbral configurado (7 días por defecto)
**When** se evalúa
**Then** el color es 🟢 si R ≤ Dinero libre e `impactoEnDias(R)` < umbral
**And** es 🟡 si R ≤ Dinero libre e `impactoEnDias(R)` ≥ umbral, o si R > Dinero libre pero R ≤ Dinero libre + reserva de Meta del Periodo (con `comeReservaMeta = true`)
**And** es 🔴 si R > Dinero libre + reserva de Meta

**Given** que no hay Meta activa (o está cumplida o vencida sin una nueva elegida)
**When** se evalúa
**Then** el color es 🟢 si R ≤ Dinero libre y 🔴 si no, con `impactoEnDias = null`

**Given** la tabla del addendum (estado al 3-nov, umbral 7, cuota de la Deuda objetivo 1.000.000)
**When** se ejecuta la prueba fija
**Then** comida afuera de 120.000 → 🟢 (4 días); botas de 600.000 con fondo enduro (saldo 350.000) → R = 250.000, 🟡 (8 días); casco de 1.500.000 → 🟡 (45 días, come reserva de Meta); llantas de "gusto" de 2.000.000 → 🔴 (60 días)

### Story 5.2: Pantalla "¿Puedo?", veredicto y "Lo compré"

Como Priettos,
quiero escribir un precio a las 11 p. m. y ver en segundos si puedo, y registrar la compra con un toque si la hago,
para decidir con calma y sin culpa.

**Requisitos:** FR21, FR23, FR24, NFR9, UX-DR7

**Acceptance Criteria:**

**Given** la pantalla principal
**When** Priettos toca "¿Puedo?"
**Then** se abre una pantalla con el campo de precio enfocado y un selector opcional de Fondo protegido
**And** desde tocar el ícono de la app (incluida la autenticación con huella) hasta ver el veredicto pasan ≤ 5 s, medido con cronómetro sobre el APK release (mediana de 5 intentos, escribiendo un precio de 6 dígitos)
**And** `evaluarCompra` sobre un Estado ya calculado tarda < 50 ms (prueba)

**Given** un precio ingresado
**When** Priettos pide el veredicto
**Then** la app muestra el color, el Dinero libre resultante y el Impacto en días en una sola frase simple de `src/textos/` con la Voz del socio (p. ej. "350.000 salen de tu fondo enduro; los 250.000 restantes le cuestan 8 días a tu Meta")
**And** un 🔴 nunca se suaviza, y ningún color bloquea la compra

**Given** cada consulta respondida
**When** se muestra el veredicto
**Then** se guarda la instantánea en `consultas_semaforo` (fecha, monto, fondo, color, R, Impacto en días y si se compró)
**And** `domain/` nunca lee esa tabla como entrada

**Given** un veredicto de cualquier color
**When** Priettos toca "Lo compré"
**Then** en una sola transacción se crea el Gasto (`origen = semaforo`; clase fondo con ese fondo si se eligió uno, o Gusto si no; categoría editable con la última usada como sugerencia) y la consulta se marca como comprada
**And** luego se muestran el Dinero libre restante y el Impacto en días

**Given** un Gasto creado por "Lo compré"
**When** después se borra
**Then** la instantánea de la consulta no cambia

## Epic 6: Sesión de pagos agendada y avisos a tiempo *(Congelada)*

> **Congelada (2026-11-11):** diseñada, fuera del MVP y retomable sin rehacer. La épica completa y sus historias se conservan sin cambios.

La app cita a Priettos para pagar junto lo del Periodo el día siguiente a cada Pago, le recuerda el Cuadre pendiente y le avisa con tiempo de los vencimientos anuales de sus Vehículos. Todas las notificaciones se derivan de los datos desde un único punto y ninguna muestra montos.

### Story 6.1: Sesión de pagos agendada con notificación

Como Priettos,
quiero que la app me cite a una hora fija el día siguiente a cada Pago para pagar todas mis Obligaciones,
para pagar todo de una vez en lugar de perseguir recordatorios sueltos.

**Requisitos:** FR25, NFR4, UX-DR9, UX-DR14; AD-13

**Acceptance Criteria:**

**Given** `services/notificaciones`
**When** se llama `reprogramar(estado, hoy)`
**Then** cancela todas las notificaciones locales (`expo-notifications`) y las recrea desde el `Estado`
**And** es la única función del código que programa notificaciones

**Given** el ciclo de la app
**When** termina un comando por `ejecutar()`, se abre la app o `suscribirHoy` avisa de un cambio de día
**Then** se llama `reprogramar` con el `Estado` recalculado y `hoy`

**Given** Ajustes
**When** Priettos fija la hora de la Sesión de pagos
**Then** se guarda como configuración, y por defecto la Sesión queda el día siguiente a la fecha esperada de cada Pago, a esa hora

**Given** una Sesión de pagos futura
**When** llega la hora
**Then** se muestra una notificación con un texto de `src/textos/` sin montos
**And** al tocarla, se abre la lista de Obligaciones pendientes hasta el próximo Pago (historia C2.4, antes 2.4)

**Given** el primer uso de las notificaciones
**When** la app las necesita
**Then** pide el permiso de notificaciones de Android (`POST_NOTIFICATIONS`, Android 13+)
**And** usa notificaciones programadas inexactas (sin `SCHEDULE_EXACT_ALARM`); un retraso de unos minutos es aceptable
**And** si Priettos lo niega, la app sigue funcionando y Ajustes indica que los avisos están desactivados

**Given** una Obligación borrada
**When** se reprograma
**Then** no queda ninguna notificación de esa Obligación

### Story 6.2: Recordatorio de Cuadre y vencimientos anuales

Como Priettos,
quiero que la app me recuerde cuadrar si se me pasó y me avise con tiempo de los SOAT, tecnomecánicas e impuestos,
para no perder el hábito ni pagar multas.

**Requisitos:** FR14, FR27; AD-13

**Acceptance Criteria:**

**Given** un Pago confirmado sin un Cuadre posterior
**When** se reprograma
**Then** queda programado un recordatorio de Cuadre para el día siguiente a la confirmación
**And** si se hace el Cuadre antes, el recordatorio desaparece en la siguiente reprogramación

**Given** una Obligación anual de Vehículo pendiente
**When** se reprograma
**Then** quedan programados avisos 30 y 7 días antes de su vencimiento, con el nombre de la Obligación y del Vehículo y sin montos
**And** los avisos cuya fecha ya pasó no se programan

**Given** una Obligación anual marcada como pagada
**When** se reprograma
**Then** sus avisos pendientes de ese año desaparecen

**Given** las pruebas
**When** se ejecutan
**Then** la función que arma la lista de notificaciones a partir de `(estado, hoy)` es pura y se prueba sin `expo-notifications`: Sesión de pagos, recordatorio de Cuadre y avisos a 30 y 7 días

## Epic 7: Proteger mis datos con exportación y respaldo

Priettos exporta sus datos a un archivo, activa el respaldo automático en su Google Drive y restaura todo si cambia de celular. Las dos vías usan el mismo formato. El respaldo a Drive es la última historia: si hay atraso, pasa a v1.1 y la exportación manual se queda en v1.

> **MVP (2026-11-11):** solo **7.1 Exportar** entra al MVP (última del orden). **7.2 y 7.3 quedan Congeladas.**

### Story 7.1: Exportar mis datos y el diagnóstico a un archivo

> **MVP (2026-11-11):** la opción "Exportar" aparece en Ajustes (historia 1.10). La exportación incluye las tablas nuevas (`gasto_items`, `capturas`) y, como siempre, no incluye fotos ni audios.

Como Priettos,
quiero exportar todos mis datos a un archivo que guarde donde yo quiera,
para no depender de un solo celular.

**Requisitos:** FR28, UX-DR14; AD-14, AD-23

**Acceptance Criteria:**

**Given** Ajustes
**When** Priettos toca "Exportar datos"
**Then** la app genera un `MoneyTrackExport {schemaVersion, variante, exportadoEn, tablas}` en JSON y lo ofrece para guardar o compartir
**And** `schemaVersion` es el número de migraciones de drizzle-kit aplicadas, y `variante` es `dev` o `release`

**Given** el archivo exportado
**When** se inspecciona
**Then** contiene todas las tablas existentes, incluidas las filas borradas y el `rastro`
**And** no contiene secretos (clave de IA, tokens) ni fotos

**Given** Ajustes
**When** Priettos toca "Exportar diagnóstico"
**Then** la app exporta el buffer de `services/log` (≤ 500 entradas), sin montos, comercios ni secretos

**Given** las pruebas
**When** se ejecutan
**Then** exportar una base de prueba con datos y borrados produce un JSON que cumple el formato y no incluye la clave de IA

### Story 7.2: Restaurar desde un archivo *(Congelada)*

> **Congelada (2026-11-11):** diseñada, fuera del MVP y retomable sin rehacer.

Como Priettos,
quiero restaurar una exportación en un celular nuevo o después de un problema,
para recuperar mis finanzas tal como estaban.

**Requisitos:** FR30; AD-14

**Acceptance Criteria:**

**Given** un archivo `MoneyTrackExport`
**When** Priettos elige restaurarlo
**Then** la app advierte que se reemplazarán todos los datos del celular y pide confirmación

**Given** una copia de otra variante o con `schemaVersion` mayor que la de la app
**When** se intenta restaurar
**Then** se rechaza con un mensaje claro y los datos actuales no cambian

**Given** una copia con `schemaVersion` menor
**When** se restaura
**Then** primero se migra en una base temporal en memoria hasta la versión actual

**Given** una copia válida
**When** se confirma la restauración
**Then** en una sola transacción sobre la conexión abierta se borran todas las tablas y se insertan las de la copia, sin reemplazar el archivo `.db`
**And** si algo falla, la transacción se revierte y los datos anteriores quedan intactos
**And** al terminar se recalcula el Estado y se reprograman las notificaciones (ciclo post-comando)

**Given** Gastos restaurados cuya foto no existe en este celular
**When** se muestran
**Then** aparecen sin foto y sin error

**Given** las pruebas
**When** se ejecutan
**Then** exportar y luego restaurar una base de prueba en better-sqlite3 produce los mismos datos y el mismo `Estado`

### Story 7.3: Respaldo automático en mi Google Drive *(Congelada)*

> **Congelada (2026-11-11):** diseñada, fuera del MVP y retomable sin rehacer.

Como Priettos,
quiero que la app guarde sola una copia en la carpeta privada de mi Google Drive cuando haya cambios,
para no tener que acordarme de exportar.

**Requisitos:** FR29, FR30; AD-14, AD-16

**Acceptance Criteria:**

**Given** el proyecto de Google Cloud/Firebase
**When** se configura el inicio de sesión
**Then** cada variante (`dev`, `release`) tiene su propio cliente OAuth Android con el SHA-1 de su firma, y se usa `@react-native-google-signin/google-signin` 16.x (módulo Original) con el alcance `drive.appdata`
**And** los tokens los maneja la librería: nunca se guardan en SQLite, en la exportación ni en el log

**Given** Ajustes
**When** Priettos activa el respaldo en Drive
**Then** inicia sesión con Google y el respaldo queda activo
**And** puede desactivarlo cuando quiera

**Given** el respaldo activo
**When** la app pasa a segundo plano y `max(updatedAt)` de todas las tablas es posterior a la última copia subida
**Then** sube a `appDataFolder` el archivo `moneytrack-<variante>-<exportadoEn>.json`, con el mismo formato de 7.1
**And** conserva solo las últimas 7 copias de su variante y borra las más antiguas

**Given** que no hay conexión o la subida falla
**When** ocurre
**Then** se registra con `services/log`, sin interrumpir a Priettos, y se reintenta la próxima vez que la app pase a segundo plano

**Given** Ajustes con el respaldo activo
**When** Priettos elige "Restaurar desde Drive"
**Then** ve las copias de su variante con su fecha, elige una y la restauración sigue exactamente el flujo de 7.2
