---
baseline_commit: 8fda2ea1fa7e88fbca24b3435406732d4c836731
---

# Story 1.4: Configurar Pagos, saldo inicial y Colchón, y ver el primer Dinero libre

Status: done

<!-- Nota: la validación es opcional. Ejecutar validate-create-story para un control de calidad antes de dev-story. -->

## Story

Como Priettos,
quiero registrar mis dos Pagos, mi Saldo real inicial y mi Colchón, y ver de inmediato cuánto tengo libre,
para dejar de hacer cuentas de cabeza desde el primer día.

**Requisitos:** FR1, FR4 (Colchón y saldo inicial; el fondo enduro es de H1.6), FR13 (parte base), NFR2, NFR6, UX-DR3; AD-2, AD-3, AD-5, AD-9, AD-10, AD-17, AD-18.

Es la segunda mitad de la antigua H1.3, que se partió en el readiness del 2026-11-04. H1.3 dejó el núcleo: reloj, `Hechos`, `calcularEstado`, `useEstado`, `ejecutar` y rastro. **Esta historia trae las primeras tablas de negocio, los primeros comandos reales, las ocurrencias de Pagos, la navegación base y la pantalla principal.**

## Acceptance Criteria

1. **Pagos (FR1, AD-3, AD-10).** En la pantalla de configuración de Pagos, Priettos registra el Pago 1 (p. ej. día 10 y su monto esperado) y el Pago 2 (p. ej. día 30 y su monto esperado). El comando `configurarPagos` guarda los dos en **una sola transacción**. Cada fila lleva `id` UUID v4 (`expo-crypto`), `createdAt`, `updatedAt` y `deletedAt`. Si ya existían, los edita con rastro y conserva su `id`.
2. **Día inexistente (AD-5).** En un mes sin día 29, 30 o 31, la ocurrencia que genera `domain/` cae el último día del mes: el día 30 de febrero de 2027 → `2027-02-28`, y el día 31 de abril → `2026-04-30`. No hay ajuste por fines de semana.
3. **Saldo inicial y Colchón (FR4, AD-2, AD-9).** En la pantalla de saldo inicial y Colchón, el Colchón viene precargado con 4.000.000. Es el valor de siembra y la única constante permitida en el código. Priettos ingresa el Saldo real inicial y su fecha. Todo se guarda como configuración con fecha (`saldoInicial {monto, fecha}`), sin columnas derivadas.
4. **Rastro (AD-3).** Toda edición de configuración, de Pagos o de saldo inicial y Colchón, escribe su fila de `rastro` en la misma transacción con el helper de H1.3. Una edición que no cambia nada no deja rastro ni toca `updatedAt`.
5. **Pagos esperados en el Horizonte (AD-5).** Al calcular el Estado, cada ocurrencia esperada y no confirmada de un Pago con fecha dentro del Horizonte (`hoy..hoy+31`) suma su monto esperado al Saldo proyectado desde su fecha.
6. **Pago atrasado (AD-5).** Si la fecha de una ocurrencia esperada ya pasó (`fecha < hoy`) sin confirmar, el Pago se proyecta en `hoy` y queda marcado `pagoAtrasado`. Solo cuentan las ocurrencias posteriores al punto de partida (`fecha > saldoInicial.fecha`; ver Decisiones).
7. **Navegación base.** Con la app autenticada existen la pantalla principal, Movimientos y Ajustes, como pestañas, más el lugar de los accesos rápidos (registro manual, cámara y "¿Puedo?"), que llenan las historias siguientes. Los accesos cuya función aún no existe **no se muestran**: en H1.4 no se ve ninguno.
8. **Pantalla principal con cifras (FR13, UX-DR3, NFR6).** Tras configurar, la pantalla principal muestra el Dinero libre y el Saldo calculado formateados con `formatearDinero()`. Si el Dinero libre es negativo, se muestra en rojo con el día y el monto del faltante, y además **un texto que lo dice**: no basta el color.
9. **Estado vacío amable.** Sin configuración suficiente para calcular, la pantalla principal muestra un estado vacío amable que lleva a Ajustes o al paso que falta (el asistente llega en H1.8). Nunca muestra cifras inventadas.
10. **Calidad (NFR13).** `npm run verificar` pasa en verde. Todo texto visible sale de `src/textos/` (AD-17).

## Tasks / Subtasks

- [x] **T1. Fechas y ocurrencias puras en `domain/` (AC: 2, 5, 6)**
  - [x] En `src/domain/fechas.ts` agrega, sin romper lo existente:
    - `diasDelMes(anio, mes)`: ya existe como función privada; expórtala.
    - `mesDe(fecha): string`: devuelve la clave `'YYYY-MM'`.
    - `sumarMeses(claveMes, n): string`: suma `n` meses a una clave `'YYYY-MM'`; `n` puede ser negativo.
    - `fechaEnMes(claveMes, dia): string`: si el día no existe en el mes, usa el último (AD-5).
    - Todo con aritmética entera. `domain/` no usa `Date` ni `Intl`; ESLint lo hace cumplir.
  - [x] Nuevo `src/domain/ocurrencias.ts`. Lo reutilizan las Obligaciones (H1.5) y las cuotas (H1.7), así que debe ser **genérico** y no saber nada de Pagos:
    ```ts
    export type Ocurrencia = { clave: string /* 'YYYY-MM' */; fecha: string /* 'YYYY-MM-DD' */ };
    /** Ocurrencias mensuales de un día, con fecha en [desde, hasta] (ambos inclusive), en orden. */
    export function ocurrenciasMensuales(dia: number, desde: string, hasta: string): Ocurrencia[];
    ```
    - La primera ocurrencia sale de `mesDe(desde)`, y el ciclo avanza con `sumarMeses` mientras `fechaEnMes(clave, dia) <= hasta`.
    - Es total: con `dia` fuera de `1..31`, no entero, o con `desde > hasta`, devuelve `[]`.
  - [x] Pruebas en `fechas.test.ts` y en el nuevo `ocurrencias.test.ts`:
    - `fechaEnMes('2027-02', 30)` → `2027-02-28`; `fechaEnMes('2028-02', 30)` → `2028-02-29`; `fechaEnMes('2026-04', 31)` → `2026-04-30`; `fechaEnMes('2026-12', 31)` → `2026-12-31`.
    - `sumarMeses('2026-12', 1)` → `'2027-01'`; `sumarMeses('2026-01', -1)` → `'2025-12'`; `sumarMeses('2026-11', 14)` → `'2028-01'`.
    - Rango que cruza el año. Un rango sin ninguna ocurrencia. Los bordes `desde` y `hasta` son inclusivos. `dia` 0, 32 y 1,5 → `[]`.

- [x] **T2. Entrada y validación puras (AC: 1, 3)**
  - [x] Nuevo `src/domain/entrada.ts`. Son funciones puras que usan las pantallas y que los comandos repiten como defensa:
    - `leerMonto(texto): number | null` acepta dígitos con puntos de miles o espacios, como `'2.000.000'`, `'2000000'` o `' 2 000 000 '`. Devuelve un entero seguro ≥ 0, o `null` si viene vacío, con letras, comas decimales, signo o pasa de `Number.MAX_SAFE_INTEGER`. Nunca redondea.
    - `leerDia(texto): number | null` → entero de 1 a 31, o `null`.
    - `validarPago({ dia, montoEsperado })` → `Resultado<…, 'diaInvalido' | 'montoInvalido'>`. El monto esperado debe ser un entero seguro **> 0**.
    - `validarSaldoYColchon({ monto, fecha, colchon }, hoy)` → `Resultado<…, 'montoInvalido' | 'fechaInvalida' | 'fechaFutura' | 'colchonInvalido'>`. Las reglas:
      - El saldo es un entero seguro ≥ 0.
      - La fecha cumple `esFechaValida` y es `<= hoy`.
      - El Colchón es un entero seguro ≥ 0.
      - Ver Decisiones sobre los saldos negativos.
  - [x] Pruebas con tablas `it.each` que cubran cada código de error y los bordes: 0, 31, 32, el máximo seguro, `'1,5'`, `'-5'`, `''` y una fecha igual a `hoy`.

