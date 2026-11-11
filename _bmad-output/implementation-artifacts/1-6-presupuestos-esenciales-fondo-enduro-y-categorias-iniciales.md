---
baseline_commit: 1947cf858fe06f2dd41affd87128a60761a10fb8
---

# Story 1.6: Presupuestos esenciales, Fondo enduro y categorías iniciales

Status: done

<!-- Nota: la validación es opcional. Ejecutar validate-create-story para un control de calidad antes de dev-story. -->

## Story

Como Priettos,
quiero fijar mis Presupuestos de comida y mantenimiento de vehículos y el aporte a mi fondo enduro, con categorías listas para usar,
para que el Dinero libre aparte lo esencial y proteja mi pasión sin culpa.

**Requisitos:** FR3 (Presupuestos esenciales), FR4 (fondo enduro), FR8 (reglas por defecto de las categorías), FR13 (saldo del fondo enduro en la pantalla principal), NFR2, NFR6; AD-1, AD-2, AD-3, AD-4, AD-5, AD-7, AD-9, AD-10, AD-17, AD-18, AD-19 (solo la forma de las reglas), AD-20.

H1.5 dejó Vehículos, Obligaciones, la reserva anual, los primeros Aportes programados y los componentes de configuración reutilizables. **Esta historia trae las tablas `presupuestos`, `fondos` y `categorias` con su siembra, el Presupuesto esencial pendiente en el Saldo proyectado, el saldo del fondo como Reserva, el aporte al fondo como Aporte programado, la configuración de montos y la gestión de categorías.**

## Acceptance Criteria

1. **Tablas y siembra (AD-9, AD-10).** Tras aplicar las migraciones existen las filas sembradas: los Presupuestos esenciales "Comida" y "Mantenimiento de vehículos" y el Fondo protegido "Fondo enduro", **sin montos** (los montos los confirma Priettos; ver Decisiones). El modelo admite N Presupuestos y N Fondos. Existe `categorias` con `claseDefault`, `presupuestoId?`, `fondoId?`, `requiereVehiculo` y `esSistema`.
2. **Categorías iniciales (PRD §10.1, decisiones del 2026-11-04).** `categorias` contiene exactamente estas 11 filas sembradas:
   - Mercado y comida → Esencial, Presupuesto "Comida".
   - Mantenimiento de vehículo y Combustible → Esencial, Presupuesto "Mantenimiento de vehículos", requieren Vehículo.
   - Equipo de enduro → Fondo protegido, "Fondo enduro".
   - Salud → Esencial, sin Presupuesto (`presupuestoId` nulo).
   - Comida afuera, Salidas, Compras personales y Otros → Gusto.
   - Pago de Obligación (Esencial, sin Presupuesto) y Sin registrar (Gusto) → `esSistema`: no se pueden editar ni borrar.
3. **Gestión de categorías (AD-3, AD-4).** Priettos crea, edita (con rastro, conservando el `id`) y borra (borrado lógico con rastro) las categorías que no son de sistema. El nombre no puede quedar vacío, pasar de 40 caracteres ni repetirse entre las categorías vigentes (incluidas las de sistema). Los enlaces son coherentes con la clase: Esencial → un Presupuesto vigente o ninguno; Fondo protegido → un Fondo vigente obligatorio; Gusto → ninguno.
4. **Montos de Presupuestos y fondo (FR3, FR4, AD-2).** En una sola pantalla Priettos fija el monto mensual de cada Presupuesto esencial y, por cada Fondo protegido, el aporte mensual y el saldo inicial con fecha (`{monto, fecha}`). Se guarda en una sola transacción, con rastro solo si algo cambió.
5. **Ayuda del combustible.** Donde se fija el Presupuesto de mantenimiento de vehículos (Ajustes ahora, el asistente en H1.8), un texto de `src/textos/` recuerda que ese monto debe incluir el combustible del mes, además de aceite, pastillas, llantas y repuestos.
6. **Presupuesto esencial pendiente en el Horizonte (Glosario, AD-5).** Al calcular el Estado, el Presupuesto esencial pendiente del mes en curso se descuenta completo en `hoy`, y el de cada mes siguiente cuyo día 1 cae dentro de `(hoy, hoy+31]`, el día 1 de ese mes. Un Presupuesto sin monto (o con monto 0) no descuenta nada.
7. **Saldo del fondo como Reserva (AD-2, AD-20).** Para cada Fondo configurado, el saldo = saldo inicial + aporte mensual acreditado en cada **fecha esperada** del Pago 2 posterior a la fecha del saldo inicial y `≤ hoy`. Ese saldo forma parte de las Reservas (`reservas.fondo`) y se resta del Saldo proyectado desde el primer día.
8. **Aporte al fondo como Aporte programado (AD-20).** Los aportes con fecha esperada del Pago 2 dentro de `(hoy, hoy+31]` se descuentan como Aportes programados (`tipo: 'fondo'`) en esa fecha.
9. **Pantalla principal (FR13, NFR6).** Muestra el saldo de cada Fondo configurado ("Fondo enduro: 350.000") con `formatearDinero`. Sin Fondos configurados no se muestra nada.
10. **Gasto Esencial sin Presupuesto (Salud).** La regla queda **fijada en los datos** (Salud con `claseDefault = 'esencial'` y `presupuestoId` nulo) y documentada en `domain/hechos.ts`. Su cálculo (resta del Saldo calculado y del proyectado, sin adelanto y sin Impacto en días) llega con los Gastos en H2.1/H2.2: esta historia lo deja registrado en `deferred-work.md` (ver Dev Notes → "Qué es y qué no es").
11. **Ajustes.** Ajustes tiene dos entradas nuevas: "Presupuestos y fondo" y "Categorías", con su resumen.
12. **Calidad (NFR13).** `npm run verificar` pasa en verde. Todo texto visible sale de `src/textos/` (AD-17). Hay pruebas de `domain/`, de la siembra y los comandos con la base real, de las pantallas y una integración de punta a punta.

## Tasks / Subtasks

- [x] **T0. Antes de empezar**
  - [x] El árbol tiene sin commit las correcciones del review de H1.5 (`boton-borrar`, `formulario-vehiculo`, textos, pruebas, `deferred-work.md`, `sprint-status.yaml`). Pide a Priettos que las commitee (`H1.5: correcciones del review`) para que el `baseline_commit` de esta historia aísle su diff. **No commitees sin que lo pida.**

- [x] **T1. Tipos de `Hechos` y `Estado` (AC: 1, 6–9)**
  - [x] `src/domain/hechos.ts` agrega:
    ```ts
    /** Clase de gasto (Glosario, AD-19). */
    export type ClaseGasto = 'esencial' | 'fondo' | 'gusto';

    /** Monto mensual para esenciales variables. `null`: aún sin configurar (no descuenta nada). */
    export type PresupuestoEsencial = { id: string; nombre: string; montoMensual: number | null };

    /**
     * Bolsa mensual para una pasión. `aporteMensual` y `saldoInicial` van juntos:
     * los dos `null` (sin configurar) o los dos con valor (lo garantiza el cargador).
     */
    export type FondoProtegido = {
      id: string; nombre: string;
      aporteMensual: number | null;
      saldoInicial: { monto: number; fecha: string } | null; // punto de partida con fecha (AD-2)
    };

    /**
     * Reglas FR-8 (AD-9). Se copian al Gasto al registrarlo (AD-19, H2.1).
     * Esencial con `presupuestoId` null (p. ej. Salud): resta del Saldo, no
     * consume ninguna bolsa, no genera adelanto (FR-9) y no tiene Impacto en días.
     */
    export type Categoria = {
      id: string; nombre: string; claseDefault: ClaseGasto;
      presupuestoId: string | null; fondoId: string | null;
      requiereVehiculo: boolean; esSistema: boolean;
    };
    // Hechos += presupuestos: PresupuestoEsencial[]; fondos: FondoProtegido[]; categorias: Categoria[]   (vigentes)
    ```
    Actualiza `hechosVacios` (tres arreglos vacíos) y el comentario de cabecera.
  - [x] `src/domain/estado.ts`, en la rama `calculado`:
    ```ts
    export type PresupuestoPendiente = {
      presupuestoId: string;
      mes: string;     // 'YYYY-MM'
      fecha: string;   // hoy (mes en curso) o el día 1 del mes
      monto: number;   // H1.6: el monto mensual completo. H2.1/H2.2 le restan lo consumido y los adelantos.
    };
    export type SaldoFondo = { fondoId: string; nombre: string; saldo: number };

    export type AporteProgramado =
      | { fecha: string; tipo: 'prorrateoAnual'; obligacionId: string; monto: number }
      | { fecha: string; tipo: 'fondo'; fondoId: string; monto: number };
    // H1.7 agrega 'meta'.

    presupuestosPendientes: PresupuestoPendiente[]; // ordenados por (fecha, presupuestoId)
    fondos: SaldoFondo[];                           // solo los configurados, en el orden de hechos
    reservas: { anual: number; fondo: number; total: number };
    aportesProgramados: AporteProgramado[];         // ahora ordenados por (fecha, tipo, id): 'fondo' < 'prorrateoAnual'
    ```
    - `sinConfigurar` no cambia: Presupuestos y fondo no son configuración mínima.
    - Ajusta el comentario de `reservas` ("H1.7 suma la Meta").

