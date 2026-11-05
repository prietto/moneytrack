---
title: 'Revisión adversarial — Architecture Spine MoneyTrack v1'
target: ../ARCHITECTURE-SPINE.md
fuentes: [prd.md, addendum.md]
fecha: '2026-10-19'
lente: 'Construir dos unidades un nivel abajo que cumplan cada AD al pie de la letra y aun así no encajen.'
---

# Revisión adversarial del spine

## Veredicto

El spine fija bien el **paradigma** (núcleo puro, solo hechos, comandos transaccionales) pero deja sin dueño la **forma** de casi todo lo que cruza fronteras: el tipo `Hechos` y quién lo carga, cómo se enlaza un Gasto con su Presupuesto/Fondo/Obligación/Cuadre, qué es un Periodo, cómo se componen comandos de tablas distintas y qué significa `schemaVersion`. Dos agentes que cumplan cada AD a la letra producirán historias que compilan por separado y se rompen al unirse. Hay **4 huecos críticos** y **7 altos** que conviene cerrar antes de escribir historias.

Severidad: **Crítico** = cifras distintas o datos corruptos sin error visible. **Alto** = integración rota o retrabajo entre historias. **Medio** = inconsistencia acotada o de UX.

---

## Pares divergentes

### D-1 · Crítico — Nadie es dueño de `Hechos` ni de su carga; `reprogramar` no tiene quién lo llame

**Unidad A (historia "Pantalla principal", 4.3):** escribe `useEstado()` con un `useLiveQuery` por tabla, filtra `deletedAt IS NULL` en SQL, arma `hechos = { gastos, pagos, ... }` y llama `calcularEstado(hechos, reloj.hoy())`.
**Unidad B (historia "Sesión de pagos", 4.6):** necesita un `Estado` dentro de `services/notificaciones` (no hay hooks fuera de React). Como `services → data` y `services → domain` están permitidos, escribe su propio `leerHechos()` en `services/`, que no excluye los borrados (supone que `domain/` filtra, AD-4 no dice quién) y omite `consultas_semaforo`.
**Resultado:** dos `Estado` distintos para los mismos datos; notificaciones de Obligaciones borradas (exactamente lo que AD-13 dice prevenir).

Además, AD-13 exige llamar `reprogramar` "después de cada comando", pero `data/` no puede importar `services/` ni ejecutar `domain/` (solo tipos). Entonces lo llama cada pantalla: la historia A lo hace, la historia B lo olvida. Nada lo verifica.

**Cerrar con AD nuevo — AD-18 "Un solo cargador de hechos y un solo punto post-comando":**
> `domain/hechos.ts` define el tipo `Hechos` (única fuente de su forma; `data/` lo importa como tipo). `src/data/queries/cargar-hechos.ts` exporta `cargarHechos(db): Promise<Hechos>`, la **única** función que lee tablas para `calcularEstado`; excluye filas con `deletedAt` (los borrados nunca llegan a `domain/`) y nunca incluye instantáneas (Cuadre, consultas del Semáforo). `useEstado()` y `services/` obtienen hechos solo por `cargarHechos`. Toda pantalla ejecuta comandos solo a través de `ejecutar(comando)` de `src/hooks/use-comando.ts`, que tras el commit invalida `useEstado` y llama `notificaciones.reprogramar(calcularEstado(await cargarHechos(db), reloj.hoy()))`. Agregar un campo a `Hechos` exige tocar solo `domain/hechos.ts` y `cargar-hechos.ts`.

---

### D-2 · Crítico — "Cada tabla tiene un solo dueño" choca con los comandos encadenados; la cuota vive en dos tablas

AD-3 exige a la vez (a) que `marcarObligacionPagada` cree el Gasto en la misma transacción y (b) que `gastos` tenga un solo módulo dueño.

**Unidad A (Sesión de pagos):** cumple (b) importando `registrarGasto` desde el módulo de gastos; como cada comando abre su propia transacción, la llamada anidada abre otra (o falla en expo-sqlite) y rompe (a).
**Unidad B (Cuadre):** cumple (a) haciendo `tx.insert(gastos)` directo dentro de `hacerCuadre`, y rompe (b). Ya hay dos formas de insertar un Gasto: una con valores por defecto de clase/categoría y otra sin ellos.