- [x] **T3. `Hechos` y `Estado` con Pagos (AC: 5, 6, 8, 9)**
  - [x] `src/domain/hechos.ts` agrega:
    ```ts
    export type NumeroPago = 1 | 2;
    export type PagoDefinido = { id: string; numero: NumeroPago; dia: number; montoEsperado: number };
    export type Hechos = { saldoInicial: SaldoInicial | null; colchon: number | null; pagos: PagoDefinido[] };
    export const hechosVacios: Hechos = { saldoInicial: null, colchon: null, pagos: [] };
    ```
    `hechosVacios` es una constante compartida: `cargarHechos` debe devolver arreglos nuevos y nunca mutar ni reutilizar ese arreglo.
  - [x] `src/domain/estado.ts`:
    ```ts
    export type Faltante = 'pagos' | 'saldoInicial' | 'colchon';
    export type OcurrenciaPago = {
      pagoId: string; numero: NumeroPago;
      clave: string;            // 'YYYY-MM' (AD-5): la confirmará H2.3 como (pagoId, clave)
      fecha: string;            // fecha esperada
      fechaProyectada: string;  // = fecha, o hoy si está atrasado
      monto: number;            // monto esperado
      pagoAtrasado: boolean;
    };
    // sinConfigurar gana `faltan`, que no está vacío y va en el orden de arriba.
    | { tipo: 'sinConfigurar'; hoy: string; faltan: Faltante[] }
    // calculado gana:
    pagosEsperados: OcurrenciaPago[];  // todas las que entran en la proyección, ordenadas por (fechaProyectada, numero)
    pagosAtrasados: OcurrenciaPago[];  // el subconjunto con pagoAtrasado = true (AD-1: "Pagos atrasados")
    ```
    - Los nombres van en camelCase y sin tildes, con términos del Glosario.
    - Saldo calculado y Dinero libre siguen siendo enteros, nunca `{valor, aproximado}` (AD-1).

- [x] **T4. `calcularEstado` con Pagos (AC: 5, 6, 9)**
  - [x] Reglas nuevas en `src/domain/calcular-estado.ts`:
    - **Sin configurar:** la configuración está completa si existen un Pago `numero 1` y un Pago `numero 2`, `saldoInicial` no es `null` y su `fecha <= hoy`, y `colchon` no es `null`. Si falta algo → `{ tipo: 'sinConfigurar', hoy, faltan }`.
      - Un `saldoInicial` con fecha futura cuenta como faltante `'saldoInicial'`. Cierra el diferido de H1.3: un reloj que retrocede o un saldo inicial con fecha futura nunca dan cifras de antes del punto de partida.
    - **Saldo calculado:** sigue siendo `saldoInicial.monto`, porque aún no hay movimientos. Deja el comentario de qué se suma en la Épica 2.
    - **Ocurrencias de Pagos:**
      - Para cada Pago, `ocurrenciasMensuales(pago.dia, sumarDias(saldoInicial.fecha, 1), sumarDias(hoy, HORIZONTE_DIAS))`.
      - Si `fecha < hoy` → `pagoAtrasado: true` y `fechaProyectada = hoy`. Si no → `pagoAtrasado: false` y `fechaProyectada = fecha`.
      - Todavía no hay confirmaciones: deja el punto marcado con un comentario para H2.3, donde se excluye la ocurrencia confirmada `(pagoId, clave)`.
    - **Saldo proyectado del día d** = Saldo calculado + suma de `monto` de las `pagosEsperados` con `fechaProyectada <= d`. Recorre los 32 días acumulando por fecha; no hagas un filtro O(n²) por día.
    - **Mínimo y Dinero libre:** sin cambios. El mínimo es el primer día en empate, y Dinero libre = `minimo.saldo − colchon`.
  - [x] Pruebas en `calcular-estado.test.ts`. Actualiza las existentes: ahora todos los casos "configurados" necesitan Pagos, y `sinConfigurar` lleva `faltan`. Agrega estos casos:
    - **Caso base del addendum, recortado a H1.4:** `hoy = '2026-11-03'`, saldo 10.000.000 al `2026-11-03`, Colchón 4.000.000, Pago 1 el día 10 por 2.000.000 y Pago 2 el día 30 por 6.000.000.
      - El Saldo proyectado vale 10M del 3 al 9-nov, 12M del 10 al 29-nov y 18M del 30-nov al 4-dic.
      - El mínimo es 10.000.000 el 3-nov y el Dinero libre es 6.000.000.
      - `pagosEsperados` tiene 2 entradas. El 10-dic queda fuera del Horizonte.
    - **Atrasado:** `hoy = '2026-11-12'` con saldo al `2026-11-05`.
      - La ocurrencia del 10-nov sale con `pagoAtrasado: true` y `fechaProyectada: '2026-11-12'`, y suma desde el primer día.
      - Aparece en `pagosAtrasados`.
    - **Varios atrasados:** con saldo al `2026-09-01` y `hoy = '2026-11-12'`, cada ocurrencia pendiente (10-sep, 30-sep, 10-oct, 30-oct, 10-nov) se proyecta en `hoy`.
    - **Punto de partida:** una ocurrencia el mismo día que `saldoInicial.fecha` no cuenta; la del día siguiente sí.
    - **Febrero:** `hoy = '2027-02-01'` y Pago 2 el día 30 → la ocurrencia es el 28-feb. Agrega también un año bisiesto.
    - **Ocurrencia hoy:** la ocurrencia en `hoy` no está atrasada.
    - **Horizonte:** una ocurrencia en `hoy+31` cuenta; una en `hoy+32` no.
    - **`faltan`:** sin nada → `['pagos', 'saldoInicial', 'colchon']`; solo Pago 1 → `'pagos'` sigue faltando; saldo con fecha futura → `'saldoInicial'`.
    - **Dinero libre negativo:** saldo 1.000.000 y Colchón 4.000.000, con Pagos fuera del primer día → −3.000.000 el día `hoy`.
    - **Invariantes de siempre:** enteros, pureza (`Object.freeze` profundo de `hechos`, incluido `pagos`) y dos llamadas `toEqual`.

- [x] **T5. Tablas, migración y módulos dueños (AC: 1, 3, 4)**
  - [x] En `src/data/schema.ts`, junto a `rastro` y con `...columnasComunes`:
    ```ts
    export const pagos = sqliteTable('pagos', {
      ...columnasComunes,
      numero: integer('numero').notNull(),            // 1 | 2
      dia: integer('dia').notNull(),                  // 1..31
      montoEsperado: integer('monto_esperado').notNull(),
    }, (t) => [uniqueIndex('pagos_numero_vigente').on(t.numero).where(sql`${t.deletedAt} is null`)]);

    export const ajustes = sqliteTable('ajustes', {   // una sola fila vigente: configuración general (AD-9)
      ...columnasComunes,
      saldoInicialMonto: integer('saldo_inicial_monto'),
      saldoInicialFecha: text('saldo_inicial_fecha'), // 'YYYY-MM-DD'
      colchon: integer('colchon'),
    });
    ```
    - Verifica en `node_modules/drizzle-orm/sqlite-core` que 0.45 acepte el índice parcial (`.where` en `IndexBuilderOn`) y que el SQL generado diga `WHERE "deleted_at" is null`. Si no lo acepta, omite el índice y documenta que la unicidad la garantiza el comando.
    - **No** guardes nada derivado (AD-2): ni ocurrencias, ni saldo proyectado, ni "atrasado".
    - Las columnas de `ajustes` admiten `null`: H1.8 y otras historias le agregan columnas (umbral del Semáforo y hora de la Sesión de pagos) con migraciones nuevas.
  - [x] Genera la migración con `npm run db:generar`. Versiona los cuatro archivos que cambian: el `.sql` nuevo `0001_*.sql`, `meta/0001_snapshot.json`, `meta/_journal.json` y `migrations.js`. **No** edites `0000_black_lockjaw.sql` ni escribas SQL a mano. Revisa que el `when` de la entrada nueva sea mayor que el de la 0000 (diferido de H1.1).
  - [x] Módulos dueños (AD-3). Reciben `tx` y `ctx` y nunca abren transacción:
    - `src/data/tablas/pagos.ts`: `leerPagosVigentes(tx)`, `insertarPago(tx, ctx, datos)` y `editarPago(tx, ctx, id, cambios)`. `editarPago` usa `editarConRastro`.
    - `src/data/tablas/ajustes.ts`: `leerAjustesVigentes(tx)`, `insertarAjustes(tx, ctx, datos)` y `editarAjustes(tx, ctx, id, cambios)`.
    - No hace falta `borrarX`: ninguna pantalla borra Pagos ni ajustes en v1. No lo agregues "por si acaso".
  - [x] **Edición sin cambios.** Cierra el diferido de H1.3 en `src/data/tablas/rastro.ts`: si `editarConRastro` recibe `cambios` que no alteran ninguna columna (comparación por valor con la fila vigente), devuelve la fila sin `update` y sin rastro. Agrega su prueba en `rastro.test.ts`.

