---
baseline_commit: 8294cd4c92337fa0cfe857cc9086eea1da6c7977
---

# Story 1.5: Registrar Vehículos y Obligaciones mensuales y anuales

Status: review

<!-- Nota: la validación es opcional. Ejecutar validate-create-story para un control de calidad antes de dev-story. -->

## Story

Como Priettos,
quiero registrar mis Vehículos y mis Obligaciones mensuales y anuales (arriendo, servicios, SOAT, tecnomecánica, impuesto),
para que el Dinero libre aparte de antemano lo que debo pagar y la reserva anual crezca mes a mes.

**Requisitos:** FR3 (Obligaciones; los Presupuestos esenciales son de H1.6), FR5, FR13 (Obligaciones vencidas en la pantalla principal), NFR2, NFR6; AD-1, AD-2, AD-3, AD-4, AD-5, AD-7, AD-10, AD-17, AD-18, AD-20.

H1.4 dejó Pagos, saldo inicial, Colchón, la navegación base, los formularios reutilizables y la pantalla principal. **Esta historia trae las tablas `vehiculos` y `obligaciones`, sus comandos, las primeras Reservas (la reserva anual), los primeros Aportes programados (el prorrateo anual) y las Obligaciones vencidas en la pantalla principal.**

## Acceptance Criteria

1. **Vehículos (FR5, AD-3, AD-4, AD-10).** En la pantalla de Vehículos, Priettos registra "Moto azul" y "Carro". Quedan guardados con nombre e `id` UUID v4. Se pueden editar (con rastro, conservando el `id`) y borrar (borrado lógico con `deletedAt` y rastro). El nombre no puede quedar vacío, pasar de 40 caracteres ni repetirse entre los Vehículos vigentes (sin distinguir mayúsculas ni espacios de los extremos). Un Vehículo que usa una Obligación vigente **no se puede borrar**: la pantalla lo explica.
2. **Obligación mensual (FR3, AD-5).** Priettos registra una Obligación mensual con nombre, monto y día (1..31). Se guarda **solo la definición**; `domain/` genera las ocurrencias con clave `YYYY-MM`. Un día que no existe en el mes cae el último día del mes.
3. **Obligación anual (FR3, AD-2, AD-5).** Priettos registra una Obligación anual con nombre, monto, fecha de vencimiento, Vehículo opcional y reserva inicial con fecha (`{monto, fecha}`). Se guarda solo la definición; `domain/` genera una ocurrencia por año con clave `YYYY`, en el mismo mes y día de la fecha de vencimiento (desde el año de esa fecha). Un 29 de febrero cae el 28 en los años no bisiestos.
4. **Editar y borrar Obligaciones (AD-3, AD-4).** Toda Obligación se puede editar (con rastro y conservando el `id`; el tipo mensual/anual no cambia) y borrar (borrado lógico con rastro). Una edición que no cambia nada no deja rastro.
5. **Obligaciones en el Horizonte (AD-5).** Al calcular el Estado, cada ocurrencia pendiente con fecha dentro del Horizonte (`hoy..hoy+31`) se descuenta del Saldo proyectado en su fecha. Solo cuentan las ocurrencias posteriores al punto de partida (`fecha > saldoInicial.fecha`, la misma regla de los Pagos en H1.4).
6. **Obligaciones vencidas (AD-1, AD-5).** Una ocurrencia con `fecha < hoy` (y posterior al punto de partida) está vencida: se descuenta en `hoy` y aparece en `Estado.obligacionesVencidas`. Mientras no exista "ya pagamos" (H2.4), toda ocurrencia vencida sigue pendiente.
7. **Reserva anual (AD-2, AD-20, Glosario).** Para cada Obligación anual, la reserva anual = reserva inicial + un prorrateo mensual (`monto ÷ 12`, redondeado hacia arriba con `dividirHaciaArriba`) acreditado en cada **fecha esperada** del Pago 2 posterior a la fecha de la reserva inicial. La reserva anual actual (al día `hoy`) forma parte de las Reservas y se resta del Saldo proyectado desde el primer día. Las reglas exactas de reinicio y liberación están en Dev Notes → "Algoritmo de la reserva anual".
8. **Aportes programados (AD-20).** Los prorrateos con fecha esperada del Pago 2 dentro de `(hoy, hoy+31]` se descuentan como Aportes programados en esa fecha y se exponen en `Estado.aportesProgramados`.
9. **Pantalla principal (FR13, NFR6).** Si hay Obligaciones vencidas, se listan como vencidas con su nombre, su monto (`formatearDinero`) y la fecha en que vencieron (`formatearFechaCorta`). Sin vencidas, no se muestra nada (ni título vacío).
10. **Ajustes.** Ajustes tiene dos entradas nuevas, Vehículos y Obligaciones, con un resumen del valor actual. Desde ellas se llega a las listas, al formulario de alta y al de edición.
11. **Calidad (NFR13).** `npm run verificar` pasa en verde. Todo texto visible sale de `src/textos/` (AD-17). Hay pruebas de `domain/`, de los comandos con la base real, de las pantallas y una integración de punta a punta.

## Tasks / Subtasks

- [x] **T1. Ocurrencias anuales puras (AC: 3)**
  - [x] En `src/domain/ocurrencias.ts` agrega, sin tocar `ocurrenciasMensuales`:
    ```ts
    /** Ocurrencias anuales del mes `mes` (1..12) y día `dia`, con fecha en [desde, hasta], en orden. clave = 'YYYY'. */
    export function ocurrenciasAnuales(mes: number, dia: number, desde: string, hasta: string): Ocurrencia[];
    ```
    - La fecha de cada año sale de `fechaEnMes(\`${anio}-${mm}\`, dia)`: el 29-feb cae el 28 en un año no bisiesto (AD-5).
    - Es total: con `mes` fuera de `1..12`, `dia` fuera de `1..31` o no entero, fechas inválidas o `desde > hasta`, devuelve `[]`.
    - El tipo `Ocurrencia` se mantiene: `clave` es `'YYYY'` aquí.
  - [x] Pruebas en `ocurrencias.test.ts`: un rango de tres años; el ancla `2028-02-29` → `2028-02-29`, `2029-02-28`, `2032-02-29`; bordes `desde`/`hasta` inclusivos; un rango sin ocurrencias; argumentos inválidos → `[]`.

- [x] **T2. Entrada y validación puras (AC: 1, 2, 3)**
  - [x] En `src/domain/entrada.ts` agrega (con el patrón `erroresX` + `validarX` de H1.4):
    - `NOMBRE_MAXIMO = 40` y `normalizarNombre(texto)`: `trim()` y espacios internos colapsados a uno. `mismoNombre(a, b)` compara `normalizarNombre(x).toLowerCase()` (sin `Intl` ni `localeCompare`).
    - **Vehículo:** `erroresVehiculo({ nombre }, existentes: { id: string; nombre: string }[], idPropio: string | null)` → `{ nombre?: 'nombreVacio' | 'nombreLargo' | 'nombreRepetido' }`. `nombreRepetido` ignora el propio `id` al editar.
    - **Obligación mensual:** `erroresObligacionMensual({ nombre, monto, dia })` → `nombreVacio | nombreLargo`, `montoInvalido` (entero seguro **> 0**) y `diaInvalido`.
    - **Obligación anual:** `erroresObligacionAnual(datos, hoy, guardada, vehiculosVigentes)`, con `datos = { nombre, monto, fechaVencimiento, vehiculoId, reservaMonto, reservaFecha }` y `guardada: { fechaVencimiento: string; reservaFecha: string } | null`:
      - `nombre` y `monto` como la mensual.
      - `fechaVencimiento`: `fechaInvalida`; `fechaAntigua` si es anterior a `hoy − 62 días` (`ANTIGUEDAD_MAXIMA_SALDO_DIAS`, reutilízala); `fechaLejana` si es posterior a `hoy + 366 días`. La fecha guardada se acepta tal cual aunque envejezca (igual que el saldo en H1.4).
      - `reservaMonto`: entero seguro ≥ 0 (`reservaInvalida`) y ≤ `monto` (`reservaMayorQueMonto`).
      - `reservaFecha`: `fechaInvalida`, `fechaFutura` (> `hoy`) y `fechaAntigua` (< `hoy − 62`, salvo la guardada).
      - `vehiculoId`: `null` o el id de un Vehículo vigente (`vehiculoInvalido`).
    - Los `validarX` devuelven `Resultado<…, CodigoError>` con el primer error, como `validarPago`.
  - [x] Pruebas `it.each` en `entrada.test.ts` por cada código y borde: nombre de 40 y de 41 caracteres; `'  Moto  azul '` repite `'moto azul'`; editar sin cambiar el nombre no es repetido; monto 0; día 0 y 32; reserva igual al monto (válida) y mayor; fechas en `hoy − 62`, `hoy − 63`, `hoy + 366` y `hoy + 367`; fecha guardada antigua aceptada.