- [x] **T2. Presupuestos pendientes y fondo, puros (AC: 6–8)**
  - [x] `src/domain/presupuestos.ts` (nuevo):
    ```ts
    /** Presupuesto esencial pendiente en el Horizonte (Glosario: "se descuenta completo el primer día del mes, o hoy para el mes en curso"). */
    export function presupuestosPendientes(presupuestos: PresupuestoEsencial[], { hoy, hasta }: { hoy: string; hasta: string }): PresupuestoPendiente[];
    ```
    - Mes en curso: `{ mes: mesDe(hoy), fecha: hoy, monto }`.
    - Meses siguientes: para `k = 1, 2, …` mientras `fechaEnMes(sumarMeses(mesDe(hoy), k), 1) ≤ hasta`. Con `hoy` el 31-ene caben el 1-feb **y** el 1-mar (el Horizonte tiene 32 días).
    - Si `hoy` es día 1, el mes en curso entra **una sola vez** (en `hoy`).
    - `montoMensual` `null` o `0` → sin entradas. Total: con fechas inválidas devuelve `[]`.
    - Deja marcado con un comentario el punto donde H2.1/H2.2 restan lo consumido y encadenan los adelantos.
  - [x] `src/domain/fondos.ts` (nuevo), con el mismo `Marco` de `obligaciones.ts` (reutilízalo o muévelo a un archivo común sin cambiar su forma):
    ```ts
    export type ResultadoFondo = { saldo: number; aportes: AporteProgramado[] };
    export function resultadoFondo(fondo: FondoProtegido, diaPago2: number, { hoy, hasta }: Marco): ResultadoFondo | null;
    ```
    - `null` si el fondo no está configurado (`aporteMensual` o `saldoInicial` en `null`).
    - Créditos: `ocurrenciasMensuales(diaPago2, sumarDias(f0, 1), hasta)` con `f0 = saldoInicial.fecha`. Usa la fecha **esperada**, aunque el Pago 2 esté atrasado (igual que el prorrateo de H1.5).
    - Crédito con fecha `≤ hoy` → suma al `saldo`. Crédito con fecha `> hoy` → Aporte programado `{ tipo: 'fondo', fondoId, fecha, monto: aporteMensual }`.
    - Aporte `0` → ningún Aporte programado (el saldo queda en `saldoInicial.monto`).
    - Lo no usado se acumula (no hay tope). Deja el comentario donde H2.1 resta los Gastos del fondo en orden `(fecha, createdAt)`.
  - [x] `src/domain/categorias.ts` (nuevo): `esPresupuestoDeVehiculos(presupuestoId, categorias): boolean` → `true` si alguna categoría vigente con `requiereVehiculo` apunta a ese Presupuesto. Es lo que decide si se muestra la ayuda del combustible (AC 5), sin ids fijos en la UI (AD-9).
  - [x] Pruebas (`presupuestos.test.ts`, `fondos.test.ts`, `categorias.test.ts`). Casos obligatorios, con los números ya calculados:
    - **P1.** `hoy = 2026-11-03`, Comida 700.000 y Mantenimiento 400.000 → 4 entradas: los dos en `2026-11-03` (mes `2026-11`) y los dos en `2026-12-01` (mes `2026-12`).
    - **P2.** `hoy = 2027-01-31` (fin del Horizonte `2027-03-03`) → entradas el 31-ene, el 1-feb y el 1-mar.
    - **P3.** `hoy = 2026-11-01` (fin `2026-12-02`) → el 1-nov una sola vez y el 1-dic.
    - **P4.** Borde: `hoy = 2026-10-31` (fin `2026-12-01`) → el 1-dic entra (inclusivo); con `hoy = 2026-11-01`, el 1-ene no.
    - **P5.** `montoMensual` `null` y `0` → `[]`.
    - **F1.** Saldo 200.000 al `2026-10-01`, aporte 100.000, Pago 2 día 30, `hoy = 2026-11-03` → saldo 300.000 (crédito del 30-oct) y un Aporte programado de 100.000 el 30-nov.
    - **F2.** `hoy = 2026-11-30` → el crédito del 30-nov va al saldo (no es Aporte programado) y el del 30-dic sí lo es (fin del Horizonte `2026-12-31`).
    - **F3.** Crédito en la misma fecha que `f0` → no cuenta.
    - **F4.** Pago 2 día 31 en noviembre → crédito el 30-nov.
    - **F5.** Aporte 0 → saldo = saldo inicial, sin aportes. Fondo sin configurar → `null`.
    - **C1.** `esPresupuestoDeVehiculos`: verdadero con Combustible apuntando al Presupuesto; falso si la única categoría que apunta no requiere Vehículo.

- [x] **T3. `calcularEstado` compone Presupuestos y fondos (AC: 6–9)**
  - [x] En `src/domain/calcular-estado.ts`, solo composición (como en H1.5):
    - `presupuestosPendientes(hechos.presupuestos, { hoy, hasta })` → flujo `−monto` en cada `fecha`.
    - `resultadoFondo` por fondo → `fondos` (solo los no `null`), `reservas.fondo = Σ saldo` y sus aportes se suman a los de las Obligaciones.
    - `reservas.total = anual + fondo`.
    - Ordena todos los `aportesProgramados` por `(fecha, tipo, id)`, con `id` = `fondoId` u `obligacionId`. Mueve la comparación a una función exportada (p. ej. `compararAportes`) y úsala también en `obligacionesEnHorizonte`, o deja allí su orden y reordena al componer: lo que importa es un solo orden final.
    - Saldo proyectado del día d = Saldo calculado − `reservas.total` + Σ flujos ≤ d. Flujos: Pagos (H1.4), Obligaciones con `reservaLiberada` (H1.5), `−` Presupuestos pendientes y `−` Aportes programados. Sigue el mapa por fecha en un solo recorrido.
  - [x] Pruebas en `calcular-estado.test.ts`. **Actualiza las existentes** (fixtures de `Hechos` con los tres arreglos nuevos; `toEqual` de Estado completo con `presupuestosPendientes: []`, `fondos: []` y `reservas.fondo: 0`). Casos nuevos:
    - **A6. Addendum recortado a H1.6** (los mismos datos del caso A de H1.5 más Presupuestos y fondo): `hoy = 2026-11-03`; saldo 10.000.000 al `2026-11-03`; Colchón 4.000.000; Pago 1 día 10 por 2.000.000 y Pago 2 día 30 por 6.000.000; servicios mensual día 8 por 300.000; arriendo mensual día 1 por 1.500.000; SOAT anual por 1.800.000 con vencimiento `2027-03-15` y reserva 400.000 al `2026-11-03`; Comida 700.000; Mantenimiento 400.000; Fondo enduro con saldo 350.000 al `2026-11-03` y aporte 350.000.
      - `reservas = { anual: 400_000, fondo: 350_000, total: 750_000 }`; `fondos = [{ nombre: 'Fondo enduro', saldo: 350_000 }]`.
      - Aportes: `[{ 2026-11-30, fondo, 350_000 }, { 2026-11-30, prorrateoAnual, 150_000 }]` (en ese orden).
      - Saldo proyectado: **8.150.000** del 3 al 7-nov; **7.850.000** el 8 y el 9-nov; **9.850.000** del 10 al 29-nov; **15.350.000** el 30-nov; **12.750.000** del 1 al 4-dic.
      - Mínimo 7.850.000 el 8-nov y **Dinero libre 3.850.000**.
      - Comprobación cruzada: con la reserva de Meta (500.000) y las dos cuotas del 5-nov (2.000.000) de H1.7, el mínimo baja a 5.350.000 y el Dinero libre a 1.350.000 (el addendum). No lo pruebes aquí: es la prueba fija de H1.7.
    - **Sin Presupuestos configurados ni fondos** (montos `null`) → las mismas cifras de H1.5 (casos A–H intactos).
    - **Invariantes:** todo entero; `Object.freeze` profundo de `hechos` (incluidos `presupuestos`, `fondos` y `categorias`); dos llamadas dan `toEqual`. Las categorías no cambian ninguna cifra.