El mismo choque aparece en "Lo compré" (consulta → Gasto), en el sobrante del Cuadre (→ Otro ingreso) y al crear una Deuda (AD-5: "la cuota es una Obligación mensual con `deudaId`, generada al crear la Deuda"). En ese último caso la **cuota y el día de pago quedan en dos filas** (`deudas.cuota` y `obligaciones.monto/dia`). La historia "Editar Deuda" actualiza `deudas.cuota`; `domain/` genera la ocurrencia desde `obligaciones.monto`: el saldo de la Deuda (AD-6) y el Saldo proyectado usan cuotas distintas.

Encadenar también al borrar o editar: `borrarMovimiento(gasto)` genérico borra el Gasto de una cuota pagada pero deja viva la `obligacion_pagada`. La ocurrencia queda cerrada y el dinero nunca salió. Otra historia hace la cascada al revés.

**Cerrar con AD-3 endurecido + regla nueva en AD-5:**
> AD-3: cada módulo dueño exporta funciones `insertarX(tx, …)` / `editarX(tx, …)` / `borrarX(tx, …)` que **reciben** la transacción y nunca abren una; solo los comandos públicos (`src/data/commands/*.ts`, los que llaman las pantallas) abren `db.transaction`. Un comando que toca otra tabla lo hace solo a través del `insertarX(tx)` de su dueño. `editarMovimiento`/`borrarMovimiento` genéricos no existen: cada movimiento tiene su `editarX`/`borrarX`, que declara su cascada. Borrar un Gasto con `obligacionPagadaId`, `cuadreId` o `consultaId` borra (lógicamente) también la fila que lo originó, y viceversa, en la misma transacción y con rastro de ambas.
> AD-5: la Obligación de cuota de una Deuda **no guarda monto ni día**: tiene `deudaId` y `domain/` toma cuota y día de la Deuda. Editar la Deuda nunca toca `obligaciones`.

---

### D-3 · Crítico — El enlace Gasto ↔ Clase/Presupuesto/Fondo/Obligación/Cuadre no tiene forma única

El glosario dice "los Gastos Esenciales **de esa categoría** consumen el Presupuesto esencial"; el diagrama ER dibuja un FK opcional `GASTO → PRESUPUESTO_ESENCIAL` y otro `GASTO → FONDO_PROTEGIDO`. Las dos lecturas cumplen el spine:

**Unidad A (Registro manual, FR-6):** guarda `clase='esencial'` + `presupuestoId`, y `fondoId` cuando el usuario elige un Fondo.
**Unidad B (Clasificación FR-8 / foto):** guarda `clase` + `categoriaId`; `domain/` deduce el Presupuesto por un mapa categoría→presupuesto que está en la tabla de categorías.
**Resultado:** el Gasto de A con una categoría que B mapea a otro presupuesto consume dos presupuestos o ninguno. Si el usuario cambia la categoría por defecto, B reclasifica en silencio todos los Gastos pasados y A no.

Lo que excede un Fondo:
- **A** guarda un solo Gasto de 600.000 con `fondoId`, y `domain/` calcula el excedente como Gusto.
- **B** (la historia "Lo compré", FR-21) lo **parte** en dos Gastos (350.000 del fondo y 250.000 de Gusto).

Con datos de B, `domain/` escrito para A cuenta el excedente dos veces o ninguna.

**FR-9, adelanto:**
- **A:** columna `esAdelanto` que marca el usuario.
- **B:** `domain/` trata automáticamente todo exceso de un Gasto Esencial como adelanto del mes siguiente.

Sin marca, ¿el exceso es Gusto con Impacto en días? ¿Se encadena si el mes siguiente también se excede? Nada lo dice.

**Gasto sin registrar:**
- **A (Cuadre):** lo crea con `categoria = "Sin registrar"` (nombre).
- **B (Impacto en días, FR-10):** lo detecta por nombre de categoría.

Si el usuario renombra la categoría, el Impacto en días se activa. Otra historia lo detecta por `cuadreId`. El ER dibuja `CUADRE ||--o| GASTO` sin decir de qué lado está el FK.