- [x] **T6. Comandos fabricados solo en `data/commands` (AC: 1, 3, 4)**
  - [x] Cierra el diferido de H1.3 ("`Comando` entrega `ctx.db` completo"). Crea `src/data/commands/definir-comando.ts`:
    ```ts
    declare const marca: unique symbol;
    export type ComandoDefinido<T> = Comando<T> & { readonly [marca]: true };
    export function definirComando<T>(operacion: string, aplicar: (ctx: ContextoComando) => T): ComandoDefinido<T>;
    ```
    - `hooks/use-comando.ts`: `ejecutar` y `useComando` aceptan **solo** `ComandoDefinido<T>`.
    - `data/ejecutar-comando.ts` sigue aceptando `Comando<T>`, porque sus pruebas usan comandos de prueba.
    - Actualiza `use-comando.test.ts` y `use-estado.integracion.test.tsx` para que fabriquen sus comandos de prueba con `definirComando`.
  - [x] En `eslint.config.js`, agrega a `patronesComando` el patrón `(^|/)data/(contexto|commands/definir-comando)$`. Así una pantalla no puede fabricar un comando en línea, porque solo importa los comandos de `data/commands/*`. Agrega los casos en `pruebas/eslint-reglas.test.ts`:
    - `src/app/x.tsx` que importa `@/data/commands/definir-comando` → falla.
    - `src/app/x.tsx` que importa `@/data/commands/configurar-pagos` → pasa.
    - El mismo archivo que importa `drizzle-orm` → sigue fallando.
    - Recuerda la trampa de flat config: el bloque de `src/app/**` ya repite `patronesData`.
  - [x] `src/data/commands/configurar-pagos.ts`: `configurarPagos({ pago1, pago2 }: { pago1: { dia, montoEsperado }, pago2: … }): ComandoDefinido<void>`, con `operacion: 'pagos.configurar'`. Dentro de **una** `db.transaction`:
    1. Revalida con `validarPago`. Si falla, lanza `new Error('datosInvalidos')`: hay rollback y la pantalla recibe `fallo`.
    2. Lee los vigentes. Para cada número, edita si existe (`editarPago`, con rastro solo si cambió algo) y lo inserta si no existe.
  - [x] `src/data/commands/guardar-saldo-y-colchon.ts`: `guardarSaldoInicialYColchon({ monto, fecha, colchon, hoy })`, con `operacion: 'ajustes.saldoYColchon'`.
    - Una transacción. Revalida con `validarSaldoYColchon(…, hoy)`. `hoy` llega como parámetro porque el comando no lee el reloj; la pantalla lo pasa desde `useHoy()`.
    - Hace upsert de la única fila de `ajustes`.
    - Si hubiera más de una fila vigente (no debería pasar), edita la de `createdAt` más antiguo. Documéntalo.
  - [x] Pruebas `/** @jest-environment node */` con `crearBaseDePrueba()`, `ahora` y `nuevoId` fijos (inyectados en `ejecutarComando`). Cierra las bases en `afterEach`.
    - Primer `configurarPagos` → 2 filas con UUID, marcas iguales a `ahora` y ningún rastro.
    - Segundo con otro monto → mismos `id`, rastro `editar` con `antes`/`despues` completos y `updatedAt` nuevo.
    - Repetir los mismos datos → no hay rastro nuevo.
    - Datos inválidos (día 0, monto 0) → `fallo` y la base sin cambios (rollback).
    - Si falla el segundo Pago, tampoco queda el primero (atomicidad).
    - `guardarSaldoInicialYColchon`: insertar, editar con rastro, fecha futura → `fallo`, Colchón 0 → aceptado.
    - Índice parcial (si quedó): insertar a mano un segundo `numero 1` vigente lanza, y uno con `deletedAt` no lanza.

- [x] **T7. Cargador y hechos compartidos (AC: 5, 8)**
  - [x] `src/data/queries/cargar-hechos.ts` lee `pagos` y `ajustes` con `.where(vigentes(tabla))`:
    - `pagos` → `PagoDefinido[]`, ordenados por `numero`. Un `numero` fuera de 1|2 se descarta. Es una defensa para que el tipo sea honesto; no lances.
    - `ajustes` → `saldoInicial` es `{monto, fecha}` solo si **ambas** columnas existen; si no, `null`. `colchon` es `null` si falta.
    - Actualiza el JSDoc de "tablas que leerá cada historia".
    - Sigue sin leer `rastro` ni instantáneas.
  - [x] Pruebas en `cargar-hechos.test.ts` con la base real:
    - Base vacía → equivalente a `hechosVacios`, con arreglos nuevos.
    - Con filas → los Hechos esperados.
    - Las filas con `deletedAt` se excluyen.
    - Un saldo sin fecha → `saldoInicial: null`.
  - [x] **N+1 cargas.** Cierra el diferido de H1.3 en `src/data/use-hechos.ts`. Ahora hay varios consumidores: inicio, formularios y el post-comando.
    - Cachea la carga **a nivel de módulo** por `versionCambios()`. Todos los `useHechos` y `cargarHechosActuales()` de la misma versión comparten una sola lectura y el mismo objeto, así que no hay re-render por identidad nueva.
    - Mantén el contrato de errores: una carga fallida se lanza en el render. No la cachees como éxito.
    - Prueba que dos consumidores montados y `cargarHechosActuales()` en la misma versión llaman a `cargarHechos` **una** vez, y que tras `avisarCambio()` vuelve a cargar una vez.

- [x] **T8. Hook de configuración para los formularios (AC: 1, 3)**
  - [x] `src/hooks/use-configuracion.ts`: `useConfiguracion()` → `{ pago1, pago2, saldoInicial, colchon, colchonSugerido }`, derivado de `useHechos()`. No hace una lectura propia.
    - `colchonSugerido = colchon ?? SIEMBRA.colchon`.
    - `SIEMBRA` vive en el nuevo `src/data/siembra.ts`, como `export const SIEMBRA = { colchon: 4_000_000 } as const`, con un comentario que cite AD-9: es la única constante de valor personal permitida. H1.6 ampliará ese archivo con la siembra de categorías, presupuestos y fondo.
  - [x] Prueba con `useHechos` mockeado: sin datos → `colchonSugerido` 4.000.000; con Colchón 3.000.000 → 3.000.000.

- [x] **T9. Textos (AC: 7, 8, 9, 10)**
  - [x] Nuevos módulos en `src/textos/`, con la Voz del socio: honesto, amable, sin jerga y sin culpa.
    - `navegacion.ts` (`textosNavegacion`): títulos de pestañas y pantallas (Inicio, Movimientos, Ajustes, Pagos, Saldo inicial y Colchón).
    - `inicio.ts` (`textosInicio`):
      - Etiquetas de Dinero libre y Saldo calculado.
      - Una explicación de una línea del Dinero libre ("lo que puedes gastar hoy sin tocar lo que ya tiene destino ni tu Colchón").
      - Frase del faltante, como función: `faltante(monto: string, dia: string)` → p. ej. "Ojo: el {dia} te faltarían {monto} para mantener tu Colchón." Recibe valores **ya formateados**.
      - Frase del Pago atrasado: `pagoAtrasado(numero, dia)` → "Tu Pago {n} del {dia} aún no está confirmado; lo cuento como si llegara hoy."
      - Textos del estado vacío, con uno por cada `Faltante`.
    - `ajustes.ts` (`textosAjustes`): entradas de la lista.
    - `configuracion.ts` (`textosConfiguracion`): etiquetas, placeholders, ayuda, Guardar, el mensaje `errores[codigo]` de cada código de T2 y el fallo genérico al guardar.
    - `movimientos.ts` (`textosMovimientos`): estado vacío honesto ("Aún no hay movimientos. Aquí verás tus Gastos e ingresos cuando empieces a registrarlos.").
  - [x] `src/textos/fechas.ts`: `formatearFechaCorta('2026-11-08')` → `'8 de nov.'`, más el año cuando no es el de `hoy` (`formatearFechaCorta(fecha, hoy)`). Es puro y sin `Intl`, con nombres de mes en español. Prueba los bordes: enero, diciembre y cambio de año.
  - [x] Títulos de Tabs y Stack (`options={{ title: … }}`): también salen de `textos/`. El lint lo exige con `Property[key.name=title]`.

- [x] **T10. Tema mínimo (AC: 8; cierra un diferido de H1.2)**
  - [x] `src/components/tema.ts` exporta `colores`:
    - `fondo`, `superficie`, `texto`, `textoSuave`, `borde`.
    - `primario` = `'#1F6F4A'`, el de `Boton`.
    - `peligro`: un rojo con contraste AA sobre `fondo`, p. ej. `'#B3261E'`.
  - [x] Usa `colores` en las pantallas nuevas, en `Boton`, en `ErrorAmable`, en `PantallaBloqueo` y en las pantallas de error y de carga de `_layout.tsx` (fondo y texto explícitos). Así se cierra el diferido "en modo oscuro el texto puede no leerse".
    - **No** cambies `userInterfaceStyle` en `app.config.ts`: es un cambio nativo que obliga a reconstruir. Con colores explícitos alcanza.
    - Las Tabs usan `screenOptions` con `tabBarActiveTintColor: colores.primario` y el fondo explícito.