- [x] **T4. Validación pura (AC: 3, 4)**
  - [x] En `src/domain/entrada.ts`, con el patrón `erroresX` + `validarX` (primer error, `Resultado`):
    - **Presupuesto:** `erroresPresupuesto({ montoMensual })` → `montoInvalido` (entero seguro ≥ 0; `null` es inválido: guardar exige un número).
    - **Fondo:** `erroresFondo({ aporteMensual, saldoMonto, saldoFecha }, hoy, fechaGuardada: string | null)` → `aporte: 'aporteInvalido'` (≥ 0), `saldoMonto: 'montoInvalido'` (≥ 0), `saldoFecha: 'fechaInvalida' | 'fechaFutura' | 'fechaAntigua'` con las mismas reglas de la reserva inicial de H1.5 (`ANTIGUEDAD_MAXIMA_SALDO_DIAS`; la guardada se acepta aunque envejezca).
    - **Categoría:** `erroresCategoria(datos, existentes: { id; nombre }[], idPropio, presupuestosVigentes: { id }[], fondosVigentes: { id }[])`, con `datos = { nombre, claseDefault, presupuestoId, fondoId, requiereVehiculo }`:
      - `nombre`: `nombreVacio | nombreLargo | nombreRepetido` (reutiliza `errorNombre`, `mismoNombre`; ignora el propio `id`).
      - `presupuestoId`: `presupuestoInvalido` si no es `null` y (la clase no es `esencial` o no está vigente).
      - `fondoId`: `fondoInvalido` si la clase es `fondo` y no es un fondo vigente, o si no es `null` con otra clase.
      - `claseDefault` fuera de las tres → `claseInvalida`.
  - [x] Pruebas `it.each` por código y borde (nombre de 40 y 41; "  salud " repite "Salud"; editar sin cambiar el nombre no es repetido; monto 0 válido; aporte negativo; fecha en `hoy − 62` y `hoy − 63`; fecha guardada antigua aceptada; Fondo protegido sin fondo; Gusto con Presupuesto).

- [x] **T5. Esquema, migraciones y siembra (AC: 1, 2)**
  - [x] En `src/data/schema.ts`, con `...columnasComunes` y **sin `.references()`** (igual que H1.5):
    ```ts
    export const presupuestos = sqliteTable('presupuestos', {
      ...columnasComunes,
      nombre: text('nombre').notNull(),
      montoMensual: integer('monto_mensual'),            // null: sin configurar
    });

    export const fondos = sqliteTable('fondos', {
      ...columnasComunes,
      nombre: text('nombre').notNull(),
      aporteMensual: integer('aporte_mensual'),           // null: sin configurar
      saldoInicialMonto: integer('saldo_inicial_monto'),
      saldoInicialFecha: text('saldo_inicial_fecha'),     // 'YYYY-MM-DD'
    });

    export const clasesGasto = ['esencial', 'fondo', 'gusto'] as const satisfies readonly ClaseGasto[];
    export const categorias = sqliteTable('categorias', {
      ...columnasComunes,
      nombre: text('nombre').notNull(),
      claseDefault: text('clase_default', { enum: clasesGasto }).notNull(),
      presupuestoId: text('presupuesto_id'),
      fondoId: text('fondo_id'),
      requiereVehiculo: integer('requiere_vehiculo', { mode: 'boolean' }).notNull().default(false),
      esSistema: integer('es_sistema', { mode: 'boolean' }).notNull().default(false),
    });
    ```
    (`import type { ClaseGasto } from '@/domain/hechos'`: `data/` solo importa tipos de `domain/`.) `clasesGasto` la reutiliza la tabla `gastos` de H2.1.
  - [x] `npm run db:generar` → `drizzle/0003_*.sql` (las tres tablas). **No** edites `0000`–`0002`.
  - [x] **Siembra como migración propia:** `npx drizzle-kit generate --custom --name=sembrar-presupuestos-fondo-y-categorias` → `drizzle/0004_sembrar-…sql` vacío (con su entrada en `_journal.json` y en `migrations.js`). Escribe ahí los `INSERT`:
    - **Separa cada sentencia con `--> statement-breakpoint`**: el migrador de Expo ejecuta una sentencia por bloque.
    - `created_at`/`updated_at` = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')` (ISO UTC, AD-8); `deleted_at` NULL; booleanos como `0`/`1`.
    - Los ids son **fijos** (tabla abajo) y deben coincidir con `IDS_SIEMBRA` de `src/data/siembra.ts`. Todos tienen forma UUID v4.
    - Comprueba que el `when` de la 0003 sea mayor que el de la 0002 (1794055913467) y el de la 0004 mayor que el de la 0003.

    | id | Tabla | Nombre | Clase | Enlace | Vehículo | Sistema |
    | --- | --- | --- | --- | --- | --- | --- |
    | `00000000-0000-4000-8000-000000000101` | presupuestos | Comida | — | — | — | — |
    | `00000000-0000-4000-8000-000000000102` | presupuestos | Mantenimiento de vehículos | — | — | — | — |
    | `00000000-0000-4000-8000-000000000201` | fondos | Fondo enduro | — | — | — | — |
    | `00000000-0000-4000-8000-000000000301` | categorias | Mercado y comida | esencial | presupuesto `…0101` | 0 | 0 |
    | `00000000-0000-4000-8000-000000000302` | categorias | Mantenimiento de vehículo | esencial | presupuesto `…0102` | 1 | 0 |
    | `00000000-0000-4000-8000-000000000303` | categorias | Combustible | esencial | presupuesto `…0102` | 1 | 0 |
    | `00000000-0000-4000-8000-000000000304` | categorias | Equipo de enduro | fondo | fondo `…0201` | 0 | 0 |
    | `00000000-0000-4000-8000-000000000305` | categorias | Salud | esencial | — | 0 | 0 |
    | `00000000-0000-4000-8000-000000000306` | categorias | Comida afuera | gusto | — | 0 | 0 |
    | `00000000-0000-4000-8000-000000000307` | categorias | Salidas | gusto | — | 0 | 0 |
    | `00000000-0000-4000-8000-000000000308` | categorias | Compras personales | gusto | — | 0 | 0 |
    | `00000000-0000-4000-8000-000000000309` | categorias | Otros | gusto | — | 0 | 0 |
    | `00000000-0000-4000-8000-000000000310` | categorias | Pago de Obligación | esencial | — | 0 | 1 |
    | `00000000-0000-4000-8000-000000000311` | categorias | Sin registrar | gusto | — | 0 | 1 |

    Presupuestos sin `monto_mensual` y fondo sin aporte ni saldo (todo `NULL`).
  - [x] `src/data/siembra.ts`: conserva `SIEMBRA.colchon` y agrega `IDS_SIEMBRA` (al menos los tres de configuración, `categoriaPagoObligacion` y `categoriaSinRegistrar`, que usarán H2.4 y H2.6). Actualiza su JSDoc: el Colchón sigue sin escribirse hasta que Priettos lo confirma; Presupuestos, fondo y categorías sí se escriben, pero sin montos.
  - [x] `src/data/siembra.test.ts` (`/** @jest-environment node */`, `crearBaseDePrueba()`): las 3 + 11 filas exactas (nombre, clase, enlaces, booleanos), ids iguales a `IDS_SIEMBRA`, `created_at` con forma ISO UTC, montos `null`, todo enlace apunta a una fila sembrada vigente.