**Cerrar con AD nuevo — AD-19 "Forma del Gasto":**
> Un Gasto es **una** fila por compra; nunca se parte. Columnas obligatorias: `monto`, `fecha`, `categoriaId`, `clase ∈ {esencial, fondo, gusto}`. Enlaces, todos en `gastos` y mutuamente excluyentes por `clase`: `presupuestoId` (requerido si `clase='esencial'` y no hay `obligacionPagadaId`), `obligacionPagadaId` (Esencial por Obligación), `fondoId` (requerido si `clase='fondo'`), y `origen ∈ {manual, foto, obligacion, cuadre, semaforo}` con `cuadreId` / `consultaId` cuando aplica. Clase y enlaces se **copian** de la categoría al registrar y luego son del Gasto: cambiar la categoría por defecto nunca reclasifica Gastos pasados. `domain/` calcula el excedente de Fondo (parte Gusto) y el exceso de Presupuesto. `esAdelanto: boolean` lo fija el usuario; con `true`, el exceso sobre el Presupuesto del mes se descuenta del Presupuesto del mes siguiente (solo un mes; si también lo excede, lo que sobra es Gusto); con `false`, el exceso es Gusto. Un Gasto sin registrar se identifica **solo** por `origen='cuadre'` (nunca por el nombre de la categoría); la categoría "Sin registrar" es de sistema (`esSistema=true`) y no se puede borrar ni renombrar.

---

### D-4 · Crítico — "Periodo", Ritmo y reserva de Meta: el Abono se cuenta dos veces

El glosario define la reserva de Meta como "Ritmo de la Meta del Periodo aún no abonado", y el Ritmo como "(saldo **actual** − cuotas programadas) ÷ Periodos restantes".

**Unidad A (Reserva de Meta, FR-18):** `reservaMeta = ritmo(saldoActual) − abonosDelPeriodo`.
**Unidad B (Aviso de Ritmo, FR-19):** calcula el Ritmo con el saldo al **inicio** del Periodo para poder decir "al día / atrasado X".
**Resultado:** tras un Abono de 300.000, A baja el saldo (y con él el Ritmo) **y además** resta el Abono: la reserva cae más que el Abono y el Dinero libre sube de más (redondeo a favor, contra AD-7). B muestra otro Ritmo en otra pantalla, contra AD-1.

Límites del Periodo:
- **A** usa las fechas **esperadas** de los Pagos.
- **B** usa las fechas de los Pagos **confirmados**.

Un Pago 2 confirmado el 28 en vez del 30 mueve los Abonos del 29 de Periodo según quién calcule. Lo mismo pasa con los Aportes programados ("en la fecha del Pago 2": ¿esperada o confirmada?) y con el Pago no confirmado cuya fecha esperada ya pasó: una historia lo deja en su fecha pasada (fuera del Horizonte, y el Dinero libre se desploma); otra lo trae a `hoy`.

"Cuotas programadas" en el Ritmo:
- **A** suma la cuota completa (como en el addendum, sin tasa).
- **B** (Fecha de la Meta proyectada, AD-6) amortiza solo el capital.

Con tasa, el Ritmo dice "al día" mientras la Fecha proyectada cae después de la Meta.

**Cerrar con AD nuevo — AD-20 "Periodo y Ritmo":**
> Un Periodo va de la fecha **esperada** de una ocurrencia de Pago (AD-5) a la siguiente, nunca de las confirmadas. Un Pago confirmado se asigna a su ocurrencia por `(pagoId, clave)`, no por la fecha en que llegó. Un Pago esperado no confirmado cuya fecha ya pasó se proyecta en `hoy`. Los Aportes programados ocurren en la fecha esperada del Pago. `ritmoMeta` del Periodo se calcula **una vez** con el saldo de la Deuda objetivo al inicio del Periodo (sin Abonos del Periodo) y con "cuotas programadas" = **solo el capital** de las cuotas según AD-6, redondeado hacia arriba. `reservaMeta = max(0, ritmoMeta − Σ Abonos a la Deuda objetivo con fecha dentro del Periodo)`. Periodos restantes = ocurrencias de Pago desde el inicio del Periodo actual hasta la fecha de la Meta, incluido el actual. Los Abonos a otras Deudas no tocan la reserva de Meta.

---

### D-5 · Alto — El punto de partida de las Reservas no es un hecho guardado

AD-2 prohíbe guardar el saldo del fondo y la reserva anual, pero el addendum arranca con fondo enduro 350.000 y reserva anual 400.000 ya acumulados.