- [x] **T3. `Hechos` y `Estado` (AC: 2, 3, 5–8)**
  - [x] `src/domain/hechos.ts` agrega:
    ```ts
    export type Vehiculo = { id: string; nombre: string };
    export type ObligacionMensual = { id: string; tipo: 'mensual'; nombre: string; monto: number; dia: number };
    export type ObligacionAnual = {
      id: string; tipo: 'anual'; nombre: string; monto: number;
      fechaVencimiento: string;              // 'YYYY-MM-DD': ancla; se repite cada año desde aquí
      vehiculoId: string | null;
      reservaInicial: { monto: number; fecha: string }; // punto de partida con fecha (AD-2)
    };
    export type ObligacionDefinida = ObligacionMensual | ObligacionAnual;
    // Hechos += vehiculos: Vehiculo[]; obligaciones: ObligacionDefinida[]   (vigentes)
    ```
    Actualiza `hechosVacios` (`vehiculos: []`, `obligaciones: []`) y el comentario de cabecera.
  - [x] `src/domain/estado.ts`, en la rama `calculado`:
    ```ts
    export type OcurrenciaObligacion = {
      obligacionId: string; tipo: 'mensual' | 'anual'; nombre: string;
      clave: string;            // 'YYYY-MM' o 'YYYY' (AD-5): H2.4 la cierra como (obligacionId, clave)
      fecha: string;            // fecha de vencimiento de la ocurrencia
      fechaProyectada: string;  // = fecha, o hoy si está vencida
      monto: number;
      vencida: boolean;
      vehiculoId: string | null;
      reservaLiberada: number;  // anual: reserva que se libera al proyectarla; mensual: 0
    };
    export type AporteProgramado = { fecha: string; tipo: 'prorrateoAnual'; obligacionId: string; monto: number };
    // H1.6 agrega 'fondo' y H1.7 'meta' a `tipo`.

    obligacionesPendientes: OcurrenciaObligacion[];  // las que entran en la proyección, ordenadas por (fechaProyectada, fecha, nombre, obligacionId)
    obligacionesVencidas: OcurrenciaObligacion[];    // subconjunto con vencida = true, mismo orden
    reservas: { anual: number; total: number };      // Reservas actuales (en hoy). H1.6 suma fondo y H1.7 Meta
    reservasAnuales: { obligacionId: string; reserva: number }[]; // reserva actual de cada anual, en el orden de hechos
    aportesProgramados: AporteProgramado[];          // en (hoy, hoy+31], ordenados por (fecha, obligacionId)
    ```
    - Saldo calculado y Dinero libre siguen siendo enteros (AD-1). `sinConfigurar` no cambia: las Obligaciones no son configuración mínima.

- [x] **T4. `calcularEstado` con Obligaciones y reserva anual (AC: 5–8)**
  - [x] En `src/domain/calcular-estado.ts`, separa la lógica en funciones puras (p. ej. `ocurrenciasDeObligaciones` y `reservaAnual` en un archivo nuevo `src/domain/obligaciones.ts`) para que `calcularEstado` solo componga. Reglas:
    - **Mensuales:** `ocurrenciasMensuales(dia, saldoInicial.fecha + 1, hoy + 31)`. `fecha < hoy` → vencida, `fechaProyectada = hoy`.
    - **Anuales:** `ocurrenciasAnuales(mes, dia del ancla, max(fechaVencimiento, saldoInicial.fecha + 1), hoy + 31)`, con las mismas reglas de vencida.
    - **Reserva anual y Aportes programados:** sigue al pie de la letra "Algoritmo de la reserva anual" (Dev Notes).
    - Deja marcado con un comentario el punto donde H2.4 excluye la ocurrencia pagada `(obligacionId, clave)` y donde el pago reinicia la reserva.
    - **Saldo proyectado del día d** = Saldo calculado − `reservas.total` + Σ flujos con fecha ≤ d. Los flujos son: `+` Pagos esperados (H1.4), `−` monto de cada Obligación pendiente en su `fechaProyectada`, `+` `reservaLiberada` en esa misma fecha y `−` Aportes programados en su fecha. Sigue acumulando con el mapa por fecha en un solo recorrido (no hagas un filtro por día).
    - Mínimo y Dinero libre: sin cambios.
  - [x] Pruebas en `calcular-estado.test.ts` (y `obligaciones.test.ts` si separas). Actualiza las existentes con los campos nuevos (los `toEqual` de Estado completo los necesitan). Casos obligatorios, con los números ya calculados:
    - **A. Addendum recortado a H1.5.** `hoy = 2026-11-03`; saldo 10.000.000 al `2026-11-03`; Colchón 4.000.000; Pago 1 día 10 por 2.000.000 y Pago 2 día 30 por 6.000.000; servicios mensual día 8 por 300.000; arriendo mensual día 1 por 1.500.000; SOAT anual por 1.800.000 con vencimiento `2027-03-15` y reserva inicial 400.000 al `2026-11-03`.
      - `reservas = { anual: 400_000, total: 400_000 }`. Aportes: `[{ fecha: '2026-11-30', monto: 150_000 }]`.
      - Saldo proyectado: 9.600.000 del 3 al 7-nov; 9.300.000 el 8 y el 9-nov; 11.300.000 del 10 al 29-nov; 17.150.000 el 30-nov; 15.650.000 del 1 al 4-dic.
      - Mínimo 9.300.000 el 8-nov (el mismo día del mínimo del addendum) y Dinero libre 5.300.000.
      - Pendientes: servicios 8-nov y arriendo 1-dic. El arriendo del 1-nov no cuenta (≤ punto de partida) y los servicios del 8-dic quedan fuera del Horizonte.
    - **B. Anual dentro del Horizonte.** Igual que A pero sin mensuales ni SOAT, con saldo al `2026-11-01` y una tecnomecánica anual por 1.200.000 (prorrateo 100.000) con vencimiento `2026-12-01` y reserva 1.000.000 al `2026-11-01`.
      - Reserva actual 1.000.000. Aporte 100.000 el 30-nov.
      - La ocurrencia del 1-dic tiene `reservaLiberada` 1.100.000.
      - Saldo: 9.000.000 el 3-nov, 11.000.000 el 10-nov, 16.900.000 el 30-nov y 16.800.000 el 1-dic. Mínimo 9.000.000 el 3-nov y Dinero libre 5.000.000.
    - **C. Vencidas.** `hoy = 2026-11-12`; saldo 10.000.000 al `2026-11-05`; Colchón 4.000.000; los mismos Pagos (el 10-nov sale atrasado); arriendo mensual día 8 por 1.500.000; SOAT anual por 1.200.000 con vencimiento `2026-11-08` y reserva 1.100.000 al `2026-11-05`.
      - Las dos ocurrencias del 8-nov están vencidas, con `fechaProyectada` el 12-nov. `obligacionesVencidas` = [arriendo, SOAT], ordenadas por nombre.
      - `reservas.anual` = 1.100.000, y el SOAT tiene `reservaLiberada` 1.100.000.
      - Saldo del 12-nov: 10.000.000 − 1.100.000 + 2.000.000 − 1.500.000 − 1.200.000 + 1.100.000 = 9.300.000. Es el mínimo, y el Dinero libre es 5.300.000.
    - **D. Ocurrencia asumida pagada.** Ancla en una fecha `> reservaInicial.fecha` y `≤ saldoInicial.fecha`: no aparece como pendiente, y la reserva se reinicia a 0 en esa fecha (solo cuentan los prorrateos posteriores).
    - **E. Prorrateo hacia arriba.** Monto 1.000.001 → prorrateo 83.334.
    - **F. Mismo día.** Vencimiento anual el mismo día de la fecha esperada del Pago 2: el prorrateo de ese día entra en `reservaLiberada` (primero el crédito, luego la liberación).
    - **G. Prorrateos ya acreditados.** Reserva inicial al `2026-10-01`, Pago 2 día 30 y `hoy = 2026-11-03` → el 30-oct ya se acreditó y la reserva actual es la inicial más un prorrateo.
    - **H. Bordes.**
      - Ocurrencia en `hoy`: pendiente, no vencida.
      - Ocurrencia en `hoy + 31`: cuenta; en `hoy + 32`: no.
      - Ocurrencia el mismo día que `saldoInicial.fecha`: no cuenta.
      - Mensual del día 31 en noviembre → 30-nov.
      - Sin Obligaciones → `reservas.total = 0`, listas vacías y las mismas cifras de H1.4.
    - **Invariantes:** todo entero; `Object.freeze` profundo de `hechos` (incluidas `obligaciones` y `vehiculos`); dos llamadas dan `toEqual`.