- [x] **T11. Navegación base (AC: 7)**
  - [x] Estructura de rutas con Expo Router 57. Las Tabs JS vienen dentro de expo-router, sin dependencia nueva: `import { Tabs } from 'expo-router'`.
    ```text
    src/app/_layout.tsx                 # MODIFICADO: Stack con (tabs) y configuracion/*
    src/app/(tabs)/_layout.tsx          # NUEVO: Tabs (index, movimientos, ajustes)
    src/app/(tabs)/index.tsx            # NUEVO: pantalla principal (reemplaza src/app/index.tsx)
    src/app/(tabs)/movimientos.tsx      # NUEVO: estado vacío (H2.5 la llena)
    src/app/(tabs)/ajustes.tsx          # NUEVO: lista → configuracion/*
    src/app/configuracion/pagos.tsx            # NUEVO
    src/app/configuracion/saldo-y-colchon.tsx  # NUEVO
    ```
    - **Borra** `src/app/index.tsx`: `(tabs)/index.tsx` toma la ruta `/`. Si quedan dos `index`, Expo Router falla.
    - En `_layout.tsx`, cambia **solo** la rama de éxito: `<Stack screenOptions={{ contentStyle: { backgroundColor: colores.fondo } }}>` con `<Stack.Screen name="(tabs)" options={{ headerShown: false }} />`. Las pantallas de `configuracion/*` toman su `title` de `textosNavegacion`.
    - **No toques** el gating de H1.2: el orden bloqueo → error de migración → carga → contenido, la capa `PantallaBloqueo` como `View` absoluto, `importantForAccessibility`, `BackHandler` y `Keyboard.dismiss`.
    - **No uses** `presentation: 'modal'`/`formSheet`, `Modal` ni `Alert`: la capa de bloqueo no tapa ventanas nativas (diferido de H1.2). Los formularios son pantallas del Stack.
    - **Sin íconos en las pestañas:** `@expo/vector-icons` y `expo-symbols` no están instalados, y H1.1 los quitó a propósito. Las pestañas van solo con texto (`tabBarIcon` sin definir, `tabBarIconStyle: { display: 'none' }`, y etiqueta centrada si hace falta). Agregar íconos es una dependencia nueva que se pregunta a Priettos; no la instales.
  - [x] Accesos rápidos: `src/components/accesos-rapidos.tsx`.
    - Una lista declarativa `{ clave: 'registro' | 'camara' | 'puedo', texto, ruta, disponible: boolean }`, con las tres en `disponible: false` en H1.4.
    - Renderiza solo las disponibles. Si no hay ninguna, devuelve `null`, sin contenedor vacío ni espacio reservado.
    - H2.1, H4.2 y H5.2 solo cambian `disponible` y su ruta.
    - Se monta en la pantalla principal.
  - [x] `src/app/(tabs)/ajustes.tsx` tiene dos entradas táctiles (`Link`/`router.push` de `expo-router`, con `accessibilityRole="button"`) hacia `/configuracion/pagos` y `/configuracion/saldo-y-colchon`. Cada entrada muestra un resumen del valor actual si existe (p. ej. "Día 10 · 2.000.000"), formateado con `formatearDinero`.
    - El resto de Ajustes (Vehículos, Obligaciones, umbral, exportar log…) llega en H1.5–H1.8 y H7. No pongas entradas deshabilitadas.

- [x] **T12. Formularios de configuración (AC: 1, 3, 4)**
  - [x] Los formularios van en `src/components/configuracion/` y no en la ruta, porque el asistente de H1.8 los reutiliza:
    - `formulario-pagos.tsx`
    - `formulario-saldo-y-colchon.tsx`
    - Props: `{ onGuardado: () => void }`.
    - Las rutas de `configuracion/*` solo los montan y hacen `router.back()` en `onGuardado`.
  - [x] **Formulario de Pagos:**
    - Dos bloques, Pago 1 y Pago 2, cada uno con día (`keyboardType="number-pad"`) y monto esperado.
    - Se precargan desde `useConfiguracion()`. El monto se muestra formateado al precargar; al escribir se acepta con o sin puntos y se lee con `leerMonto`.
    - Al guardar: `leerDia`/`leerMonto` + `validarPago`. Cada error se muestra junto a su campo con `textosConfiguracion.errores[codigo]`.
    - Si todo es válido → `ejecutar(configurarPagos(...))`. Con `ok` → `onGuardado()`; con `fallo` → mensaje genérico de `textos/` y los datos escritos se conservan.
  - [x] **Formulario de saldo inicial y Colchón:**
    - Monto del saldo, fecha y Colchón (precargado con `colchonSugerido`).
    - La fecha por defecto es `useHoy()`, en un campo de texto `AAAA-MM-DD`, con ayuda de `textos/`. No hay librería de selector de fecha instalada, y agregar `@react-native-community/datetimepicker` exige una build nueva: no lo agregues.
    - La fecha se valida con `validarSaldoYColchon(…, hoy)`.
    - Un texto de ayuda explica qué es el Saldo real ("lo que hoy dice tu cuenta del banco") y el Colchón ("lo que nunca tocas").
  - [x] Detalles comunes:
    - `ScrollView` con `keyboardShouldPersistTaps="handled"`, y un `KeyboardAvoidingView` si hace falta.
    - Etiquetas accesibles: `accessibilityLabel` de `textos/`.
    - Botón `Boton` (reutilizado) deshabilitado mientras se guarda, para evitar doble envío.
    - Ningún `console`. Si el comando falla, el registro ya lo hace `ejecutar` (`comando.pagos.configurar`).

- [x] **T13. Pantalla principal (AC: 8, 9)**
  - [x] `src/app/(tabs)/index.tsx` usa `useEstado()`.
    - **`sinConfigurar`:** muestra el estado vacío.
      - Un título amable y la lista de lo que falta (`faltan`), con su texto.
      - Un botón por faltante que lleva a su pantalla: `'pagos'` → `/configuracion/pagos`; `'saldoInicial'` y `'colchon'` → `/configuracion/saldo-y-colchon`, en un solo botón aunque falten ambos.
      - Ninguna cifra. No muestres el Dinero libre en 0 ni guiones con forma de número.
    - **`calculado`:**
      - **Dinero libre** grande, con `formatearDinero(estado.dineroLibre)` y su etiqueta y explicación.
      - **Saldo calculado** más pequeño.
      - Si `dineroLibre < 0`: la cifra en `colores.peligro` y, debajo, `textosInicio.faltante(formatearDinero(-estado.dineroLibre), formatearFechaCorta(estado.minimo.fecha, estado.hoy))`. El faltante es lo que falta para el Colchón el día del mínimo.
      - Por cada `pagosAtrasados`, una línea con `textosInicio.pagoAtrasado`. Es solo informativa; el acceso para confirmar llega en H2.3.
      - `<AccesosRapidos />`, que en H1.4 no renderiza nada.
    - El signo de un negativo lo pone `formatearDinero` (`-3.000.000`). El texto del faltante usa el monto positivo.
    - No calcules nada en la pantalla (AD-1): solo eliges qué mostrar del `Estado`.
  - [x] Nada de Meta, fondo enduro ni Obligaciones vencidas aquí: llegan en H1.5, H1.6 y la Épica 3, y la pantalla debe dejar espacio para crecer sin rehacerse.

- [x] **T14. Pruebas de pantallas (AC: 7, 8, 9)**
  - [x] En `pruebas/pantallas/` (nunca en `src/app/`), con `await render(...)` (Testing Library 14):
    - `inicio.test.tsx`, que **reemplaza** la prueba de humo actual. Mockea `@/hooks/use-estado` y `expo-router`. Casos:
      - `sinConfigurar` con los tres faltantes → textos de `textosInicio` y ninguna cifra (ningún texto con `/\d\.\d{3}/`).
      - Calculado positivo → `'6.000.000'` y el Saldo calculado.
      - Negativo → `'-3.000.000'`, el texto del faltante presente y un estilo con `colores.peligro`.
      - Con un Pago atrasado → su línea.
      - Los accesos rápidos no aparecen.
    - `ajustes.test.tsx`: las dos entradas y la navegación (mock de `router.push` o de `Link`).
    - `configuracion-pagos.test.tsx` y `configuracion-saldo.test.tsx`: renderizan los **componentes** de formulario. Mockean `@/hooks/use-comando` y `@/hooks/use-configuracion` (y `@/hooks/use-hoy`). Casos:
      - Precarga.
      - Error por campo.
      - Llamada a `ejecutar` con el comando correcto (verifica la `operacion` y los datos).
      - `onGuardado` con `ok`.
      - Mensaje genérico con `fallo`.
      - Botón deshabilitado mientras guarda.
    - `layout.test.tsx`: el mock actual de `expo-router` devuelve `Stack` como función. Ahora `Stack.Screen` se usa como hijo, así que el mock debe exponer `Stack` con una propiedad `Screen`, p. ej. `Object.assign(() => <View testID="stack" />, { Screen: () => null })`. Todas las pruebas actuales de gating deben seguir pasando sin cambiar sus aserciones.
    - `accesos-rapidos.test.tsx` (junto al componente): sin disponibles → `toJSON()` es `null`.
  - [x] Una integración breve en `src/hooks/use-estado.integracion.test.tsx` o en una prueba nueva junto a ella, con la base de prueba real (mock de `@/data/db`):
    1. `ejecutar(configurarPagos(...))` y `ejecutar(guardarSaldoInicialYColchon(...))`.
    2. `renderHook(useEstado)` pasa de `sinConfigurar` a `calculado` con el Dinero libre esperado.
    - Fija `hoy` con el mock de `@/services/reloj`. Es la prueba de punta a punta de esta historia.