**Unidad A (Configuración, FR-4):** el saldo del fondo arranca en 0 el día de la configuración; la reserva anual se acumula desde la fecha de creación de la Obligación.
**Unidad B (Dinero libre):** cumple el caso del addendum y calcula la reserva anual hacia atrás, desde el último vencimiento (meses transcurridos × monto/12).
**Resultado:** el primer día, la Configuración muestra un Dinero libre distinto en 750.000 al del caso de aceptación. ¿El fondo "bolsa mensual" acumula lo no usado o se reinicia cada mes? Cada historia decide sola.

Lo mismo pasa con el Saldo real inicial: no tiene fecha. Una historia suma al Saldo calculado los Gastos fechados **antes** del saldo inicial (por ejemplo, Gastos atrasados registrados después) y otra no.

**Cerrar con AD-2 ampliado:**
> Los puntos de partida son hechos de configuración con fecha: `saldoInicial {monto, fecha}`, `fondo.saldoInicial` y `obligacionAnual.reservaInicial`, todos en la fecha de inicio. El Saldo calculado incluye solo movimientos con `fecha ≥ saldoInicial.fecha`. Saldo del fondo = saldoInicial + aportes en cada fecha esperada de Pago 2 desde la fecha de inicio − consumo; lo no usado **se acumula**. Reserva anual = reservaInicial + monto/12 (redondeado hacia arriba) en cada Pago 2 hasta el vencimiento, y se reinicia al cerrarse su ocurrencia.

---

### D-6 · Alto — Restaurar, `schemaVersion` y migraciones: tres lecturas compatibles con AD-14

AD-14 dice "una copia con `schemaVersion` menor se migra antes de cargarse", pero las migraciones de Drizzle son SQL sobre una base, no sobre JSON.

**Unidad A (Exportación):** pone en `schemaVersion` un entero escrito a mano en `app.config.ts`.
**Unidad B (Restaurar):** lo interpreta como el índice del `_journal.json` de drizzle-kit, y migra creando una base temporal, aplicando las migraciones hasta esa versión, insertando el JSON y aplicando las restantes.
**Unidad C:** escribe transformadores JSON por versión.

Las tres cumplen. Además, una restauración que **reemplaza el archivo** `.db` (también "reemplaza toda la base") rompe la conexión abierta y los `useLiveQuery` siguen suscritos a una conexión muerta. Después de restaurar nadie llama `reprogramar`, y las notificaciones de la base anterior siguen vivas. Las fotos no viajan, pero las filas de `fotos` sí: quedan URIs colgantes.

**Cerrar con AD-14 endurecido:**
> `schemaVersion` = número de migraciones de drizzle-kit aplicadas (largo del journal); no hay otro contador. Restaurar es el comando `restaurar(export)` en `data/commands/`: valida con Zod y, si la versión es menor, crea una base temporal en memoria, aplica las migraciones `0..schemaVersion`, inserta las tablas, aplica las restantes y lee de nuevo las filas. Después, sobre la **conexión abierta** y en una sola transacción, hace `DELETE` de todas las tablas e `INSERT` de todas las filas. Nunca reemplaza el archivo ni cierra la conexión. Al terminar pasa por el post-comando de AD-18 (invalidar y `reprogramar`). Las filas de fotos restauradas quedan `estado='sin_archivo'`.

---

### D-7 · Alto — Estado de la cola de fotos: ¿`services/` o `data/`? ¿Hay Gasto o no?

AD-11: "la foto se guarda primero … la extracción pendiente se reintenta". FR-7: "si la extracción falla, la foto queda adjunta y el usuario completa a mano (o se reintenta)". AD-2 no menciona ninguna tabla de fotos ni de cola.

**Unidad A (`services/extractor`):** guarda la cola en un JSON dentro de `FileSystem.documentDirectory` (AD-3 solo prohíbe a los servicios escribir **en la base**). No hay Gasto hasta confirmar.
**Unidad B (Registro, `data/`):** crea la tabla `fotos {gastoId, uri}`. El usuario completa a mano, guarda el Gasto con la foto, y luego el reintento de A extrae la misma foto y propone un segundo Gasto.
**Resultado:** Gastos duplicados. Dos dueños del estado "pendiente". La cola de A no viaja en el respaldo ni respeta `deletedAt`.