- [x] **T5. Tablas, migración y módulos dueños (AC: 1–4)**
  - [x] En `src/data/schema.ts`, con `...columnasComunes`:
    ```ts
    export const vehiculos = sqliteTable('vehiculos', {
      ...columnasComunes,
      nombre: text('nombre').notNull(),
    });

    export const tiposObligacion = ['mensual', 'anual'] as const;
    export const obligaciones = sqliteTable('obligaciones', {
      ...columnasComunes,
      tipo: text('tipo', { enum: tiposObligacion }).notNull(),
      nombre: text('nombre').notNull(),
      monto: integer('monto'),                          // null solo en cuotas de Deuda (H1.7, AD-5)
      dia: integer('dia'),                              // mensual
      fechaVencimiento: text('fecha_vencimiento'),      // anual, 'YYYY-MM-DD'
      vehiculoId: text('vehiculo_id'),                  // anual, opcional; sin FK (ver Decisiones)
      reservaInicialMonto: integer('reserva_inicial_monto'), // anual
      reservaInicialFecha: text('reserva_inicial_fecha'),    // anual, 'YYYY-MM-DD'
    });
    ```
    - Nada derivado (AD-2): ni ocurrencias, ni reserva acumulada, ni "vencida".
    - **Sin `.references()`:** SQLite no tiene las FK activas en esta app (`PRAGMA foreign_keys` no se enciende) y la restauración de H7 reemplaza todas las tablas. La integridad la garantizan los comandos (T6).
  - [x] `npm run db:generar` → `drizzle/0002_*.sql`, `meta/0002_snapshot.json`, `meta/_journal.json` y `migrations.js`. **No** edites `0000` ni `0001`. Comprueba que el `when` de la 0002 sea mayor que el de la 0001 (1793970482285).
  - [x] Módulos dueños (AD-3). Reciben `tx` y `ctx` y nunca abren transacción:
    - `src/data/tablas/vehiculos.ts`: `leerVehiculosVigentes`, `insertarVehiculo`, `editarVehiculo` (`editarConRastro`) y `borrarVehiculo` (`borrarConRastro`).
    - `src/data/tablas/obligaciones.ts`: `leerObligacionesVigentes`, `insertarObligacion`, `editarObligacion` y `borrarObligacion`.
    - Pruebas `/** @jest-environment node */` con `crearBaseDePrueba()`: insertar, editar con rastro, edición sin cambios sin rastro y borrado lógico con rastro (`despues: null`).

- [x] **T6. Comandos (AC: 1–4)**
  - [x] `src/data/commands/guardar-vehiculo.ts`: `guardarVehiculo({ id, nombre }: { id: string | null; nombre: string }): ComandoDefinido<string>`, con `operacion: 'vehiculos.guardar'`. Devuelve el `id`.
    - Una transacción. Lee los vigentes y revalida con `validarVehiculo` (nombre normalizado y no repetido). Si falla, lanza `datosInvalidos`.
    - `id = null` → inserta con el nombre normalizado. Si no, edita (lanza `filaNoEncontrada` si no está vigente).
  - [x] `src/data/commands/borrar-vehiculo.ts`: `borrarVehiculo(id)`, `operacion: 'vehiculos.borrar'`. Si alguna Obligación vigente tiene ese `vehiculoId`, lanza `vehiculoEnUso` (rollback). Si no, hace borrado lógico con rastro.
  - [x] `src/data/commands/guardar-obligacion.ts`: `guardarObligacion(entrada, hoy)`, `operacion: 'obligaciones.guardar'`, que devuelve el `id`.
    ```ts
    type EntradaObligacion =
      | { id: string | null; tipo: 'mensual'; nombre: string; monto: number; dia: number }
      | { id: string | null; tipo: 'anual'; nombre: string; monto: number; fechaVencimiento: string;
          vehiculoId: string | null; reservaInicial: { monto: number; fecha: string } };
    ```
    - Una transacción. Revalida con la función del tipo; la anual usa los vehículos vigentes y, al editar, `guardada` con las fechas de la fila.
    - Al editar, si el `tipo` difiere del de la fila, lanza `tipoNoEditable`.
    - Escribe en `null` las columnas que no son de su tipo.
    - `hoy` llega como parámetro (el comando no lee el reloj); la pantalla lo pasa desde `useHoy()`.
  - [x] `src/data/commands/borrar-obligacion.ts`: `borrarObligacion(id)`, `operacion: 'obligaciones.borrar'`. Borrado lógico con rastro. (H2.4 decidirá qué pasa con sus ocurrencias pagadas.)
  - [x] Pruebas con base real y `ahora`/`nuevoId` fijos, como en `configurar-pagos.test.ts`:
    - Alta → fila con UUID y sin rastro.
    - Edición → mismo `id` y rastro `editar` completo.
    - Repetir los mismos datos → sin rastro nuevo.
    - Nombre repetido o inválido → `fallo` y base sin cambios.
    - Borrar → `deletedAt` y rastro `borrar`.
    - Borrar un Vehículo en uso → `fallo`, y no queda ni el borrado ni el rastro.
    - Borrar un Vehículo que solo usa una Obligación ya borrada → se permite.
    - Cambiar el tipo al editar → `fallo`.
    - Anual con `vehiculoId` de un Vehículo borrado → `fallo`.
    - Anual con reserva mayor que el monto → `fallo`.
    - Editar una anual cuya fecha guardada envejeció más de 62 días, cambiando solo el monto → se acepta.