- [x] **T6. Módulos dueños (AC: 3, 4)** — reciben `tx` y `ctx` y nunca abren transacción (AD-3):
  - [x] `src/data/tablas/presupuestos.ts`: `leerPresupuestosVigentes`, `editarPresupuesto` (`editarConRastro`). Sin insertar ni borrar en esta historia (no hay UI para crear o borrar Presupuestos; el modelo ya admite N).
  - [x] `src/data/tablas/fondos.ts`: `leerFondosVigentes`, `editarFondo`.
  - [x] `src/data/tablas/categorias.ts`: `leerCategoriasVigentes`, `insertarCategoria`, `editarCategoria`, `borrarCategoria`.
  - [x] Pruebas con base real: editar con rastro, edición sin cambios sin rastro, insertar y borrado lógico con rastro (`despues: null`).

- [x] **T7. Comandos (AC: 3, 4)**
  - [x] `src/data/commands/guardar-presupuestos-y-fondos.ts`:
    ```ts
    type EntradaPresupuestosYFondos = {
      presupuestos: { id: string; montoMensual: number }[];
      fondos: { id: string; aporteMensual: number; saldoInicial: { monto: number; fecha: string } }[];
    };
    export function guardarPresupuestosYFondos(entrada: EntradaPresupuestosYFondos, hoy: string): ComandoDefinido<void>;
    // operacion: 'presupuestosYFondos.guardar'
    ```
    - Una transacción. Cada `id` debe estar vigente (`filaNoEncontrada`). Revalida con `validarPresupuesto` / `validarFondo` (la fecha guardada del fondo se acepta aunque envejezca) y lanza `datosInvalidos` si falla: rollback de todo.
    - Edita con rastro cada fila; las que no cambian no dejan rastro.
    - `hoy` llega como parámetro: el comando no lee el reloj.
  - [x] `src/data/commands/guardar-categoria.ts`: `guardarCategoria(entrada)` con `operacion: 'categorias.guardar'`; devuelve el `id`.
    - `entrada = { id: string | null; nombre; claseDefault; presupuestoId; fondoId; requiereVehiculo }`.
    - Una transacción. Revalida con `validarCategoria` contra las categorías, Presupuestos y Fondos vigentes. Guarda el nombre normalizado y `esSistema = false`.
    - Al editar: `filaNoEncontrada` si no está vigente; `categoriaDeSistema` si `esSistema`.
  - [x] `src/data/commands/borrar-categoria.ts`: `borrarCategoria(id)`, `operacion: 'categorias.borrar'`. `categoriaDeSistema` si es de sistema; si no, borrado lógico con rastro. (Los Gastos de la Épica 2 conservan su `categoriaId`: AD-19 no reclasifica.)
  - [x] Pruebas con base real y `ahora`/`nuevoId` fijos (patrón de `guardar-obligacion.test.ts`):
    - Guardar montos → filas con los valores y rastro `editar` por fila cambiada.
    - Repetir los mismos datos → sin rastro nuevo.
    - Un Presupuesto inválido junto a uno válido → `fallo` y **ninguna** fila cambia.
    - Fondo con fecha antigua nueva → `fallo`; con la guardada antigua y solo el aporte cambiado → se acepta.
    - `id` inexistente o borrado → `fallo`.
    - Alta, edición (mismo `id`, rastro) y borrado (`deletedAt`, rastro) de una categoría.
    - Nombre repetido con una de sistema ("sin registrar") → `fallo`.
    - Editar o borrar "Sin registrar" → `fallo` y sin rastro.
    - Clase Fondo protegido sin fondo, o Gusto con Presupuesto → `fallo`.

- [x] **T8. Cargador y hook de configuración (AC: 1–4)**
  - [x] `src/data/queries/cargar-hechos.ts` lee `presupuestos`, `fondos` y `categorias` con `.where(vigentes(tabla))`, ordenadas por `(createdAt, id)`:
    - Fondo con `aporteMensual`, `saldoInicialMonto` o `saldoInicialFecha` en `null` → `aporteMensual: null, saldoInicial: null` (los dos o ninguno).
    - Categoría con `presupuestoId` que no es de un Presupuesto vigente → `null`; igual con `fondoId`. Una `claseDefault` desconocida → se descarta la fila (defensa: no lances).
    - Actualiza el JSDoc de "tablas que lee cada historia".
  - [x] **Ojo, regresión:** desde la 0004 una base recién migrada ya no está vacía. Las pruebas de `cargar-hechos.test.ts`, `use-hechos.test.tsx`, `use-configuracion.test.ts` y la integración que esperaban `hechosVacios` o listas vacías deben esperar la siembra (Presupuestos y fondo sin montos, 11 categorías). El Estado no cambia: lo sembrado no tiene montos.
  - [x] Pruebas nuevas en `cargar-hechos.test.ts`: la siembra cargada; fondo a medio configurar → ambos `null`; enlace huérfano → `null`; categoría borrada excluida.
  - [x] `src/hooks/use-configuracion.ts` agrega `presupuestos`, `fondos` y `categorias`, derivados de `useHechos()` (sin lectura propia). Actualiza su prueba.

- [x] **T9. Textos (AC: 3–5, 9, 11)** — Voz del socio; las funciones reciben cifras y fechas **ya formateadas**:
  - [x] `src/textos/clases.ts` (nuevo): `nombresClase = { esencial: 'Esencial', fondo: 'Fondo protegido', gusto: 'Gusto' } satisfies Record<ClaseGasto, string>`. Lo reutiliza el registro de Gastos (H2.1).
  - [x] `navegacion.ts`: Presupuestos y fondo, Categorías, Nueva categoría, Editar categoría.
  - [x] `ajustes.ts`: entradas y resúmenes, p. ej. `resumenPresupuestos(lineas: string[])` → "Comida 700.000 · Mantenimiento de vehículos 400.000" o "Sin configurar", y `resumenFondo(nombre, aporte)` → "Fondo enduro: 350.000 al mes"; `resumenCategorias(cantidad)` → "11 categorías".
  - [x] `configuracion.ts`, agregando sin romper lo de H1.4/H1.5:
    - Ayuda general del Presupuesto: "Lo que gastas al mes en esto. Lo aparto apenas empieza el mes."
    - **Ayuda del combustible (AC 5):** "Incluye el combustible del mes, además de aceite, pastillas, llantas y repuestos."
    - Fondo: etiquetas de aporte, saldo actual y fecha; ayuda del aporte: "Lo que apartas cada mes con tu Pago 2 para esto." Ayuda del saldo: "Lo que ya tienes guardado para esto; si no tienes nada, déjalo en 0."
    - Categoría: etiquetas de nombre, clase, Presupuesto ("Sin presupuesto"), fondo y "¿Pide Vehículo?" ("Sí"/"No"); ayuda de "Sin presupuesto": "Resta de tu saldo, pero no sale de ninguna bolsa."
    - Un mensaje en `errores` por cada código nuevo (`aporteInvalido`, `presupuestoInvalido`, `fondoInvalido`, `claseInvalida`, `categoriaDeSistema`). El `satisfies Record<…>` debe cubrirlos todos.
    - Estado vacío de la lista y título del grupo de sistema: "De la app" con "La app las usa; no se pueden cambiar ni borrar."
  - [x] `inicio.ts`: `saldoFondo(nombre, monto)` → "{nombre}: {monto}".