- [x] **T15. Cierre**
  - [x] `npm run verificar` en verde. Hoy hay 360 pruebas; anota el nuevo total.
  - [x] Prueba manual en la build dev (`JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 APP_VARIANT=dev npx expo run:android`). Como no hay módulos nativos nuevos, si ya hay una build dev instalada basta `npx expo start`. Recorrido:
    1. Desbloquear.
    2. Ver el estado vacío.
    3. Configurar los Pagos.
    4. Configurar saldo y Colchón.
    5. Ver el Dinero libre.
    6. Editar el Colchón para forzar un negativo y verlo en rojo con su texto.
    7. Revisar las pestañas.
    8. Volver tras 5 min y comprobar que se re-bloquea sobre las pestañas.
  - [x] Llena el Dev Agent Record: archivos, desvíos y el resultado de la verificación del índice parcial.

### Review Findings

- [x] [Review][Patch] (Resuelta D1 → límite de 62 días en la validación, con su mensaje) Fecha del saldo inicial sin límite hacia atrás — `erroresSaldoYColchon` solo rechaza fechas futuras. Con una fecha antigua o mal tecleada (`2016-11-05`, `0206-11-05`), cada ocurrencia desde entonces queda como Pago atrasado y suma en `hoy`. Resultado: Dinero libre inflado, una línea por atraso en Inicio (con 0206 son unas 43.000 y la pantalla se congela) y, si la suma pasa de `MAX_SAFE_INTEGER`, `formatearDinero` lanza `RangeError` y toda Inicio cae al ErrorBoundary. La acumulación de atrasados es una decisión documentada, pero falta decidir el límite. [src/domain/entrada.ts:86, src/domain/calcular-estado.ts:31]
- [x] [Review][Decision] La prueba manual T15 mencionaba un "Pago atrasado" que no sale con los datos anotados — resuelta (D2): se quitó la mención del registro; el caso lo cubren las pruebas automáticas de `calcular-estado`.
- [x] [Review][Patch] Doble toque en Guardar dentro del mismo frame ejecuta el comando dos veces y llama dos veces a `router.back()`, porque `if (guardando) return` lee el estado de la closure. Guard con `useRef`. [src/components/configuracion/formulario-pagos.tsx:75, src/components/configuracion/formulario-saldo-y-colchon.tsx:33]
- [x] [Review][Patch] El `setTimeout` del guardado no se cancela al desmontar: el comando se escribe aunque el usuario salió, hay `setState` sobre un componente desmontado y se hace un `back()` extra. [src/components/configuracion/formulario-pagos.tsx:86, src/components/configuracion/formulario-saldo-y-colchon.tsx:43]
- [x] [Review][Patch] Ajustes llama `formatearFechaCorta(saldoInicial.fecha)` sin `hoy`, así que un saldo de otro año sale sin el año (T9). [src/app/(tabs)/ajustes.tsx:41]
- [x] [Review][Patch] Texto muerto: `textosAjustes.resumenPagos` no lo usa nadie (T11). [src/textos/ajustes.ts:6]
- [x] [Review][Patch] El comentario de la prueba dice "Pagos que no caen en el Horizonte de HOY", pero el 10-nov y el 30-nov sí caen. Solo es cierto que no mueven el saldo del primer día. [src/domain/calcular-estado.test.ts:12]
- [x] [Review][Defer] Saldo con fecha futura (reloj que retrocede): Inicio dice que falta y Ajustes lo muestra configurado, sin explicar por qué. [src/domain/calcular-estado.ts:16] — deferred
- [x] [Review][Defer] Ajustes muestra "Sin configurar" con saldo y sin Colchón. Hoy no se alcanza porque se guardan juntos. [src/app/(tabs)/ajustes.tsx:38] — deferred
- [x] [Review][Defer] La caché de `useHechos` se indexa solo por versión: una versión vieja desaloja la nueva, y una escritura sin `avisarCambio` (restauración H7) deja hechos viejos. [src/data/use-hechos.ts:22] — deferred
- [x] [Review][Defer] La base no impone una sola fila en `ajustes` ni `CHECK` de `numero`/`dia` en `pagos`. Las filas inválidas se descartan en silencio al leer. [drizzle/0001_giant_thanos.sql] — deferred
- [x] [Review][Defer] Los formularios toman la configuración una sola vez (`useState` inicial) y no se resincronizan; relevante para el asistente de H1.8. [src/components/configuracion/formulario-pagos.tsx:68] — deferred
- [x] [Review][Defer] Android: `KeyboardAvoidingView` sin `behavior` con edge-to-edge; el teclado podría tapar Guardar. Revisar en dispositivo. [src/components/configuracion/formulario.tsx:22] — deferred
- [x] [Review][Defer] `router.push` sin guard ante doble toque apila el formulario dos veces. [src/app/(tabs)/ajustes.tsx:16] — deferred

## Dev Notes

### Qué es y qué no es esta historia

- **Es:**
  - Las tablas `pagos` y `ajustes`, con su migración `0001`.
  - Los comandos `configurarPagos` y `guardarSaldoInicialYColchon`.
  - Las ocurrencias mensuales y `pagoAtrasado` en `domain/`.
  - El Saldo proyectado con Pagos.
  - La navegación base (Tabs y Stack).
  - Los formularios reutilizables.
  - La pantalla principal con su estado vacío.
  - El tema mínimo.
  - Cuatro diferidos cerrados: el saldo inicial futuro, N+1 cargas, comandos en línea y la edición sin cambios.
- **No es:**
  - Confirmar Pagos ni la tabla `pagos_confirmados` (H2.3). Las ocurrencias se exponen con `(pagoId, clave)` listas para eso.
  - Vehículos, Obligaciones, Presupuestos, fondo, categorías, Deudas ni Meta (H1.5–H1.7).
  - El asistente de primer uso (H1.8): esta historia solo deja los formularios reutilizables.
  - El umbral del Semáforo (H1.8).
  - La lista de movimientos (H2.5): la pestaña existe con su estado vacío.
  - Los accesos rápidos funcionales (H2.1, H4.2, H5.2).
  - Notificaciones (Épica 6).
  - `formatearMillones` (H3.2).
- La prueba fija **Dinero libre = 1.350.000** del addendum necesita Obligaciones, Presupuestos, fondo y Meta: se completa en **H1.7**. Aquí va su versión recortada (T4, Dinero libre 6.000.000), con las mismas fechas, para que H1.5–H1.7 solo agreguen flujos.

### Decisiones fijadas en esta historia

- **Punto de partida y ocurrencias (AD-2, AD-5): `fecha > saldoInicial.fecha`.**
  - El Saldo real inicial es lo que dice el banco ese día. Si el Pago cayó ese mismo día, se asume que ya está dentro del saldo.
  - Es la lectura en contra del usuario (AD-7): en la duda, no se suma.
  - Si Priettos carga el saldo por la mañana, antes de que llegue el Pago, ese Pago no se proyecta. Lo corrige confirmándolo (H2.3) o cuadrando (H2.6).
- **Todos los Pagos vencidos sin confirmar se proyectan en `hoy`**, uno por ocurrencia (AD-5 literal).
  - Hasta H2.3 no hay forma de confirmarlos, así que con el tiempo se acumulan como atrasados.
  - Es coherente: el Saldo calculado no los incluye y la proyección sí, igual que el banco real.
  - La pantalla lo dice con la línea de `pagoAtrasado`.
- **Pagos 1 y 2 identificados por `numero`.** El Pago 2 es especial: los Aportes programados se acreditan en su fecha (AD-20, H1.5–H1.7). La definición conserva su `id` al editar, porque H2.3 referenciará `(pagoId, clave)`.
- **`ajustes` es una tabla de una sola fila vigente** para la configuración general (saldo inicial, Colchón y, más adelante, umbral y hora de la Sesión). Todo es configuración con fecha o valor simple (AD-2, AD-9), y se edita con rastro.
- **Colchón precargado, no sembrado en la base.** El 4.000.000 vive en `SIEMBRA.colchon` y precarga el formulario.
  - Si se sembrara una fila, el asistente de H1.8 vería el paso como completo sin que Priettos lo confirmara.
  - Sin Colchón guardado, el Estado sigue `sinConfigurar` (faltante `'colchon'`).