- [x] **T7. Cargador y hook de configuración (AC: 1–3, 10)**
  - [x] `src/data/queries/cargar-hechos.ts` lee `vehiculos` y `obligaciones` con `.where(vigentes(tabla))`, ordenadas por `(createdAt, id)`.
    - Una mensual sin `monto` o sin `dia` se descarta. Una anual sin `monto`, `fechaVencimiento` o reserva completa también. Es defensa para que el tipo sea honesto (y para las futuras cuotas de H1.7): no lances.
    - Un `vehiculoId` que no está entre los Vehículos vigentes pasa a `null`.
    - Actualiza el JSDoc de "tablas que lee cada historia".
  - [x] Pruebas en `cargar-hechos.test.ts` con la base real: base vacía; filas de los dos tipos; borradas excluidas; fila incompleta descartada; `vehiculoId` huérfano → `null`.
  - [x] `src/hooks/use-configuracion.ts` agrega `vehiculos` y `obligaciones`, derivados de `useHechos()` (sin lectura propia). Actualiza su prueba.

- [x] **T8. Textos (AC: 1, 9, 10, 11)**
  - [x] Con la Voz del socio (honesto, amable, sin jerga y sin culpa). Las funciones reciben cifras y fechas **ya formateadas**:
    - `navegacion.ts`: Vehículos, Nuevo vehículo, Editar vehículo, Obligaciones, Nueva obligación, Editar obligación.
    - `ajustes.ts`: entradas y resúmenes, p. ej. `resumenVehiculos(nombres: string[])` → "Moto azul, Carro" o "Sin vehículos", y `resumenObligaciones(mensuales, anuales)` → "3 mensuales · 2 anuales".
    - `configuracion.ts`, agregando sin romper lo de H1.4:
      - Etiquetas, placeholders y ayudas de los dos formularios. En la fecha de vencimiento: "la próxima vez que vence; si ya venció y no la has pagado, el día en que venció". En la reserva: "lo que ya tienes guardado para esto; si no tienes nada, déjalo en 0".
      - Los tipos "Mensual"/"Anual" y "Sin vehículo".
      - Un mensaje `errores[codigo]` por cada código nuevo de T2. El `satisfies Record<…>` debe cubrirlos todos.
      - Los textos de borrar: "Borrar", la confirmación en línea ("¿Seguro? Toca otra vez para borrar «{nombre}».") y "Cancelar".
      - `vehiculoEnUso`: "Este Vehículo tiene Obligaciones. Bórralas o quítales el Vehículo antes de borrarlo."
      - `noEncontrado`: "Esto ya no existe; quizás se borró."
      - Los estados vacíos de las listas.
    - `inicio.ts`:
      - Título "Obligaciones vencidas".
      - `obligacionVencida(nombre, monto, dia)` → "{nombre}: {monto}, venció el {dia}. Lo cuento como si lo pagaras hoy."

- [x] **T9. Componentes reutilizables (AC: 1–4)**
  - [x] En `src/components/configuracion/`, porque el asistente de H1.8 los reutiliza:
    - `opciones.tsx`: grupo de opciones de selección única (`accessibilityRole="radio"`, `accessibilityState={{ checked }}`), para el tipo y el Vehículo. Genérico en `T extends string | null`.
    - `boton-borrar.tsx`: borrado con **confirmación en línea en dos pasos** (primer toque → texto de confirmación con "Sí, borrar" y "Cancelar"). **Sin `Alert` ni `Modal`**: la capa de bloqueo no tapa ventanas nativas (diferido de H1.2).
    - `lista-vehiculos.tsx` (`{ onAgregar, onEditar(id) }`) y `lista-obligaciones.tsx` (igual). La segunda va agrupada en Mensuales y Anuales. Cada fila muestra un resumen ("Día 8 · 300.000" o "15 de mar. · 1.800.000 · Moto azul") y tiene estado vacío.
    - `formulario-vehiculo.tsx` y `formulario-obligacion.tsx`, con `{ id: string | null; onGuardado: () => void; onBorrado: () => void }`:
      - Reutilizan `Formulario`, `Campo` y `useGuardadoDiferido` de H1.4.
      - Precargan desde `useConfiguracion()` cuando hay `id`.
      - Con un `id` que no existe → texto `noEncontrado` y ningún campo.
      - Validan con las funciones de T2 y muestran el error junto a su campo.
      - Si `ejecutar` devuelve `fallo` → `falloAlGuardar` y lo escrito se conserva.
      - `BotonBorrar` solo al editar. El borrado también va con `useGuardadoDiferido` (sin doble envío). Si un Vehículo está en uso, el formulario lo detecta **antes** con los hechos y muestra `vehiculoEnUso` sin llamar a `ejecutar`; el comando lo repite como defensa.
    - **Formulario de Obligación:**
      - Al crear, el tipo se elige con `Opciones` (Mensual por defecto). Al editar se muestra pero no se puede cambiar.
      - **Mensual:** nombre, monto y día, con la ayuda del último día del mes de H1.4.
      - **Anual:** nombre, monto, fecha de vencimiento (`AAAA-MM-DD` en texto; no hay selector de fecha), Vehículo (`Opciones` con "Sin vehículo" y los vigentes; sin Vehículos registrados solo aparece "Sin vehículo") y reserva inicial con su fecha (por defecto `0` y `useHoy()`).

- [x] **T10. Rutas y navegación (AC: 1, 4, 10)**
  - [x] Rutas nuevas. Solo montan componentes:
    ```text
    src/app/configuracion/vehiculos/index.tsx      # ListaVehiculos → push a [id]
    src/app/configuracion/vehiculos/[id].tsx       # id = 'nuevo' o el UUID → FormularioVehiculo; onGuardado/onBorrado → router.back()
    src/app/configuracion/obligaciones/index.tsx
    src/app/configuracion/obligaciones/[id].tsx
    ```
    - `useLocalSearchParams<{ id: string }>()` de `expo-router`. `'nuevo'` → `id = null`.
    - Navega con `router.push({ pathname: '/configuracion/vehiculos/[id]', params: { id } })` (rutas tipadas).
    - El título de `[id]` ("Nuevo…"/"Editar…") se fija desde la pantalla con `<Stack.Screen options={{ title }} />`, con texto de `textosNavegacion`.
  - [x] En `src/app/_layout.tsx` agrega los `Stack.Screen` de las rutas nuevas, con su `title`. **Cambia solo la lista de pantallas del Stack:** el gating de H1.2/H1.4 queda intacto (orden bloqueo → error → carga → contenido, la capa absoluta, `BackHandler` y `Keyboard.dismiss`). No uses `presentation: 'modal'`.
  - [x] `src/app/(tabs)/ajustes.tsx`: dos entradas nuevas, Vehículos y Obligaciones, debajo de las de H1.4, con su resumen (`useConfiguracion`, `formatearDinero`).
  - [x] `src/app/(tabs)/index.tsx`: bajo el bloque de Saldo calculado (y antes de los Pagos atrasados), un bloque "Obligaciones vencidas" que solo aparece si `estado.obligacionesVencidas.length > 0`. Una línea por vencida con `textosInicio.obligacionVencida(nombre, formatearDinero(monto), formatearFechaCorta(fecha, hoy))`. No calcula nada (AD-1).
  - [x] Si `tsc` no reconoce las rutas nuevas (`typedRoutes`), corre `npx expo start` una vez para regenerar `.expo/types` (lección de H1.4). No desactives `typedRoutes`.