- [x] **T10. Componentes (AC: 3–5)** — en `src/components/configuracion/`, reutilizables por el asistente de H1.8:
  - [x] `formulario-presupuestos-y-fondos.tsx` (`{ onGuardado: () => void }`):
    - Un `Campo` por Presupuesto vigente (etiqueta = su nombre, que es un dato, no un literal) con la ayuda del combustible si `esPresupuestoDeVehiculos(id, categorias)`, y la general si no.
    - Por cada Fondo vigente: un título con su nombre y tres `Campo` (aporte, saldo actual, fecha `AAAA-MM-DD`, por defecto `0` y `useHoy()`).
    - Precarga los montos guardados (vacío si `null`). Errores por `id` y campo; valida con T4 antes de `ejecutar`.
    - Reutiliza `Formulario`, `Campo` y `useGuardadoDiferido`. Con `fallo` → `falloAlGuardar`, conservando lo escrito.
  - [x] `lista-categorias.tsx` (`{ onAgregar, onEditar(id) }`): agrupada por clase (Esenciales, Fondo protegido, Gustos) y un grupo final "De la app" con las de sistema **sin** acción de editar. Cada fila editable usa `Fila` con un resumen ("Esencial · Mantenimiento de vehículos · pide Vehículo").
  - [x] `formulario-categoria.tsx` (`{ id: string | null; onGuardado; onBorrado }`):
    - Nombre; clase con `Opciones` (Esencial por defecto; "Fondo protegido" solo si hay Fondos vigentes).
    - Esencial → `Opciones` de Presupuesto ("Sin presupuesto" + vigentes). Fondo protegido → `Opciones` de fondo (preselecciona el primero). Gusto → nada.
    - "¿Pide Vehículo?" con `Opciones<'si' | 'no'>`.
    - Al cambiar de clase, limpia los enlaces que no son de la nueva clase antes de validar.
    - Con un `id` inexistente, o de una categoría de sistema → `NoEncontrado` y ningún campo.
    - `BotonBorrar` solo al editar (sin `Alert` ni `Modal`).

- [x] **T11. Rutas, Ajustes e Inicio (AC: 9, 11)**
  - [x] Rutas nuevas (solo montan componentes):
    ```text
    src/app/configuracion/presupuestos-y-fondos.tsx   # FormularioPresupuestosYFondos; onGuardado → router.back()
    src/app/configuracion/categorias/index.tsx        # ListaCategorias → push a [id]
    src/app/configuracion/categorias/[id].tsx         # 'nueva' o el UUID → FormularioCategoria
    ```
    `useLocalSearchParams<{ id: string }>()`; `'nueva'` → `id = null`; título con `<Stack.Screen options={{ title }} />` y `textosNavegacion`.
  - [x] `src/app/_layout.tsx`: agrega los `Stack.Screen` de las rutas nuevas. **Cambia solo la lista de pantallas del Stack**: el gating (bloqueo → error → carga → contenido, la capa absoluta, `BackHandler`, `Keyboard.dismiss`) queda intacto. Sin `presentation: 'modal'`.
  - [x] `src/app/(tabs)/ajustes.tsx`: dos entradas nuevas debajo de Obligaciones ("Presupuestos y fondo" y "Categorías"). Actualiza el JSDoc (quedan Deudas, umbral y exportar).
  - [x] `src/app/(tabs)/index.tsx`: debajo del bloque de Saldo calculado y antes de las vencidas, una línea por cada `estado.fondos` con `t.saldoFondo(nombre, formatearDinero(saldo))`. Sin fondos, nada. No calcula nada (AD-1).
  - [x] Si `tsc` no reconoce las rutas nuevas (`typedRoutes`), corre `npx expo start` una vez para regenerar `.expo/types` (lección de H1.4). No desactives `typedRoutes`.

- [x] **T12. Pruebas de pantallas e integración (AC: 9, 11, 12)**
  - [x] En `pruebas/pantallas/`, con `await render(...)` y los mocks de H1.5 (`use-comando`, `use-configuracion`, `use-hoy`, `expo-router` con `Stack.Screen` y `useLocalSearchParams`):
    - `configuracion-presupuestos.test.tsx`: precarga; la ayuda del combustible aparece solo en el Presupuesto enlazado a una categoría con Vehículo; errores por campo; alta con `operacion` y datos del comando; `fallo` → mensaje genérico.
    - `configuracion-categorias.test.tsx`: la lista agrupada con las de sistema sin edición; alta de Esencial sin Presupuesto; cambio de clase que limpia enlaces; nombre repetido; edición precargada; borrado en dos pasos; `noEncontrado` con un id de sistema.
    - `ajustes.test.tsx`: seis entradas (antes 4), resúmenes y navegación.
    - `inicio.test.tsx`: con fondos → la línea del saldo; sin fondos → nada. Actualiza los Estados de prueba con los campos nuevos.
    - `layout.test.tsx`: siguen pasando las pruebas de gating sin cambiar sus aserciones.
  - [x] Integración con base real en `src/hooks/use-estado.integracion.test.tsx`:
    1. Configura Pagos y saldo.
    2. `ejecutar(guardarPresupuestosYFondos(...))` con los ids de `IDS_SIEMBRA`.
    3. `useEstado` muestra los Presupuestos pendientes, `reservas.fondo` y el Dinero libre esperado.
    4. Una categoría nueva no cambia el Estado.

- [x] **T13. Cierre**
  - [x] Agrega en `_bmad-output/implementation-artifacts/deferred-work.md` una sección "Deferred from: H1.6" con: (1) el cálculo del Gasto Esencial sin Presupuesto (Salud: resta del Saldo, sin adelanto ni Impacto) va con H2.1/H2.2, con su prueba; (2) consumo de Presupuestos y fondo por Gastos en H2.1; (3) sin UI para crear, renombrar o borrar Presupuestos y Fondos (el modelo admite N).
  - [x] `npm run verificar` en verde. Hoy hay 745 pruebas (más las del review de H1.5); anota el nuevo total.
  - [x] `npx expo export --platform android` compila el bundle.
  - [x] Prueba manual en la build dev (no hay módulos nativos nuevos: basta `npx expo start`). Recorrido:
    1. Abrir la app ya instalada: la migración 0004 corre sobre los datos de H1.5 sin perderlos.
    2. Ajustes → Presupuestos y fondo: ver la ayuda del combustible; fijar Comida, Mantenimiento y el fondo.
    3. Ver cómo baja el Dinero libre y aparece "Fondo enduro" en Inicio.
    4. Categorías: crear una, editarla, intentar repetir "Salud", borrarla; ver que las de sistema no se editan.
    5. Re-bloqueo tras más de 5 minutos sobre un formulario.
  - [x] Llena el Dev Agent Record: archivos, desvíos y el resultado de las migraciones.

### Review Findings

- [x] [Review][Patch] Re-anclar el saldo del fondo en hoy (decisión 1): precargar el saldo calculado con fecha hoy; si cambian el saldo o el aporte, guardar un punto de partida nuevo (saldo, hoy) para no recalcular hacia atrás [src/components/configuracion/formulario-presupuestos-y-fondos.tsx:42, src/data/commands/guardar-presupuestos-y-fondos.ts:43]
- [x] [Review][Patch] Normalizar los enlaces de la categoría según su clase en el cargador; una 'fondo' sin Fondo vigente pasa a 'gusto' sin enlace (decisión 2) [src/data/queries/cargar-hechos.ts:45]
- [x] [Review][Patch] Dos listas de clases de gasto (`CLASES_GASTO` en domain y `clasesGasto` en schema) sin garantía de exhaustividad: exportar una sola desde domain e importarla en schema [src/domain/entrada.ts:379]
- [x] [Review][Patch] `compararTexto` copiado 4 veces en domain/ (aportes, presupuestos, obligaciones, calcular-estado): exportarlo una vez [src/domain/aportes.ts:3]
- [x] [Review][Patch] El texto `categoriaDeSistema` está definido pero nunca se muestra: mapear ese error del comando en el formulario en vez del fallo genérico, o eliminar el texto [src/textos/configuracion.ts:127]
- [x] [Review][Patch] Las filas de sistema ponen el resumen en `accessibilityHint`: moverlo a `accessibilityLabel` (nombre + resumen) [src/components/configuracion/lista-categorias.tsx:64]
- [x] [Review][Defer] Saldo del fondo con fecha futura (reloj atrasado): `resultadoFondo` lo cuenta como Reserva y `fechaFutura` bloquea guardar toda la pantalla [src/domain/fondos.ts:27, src/domain/entrada.ts:359] — deferred, mismo patrón previo de la reserva inicial de H1.5
- [x] [Review][Defer] La reserva inicial de la Obligación anual (H1.5) comparte la semántica de punto de partida que se puede volver a aplicar hacia atrás al editarla [src/components/configuracion/formulario-obligacion.tsx:51] — deferred, pre-existing

## Dev Notes

### Qué es y qué no es esta historia

- **Es:**
  - Las tablas `presupuestos`, `fondos` y `categorias` (migración 0003) y su siembra (migración 0004).
  - Presupuestos pendientes, saldo del fondo (Reserva) y aporte al fondo (Aporte programado) en el Estado.
  - Un formulario de montos, la lista y el formulario de categorías, dos entradas de Ajustes y el saldo del fondo en Inicio.