**Cerrar con AD-11 endurecido:**
> El estado de una foto vive solo en la tabla `fotos` (dueño `data/commands/fotos.ts`): `{id, uri, estado ∈ pendiente | propuesta | confirmada | descartada | sin_archivo, propuesta JSON?, gastoId?}`. `services/extractor` es sin estado: lee las pendientes con una consulta, llama `extraerFactura` y guarda el resultado con `guardarPropuesta(fotoId, resultado)`. Una foto con `gastoId` nunca se reintenta. Confirmar es `registrarGasto({…, fotoId})`, que en la misma transacción pone la foto en `confirmada`.

---

### D-8 · Alto — Meta: reemplazo, estado y línea base del Avance

FR-20 pide elegir la siguiente Deuda objetivo y su fecha, o una nueva fecha si la Meta vence.

**Unidad A:** actualiza en sitio la fila única de `meta` (con rastro) y guarda `estado = 'vencida'` cuando pasa la fecha. Es un dato derivado persistido y viola AD-2, pero la historia lo justificaría como "configuración".
**Unidad B:** guarda una Meta nueva por cambio y deriva cumplida/vencida.

El **Avance** ("saldo inicial de la Deuda objetivo − saldo actual") no tiene línea base cuando la nueva objetivo ya estaba medio pagada. A usa el saldo inicial de la Deuda y muestra un Avance inflado el primer día; B usa el saldo a la fecha de inicio de la Meta. Con varias Metas en historia, "una sola Meta activa" no tiene regla.

**Cerrar con AD nuevo — AD-21 "Metas":**
> `metas` es de solo agregar: `{deudaId, fechaObjetivo, fechaInicio, reemplazadaEn?}`. Activa = la única con `reemplazadaEn` nulo (el comando `fijarMeta` cierra la anterior en la misma transacción). Cumplida y vencida **se derivan** (saldo = 0 / `hoy > fechaObjetivo`) y nunca se guardan. Avance = saldo de la Deuda objetivo en `fechaInicio` (calculado por `domain/`) − saldo actual. Sin Meta activa, `Estado.meta` es `null`, y `impactoEnDias` y `reservaMeta` devuelven `null` y 0.

---

### D-9 · Medio — "Hoy" cambia a medianoche con la app abierta

AD-8 dice que "hoy" sale solo de `reloj.hoy()`, pero no dice cuándo se vuelve a leer.

**Unidad A:** `useEstado` hace `useMemo(() => reloj.hoy(), [])`.
**Unidad B (formulario de Gasto):** usa `reloj.hoy()` en cada render como fecha por defecto.
**Resultado:** a las 00:05, el Gasto queda fechado mañana y el `Estado` sigue en ayer: Obligaciones "vencidas" que no se marcan, Horizonte corrido un día.

**Cerrar con AD-8 endurecido:**
> `services/reloj` expone `hoy()` y `suscribirHoy(cb)`, que avisa al cruzar la medianoche de Bogotá y al volver la app a primer plano. `useHoy()` es el único hook que lo envuelve. `useEstado`, las fechas por defecto de formularios y `reprogramar` lo usan. Ningún componente memoriza `hoy`.

---

### D-10 · Medio — Forma del rastro

AD-3 da los campos (`entidad`, `id`, `antes`, `despues`, `fecha`), pero no su contenido.

**Unidad A (editar Gasto):** guarda `antes`/`despues` como fila completa en JSON y `entidad = 'gastos'`.
**Unidad B (editar Deuda):** guarda solo el diff `{cuota: 900000}` y `entidad = 'Deuda'`.
**Resultado:** la pantalla que muestra "editado 15-oct: 850.000 → 85.000" no puede leer ambas formas. Además, `id` choca con el `id` propio que AD-10 exige a toda tabla. ¿La configuración deja rastro? AD-3 la incluye en Binds pero el texto habla de "movimiento".

**Cerrar con AD-3 endurecido:**
> Tabla `rastro {id, entidad (nombre de tabla snake_case), entidadId, operacion ∈ editar | borrar | restaurar, antes JSON fila completa, despues JSON fila completa | null, fecha ISO UTC}`. Toda edición o borrado de **cualquier** tabla de AD-2, configuración incluida, escribe una fila. La función pura `domain/diferencias(antes, despues)` calcula el texto del cambio.