- [x] **T11. Pruebas de pantallas e integración (AC: 9–11)**
  - [x] En `pruebas/pantallas/` (nunca en `src/app/`), con `await render(...)`:
    - `inicio.test.tsx`: con vencidas → título y líneas con nombre, monto y fecha; sin vencidas → sin título. Actualiza los Estados de prueba con los campos nuevos.
    - `ajustes.test.tsx`: las cuatro entradas, los resúmenes nuevos y la navegación.
    - `configuracion-vehiculos.test.tsx`: la lista (vacía y con datos), el alta, el error de nombre repetido, la edición precargada y el borrado en dos pasos.
      - Un Vehículo en uso muestra `vehiculoEnUso` y no llama a `ejecutar`.
      - Con `fallo` aparece el mensaje genérico.
      - Mockea `@/hooks/use-comando`, `@/hooks/use-configuracion`, `@/hooks/use-hoy` y `expo-router`.
    - `configuracion-obligaciones.test.tsx`:
      - Alta mensual y anual: verifica `operacion` y datos del comando.
      - El cambio de tipo muestra los campos del tipo.
      - Errores por campo.
      - Edición con el tipo bloqueado, borrado y `noEncontrado`.
    - `layout.test.tsx`: siguen pasando las pruebas de gating sin cambiar sus aserciones.
    - Junto a los componentes: `opciones.test.tsx` y `boton-borrar.test.tsx`.
  - [x] Integración con base real en `src/hooks/use-estado.integracion.test.tsx` (mock de `@/data/db` y `@/services/reloj`):
    1. Configura los Pagos y el saldo.
    2. `ejecutar(guardarVehiculo(...))` y `ejecutar(guardarObligacion(...))` (una mensual vencida y una anual).
    3. `useEstado` muestra la vencida, la reserva anual y el Dinero libre esperado.
    4. Borrar la Obligación devuelve el Estado anterior.

- [x] **T12. Cierre**
  - [x] `npm run verificar` en verde. Hoy hay 561 pruebas; anota el nuevo total.
  - [x] `npx expo export --platform android` compila el bundle.
  - [x] Prueba manual en la build dev. No hay módulos nativos nuevos: si la build dev ya está instalada, basta con `npx expo start`. Recorrido:
    1. Registrar "Moto azul" y "Carro"; intentar "moto azul" repetido.
    2. Registrar arriendo mensual y servicios mensual.
    3. Registrar SOAT anual con la Moto azul y una reserva.
    4. Ver cómo baja el Dinero libre.
    5. Intentar borrar la Moto azul (en uso).
    6. Editar y borrar una Obligación.
    7. Forzar una vencida (día anterior a hoy y posterior a la fecha del saldo) y verla en Inicio.
    8. Re-bloqueo tras más de 5 minutos sobre un formulario.
  - [x] Llena el Dev Agent Record: archivos, desvíos y el resultado de la migración.

## Dev Notes

### Qué es y qué no es esta historia

- **Es:**
  - Las tablas `vehiculos` y `obligaciones` con la migración `0002`.
  - Cuatro comandos.
  - Las ocurrencias anuales.
  - Las Obligaciones pendientes y vencidas en el Estado.
  - La reserva anual y los Aportes programados de prorrateo.
  - Las listas y formularios reutilizables.
  - Las entradas de Ajustes.
  - Las vencidas en Inicio.
- **No es:**
  - "Ya pagamos", `obligaciones_pagadas` ni el reinicio de la reserva por pago (H2.4). Las ocurrencias se exponen con `(obligacionId, clave)`, listas para eso.
  - La Sesión de pagos (H2.4/H6.1) ni los avisos de 30 y 7 días (H6.2).
  - Presupuestos, fondo enduro, categorías (H1.6), Deudas, cuotas ni Meta (H1.7). Las cuotas serán filas de `obligaciones` con `deudaId` y sin monto ni día propios (AD-5): por eso `monto` y `dia` admiten `null`. `nombre` es `notNull`: H1.7 decide cómo nombra la cuota (con su propia migración si hace falta).
  - El asistente (H1.8): aquí solo quedan los componentes reutilizables.
  - Gastos con Vehículo (Épica 2). La tabla `vehiculos` ya queda lista para enlazarlos.
- La prueba fija **Dinero libre = 1.350.000** del addendum se completa en H1.7. Aquí va su versión recortada (caso A, mínimo el 8-nov), con las mismas fechas.

### Algoritmo de la reserva anual (AD-20; implementarlo así, con pruebas por regla)

Para cada Obligación anual `A`, con monto `M`, reserva inicial `r0` en `f0`, ancla `fechaVencimiento` y saldo inicial en `fs`:

1. `p = dividirHaciaArriba(M, 12)`.
2. **Créditos:** las fechas esperadas del Pago 2 en `(f0, hoy+31]` (`ocurrenciasMensuales(pago2.dia, f0 + 1, hoy + 31)`). Usa la fecha **esperada**, aunque el Pago esté atrasado.
3. **Cierres:** las ocurrencias anuales `o` con `o > f0`, `o ≥ ancla` y `o ≤ hoy+31`.
   - Si `o ≤ fs`, la ocurrencia se **asume pagada**: ya está dentro del saldo inicial. No es pendiente y **reinicia** la reserva a 0 en `o`.
   - Si `o > fs`, es **pendiente**, con `fechaProyectada = max(o, hoy)`, y está vencida si `o < hoy`.
4. Recorre los eventos en orden de fecha efectiva (crédito: `c`; asumida pagada: `o`; pendiente: `fechaProyectada`). En la misma fecha va primero el crédito, luego el reinicio de una asumida pagada y al final la liberación de una pendiente. Empieza con `R = r0`:
   - **Crédito:** `R += p`. Si `c > hoy`, además es un Aporte programado `{fecha: c, monto: p}` (se resta del Saldo proyectado en `c`).
   - **Asumida pagada:** `R = 0`.
   - **Pendiente:** `reservaLiberada = R` y luego `R = 0`. En `fechaProyectada`, el Saldo proyectado suma `reservaLiberada` y resta `M`.
5. **Reserva actual** de `A` = `R` después de procesar los créditos y reinicios con fecha ≤ `hoy`, y **antes** de las liberaciones en `hoy`. Es la que entra en `reservas.anual` y en `reservasAnuales`.

Consecuencias que las pruebas deben fijar:

- Una vencida se paga en `hoy` con toda la reserva acumulada (caso C). El efecto neto en `hoy` es `−M`.
- La reserva no se reinicia en una ocurrencia vencida sin pagar: el reinicio por pago real llega en H2.4 ("la reserva anual se reinicia al pagar la Obligación", AD-20). Allí la ocurrencia pagada deja de ser pendiente y el reinicio pasa a la fecha del pago.
- `r0 ≤ M` lo exige la validación. Los créditos no se topan en `M`: es en contra del usuario (AD-7) y la liberación devuelve todo al vencer.

### Decisiones fijadas en esta historia

- **Punto de partida de las ocurrencias: `fecha > saldoInicial.fecha`**, igual que los Pagos en H1.4. La pregunta es si el pago ya está dentro del Saldo calculado. Una Obligación pagada antes de la fecha del saldo ya salió del banco; una posterior no se ha registrado, así que se descuenta (AD-7). Hasta H2.4 las vencidas se acumulan, igual que los Pagos atrasados, y la pantalla lo dice.
- **Ancla de la anual:** la fecha de vencimiento ingresada es la próxima, o la ya vencida y sin pagar. Hay ocurrencias desde el año del ancla, nunca antes. **Límite conocido:** un ancla vencida con fecha `≤ saldoInicial.fecha` se asume pagada, aunque no lo esté. La ayuda del campo lo previene, y se corrige con un Cuadre (H2.6).
- **El tipo no se edita.** Cambiar de mensual a anual cambiaría la forma de las claves que H2.4 referenciará. Para cambiarlo, se borra y se crea.
- **Vehículo solo en las anuales**, como dice la épica ("anual … Vehículo opcional").
- **Un Vehículo en uso no se borra.** Borrar en cascada las Obligaciones sería destructivo, y desenlazarlas en silencio ocultaría el cambio. El comando lo impide y la pantalla lo explica.
- **Sin FK en SQL.** No hay `PRAGMA foreign_keys` y las restauraciones de H7 reemplazan tablas completas: la integridad va en los comandos y en el cargador (huérfano → `null`).
- **Nombres:** se guardan normalizados (`normalizarNombre`). Los Vehículos no se repiten; las Obligaciones sí pueden repetirse (p. ej. dos "Servicios").
- **Fechas en texto `AAAA-MM-DD`**, como en H1.4. No se agrega selector de fecha (sería una dependencia nativa nueva).
- **Sin ventanas nativas:** la confirmación de borrado va en línea.