- **No es:**
  - **Gastos** (Épica 2). Ni el consumo de Presupuestos y fondo, ni los adelantos (FR-9), ni la parte cubierta/desbordada, ni el Impacto en días. Por eso el AC de Salud (sin adelanto y sin Impacto) queda fijado en los datos y en el tipo, y su prueba de cálculo va con H2.1/H2.2 (T13 lo deja en `deferred-work.md`). **No inventes una tabla de Gastos ni un Gasto de prueba en `Hechos`.**
  - Crear, renombrar o borrar Presupuestos y Fondos: el modelo admite N (AC 1) pero la UI solo edita montos.
  - Deudas, cuotas y Meta (H1.7). La prueba fija de Dinero libre = 1.350.000 se completa en H1.7; aquí va el caso A6, recortado.
  - El asistente (H1.8): aquí solo quedan los componentes reutilizables.
- **Diferencia conocida con el addendum:** su tabla descuenta 1.100.000 de Presupuesto en noviembre y 1.200.000 en diciembre. Eso implica 100.000 de comida ya consumidos en noviembre (un Gasto, Épica 2). Sin Gastos, A6 descuenta 1.100.000 los dos meses; el mínimo (8-nov) y el Dinero libre no cambian por eso.

### Decisiones fijadas en esta historia

- **Siembra en una migración custom con ids fijos.** Es atómica con el esquema, corre una sola vez (el migrador lleva la cuenta), existe en la base de pruebas sin pasos extra y sobrevive a una restauración (H7 reemplaza las tablas con las filas de la copia). Los ids fijos permiten que H2.4 y H2.6 encuentren "Pago de Obligación" y "Sin registrar" sin buscar por nombre (AD-9: "nunca por nombre"). Es un desvío consciente de "UUID generado en el cliente" (AD-10) solo para las filas sembradas: tienen forma UUID v4 y son iguales en toda instalación, lo que además ayuda a una futura sincronización. Las filas creadas por el usuario siguen usando `ctx.nuevoId()`.
- **Sembrado sin montos.** H1.4 fijó que los valores de siembra no se escriben hasta que Priettos los confirma, para que el asistente (H1.8) sepa qué pasos faltan. Aquí se escriben las **filas** (estructura y reglas), pero los montos quedan en `null`: un Presupuesto sin monto no descuenta nada y un fondo sin configurar no aparece. H1.8 considera completo el paso cuando todos los Presupuestos vigentes tienen monto y todos los Fondos están configurados.
- **El Presupuesto pendiente es el monto completo** del mes en curso, aunque el saldo inicial sea de mitad de mes (en contra del usuario, AD-7). H2.1/H2.2 restan lo consumido.
- **Fondo:** igual que el prorrateo anual de H1.5: créditos en la fecha **esperada** del Pago 2 posterior a `f0`, sin tope, sin liberación.
- **Categorías de sistema:** no se editan ni se borran (ni el nombre). Cuentan para el nombre repetido.
- **Enlaces coherentes con la clase**, validados en `domain/` y repetidos en el comando. El formulario limpia los enlaces al cambiar de clase.
- **La ayuda del combustible sale de los datos** (`esPresupuestoDeVehiculos`), no de un id fijo en la UI.
- **Sin FK en SQL** (como H1.5): la integridad va en los comandos y el cargador (huérfano → `null`).
- **Sin ventanas nativas ni dependencias nuevas.** Fechas en texto `AAAA-MM-DD`; "¿Pide Vehículo?" con `Opciones`, no con un `Switch`.

### Estado actual de los archivos que se modifican

| Archivo | Hoy (tras H1.5) | Qué cambia | Qué se preserva |
| --- | --- | --- | --- |
| `src/domain/hechos.ts` | Pagos, saldo, Colchón, Vehículos, Obligaciones | `ClaseGasto`, Presupuestos, Fondos, Categorías | Tipos existentes y `hechosVacios` como constante |
| `src/domain/estado.ts` | `reservas {anual, total}`, `AporteProgramado` solo `prorrateoAnual` | Presupuestos pendientes, fondos, `reservas.fondo`, aporte `fondo` | Todo lo de H1.4/H1.5 |
| `src/domain/calcular-estado.ts` | Compone Pagos y Obligaciones en el mapa por fecha | Compone Presupuestos y fondos | `HORIZONTE_DIAS`, `faltantes`, orden de Pagos, pureza y totalidad |
| `src/domain/obligaciones.ts` | `Marco`, reserva anual, orden de aportes por `(fecha, obligacionId)` | Quizá el orden común de aportes | El algoritmo de la reserva anual, intacto |
| `src/domain/entrada.ts` | Pagos, saldo, Vehículo, Obligaciones | Presupuesto, Fondo y Categoría | Funciones y códigos existentes |
| `src/data/schema.ts` | `rastro`, `pagos`, `ajustes`, `vehiculos`, `obligaciones` | 3 tablas y `clasesGasto` | Lo existente |
| `src/data/siembra.ts` | `SIEMBRA.colchon` | `IDS_SIEMBRA` y JSDoc | `SIEMBRA.colchon` (lo usa `colchonSugerido`) |
| `src/data/queries/cargar-hechos.ts` | 5 tablas | 3 tablas más | Nunca lee `rastro` ni instantáneas; arreglos nuevos en cada carga |
| `src/hooks/use-configuracion.ts` | Pagos, saldo, Colchón, Vehículos, Obligaciones | Presupuestos, fondos, categorías | Sin lectura propia |
| `src/app/_layout.tsx` | Gating + Stack con 7 pantallas | 3 `Stack.Screen` nuevas | **Todo el gating** |
| `src/app/(tabs)/ajustes.tsx` | 4 entradas | 2 más | `Entrada` y resúmenes actuales |
| `src/app/(tabs)/index.tsx` | Dinero libre, Saldo, vencidas, atrasados, accesos | Saldo del fondo | El estado vacío, el negativo en rojo con texto y las vencidas |
| `src/textos/{navegacion,ajustes,configuracion,inicio}.ts` | Textos de H1.4/H1.5 | Textos nuevos | Claves existentes (las usan las pruebas) |

### Capas y lint (vigentes; no aflojarlos)

- `domain/` es puro: sin `Date`, `Intl`, `Math.random` ni imports de otras capas. Fechas como strings (`mesDe`, `sumarMeses`, `fechaEnMes`, `sumarDias` ya existen en `domain/fechas.ts`).
- `data/` es el único lugar con `drizzle-orm`. Comandos en `data/commands/*` con `definirComando`; las pantallas solo importan comandos (el lint impide `definir-comando` y `contexto`).
- `app/` y `components/` no tienen texto literal (incluye `title`, `placeholder` y `accessibilityLabel`), no importan `services/reloj` (usa `useHoy`) y ejecutan con `ejecutar()`.
- `hooks/` no importa `drizzle-orm`, `data/db` ni `data/schema`.

### Trampas conocidas (de H1.1–H1.5)

- **Sin `await` dentro de `db.transaction`:** los comandos son síncronos.
- **`expo-crypto` en Jest:** inyecta `nuevoId` en `ejecutarComando`.
- **Caché de hechos:** las pruebas con base real llaman `avisarCambio()` en `beforeEach`.
- **React Compiler:** no leas ni escribas refs en el render; `useGuardadoDiferido` ya resuelve el doble toque.
- **Testing Library 14:** `await render`, `await fireEvent`; bajo `no-hide-descendants`, `includeHiddenElements`.
- **Mock de `expo-router`:** `Stack` con `Screen`; `useLocalSearchParams` mockeado.
- **Tabs:** se importan de `expo-router/js-tabs`. No lo cambies.
- **`formatearDinero` lanza con no enteros:** usa `leerMonto`.
- **`BotonBorrar`:** `onBorrar` puede devolver `false` para cerrar la confirmación (review de H1.5).
- **Migración custom:** sin `--> statement-breakpoint` el migrador de Expo falla con varias sentencias; better-sqlite3 (pruebas) podría no notarlo. Pruébalo también en la build dev (T13).
- **Formato:** `--single-quote --print-width 120` (Prettier de la caché de npx, como en H1.5).
- **Sin dependencias nuevas.** Si algo parece necesitar una, detente y pregunta a Priettos.