- **Saldos negativos.** El Saldo real inicial y el Colchón se aceptan ≥ 0: la cuenta de Priettos es de ahorros y no tiene sobregiro. Si algún día hiciera falta un saldo negativo, se cambia `leerMonto` y `validarSaldoYColchon` en una historia propia. El Dinero libre sí puede ser negativo.
- **Configuración mínima para calcular:** los dos Pagos, el saldo inicial con fecha `<= hoy` y el Colchón. El Horizonte siempre incluye un Pago 1 y un Pago 2 (Glosario), así que calcular sin Pagos sería inventar.
- **`ejecutar` solo acepta `ComandoDefinido`**, fabricado en `data/commands`, y el lint impide fabricarlos en `app/`. Así se cierra el diferido de H1.3.
- **Cache de hechos por versión de la señal**, a nivel de módulo: una lectura por commit, compartida. Cierra el diferido de N+1.

### Estado actual de los archivos que se modifican

| Archivo | Hoy | Qué cambia | Qué se preserva |
| --- | --- | --- | --- |
| `src/data/schema.ts` | `columnasComunes` y `rastro` | Se agregan `pagos` y `ajustes` | `rastro` intacta; los tipos `operacionesRastro` |
| `drizzle/*` | Solo `0000_black_lockjaw` | `0001_*` generada; `_journal.json`, `migrations.js` y el snapshot actualizados | `0000` sin tocar |
| `src/domain/hechos.ts` | `saldoInicial`, `colchon` y `hechosVacios` | `pagos: PagoDefinido[]` | `SaldoInicial` |
| `src/domain/estado.ts` | Unión `sinConfigurar` / `calculado` | `faltan`, `pagosEsperados` y `pagosAtrasados` | Campos y significados actuales; el mínimo en empate es el primer día |
| `src/domain/calcular-estado.ts` | Saldo constante en 32 días | Ocurrencias de Pagos y regla del saldo futuro | `HORIZONTE_DIAS = 31`, pureza y totalidad |
| `src/domain/fechas.ts` | `esFechaValida`, `sumarDias` y `diasEntre` | Se exportan `diasDelMes`, `mesDe`, `sumarMeses` y `fechaEnMes` | Algoritmos de Hinnant |
| `src/data/queries/cargar-hechos.ts` | Devuelve `{ ...hechosVacios }` | Lee `pagos` y `ajustes` con `vigentes()` | Nunca lee `rastro` ni instantáneas |
| `src/data/use-hechos.ts` | `useSyncExternalStore` + `useMemo` por versión; `cargarHechosActuales` | Cache de módulo por versión | Error lanzado en el render; firma pública |
| `src/data/tablas/rastro.ts` | `registrarRastro`, `editarConRastro` y `borrarConRastro` | La edición sin cambios es un no-op | Atomicidad y forma del rastro |
| `src/hooks/use-comando.ts` | `ejecutar(Comando<T>)`, `registrarTrasComando` | Acepta solo `ComandoDefinido<T>` | Log, `fallo('fallo')` y post-comando |
| `src/app/_layout.tsx` | Gating H1.2 + `<Stack />` | Stack con `(tabs)`; colores del tema en las pantallas de error y carga | **Todo el gating** (ver T11) |
| `src/app/index.tsx` | Marcador de posición | **Se borra** (pasa a `(tabs)/index.tsx`) | — |
| `src/components/boton.tsx`, `error-amable.tsx`, `pantalla-bloqueo.tsx` | Colores en duro | Usan `colores` del tema | API y comportamiento |
| `eslint.config.js` | Capas AD-1, AD-3, AD-8 y AD-17 | Patrón `definir-comando`/`contexto` en `patronesComando` | Todas las reglas; la trampa de los bloques |
| `pruebas/pantallas/layout.test.tsx` | Mock `Stack` como función | Mock con `Stack.Screen` | Todas las aserciones |
| `pruebas/pantallas/inicio.test.tsx` | Humo del marcador | Se reescribe para la pantalla principal | — |

### Capas y lint (vigentes; no aflojarlos)

- **`domain/`:** puro. Sin `Date`, `Intl.DateTimeFormat`, `Temporal`, `performance`, `Math.random` ni `crypto`, y sin importar otras capas. Las fechas son strings y la aritmética es entera.
- **`data/`:** el único lugar con `drizzle-orm`, el esquema y la base. No importa `services/`. Las tablas se definen en `schema.ts` (así `drizzle.config.ts` las ve); los módulos dueños en `tablas/` las importan.
- **`hooks/`:** no importa `drizzle-orm` ni `data/db`/`data/schema`. Usa `useHechos` y `cargarHechosActuales`.
- **`app/` y `components/`:** sin texto literal (incluye `title`, `placeholder` y `accessibilityLabel`). No importan `services/reloj` (usa `useHoy`), `data/ejecutar-comando`, `data/cambios` ni, desde esta historia, `data/contexto` y `data/commands/definir-comando`. Sí importan comandos de `data/commands/*` y textos.
- **Textos con cifras:** reciben strings ya formateados por `formatearDinero`/`formatearFechaCorta`.

### Trampas conocidas

- **Dos `index` en `src/app/`:** borra `src/app/index.tsx` al crear `(tabs)/index.tsx`.
- **`typedRoutes: true`:** las rutas de `router.push` se tipan desde `.expo/types`. Si `tsc` se queja de una ruta nueva, corre `npx expo start` una vez (o `npx expo customize`) para regenerar los tipos, o usa el `Href` correcto. No desactives `typedRoutes`.
- **Mock de `expo-router` en pruebas:** con `Stack.Screen`/`Tabs.Screen` como hijos, el mock tiene que exponer esas propiedades (T14).
- **Sin `await` dentro de `db.transaction(...)`:** los drivers son sync. Los comandos son síncronos; `ejecutarComando` rechaza una promesa.
- **`expo-crypto` en Jest:** jest-expo no mockea `randomUUID`. Inyecta `nuevoId` en `ejecutarComando` o mockea con `node:crypto`.
- **React Compiler:** no leas ni escribas refs en el render. El estado de "guardando" del formulario va en `useState`.
- **Testing Library 14:** `render`/`fireEvent`/`renderHook` se usan con `await`. Los elementos bajo `importantForAccessibility="no-hide-descendants"` necesitan `includeHiddenElements`.
- **Flat config de ESLint:** un bloque nuevo con `no-restricted-imports` sobre `src/app/**` debe repetir `patronesData`, `patronesReloj` y `patronesComando`. Mejor amplía `patronesComando` y no crees otro bloque.
- **`formatearDinero` lanza con no enteros:** nunca le pases el resultado de un `parseFloat`. Usa `leerMonto`.
- **Ventanas nativas:** sin `Modal`, `Alert` ni `presentation: 'modal'` (la capa de bloqueo no las tapa).
- **Formato del código:** `--single-quote --print-width 120` (no hay Prettier configurado).

### Testing

- `domain/` sin base ni reloj: fechas, ocurrencias, entrada y `calcularEstado`.
- `data/` con `crearBaseDePrueba()` (better-sqlite3 y migraciones reales), `/** @jest-environment node */` y `afterEach` para cerrar. Nunca un mock de `expo-sqlite`.
- `hooks/` con `renderHook` y mocks de módulo, más una integración con base real: comandos → `useEstado` calculado.
- Pantallas en `pruebas/pantallas/`; componentes con la prueba al lado.
- ESLint: casos nuevos en `pruebas/eslint-reglas.test.ts`.

### Project Structure Notes