### Estado actual de los archivos que se modifican

| Archivo | Hoy (tras H1.4) | Qué cambia | Qué se preserva |
| --- | --- | --- | --- |
| `src/domain/hechos.ts` | `saldoInicial`, `colchon`, `pagos`, `hechosVacios` | `vehiculos`, `obligaciones` y sus tipos | Tipos de Pagos y `SaldoInicial` |
| `src/domain/estado.ts` | `sinConfigurar {faltan}` / `calculado` con `pagosEsperados`, `pagosAtrasados` | Obligaciones, reservas y aportes en `calculado` | `Faltante`, `OcurrenciaPago`, significado del mínimo |
| `src/domain/calcular-estado.ts` | Pagos y mapa de flujos por fecha | Componer obligaciones, reservas y aportes | `HORIZONTE_DIAS`, `faltantes`, orden de Pagos, pureza y totalidad |
| `src/domain/ocurrencias.ts` | `ocurrenciasMensuales` | `ocurrenciasAnuales` | `ocurrenciasMensuales` intacta |
| `src/domain/entrada.ts` | Pagos y saldo/Colchón, `ANTIGUEDAD_MAXIMA_SALDO_DIAS` | Vehículo y Obligaciones | Funciones y códigos de H1.4 |
| `src/data/schema.ts` | `rastro`, `pagos`, `ajustes` | `vehiculos`, `obligaciones` | Lo existente |
| `src/data/queries/cargar-hechos.ts` | Lee `pagos` y `ajustes` | Lee las dos tablas nuevas | Nunca lee `rastro` ni instantáneas; arreglos nuevos |
| `src/hooks/use-configuracion.ts` | Pagos, saldo, Colchón, `colchonSugerido` | `vehiculos`, `obligaciones` | Sin lectura propia |
| `src/app/_layout.tsx` | Gating + Stack con `(tabs)`, `configuracion/pagos` y `saldo-y-colchon` | 4 `Stack.Screen` nuevas | **Todo el gating** |
| `src/app/(tabs)/ajustes.tsx` | 2 entradas | 2 entradas más | `Entrada` y resúmenes actuales |
| `src/app/(tabs)/index.tsx` | Dinero libre, Saldo, Pagos atrasados y accesos | Bloque de vencidas | El estado vacío y el negativo en rojo con texto |
| `src/textos/{navegacion,ajustes,configuracion,inicio}.ts` | Textos de H1.4 | Textos nuevos | Claves existentes (las usan las pruebas) |
| `pruebas/pantallas/{inicio,ajustes}.test.tsx` | Casos de H1.4 | Estados con los campos nuevos y casos nuevos | Aserciones actuales |

### Capas y lint (vigentes; no aflojarlos)

- `domain/` es puro: sin `Date`, `Intl`, `Math.random` ni imports de otras capas. Las fechas son strings y la aritmética es entera. La división del prorrateo va **solo** con `dividirHaciaArriba`.
- `data/` es el único lugar con `drizzle-orm`. Los comandos van en `data/commands/*` con `definirComando`. Las pantallas y los componentes solo importan los comandos (el lint impide `definir-comando` y `contexto`).
- `app/` y `components/` no tienen texto literal (incluye `title`, `placeholder` y `accessibilityLabel`). No importan `services/reloj` (usa `useHoy`). Ejecutan con `ejecutar()`.
- `hooks/` no importa `drizzle-orm`, `data/db` ni `data/schema`.

### Trampas conocidas (de H1.1–H1.4)

- **Sin `await` dentro de `db.transaction`:** los comandos son síncronos.
- **`expo-crypto` en Jest:** inyecta `nuevoId` en `ejecutarComando`.
- **Caché de hechos:** las pruebas que usan la base real llaman `avisarCambio()` en `beforeEach` (desvío 7 de H1.4).
- **React Compiler:** no leas ni escribas refs en el render. `useGuardadoDiferido` ya resuelve el doble toque.
- **Testing Library 14:** `await render`, `await fireEvent`. Bajo `no-hide-descendants` hace falta `includeHiddenElements`.
- **Mock de `expo-router`:** `Stack` con `Screen`. Las pantallas `[id]` usan `Stack.Screen` dentro, así que su mock debe aceptarlo. `useLocalSearchParams` también se mockea.
- **Tabs:** se importan de `expo-router/js-tabs` (desvío 1 de H1.4). No cambies eso.
- **`formatearDinero` lanza con no enteros:** usa `leerMonto`.
- **Formato:** `--single-quote --print-width 120`.
- **Sin dependencias nuevas.** Si algo parece necesitar una (selector de fecha, íconos), detente y pregunta a Priettos.

### Testing

- `domain/`: ocurrencias anuales, entrada y `calcularEstado` (casos A–H con los números de arriba), sin base ni reloj.
- `data/`: tablas, comandos y cargador con `crearBaseDePrueba()` y `/** @jest-environment node */`. Nunca un mock de `expo-sqlite`.
- Pantallas en `pruebas/pantallas/`; componentes con la prueba al lado.
- Integración comandos → `useEstado` con base real (T11).
- Cada rama de error se prueba de verdad: la prueba debe fallar sin el guardia (lección de los reviews de H1.2–H1.4).

### Project Structure Notes

```text
src/
  domain/
    ocurrencias.ts / .test.ts                  # MODIFICADO (T1)
    entrada.ts / .test.ts                      # MODIFICADO (T2)
    hechos.ts, estado.ts                       # MODIFICADOS (T3)
    obligaciones.ts / .test.ts                 # NUEVO (T4): ocurrencias de Obligaciones y reserva anual
    calcular-estado.ts / .test.ts              # MODIFICADOS (T4)
  data/
    schema.ts                                  # MODIFICADO (T5)
    tablas/vehiculos.ts / .test.ts             # NUEVO (T5)
    tablas/obligaciones.ts / .test.ts          # NUEVO (T5)
    commands/guardar-vehiculo.ts / .test.ts    # NUEVO (T6)
    commands/borrar-vehiculo.ts / .test.ts     # NUEVO (T6)
    commands/guardar-obligacion.ts / .test.ts  # NUEVO (T6)
    commands/borrar-obligacion.ts / .test.ts   # NUEVO (T6)
    queries/cargar-hechos.ts / .test.ts        # MODIFICADOS (T7)
  hooks/
    use-configuracion.ts / .test.ts            # MODIFICADOS (T7)
    use-estado.integracion.test.tsx            # MODIFICADO (T11)
  textos/
    navegacion.ts, ajustes.ts, configuracion.ts, inicio.ts   # MODIFICADOS (T8)
  components/configuracion/
    opciones.tsx / .test.tsx                   # NUEVO (T9)
    boton-borrar.tsx / .test.tsx               # NUEVO (T9)
    lista-vehiculos.tsx, lista-obligaciones.tsx            # NUEVOS (T9)
    formulario-vehiculo.tsx, formulario-obligacion.tsx     # NUEVOS (T9)
  app/
    _layout.tsx                                # MODIFICADO (T10)
    (tabs)/ajustes.tsx, (tabs)/index.tsx       # MODIFICADOS (T10)
    configuracion/vehiculos/index.tsx, [id].tsx       # NUEVOS (T10)
    configuracion/obligaciones/index.tsx, [id].tsx    # NUEVOS (T10)
drizzle/0002_*.sql, meta/0002_snapshot.json, meta/_journal.json, migrations.js   # GENERADOS (T5)
pruebas/pantallas/inicio.test.tsx, ajustes.test.tsx                              # MODIFICADOS (T11)
pruebas/pantallas/configuracion-vehiculos.test.tsx, configuracion-obligaciones.test.tsx   # NUEVOS (T11)
```