### Testing

- `domain/`: presupuestos (P1–P5), fondos (F1–F5), categorías (C1), entrada y `calcularEstado` (A6, casos de H1.5 intactos, invariantes), sin base ni reloj.
- `data/`: siembra, tablas, comandos y cargador con `crearBaseDePrueba()` y `/** @jest-environment node */`. Nunca un mock de `expo-sqlite`.
- Pantallas en `pruebas/pantallas/`; componentes con la prueba al lado.
- Integración comandos → `useEstado` con base real (T12).
- Cada rama de error se prueba de verdad: la prueba debe fallar sin el guardia.

### Project Structure Notes

```text
src/
  domain/
    hechos.ts, estado.ts                       # MODIFICADOS (T1)
    presupuestos.ts / .test.ts                 # NUEVO (T2)
    fondos.ts / .test.ts                       # NUEVO (T2)
    categorias.ts / .test.ts                   # NUEVO (T2)
    calcular-estado.ts / .test.ts              # MODIFICADOS (T3)
    entrada.ts / .test.ts                      # MODIFICADOS (T4)
  data/
    schema.ts                                  # MODIFICADO (T5)
    siembra.ts / siembra.test.ts               # MODIFICADO / NUEVO (T5)
    tablas/presupuestos.ts, fondos.ts, categorias.ts (+ .test.ts)          # NUEVOS (T6)
    commands/guardar-presupuestos-y-fondos.ts, guardar-categoria.ts, borrar-categoria.ts (+ .test.ts)   # NUEVOS (T7)
    queries/cargar-hechos.ts / .test.ts        # MODIFICADOS (T8)
  hooks/use-configuracion.ts / .test.ts        # MODIFICADOS (T8)
  hooks/use-estado.integracion.test.tsx        # MODIFICADO (T12)
  textos/clases.ts                             # NUEVO (T9)
  textos/navegacion.ts, ajustes.ts, configuracion.ts, inicio.ts   # MODIFICADOS (T9)
  components/configuracion/formulario-presupuestos-y-fondos.tsx, lista-categorias.tsx, formulario-categoria.tsx   # NUEVOS (T10)
  app/configuracion/presupuestos-y-fondos.tsx, categorias/index.tsx, categorias/[id].tsx   # NUEVOS (T11)
  app/_layout.tsx, (tabs)/ajustes.tsx, (tabs)/index.tsx   # MODIFICADOS (T11)
drizzle/0003_*.sql, 0004_sembrar-*.sql, meta/0003_snapshot.json, meta/0004_snapshot.json, meta/_journal.json, migrations.js   # GENERADOS (T5)
pruebas/pantallas/configuracion-presupuestos.test.tsx, configuracion-categorias.test.tsx   # NUEVOS (T12)
pruebas/pantallas/ajustes.test.tsx, inicio.test.tsx   # MODIFICADOS (T12)
```

- Archivos en kebab-case; tablas en plural `snake_case`; términos del Glosario en camelCase sin tildes (`presupuestosPendientes`, `montoMensual`, `aporteMensual`, `claseDefault`).
- El spine sitúa la configuración en `app/configuracion`: las rutas nuevas siguen ahí.

### Previous Story Intelligence (H1.5)

- **Se reutiliza tal cual:** `definirComando`/`ejecutar`; `editarConRastro` (no-op sin cambios) y `borrarConRastro`; `vigentes()`; `useHechos`/`useConfiguracion`; `ocurrenciasMensuales`, `fechaEnMes`, `sumarDias`, `mesDe`, `sumarMeses`; `normalizarNombre`, `mismoNombre`, `errorNombre`, `NOMBRE_MAXIMO`, `ANTIGUEDAD_MAXIMA_SALDO_DIAS`, `leerMonto`; `Formulario` (con `pie`), `Campo`, `Opciones`, `BotonBorrar`, `Fila`, `NoEncontrado`, `useGuardadoDiferido`; `formatearDinero`, `formatearFechaCorta`; `crearBaseDePrueba`.
- **Patrones que funcionaron:** reglas por separado en un archivo de `domain/` con sus pruebas y `calcularEstado` solo compone; casos con números ya calculados en la historia; pruebas de mutación del guardia (H1.5 las hizo para la reserva).
- **Review de H1.5:** la confirmación de borrar dice "¿Seguro que quieres borrar «{nombre}»?"; si el borrado no puede seguir, `onBorrar` devuelve `false` y la confirmación se cierra.
- **Diferidos abiertos que tocan esta historia** (no cerrarlos salvo que salga gratis): `router.push` sin guard ante doble toque; formularios que no se resincronizan (H1.8); `KeyboardAvoidingView` en Android; sin `CHECK` en SQL (el cargador descarta filas inválidas); resumen solo en `accessibilityHint`; montos hasta `Number.MAX_SAFE_INTEGER`.
- **Proceso:** para compilar Android, `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`. Documenta todo desvío en el Dev Agent Record.

### Git Intelligence

- Últimos commits: `aa12f3e` (H1.5), `8294cd4` (historia H1.5 lista), `f45830c` (H1.4), `8fda2ea` (H1.2 + H1.3), `adbab6d` (H1.1).
- Sin commit: las correcciones del review de H1.5 (T0).
- Estilo de commit: en español, prefijo `H1.6:` y viñetas por decisión. Autor: el noreply de GitHub de prietto (nunca el correo de trabajo). Solo se commitea si Priettos lo pide.

### Información técnica verificada (node_modules del proyecto, 2026-11-10)

- **drizzle-kit 0.31.11:** `generate` acepta `--custom` ("Prepare empty migration file for custom SQL") y `--name`. Con `driver: 'expo'` reescribe `drizzle/migrations.js` con la migración nueva.
- **drizzle-orm 0.45.4:** `integer(…, { mode: 'boolean' })` en `sqlite-core` (guarda 0/1) y `text(…, { enum })` como en `rastro` y `obligaciones`.
- **expo-router 57.0.29:** rutas dinámicas `[id].tsx`, `Stack.Screen` dentro de la pantalla y rutas tipadas, igual que en H1.5. Docs: https://docs.expo.dev/router/reference/url-parameters/.
- **`app.config.ts`:** `reactCompiler: true` y `typedRoutes: true`.
- Sin dependencias nuevas.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]: AC de la épica y decisiones del 2026-11-04 (Salud sin Presupuesto, Combustible en mantenimiento).
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7, 1.8, 2.1, 2.2, 2.4, 2.6]: límites de alcance (Meta, asistente, consumo de bolsas, adelantos, "ya pagamos", Gasto sin registrar).
- [Source: _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md]: AD-1 (saldos de Fondos y Presupuestos en el Estado), AD-2 (`fondo.saldoInicial`), AD-3, AD-4, AD-5, AD-7, AD-9 (columnas de `categorias`, N Fondos y N Presupuestos, "Sin registrar" no se borra, enlaces por id), AD-10, AD-17, AD-18, AD-19, AD-20 (aporte al fondo en el Pago 2, acumulación) y el erDiagram.
- [Source: _bmad-output/planning-artifacts/prds/prd-moneytrack_app-2026-10-14/prd.md#3 Glosario]: Presupuesto esencial, Fondo protegido, Reserva, Aporte programado, Saldo proyectado, Gasto sin registrar; FR-3, FR-4, FR-8, FR-13; §10.1.
- [Source: _bmad-output/planning-artifacts/prds/prd-moneytrack_app-2026-10-14/addendum.md]: caso de Dinero libre (fondo 350.000, Presupuestos de noviembre 1.100.000, aporte del 30-nov).
- [Source: _bmad-output/implementation-artifacts/1-5-registrar-vehiculos-y-obligaciones-mensuales-y-anuales.md]: patrones, algoritmo de la reserva anual, decisiones, review y desvíos.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md]: diferidos abiertos.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), con bmad-dev-story.

### Debug Log References