```text
src/
  domain/
    fechas.ts / .test.ts                      # MODIFICADO (T1)
    ocurrencias.ts / .test.ts                 # NUEVO (T1)
    entrada.ts / .test.ts                     # NUEVO (T2)
    hechos.ts, estado.ts                      # MODIFICADOS (T3)
    calcular-estado.ts / .test.ts             # MODIFICADOS (T4)
  data/
    schema.ts                                 # MODIFICADO (T5)
    siembra.ts                                # NUEVO (T8)
    tablas/pagos.ts / .test.ts                # NUEVO (T5)
    tablas/ajustes.ts / .test.ts              # NUEVO (T5)
    tablas/rastro.ts / .test.ts               # MODIFICADOS (T5: edición sin cambios)
    commands/definir-comando.ts               # NUEVO (T6); borra commands/.gitkeep
    commands/configurar-pagos.ts / .test.ts   # NUEVO (T6)
    commands/guardar-saldo-y-colchon.ts / .test.ts  # NUEVO (T6)
    queries/cargar-hechos.ts / .test.ts       # MODIFICADOS (T7)
    use-hechos.ts / .test.tsx                 # MODIFICADOS (T7)
  hooks/
    use-comando.ts / .test.ts                 # MODIFICADOS (T6)
    use-configuracion.ts / .test.ts           # NUEVO (T8)
    use-estado.integracion.test.tsx           # MODIFICADO (T6, T14)
  textos/
    navegacion.ts, inicio.ts, ajustes.ts, configuracion.ts, movimientos.ts   # NUEVOS (T9)
    fechas.ts / .test.ts                      # NUEVO (T9)
  components/
    tema.ts                                   # NUEVO (T10)
    boton.tsx, error-amable.tsx, pantalla-bloqueo.tsx   # MODIFICADOS (T10)
    accesos-rapidos.tsx / .test.tsx           # NUEVO (T11)
    configuracion/formulario-pagos.tsx        # NUEVO (T12)
    configuracion/formulario-saldo-y-colchon.tsx  # NUEVO (T12)
  app/
    _layout.tsx                               # MODIFICADO (T10, T11)
    index.tsx                                 # BORRADO (T11)
    (tabs)/_layout.tsx, index.tsx, movimientos.tsx, ajustes.tsx   # NUEVOS (T11, T13)
    configuracion/pagos.tsx, saldo-y-colchon.tsx                  # NUEVOS (T11, T12)
drizzle/0001_*.sql, meta/0001_snapshot.json, meta/_journal.json, migrations.js   # GENERADOS (T5)
eslint.config.js, pruebas/eslint-reglas.test.ts                                   # MODIFICADOS (T6)
pruebas/pantallas/inicio.test.tsx, layout.test.tsx                                # MODIFICADOS (T14)
pruebas/pantallas/ajustes.test.tsx, configuracion-pagos.test.tsx, configuracion-saldo.test.tsx  # NUEVOS (T14)
```

- El spine sitúa la configuración en `app/configuracion` y la pantalla principal en `app/inicio`. Aquí la principal es `(tabs)/index.tsx` porque es la ruta `/` de Expo Router. Es un desvío solo de nombre de archivo; documéntalo.
- Los archivos van en kebab-case, las tablas en plural `snake_case`, y los nombres de dominio usan el Glosario en camelCase sin tildes (`montoEsperado`, `pagoAtrasado`, `pagosEsperados`).

### Previous Story Intelligence (H1.3, con H1.1 y H1.2)

- **Lo que se reutiliza tal cual:**
  - `ejecutar()` + `registrarTrasComando`.
  - `ContextoComando {db, ahora, nuevoId}`: los comandos no llaman `new Date()` ni `randomUUID()`.
  - `editarConRastro`/`registrarRastro`.
  - `vigentes()`, `useHechos`/`cargarHechosActuales`, `useHoy`, `useEstado`.
  - `sumarDias`/`diasEntre`/`esFechaValida`.
  - `dividirHaciaArriba`/`Abajo`: sin uso aquí todavía.
  - `Resultado`/`ok`/`fallo`, `formatearDinero`, `Boton` y `crearBaseDePrueba`.
- **Lecciones de los code reviews de H1.2 y H1.3:**
  - Cada rama de error se prueba de verdad: una prueba que pasaría sin el guardia no sirve.
  - Los commits y las suscripciones tienen carreras entre el render y el efecto (por eso `useSyncExternalStore`). El cache de T7 no debe reintroducirlas.
  - `avisarCambio` nunca lanza; un oyente roto va a `ErrorUtils` como no fatal.
  - Toda regla de lint nueva lleva un caso que falla y uno que pasa.
  - Documenta todo desvío en el Dev Agent Record.
- **H1.1 y H1.2:**
  - `npx expo install` mete dependencias de desarrollo en `dependencies`; si instalaras algo, revísalo. En esta historia **no** se instala nada.
  - `better-sqlite3` está fijado en `~12.9.0` (Node 20 y g++ 9.4).
  - Para compilar Android hace falta JDK 17 (`JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`).

### Git Intelligence

- `8fda2ea` (H1.2 + H1.3) y `adbab6d` (H1.1). El árbol está limpio: el diff de H1.4 queda aislado.
- Estilo de commit: en español, prefijo `H1.4:` y viñetas por decisión. El autor es el noreply de GitHub de prietto (nunca el correo de trabajo). Solo se commitea si Priettos lo pide.

### Información técnica verificada (node_modules del proyecto, 2026-11-05)

- **expo-router 57.0.29:**
  - `Tabs` viene incluido: `import { Tabs } from 'expo-router'`; es el bottom-tabs de React Navigation, vendorizado en `expo-router/build/react-navigation`.
  - No hay `@react-navigation/*` en `node_modules` ni hace falta.
  - Las NativeTabs siguen en `expo-router/unstable-native-tabs`: **no** usarlas.
  - Docs: https://docs.expo.dev/router/advanced/tabs.md (estructura `src/app/(tabs)/_layout.tsx` + `Stack.Screen name="(tabs)" options={{ headerShown: false }}`; `href: null` oculta una pestaña).
- **Íconos:** `@expo/vector-icons` no está instalado (verificado), y `expo-symbols` se quitó en H1.1.
- **drizzle-orm 0.45 / drizzle-kit 0.31:** `integer()` de `sqlite-core` con modo número por defecto; `uniqueIndex(...).on(...).where(sql…)` para el índice parcial (verificar, T5). El generador con `driver: 'expo'` reescribe `drizzle/migrations.js`.
- **Sin librería de selector de fecha:** fecha en campo de texto `AAAA-MM-DD` (T12).
- **`app.config.ts`:** `reactCompiler: true`, `typedRoutes: true` y `userInterfaceStyle: 'automatic'` (no cambiarlo).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]: AC de la épica.
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5, 1.6, 1.7, 1.8, 2.3, 2.5]: límites de alcance. Ocurrencias reutilizables, siembra, Pago 2 especial, asistente reutilizando formularios, `(definicionId, clave)` y pestaña Movimientos.
- [Source: _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md]:
  - AD-1 (Estado con Pagos atrasados).
  - AD-2 (puntos de partida con fecha).
  - AD-3 (módulos dueños, comandos y rastro).
  - AD-5 (ocurrencias, último día del mes, Horizonte y atrasos).
  - AD-7 (en contra del usuario).
  - AD-8 (`useHoy`).
  - AD-9 (configuración y siembra).
  - AD-10 (UUID).
  - AD-17 (textos).
  - AD-18 (cargador y post-comando).
  - AD-20 (Pago 2 y Aportes programados).
  - Consistency Conventions y Capability Map (`app/configuracion`).
- [Source: _bmad-output/planning-artifacts/prds/prd-moneytrack_app-2026-10-14/prd.md#3 Glosario, #4.1, #4.3, #8]: Pago, Horizonte, Saldo proyectado, Dinero libre, Colchón y Voz del socio.
- [Source: _bmad-output/planning-artifacts/prds/prd-moneytrack_app-2026-10-14/addendum.md]: caso de Dinero libre, del que sale el caso recortado de T4.
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-11-04.md]: partición de H1.3/H1.4, navegación base y estados vacíos a cargo de H1.4.
- [Source: _bmad-output/implementation-artifacts/1-3-nucleo-de-calculo-reloj-hechos-y-estado-reactivo.md]: núcleo, decisiones y reviews.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md]: diferidos que cierra esta historia (saldo inicial futuro, N+1, comandos en línea, edición sin cambios y tema/modo oscuro) y los que condicionan el diseño (ventanas nativas y BackHandler).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (`claude-opus-5-5`), workflow dev-story, 2026-11-06.

### Debug Log References

- `npm run verificar`: tsc y ESLint limpios; **37 suites, 550 pruebas en verde** (antes 360).
- `npx expo export --platform android`: el bundle compila (3,2 MB hbc).
- Tipos de `typedRoutes` regenerados con `npx expo start` (las rutas `/configuracion/*` no existían en `.expo/types`).
- Índice parcial: drizzle-orm 0.45 acepta `.where()` en `IndexBuilder`. El SQL generado es `CREATE UNIQUE INDEX pagos_numero_vigente ON pagos (numero) WHERE "pagos"."deleted_at" is null`; SQLite lo acepta y las pruebas confirman que un segundo `numero 1` vigente lanza `UNIQUE` y uno borrado no.
- Migración `0001_giant_thanos`: `when` 1793970482285 > 1793845871818 (0000). La 0000 no se tocó.
- Prueba manual (T15): **hecha por Priettos el 2026-11-06** en la build dev sobre el emulador Pixel 7a con PIN de pantalla. Recorrido completo OK: desbloqueo, estado vacío sin cifras, errores por campo, Pagos (10 → 2.000.000; 30 → 6.000.000), saldo 10.000.000 al 2026-11-06 con Colchón sugerido 4.000.000 → Dinero libre 6.000.000, fecha futura rechazada, negativo en rojo con texto (Colchón 12.000.000 → −2.000.000), pestañas sin accesos rápidos y re-bloqueo tras más de 5 minutos sobre las pestañas.