- Archivos en kebab-case, tablas en plural `snake_case` y nombres del Glosario en camelCase sin tildes (`reservaAnual`, `aportesProgramados`, `obligacionesVencidas`).
- El spine sitúa la configuración en `app/configuracion`: las rutas nuevas siguen ahí.

### Previous Story Intelligence (H1.4)

- **Se reutiliza tal cual:**
  - `definirComando`/`ComandoDefinido` y `ejecutar`.
  - `editarConRastro` (ya es no-op sin cambios) y `borrarConRastro`.
  - `vigentes()`, `useHechos` (caché por versión) y `useConfiguracion`.
  - `ocurrenciasMensuales`, `fechaEnMes`, `sumarDias`, `mesDe` y `sumarMeses`.
  - `dividirHaciaArriba`.
  - `leerMonto`, `leerDia` y `ANTIGUEDAD_MAXIMA_SALDO_DIAS`.
  - `Formulario`, `Campo`, `useGuardadoDiferido`, `Boton`, `colores`, `formatearDinero`, `formatearFechaCorta` y `crearBaseDePrueba`.
- **Correcciones del review de H1.4 que aplican aquí:**
  - Límite de 62 días en fechas nuevas.
  - Doble toque con candado por ref (`useGuardadoDiferido`).
  - Año en las fechas de otro año (`formatearFechaCorta(fecha, hoy)`).
  - Nada de textos muertos.
- **Diferidos abiertos que tocan esta historia** (no cerrarlos aquí salvo que salga gratis):
  - `router.push` sin guard ante doble toque.
  - Formularios que no se resincronizan (H1.8).
  - `KeyboardAvoidingView` en Android.
  - Sin `CHECK` en SQL: `cargarHechos` descarta filas inválidas.
- **Proceso:**
  - `npx expo install` no se usa (no hay dependencias nuevas).
  - Para compilar Android: `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`.
  - Documenta todo desvío en el Dev Agent Record.

### Git Intelligence

- Últimos commits: `8fda2ea` (H1.2 + H1.3) y `adbab6d` (H1.1).
- **H1.4 está en `done` pero sin commit:** el árbol de trabajo tiene todo su diff. Antes de empezar H1.5, conviene que Priettos haga el commit de H1.4 (`H1.4: …`), para que el `baseline_commit` de esta historia aísle su diff. Solo se commitea si Priettos lo pide.
- Estilo de commit: en español, prefijo `H1.5:` y viñetas por decisión. Autor: el noreply de GitHub de prietto (nunca el correo de trabajo).

### Información técnica verificada (node_modules del proyecto, 2026-11-06)

- **expo-router 57.0.29:** `useLocalSearchParams`, `router` y `Stack` se exportan de `expo-router`. Las rutas dinámicas `[id].tsx` y `Stack.Screen` con `options` dentro de una pantalla funcionan igual que en H1.4. Las Tabs vienen de `expo-router/js-tabs`. Docs: https://docs.expo.dev/router/reference/url-parameters/ y https://docs.expo.dev/router/advanced/stack/.
- **drizzle-orm 0.45 / drizzle-kit 0.31:** `text(…, { enum })` como en `rastro`. `npm run db:generar` reescribe `drizzle/migrations.js`.
- **Sin dependencias nuevas:** ni selector de fecha ni íconos.
- **`app.config.ts`:** `reactCompiler: true` y `typedRoutes: true`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]: AC de la épica.
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6, 1.7, 1.8, 2.4, 6.2]: límites de alcance (fondo y Meta como otros Aportes, cuotas como Obligaciones, asistente, "ya pagamos" y avisos anuales).
- [Source: _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md]: AD-1 (ocurrencias pendientes y vencidas en el Estado), AD-2 (`obligacionAnual.reservaInicial`), AD-3, AD-4, AD-5 (ocurrencias, claves, último día, Horizonte, vencidas en `hoy`, cuotas con `deudaId`), AD-7, AD-9, AD-10, AD-17, AD-18, AD-20 (prorrateo en el Pago 2, reinicio al pagar) y el erDiagram (`VEHICULO |o--o{ OBLIGACION`, `OBLIGACION ||--o{ OBLIGACION_PAGADA`).
- [Source: _bmad-output/planning-artifacts/prds/prd-moneytrack_app-2026-10-14/prd.md#3 Glosario]: Obligación, Reserva, Aporte programado, Saldo proyectado y Vehículo; FR-3, FR-5, FR-13 y FR-26.
- [Source: _bmad-output/planning-artifacts/prds/prd-moneytrack_app-2026-10-14/addendum.md]: caso de Dinero libre (reserva anual 400.000, prorrateo 150.000 el 30-nov, servicios el 8-nov, arriendo el 1-dic).
- [Source: _bmad-output/implementation-artifacts/1-4-configurar-pagos-saldo-inicial-y-colchon-y-ver-el-primer-dinero-libre.md]: patrones, decisiones, review y desvíos.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md]: ventanas nativas, doble toque y formularios sin resincronizar.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (`claude-opus-5-5`), con dev-story.

### Debug Log References

- 2026-11-10: una corrida de regresión con la máquina cargada (load average 16) dio 3 fallos por tiempo agotado en pruebas de pantallas; aisladas y en la corrida completa siguiente pasan 745/745. No es un error de código.
- `npm run verificar` en verde: typecheck, lint (`--max-warnings=0`) y **745 pruebas en 49 suites** (antes 561).
- `npx expo export --platform android` compila el bundle Hermes (3,3 MB), con salida fuera del repo.
- `npm run db:generar` → `drizzle/0002_lucky_lizard.sql`: crea `obligaciones` (12 columnas) y `vehiculos` (5 columnas), sin índices ni FK. `when` de la 0002 = 1794055913467 > 1793970482285 (0001). `0000` y `0001` intactas.
- `.expo/types/router.d.ts` regenerado con `npx expo start` (el puerto 8081 estaba ocupado por otro servidor, pero los tipos se generaron igual): incluye `/configuracion/vehiculos/[id]` y `/configuracion/obligaciones/[id]`.
- Pruebas de mutación del algoritmo de la reserva: sin el guardia de "reserva antes de liberar en hoy" fallan 4 pruebas; invirtiendo el orden crédito/liberación falla 1.

### Completion Notes List