- `npm run verificar`: typecheck, lint y 879 pruebas en 59 suites, en verde (antes 745 + las del review de H1.5).
- `npx expo export --platform android`: bundle de 3,3 MB sin errores.
- Prueba manual en la build dev (2026-11-10): Priettos confirma los 5 pasos del recorrido de T13 en verde.
- Migración sobre una base de H1.5 con datos (better-sqlite3, migraciones 0000–0002, filas en `vehiculos`, `obligaciones` y `ajustes`, luego 0003–0004): los datos se conservan, se siembran 2 Presupuestos, 1 Fondo y 11 categorías, y una segunda pasada no duplica nada. `when`: 0002 = 1794055913467 < 0003 = 1794359802045 < 0004 = 1794359803930.

### Completion Notes List

- Análisis de contexto completado: guía de desarrollo exhaustiva creada (create-story, 2026-11-10).
- T0: commit `1947cf8` "H1.5: correcciones del review", hecho a pedido de Priettos con el noreply; `baseline_commit` apunta ahí.
- `domain/`: `presupuestos.ts` (pendientes del mes en curso en `hoy` y los días 1 del Horizonte), `fondos.ts` (saldo = inicial + aportes en las fechas esperadas del Pago 2 `≤ hoy`; los de `(hoy, hasta]` son Aportes programados), `categorias.ts` (`esPresupuestoDeVehiculos`) y `aportes.ts` (`compararAportes`: `(fecha, tipo, id)`, que usan `obligacionesEnHorizonte` y `calcularEstado`). `calcularEstado` solo compone: `reservas = { anual, fondo, total }`, `presupuestosPendientes`, `fondos` y un solo orden de aportes. Caso A6 con las cifras de la historia (Dinero libre 3.850.000); sin montos, el Estado es idéntico al de H1.5 (`toEqual`).
- Validación pura en `entrada.ts`: `erroresPresupuesto`, `erroresFondo` (reglas de la reserva inicial; la fecha guardada se acepta aunque envejezca) y `erroresCategoria` (nombre único contra todas las vigentes, incluidas las de sistema; enlaces coherentes con la clase; `claseInvalida`).
- Datos: tablas `presupuestos`, `fondos` y `categorias` (0003, sin FK) y siembra en la migración custom 0004 con ids fijos (`IDS_SIEMBRA`), `--> statement-breakpoint` entre sentencias y marcas ISO UTC. Módulos dueños sin transacción propia; comandos `presupuestosYFondos.guardar` (una transacción, todo o nada), `categorias.guardar` y `categorias.borrar` (`categoriaDeSistema` en las de sistema).
- Cargador: un fondo a medio configurar sale con aporte y saldo en `null`; los enlaces huérfanos pasan a `null`; una clase desconocida se descarta sin lanzar. `useConfiguracion` expone `presupuestos`, `fondos` y `categorias`.
- UI: `FormularioPresupuestosYFondos` (ayuda del combustible si `esPresupuestoDeVehiculos`), `ListaCategorias` (grupos por clase y "De la app" sin edición) y `FormularioCategoria` (limpia enlaces al cambiar de clase; preselecciona el primer fondo; `NoEncontrado` con id de sistema o inexistente). Rutas nuevas, dos entradas en Ajustes y el saldo de cada Fondo en Inicio.
- Desvíos y decisiones menores:
  1. `compararAportes` vive en `domain/aportes.ts` (archivo común), no en `obligaciones.ts`.
  2. `src/data/pruebas/hechos-sembrados.ts` (nuevo, solo pruebas): los Hechos de una base recién migrada, para las pruebas que antes esperaban `hechosVacios`.
  3. Textos extra: `textosAjustes.lineaPresupuesto` ("Comida 700.000") y `textosConfiguracion.erroresNombreCategoria.nombreRepetido` ("Ya tienes una categoría con ese nombre"; el genérico habla de vehículos). La fecha antigua del fondo reutiliza `erroresFechaReserva.fechaAntigua`.
  4. El resumen de Ajustes junta Presupuestos y Fondos configurados en una línea ("Comida 700.000 · … · Fondo enduro: 350.000 al mes"); sin ninguno, "Sin configurar".
  5. En el formulario de montos, el aporte del fondo sin configurar arranca vacío (obliga a escribirlo); el saldo en 0 y la fecha en hoy.
  6. `drizzle-kit generate --custom` borró el comentario de cabecera de `drizzle/migrations.js`; se restauró.
  7. Prettier (`--single-quote --print-width 120`) solo sobre archivos nuevos o que ya estaban formateados en el baseline, para no reformatear código ajeno a la historia.
- Pruebas nuevas: P1–P5, F1–F5, C1, A6 e invariantes; validación por código y borde; siembra; tablas; comandos (rollback total, rastro solo si cambia, fecha guardada antigua, ids borrados, sistema); cargador; pantallas de Presupuestos y Categorías, Ajustes e Inicio; integración de punta a punta con base real (Dinero libre 6.000.000 → 4.550.000; una categoría nueva no cambia el Estado).

### File List

Nuevos:
- `drizzle/0003_productive_joystick.sql`
- `drizzle/0004_sembrar-presupuestos-fondo-y-categorias.sql`
- `drizzle/meta/0003_snapshot.json`
- `drizzle/meta/0004_snapshot.json`
- `src/domain/aportes.ts`
- `src/domain/presupuestos.ts`, `src/domain/presupuestos.test.ts`
- `src/domain/fondos.ts`, `src/domain/fondos.test.ts`
- `src/domain/categorias.ts`, `src/domain/categorias.test.ts`
- `src/data/siembra.test.ts`
- `src/data/pruebas/hechos-sembrados.ts`
- `src/data/tablas/presupuestos.ts`, `src/data/tablas/fondos.ts`, `src/data/tablas/presupuestos-y-fondos.test.ts`
- `src/data/tablas/categorias.ts`, `src/data/tablas/categorias.test.ts`
- `src/data/commands/guardar-presupuestos-y-fondos.ts`, `src/data/commands/guardar-presupuestos-y-fondos.test.ts`
- `src/data/commands/guardar-categoria.ts`, `src/data/commands/borrar-categoria.ts`, `src/data/commands/categorias.test.ts`
- `src/textos/clases.ts`
- `src/components/configuracion/formulario-presupuestos-y-fondos.tsx`
- `src/components/configuracion/lista-categorias.tsx`
- `src/components/configuracion/formulario-categoria.tsx`
- `src/app/configuracion/presupuestos-y-fondos.tsx`
- `src/app/configuracion/categorias/index.tsx`
- `src/app/configuracion/categorias/[id].tsx`
- `pruebas/pantallas/configuracion-presupuestos.test.tsx`
- `pruebas/pantallas/configuracion-categorias.test.tsx`

Modificados:
- `drizzle/meta/_journal.json`, `drizzle/migrations.js`
- `src/domain/hechos.ts`, `src/domain/estado.ts`, `src/domain/calcular-estado.ts`, `src/domain/calcular-estado.test.ts`
- `src/domain/obligaciones.ts`, `src/domain/obligaciones.test.ts`
- `src/domain/entrada.ts`, `src/domain/entrada.test.ts`
- `src/data/schema.ts`, `src/data/siembra.ts`
- `src/data/queries/cargar-hechos.ts`, `src/data/queries/cargar-hechos.test.ts`
- `src/data/use-hechos.test.tsx`
- `src/hooks/use-configuracion.ts`, `src/hooks/use-configuracion.test.ts`
- `src/hooks/use-comando.test.ts`, `src/hooks/use-estado.test.ts`, `src/hooks/use-estado.integracion.test.tsx`
- `src/textos/ajustes.ts`, `src/textos/configuracion.ts`, `src/textos/inicio.ts`, `src/textos/navegacion.ts`
- `src/app/_layout.tsx`, `src/app/(tabs)/ajustes.tsx`, `src/app/(tabs)/index.tsx`
- `pruebas/pantallas/ajustes.test.tsx`, `pruebas/pantallas/inicio.test.tsx`
- `pruebas/pantallas/configuracion-obligaciones.test.tsx`, `configuracion-pagos.test.tsx`, `configuracion-saldo.test.tsx`, `configuracion-vehiculos.test.tsx`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-11-10: Historia creada con create-story. Estado → ready-for-dev.
- 2026-11-10: Implementación de H1.6 (dev-story): tablas y siembra de Presupuestos, Fondo y categorías; Presupuestos pendientes, saldo y aporte del fondo en el Estado; validación, comandos, cargador, formularios, rutas, Ajustes e Inicio. 879 pruebas en verde. Estado → review.