### Completion Notes List

- Análisis de contexto completado: guía de desarrollo exhaustiva creada (create-story, 2026-11-05).
- T1: `diasDelMes` exportada; `mesDe`, `sumarMeses` y `fechaEnMes` con aritmética entera. `ocurrenciasMensuales` es genérica y total (también devuelve `[]` con fechas inválidas).
- T2: `leerMonto` acepta dígitos solos o grupos de tres separados por punto o espacio (`'1.5'` y `'2.00.000'` → `null`, para no confundir decimales).
- T3/T4: `faltan` en orden fijo; saldo inicial con fecha futura → faltante `'saldoInicial'`. Ocurrencias desde `saldoInicial.fecha + 1`; las vencidas van a `hoy` con `pagoAtrasado`. Proyección en un solo recorrido con un mapa por fecha. Orden de `pagosEsperados`: `(fechaProyectada, numero, fecha)`; `pagosAtrasados` es el subconjunto en el mismo orden.
- T5: tablas `pagos` y `ajustes`, migración generada y módulos dueños. `editarConRastro` ya no escribe si `cambios` no altera ninguna columna (comprobado: la prueba falla sin el guardia).
- T6: `definirComando`/`ComandoDefinido` con marca `unique symbol`; `ejecutar` solo acepta `ComandoDefinido`. El lint impide importar `data/contexto` y `data/commands/definir-comando` desde `app/` y `components/`. Comandos `configurarPagos` y `guardarSaldoInicialYColchon` con revalidación, rollback y atomicidad (probada haciendo fallar `nuevoId` en la segunda escritura).
- T7: `cargarHechos` lee `pagos` y `ajustes` vigentes. `use-hechos` guarda en caché de módulo por versión de la señal; la versión se fija **antes** de leer, así que un commit durante la lectura fuerza otra lectura. Los errores no se guardan en caché.
- T8: `SIEMBRA.colchon = 4_000_000` en `data/siembra.ts`; `useConfiguracion` se deriva de `useHechos`.
- T9–T13: textos, tema con contraste AA, navegación (Stack + Tabs solo texto), accesos rápidos (ninguno disponible: devuelven `null`), formularios reutilizables y pantalla principal con estado vacío sin cifras y negativo en rojo **con texto**.
- T14: pruebas de pantallas (inicio, ajustes, los dos formularios, layout con `Stack.Screen`), accesos rápidos e integración de punta a punta comandos → `useEstado` calculado (Dinero libre 6.000.000).

**Desvíos (documentados):**

1. **`Tabs` desde `expo-router/js-tabs`**, no desde `expo-router`. En expo-router 57.0.29 el export de `expo-router` está marcado `@deprecated` a favor de `expo-router/js-tabs` (mismo layout; la doc web aún muestra la forma vieja). Sin dependencia nueva.
2. **`erroresPago` y `erroresSaldoYColchon`** en `domain/entrada.ts`, además de `validarPago`/`validarSaldoYColchon`. Devuelven el error de cada campo para mostrarlo junto a él; los `validar*` devuelven el primero como `Resultado` y los usan los comandos.
3. **Pantalla principal en `(tabs)/index.tsx`**, no en `app/inicio`: es la ruta `/` de Expo Router (desvío solo de nombre, previsto en la historia).
4. **Componentes extra en `components/configuracion/`**: `campo.tsx` (campo con etiqueta, ayuda y error) y `formulario.tsx` (marco común: scroll, teclado, fallo y Guardar), para no duplicarlos entre los dos formularios.
5. **Guardado diferido un tick** (`setTimeout(…, 0)`): `ejecutar` es síncrono, así que sin diferirlo el botón nunca llegaría a verse deshabilitado ("Guardando…"). Un segundo toque mientras guarda no ejecuta otra vez (probado con temporizadores falsos).
6. **`colores.textoSobrePrimario`** en el tema: el blanco del texto de `Boton`, que antes estaba fijo en el código.
7. **Caché de hechos en las pruebas**: `use-hechos.test.tsx` y `use-estado.integracion.test.tsx` llaman `avisarCambio()` en `beforeEach` para invalidar la caché de módulo entre pruebas.

### File List

**Nuevos**

- `drizzle/0001_giant_thanos.sql`
- `drizzle/meta/0001_snapshot.json`
- `pruebas/pantallas/ajustes.test.tsx`
- `pruebas/pantallas/configuracion-pagos.test.tsx`
- `pruebas/pantallas/configuracion-saldo.test.tsx`
- `src/app/(tabs)/_layout.tsx`
- `src/app/(tabs)/ajustes.tsx`
- `src/app/(tabs)/index.tsx`
- `src/app/(tabs)/movimientos.tsx`
- `src/app/configuracion/pagos.tsx`
- `src/app/configuracion/saldo-y-colchon.tsx`
- `src/components/accesos-rapidos.tsx`
- `src/components/accesos-rapidos.test.tsx`
- `src/components/configuracion/campo.tsx`
- `src/components/configuracion/formulario.tsx`
- `src/components/configuracion/formulario-pagos.tsx`
- `src/components/configuracion/formulario-saldo-y-colchon.tsx`
- `src/components/configuracion/use-guardado-diferido.ts`
- `src/components/configuracion/use-guardado-diferido.test.ts`
- `src/components/tema.ts`
- `src/data/commands/configurar-pagos.ts`
- `src/data/commands/configurar-pagos.test.ts`
- `src/data/commands/definir-comando.ts`
- `src/data/commands/guardar-saldo-y-colchon.ts`
- `src/data/commands/guardar-saldo-y-colchon.test.ts`
- `src/data/siembra.ts`
- `src/data/tablas/ajustes.ts`
- `src/data/tablas/ajustes.test.ts`
- `src/data/tablas/pagos.ts`
- `src/data/tablas/pagos.test.ts`
- `src/domain/entrada.ts`
- `src/domain/entrada.test.ts`
- `src/domain/ocurrencias.ts`
- `src/domain/ocurrencias.test.ts`
- `src/hooks/use-configuracion.ts`
- `src/hooks/use-configuracion.test.ts`
- `src/textos/ajustes.ts`
- `src/textos/configuracion.ts`
- `src/textos/fechas.ts`
- `src/textos/fechas.test.ts`
- `src/textos/inicio.ts`
- `src/textos/movimientos.ts`
- `src/textos/navegacion.ts`

**Modificados**

- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `drizzle/meta/_journal.json`
- `drizzle/migrations.js`
- `eslint.config.js`
- `pruebas/eslint-reglas.test.ts`
- `pruebas/pantallas/inicio.test.tsx`
- `pruebas/pantallas/layout.test.tsx`
- `src/app/_layout.tsx`
- `src/components/boton.tsx`
- `src/components/error-amable.tsx`
- `src/components/pantalla-bloqueo.tsx`
- `src/data/queries/cargar-hechos.ts`
- `src/data/queries/cargar-hechos.test.ts`
- `src/data/schema.ts`
- `src/data/tablas/rastro.ts`
- `src/data/tablas/rastro.test.ts`
- `src/data/use-hechos.ts`
- `src/data/use-hechos.test.tsx`
- `src/domain/calcular-estado.ts`
- `src/domain/calcular-estado.test.ts`
- `src/domain/estado.ts`
- `src/domain/fechas.ts`
- `src/domain/fechas.test.ts`
- `src/domain/hechos.ts`
- `src/hooks/use-comando.ts`
- `src/hooks/use-comando.test.ts`
- `src/hooks/use-estado.integracion.test.tsx`
- `src/hooks/use-estado.test.ts`

**Borrados**

- `src/app/index.tsx`
- `src/data/commands/.gitkeep`

## Change Log

- 2026-11-05: Historia creada con create-story. Estado → ready-for-dev.
- 2026-11-06: Implementación de T1–T14 con dev-story (tablas `pagos`/`ajustes`, migración 0001, comandos, ocurrencias de Pagos en el Estado, navegación base, formularios y pantalla principal). `npm run verificar` en verde con 550 pruebas. Falta la prueba manual de T15 en la build dev.
- 2026-11-06: Prueba manual de T15 completada por Priettos en la build dev; todo funciona. Historia pasada a `review`.
- 2026-11-06: Code review (Blind Hunter, Edge Case Hunter, Acceptance Auditor): 0 violaciones de AC. Aplicadas 6 correcciones: fecha del saldo nueva limitada a 62 días (`fechaAntigua`; la fecha guardada se acepta aunque envejezca), guardado diferido con candado por ref y cancelado al desmontar (`useGuardadoDiferido`), año en el resumen de Ajustes, texto muerto `resumenPagos` eliminado y comentario de prueba corregido. Se quitó del registro de T15 la mención al Pago atrasado. 7 hallazgos diferidos a deferred-work.md. `npm run verificar` en verde con 561 pruebas. Historia → `done`.