- Análisis de contexto completado: guía de desarrollo exhaustiva creada (create-story, 2026-11-06).
- **Implementado (T1–T11 y T12 salvo la prueba manual):**
  - `domain/`: `ocurrenciasAnuales`; validación de Vehículos y Obligaciones (`normalizarNombre`, `mismoNombre`, `erroresX`/`validarX`); `Hechos` con `vehiculos` y `obligaciones`; `Estado` con `obligacionesPendientes`, `obligacionesVencidas`, `reservas`, `reservasAnuales` y `aportesProgramados`; `domain/obligaciones.ts` con las ocurrencias mensuales pendientes, el algoritmo de la reserva anual (eventos crédito → reinicio → liberación) y la composición. `calcularEstado` solo compone y acumula en un mapa por fecha.
  - `data/`: tablas `vehiculos` y `obligaciones` (sin FK), migración 0002, módulos dueños, cuatro comandos (`vehiculos.guardar`, `vehiculos.borrar`, `obligaciones.guardar`, `obligaciones.borrar`) y el cargador (filas incompletas descartadas, `vehiculoId` huérfano → `null`).
  - UI: `Opciones`, `BotonBorrar` (confirmación en línea, sin `Alert`/`Modal`), listas y formularios reutilizables, cuatro rutas, dos entradas en Ajustes y el bloque de vencidas en Inicio.
  - Pruebas: casos A–H de `calcularEstado` con los números de la historia, reglas por separado en `obligaciones.test.ts`, tablas y comandos con base real, cargador, pantallas, componentes y la integración de punta a punta (el borrado de las dos Obligaciones devuelve exactamente el Estado anterior).
- **Prueba manual (T12): hecha por Priettos el 2026-11-10** en la build dev. Recorrido completo OK (los 8 pasos de T12).
- **Desvíos y decisiones:**
  1. **Algoritmo de la reserva, caso `fs < o ≤ f0`** (reserva anotada después de una ocurrencia vencida sin pagar). La regla de T4 la hace pendiente; la del algoritmo no la miraba (solo `o > f0`). Se generan los cierres desde `max(ancla, min(f0, fs) + 1)`: con `o ≤ fs` es asumida pagada (y entonces `o > f0`); con `o > fs` es pendiente y libera la reserva. Así se cumplen las dos reglas. Probado en `obligaciones.test.ts`.
  2. `Formulario` recibe una prop opcional `pie` (debajo de Guardar) para el botón de borrar. Compatible con H1.4.
  3. Archivos nuevos no listados: `components/configuracion/fila.tsx` (fila tocable común a las dos listas) y `no-encontrado.tsx` (común a los dos formularios).
  4. Textos: el `errores.fechaAntigua` de H1.4 habla del saldo, así que la fecha de vencimiento y la de la reserva tienen su propio mensaje (`erroresVencimiento`, `erroresFechaReserva`). También `falloAlBorrar` y `borrando`. La etiqueta del tipo es "Cada cuánto se paga".
  5. `LEJANIA_MAXIMA_VENCIMIENTO_DIAS = 366` exportada en `entrada.ts`, junto a `ANTIGUEDAD_MAXIMA_SALDO_DIAS`.
  6. En la lista, la fecha de una anual va sin año ("15 de mar."), como en el ejemplo de la historia: se repite cada año. En Inicio, la fecha de una vencida sí lleva el año si es de otro año.
  7. `resumenObligaciones` omite el tipo sin ninguna ("2 anuales") y dice "Sin obligaciones" si no hay.
  8. La prueba de Ajustes de H1.4 contaba 2 botones; ahora son 4 (Vehículos y Obligaciones).
  9. No hay prueba de doble toque a nivel de pantalla: con `await fireEvent.press` el tick corre entre toques. El candado ya lo prueba `use-guardado-diferido.test.ts` en el mismo frame.
  10. Las líneas de vencidas en Inicio van en color de peligro y con texto explícito (NFR6).
  11. Formato: no hay Prettier en el proyecto; se usó el de la caché de npx (3.9.10) con `--single-quote --print-width 120` sobre los archivos nuevos. En los archivos de H1.4 solo se formatearon las líneas nuevas.

### File List

**Nuevos**
- `drizzle/0002_lucky_lizard.sql`
- `drizzle/meta/0002_snapshot.json`
- `src/domain/obligaciones.ts`
- `src/domain/obligaciones.test.ts`
- `src/data/tablas/vehiculos.ts`
- `src/data/tablas/vehiculos.test.ts`
- `src/data/tablas/obligaciones.ts`
- `src/data/tablas/obligaciones.test.ts`
- `src/data/commands/guardar-vehiculo.ts`
- `src/data/commands/guardar-vehiculo.test.ts`
- `src/data/commands/borrar-vehiculo.ts`
- `src/data/commands/borrar-vehiculo.test.ts`
- `src/data/commands/guardar-obligacion.ts`
- `src/data/commands/guardar-obligacion.test.ts`
- `src/data/commands/borrar-obligacion.ts`
- `src/data/commands/borrar-obligacion.test.ts`
- `src/components/configuracion/opciones.tsx`
- `src/components/configuracion/opciones.test.tsx`
- `src/components/configuracion/boton-borrar.tsx`
- `src/components/configuracion/boton-borrar.test.tsx`
- `src/components/configuracion/fila.tsx`
- `src/components/configuracion/no-encontrado.tsx`
- `src/components/configuracion/lista-vehiculos.tsx`
- `src/components/configuracion/lista-obligaciones.tsx`
- `src/components/configuracion/formulario-vehiculo.tsx`
- `src/components/configuracion/formulario-obligacion.tsx`
- `src/app/configuracion/vehiculos/index.tsx`
- `src/app/configuracion/vehiculos/[id].tsx`
- `src/app/configuracion/obligaciones/index.tsx`
- `src/app/configuracion/obligaciones/[id].tsx`
- `pruebas/pantallas/configuracion-vehiculos.test.tsx`
- `pruebas/pantallas/configuracion-obligaciones.test.tsx`

**Modificados**
- `drizzle/meta/_journal.json`
- `drizzle/migrations.js`
- `src/domain/ocurrencias.ts`
- `src/domain/ocurrencias.test.ts`
- `src/domain/entrada.ts`
- `src/domain/entrada.test.ts`
- `src/domain/hechos.ts`
- `src/domain/estado.ts`
- `src/domain/calcular-estado.ts`
- `src/domain/calcular-estado.test.ts`
- `src/data/schema.ts`
- `src/data/queries/cargar-hechos.ts`
- `src/data/queries/cargar-hechos.test.ts`
- `src/data/use-hechos.test.tsx`
- `src/hooks/use-configuracion.ts`
- `src/hooks/use-configuracion.test.ts`
- `src/hooks/use-comando.test.ts`
- `src/hooks/use-estado.test.ts`
- `src/hooks/use-estado.integracion.test.tsx`
- `src/textos/navegacion.ts`
- `src/textos/ajustes.ts`
- `src/textos/configuracion.ts`
- `src/textos/inicio.ts`
- `src/components/configuracion/formulario.tsx`
- `src/app/_layout.tsx`
- `src/app/(tabs)/ajustes.tsx`
- `src/app/(tabs)/index.tsx`
- `pruebas/pantallas/inicio.test.tsx`
- `pruebas/pantallas/ajustes.test.tsx`
- `pruebas/pantallas/configuracion-pagos.test.tsx`
- `pruebas/pantallas/configuracion-saldo.test.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-5-registrar-vehiculos-y-obligaciones-mensuales-y-anuales.md`

## Change Log

- 2026-11-06: Historia creada con create-story. Estado → ready-for-dev.
- 2026-11-07: Implementación de T1–T11 y del cierre automatizable de T12 con dev-story (tablas `vehiculos`/`obligaciones`, migración 0002, cuatro comandos, ocurrencias anuales, Obligaciones pendientes y vencidas, reserva anual y Aportes programados en el Estado, listas y formularios, Ajustes e Inicio). `npm run verificar` en verde con 745 pruebas. Falta la prueba manual de T12 en la build dev.
- 2026-11-10: Prueba manual de T12 completada por Priettos en la build dev; todo funciona. Regresión completa en verde (745 pruebas). Historia pasada a `review`.