---

### D-11 · Medio — Categorías por id o por nombre (FR-8 y extractor)

AD-11 define `categoria` en `ResultadoExtraccion` como texto libre del LLM; AD-9 hace de las reglas FR-8 filas de configuración.

**Unidad A (extractor):** pasa al prompt los nombres y compara la respuesta por nombre exacto.
**Unidad B (reglas FR-8):** crea una tabla `reglas_clasificacion {patron, clase}` aparte de `categorias`.
**Resultado:** dos fuentes de la clase por defecto. FR-7 ("si una categoría de vehículo no trae Vehículo, la app lo pide") necesita un atributo que nadie definió.

**Cerrar con AD-9 endurecido:**
> Las reglas FR-8 **son columnas de `categorias`**: `claseDefault`, `presupuestoId?`, `fondoId?`, `requiereVehiculo`, `esSistema`. No existe otra tabla de reglas. Todo enlace a categoría es por `categoriaId`. El extractor recibe `[{id, nombre}]` y su esquema devuelve `categoriaId | null`; nunca se compara por nombre.

---

### D-12 · Medio — Monto de "ya pagamos" vs cuota esperada, y su efecto en la Deuda

FR-26: el monto es editable.

**Unidad A:** baja la Deuda por la cuota programada (AD-6: capital = cuota − interés) sin importar lo que se pagó.
**Unidad B:** usa el monto del Gasto vinculado.
**Resultado:** si el usuario paga 1.050.000 (con mora), A y B dan saldos de Deuda distintos. Lo mismo pasa con el Pago confirmado: ¿la diferencia frente al esperado mueve el Ritmo o solo el Saldo calculado?

**Cerrar en AD-6:**
> El capital de una cuota pagada = monto del Gasto vinculado − interés del mes (mínimo 0). Lo que excede la cuota programada no es Abono: si el usuario quiere abonar, registra un Abono. El monto confirmado de un Pago solo entra al Saldo calculado; los Pagos futuros se siguen proyectando por su monto esperado.

---

## Huecos menores (no se desarrollan)

- **"Hubo cambios desde la última copia" (AD-14):** no dice cómo se detecta. Propuesta: `max(updatedAt)` de todas las tablas comparado con el `exportadoEn` de la última copia, sin bandera escrita.
- **Consulta del Semáforo con Gasto borrado:** ¿`compro` sigue en `true`? Propuesta: es instantánea, no cambia; la pantalla muestra que el Gasto fue borrado.
- **Cuadre y Gastos atrasados:** registrar después del Cuadre un Gasto fechado antes de él puede contar dos veces lo que ya entró como Gasto sin registrar. Propuesta: avisarlo en la Voz del socio; no se corrige solo (AD-4).
- **Forma del `Estado` sin Meta ni tasa:** cubierta en D-8; documentar en `domain/estado.ts` que `aproximado` va por cifra, no global.

## Resumen de ADs propuestos

| Hueco | Acción |
| --- | --- |
| D-1 | AD-18 nuevo: `Hechos` en `domain/`, `cargarHechos` único, `ejecutar(comando)` post-commit |
| D-2 | AD-3 endurecido (`insertarX(tx)`, cascadas por movimiento) y AD-5 (la cuota no se duplica) |
| D-3 | AD-19 nuevo: forma del Gasto, adelanto, Gasto sin registrar por `origen` |
| D-4 | AD-20 nuevo: Periodo por fechas esperadas, Ritmo congelado, cuotas = capital |
| D-5 | AD-2 ampliado: saldos iniciales con fecha, acumulación del fondo |
| D-6 | AD-14 endurecido: `schemaVersion` = journal, restaurar en la conexión abierta |
| D-7 | AD-11 endurecido: tabla `fotos` como único estado de la cola |
| D-8 | AD-21 nuevo: Metas de solo agregar, estado derivado, línea base del Avance |
| D-9 | AD-8 endurecido: `useHoy()` con medianoche y primer plano |
| D-10 | AD-3 endurecido: forma del rastro |
| D-11 | AD-9 endurecido: reglas = columnas de categorías, enlaces por id |
| D-12 | AD-6 endurecido: capital desde el monto pagado |
