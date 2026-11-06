---
baseline_commit: adbab6da34ec55c9d9c584d461a743f449d34c17
---

# Story 1.3: Núcleo de cálculo: reloj, Hechos y Estado reactivo

Status: done

<!-- Nota: la validación es opcional. Ejecutar validate-create-story para un control de calidad antes de dev-story. -->

## Story

Como Priettos (desarrollador),
quiero el esqueleto del cálculo único (un solo "hoy", un solo cargador de hechos, un solo Estado y un solo ciclo post-comando) probado desde el inicio,
para que todas las cifras de la app salgan del mismo lugar y cada historia siguiente solo agregue reglas al núcleo.

**Requisitos:** NFR2; AD-1, AD-3 (rastro), AD-7, AD-8, AD-18. Viene de partir la antigua H1.3 (readiness 2026-11-04): esta historia es **solo el núcleo**. Pagos, saldo inicial, Colchón, sus tablas, la navegación y la pantalla principal son de **H1.4**.

## Acceptance Criteria

1. **Reloj (AD-8).** Dado `services/reloj`, cuando se pide `hoy()`, entonces devuelve la fecha `YYYY-MM-DD` en `America/Bogota`. `suscribirHoy(cb)` avisa al cruzar la medianoche de Bogotá y cada vez que la app vuelve a primer plano, y devuelve una función para cancelar la suscripción. `useHoy()` es el único hook que lo envuelve.
2. **Hechos y cargador (AD-18).** Existen `domain/hechos.ts` (tipo `Hechos`) y `data/queries/cargar-hechos.ts`. `cargarHechos(db)` es la única función que lee tablas para el cálculo, excluye las filas con `deletedAt` y nunca incluye instantáneas (Cuadres, consultas del Semáforo) ni `rastro`.
3. **Estado reactivo (AD-18).** `useEstado()` devuelve `calcularEstado(hechos, useHoy())` y se recalcula solo cuando cambian los hechos (tras un comando) o cuando cambia `hoy`. Ver la decisión sobre `useLiveQuery` en Dev Notes.
4. **`calcularEstado` (AD-1, AD-7).** Dado `domain/calcular-estado.ts`, cuando recibe `Hechos` y `hoy`, entonces devuelve un `Estado` con, como mínimo:
   - Saldo calculado.
   - Saldo proyectado por día del Horizonte: de `hoy` a `hoy+31`, ambos inclusive (32 días).
   - Dinero libre = mínimo del Saldo proyectado − Colchón, con el día y el monto de ese mínimo.
   - Sin la configuración mínima, un Estado "sin configurar", sin cifras inventadas.

   Es total (no lanza con hechos válidos), todo monto es entero, los redondeos van en contra del usuario (AD-7) y tiene pruebas unitarias sin base de datos ni reloj real.
5. **Ciclo post-comando (AD-18).** Las pantallas ejecutan comandos solo con `ejecutar(comando)` de `hooks/use-comando.ts`. Tras el commit, `useEstado` refleja el cambio. `ejecutar` deja un punto de extensión post-comando que recibe `(estado, hoy)`; ahí se conectará `notificaciones.reprogramar` en la Épica 6. Un comando que falla no lanza hacia `src/app/`: devuelve `Resultado` y queda en el log.
6. **Rastro (AD-3).** Dada la tabla `rastro {id, entidad, entidadId, operacion, antes, despues, fecha}` (ya existe desde H1.1), cuando un comando edita o borra una fila, entonces escribe la fila de rastro **en la misma transacción**, mediante un helper compartido por los módulos dueños. Si la transacción falla, no queda ni el cambio ni el rastro.

## Tasks / Subtasks

- [x] **T1. Fechas puras en `domain/` (AC: 1, 4)**
  - [x] `src/domain/fechas.ts`. Las fechas de negocio son strings `YYYY-MM-DD`. ESLint prohíbe `Date`, `Intl.DateTimeFormat`, `Temporal` y `performance` en `domain/`, así que la aritmética es **entera**: convierte la fecha civil en un número de día con el algoritmo `days_from_civil` de Howard Hinnant, y de vuelta con `civil_from_days`.
    - `esFechaValida(texto): boolean`: valida el formato estricto `^\d{4}-\d{2}-\d{2}$` y que el día exista (bisiestos incluidos: 2028-02-29 sí, 2027-02-29 no).
    - `sumarDias(fecha, n): string`.
    - `diasEntre(desde, hasta): number`, con signo.
  - [x] Para comparar fechas basta `<`/`>` entre strings: el formato `YYYY-MM-DD` ordena bien. No crear `compararFechas`.
  - [x] Pruebas en `src/domain/fechas.test.ts`:
    - Cruce de mes y de año.
    - 29 de febrero en año bisiesto y en año no bisiesto.
    - `sumarDias` con `n` negativo.
    - Ida y vuelta de 1970-01-01, 2026-11-05 y 2099-12-31.
    - `diasEntre` simétrico.
    - Formatos inválidos: `2026-1-5`, `2026-13-01`, `2026-02-30` y `''`.
- [x] **T2. Redondeo en contra del usuario (AC: 4)**
  - [x] `src/domain/redondeo.ts`: `dividirHaciaArriba(dividendo, divisor)` (para lo que se reserva o se debe) y `dividirHaciaAbajo(dividendo, divisor)` (para lo disponible).
    - Solo enteros, y sin `Math.ceil(a / b)`: con enteros grandes la división en coma flotante puede dar `x.0000000000000004`. Calcula `q = Math.trunc(a / b)`, el resto `r = a - q * b`, y ajusta `q` según el signo de `r`.
    - `divisor` debe ser un entero > 0. `domain/` no lanza: con `divisor <= 0` devuelve `0`. Documéntalo en el JSDoc y pruébalo. Así ningún cálculo divide por cero.
  - [x] Pruebas:
    - Exactas (12 ÷ 12) e inexactas (13 ÷ 12 → 2 hacia arriba, 1 hacia abajo).
    - Negativos (−13 ÷ 12 → −1 hacia arriba, −2 hacia abajo).
    - `Number.MAX_SAFE_INTEGER` ÷ 7, comparado contra `BigInt`.
    - Divisor 0 y negativo → 0.
  - [x] En H1.3 ninguna cifra del Estado tiene fracciones. Los helpers quedan listos para el prorrateo ÷12 (H1.5) y el Ritmo de la Meta (H1.7).
- [x] **T3. Tipos `Hechos` y `Estado` (AC: 2, 4)**
  - [x] `src/domain/hechos.ts`, con lo **mínimo** que necesita el cálculo de esta historia. Cada historia siguiente agrega campos (Pagos en H1.4, Obligaciones en H1.5, etc.):
    ```ts
    export type SaldoInicial = { monto: number; fecha: string }; // configuración con fecha (AD-2)
    export type Hechos = {
      saldoInicial: SaldoInicial | null;
      colchon: number | null;
    };
    export const hechosVacios: Hechos = { saldoInicial: null, colchon: null };
    ```
  - [x] `src/domain/estado.ts` (solo tipos):
    ```ts
    export type SaldoDelDia = { fecha: string; saldo: number };
    export type Estado =
      | { tipo: 'sinConfigurar'; hoy: string }
      | {
          tipo: 'calculado';
          hoy: string;
          saldoCalculado: number;
          saldoProyectado: SaldoDelDia[]; // 32 entradas: hoy..hoy+31, en orden
          minimo: SaldoDelDia;            // el menor Saldo proyectado; en empate, el día más temprano
          dineroLibre: number;            // minimo.saldo − colchon (puede ser negativo)
        };
    ```
    - Usa nombres del Glosario en camelCase y sin tildes.
    - Nada de `{valor, aproximado}` aquí: Saldo calculado y Dinero libre **nunca** son aproximados (AD-1).
    - H1.4 decide cómo mostrar `'sinConfigurar'` ("estado vacío amable", su AC).
- [x] **T4. `calcularEstado` (AC: 4)**
  - [x] `src/domain/calcular-estado.ts`: `export function calcularEstado(hechos: Hechos, hoy: string): Estado`. Exporta también `HORIZONTE_DIAS = 31` (el Horizonte tiene `HORIZONTE_DIAS + 1` días).
  - [x] Reglas de H1.3:
    - **Sin configurar:** si `saldoInicial` o `colchon` son `null` → `{ tipo: 'sinConfigurar', hoy }`.
    - **Saldo calculado:** `saldoInicial.monto`. Hoy no hay movimientos. Más adelante se le suman los movimientos con fecha ≥ `saldoInicial.fecha` y ≤ `hoy` (AD-2).
    - **Saldo proyectado:** para cada día del Horizonte, el Saldo calculado más los flujos esperados hasta ese día. En H1.3 no hay flujos, así que es constante. Construye el arreglo con un bucle sobre `sumarDias(hoy, i)`: H1.4+ agregan flujos por fecha.
    - **Mínimo:** el menor saldo del Horizonte; en empate, el **primer** día. H1.4 lo usa como "el día del faltante".
    - **Dinero libre:** `minimo.saldo − colchon`.
  - [x] Pruebas en `src/domain/calcular-estado.test.ts` (sin base de datos ni reloj; `hoy` fijo, p. ej. `'2026-11-03'`):
    - `hechosVacios` → `sinConfigurar`; solo saldo → `sinConfigurar`; solo colchón → `sinConfigurar`.
    - Configurado: 32 días, del `hoy` al `hoy+31`, con 2026-12-04 como último día cuando `hoy` es 2026-11-03.
    - Saldo constante; Dinero libre = saldo − colchón.
    - Dinero libre negativo (saldo 1.000.000, colchón 4.000.000 → −3.000.000).
    - Colchón 0; empate del mínimo → primer día.
    - Horizonte que cruza el fin de año (`hoy` = 2026-12-15).
    - Todos los montos son `Number.isInteger`.
    - `calcularEstado` es puro: dos llamadas con los mismos datos dan resultados `toEqual`, y no muta `hechos` (prueba con `Object.freeze`).
  - [x] NFR10 (< 200 ms con 12 meses de datos): no aplica todavía porque no hay movimientos. La prueba de rendimiento llega cuando existan Gastos (Épica 2). No la inventes ahora.
- [x] **T5. `services/reloj` (AC: 1)**
  - [x] `src/services/reloj.ts`:
    - `hoy(): string`. Colombia usa UTC−05:00 fijo, sin horario de verano desde 1993. Calcula `new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10)`. No uses `Intl` con `timeZone`: evita depender del ICU de Hermes y es determinista en pruebas. Deja un comentario con esa justificación y el nombre `America/Bogota`.
    - `suscribirHoy(cb: (hoy: string) => void): () => void`:
      - **Medianoche:** programa un `setTimeout` hasta la siguiente medianoche de Bogotá, con un tope de 60 min por espera. Al disparar, recalcula y, si `hoy()` cambió, llama `cb(hoy())`; luego se reprograma. El tope evita timers enormes y corrige solo si el reloj se mueve.
      - **Primer plano:** `AppState.addEventListener('change')`; con `'active'`, llama `cb(hoy())` **siempre**, aunque no haya cambiado. AD-13 usará este aviso para reprogramar notificaciones al volver a la app. Con la app en segundo plano, Android congela los timers de JS: por eso existe el aviso de `'active'`.
      - **Cancelar:** la función devuelta limpia el timer y quita la suscripción de AppState.
  - [x] Pruebas en `src/services/reloj.test.ts`, con `jest.useFakeTimers()`, `jest.setSystemTime()` y un espía de `AppState.addEventListener` (mismo patrón que `use-acceso.test.ts`):
    - `hoy()` a las 23:59:59 de Bogotá (04:59:59Z) → el día anterior UTC; a las 00:00:00 de Bogotá (05:00:00Z) → el nuevo día.
    - Equivalencia con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })` en varios instantes. En Jest (Node con ICU completo) sí se puede usar `Intl`.
    - Al avanzar los timers hasta pasar la medianoche, `cb` se llama una vez con el nuevo día.
    - Con el tope de 60 min no hay llamadas espurias si el día no cambió.
    - `'active'` → `cb` con `hoy()`. `'background'` e `'inactive'` → nada.
    - Tras cancelar, ni el timer ni AppState llaman `cb`, y se llamó `remove()`.
- [x] **T6. `useHoy` (AC: 1)**
  - [x] `src/hooks/use-hoy.ts`: `useHoy(): string`. Hace `useState(() => hoy())` y en un `useEffect` llama `suscribirHoy(setHoy)`, que devuelve el cancelador como cleanup. Un `setHoy` con el mismo string no re-renderiza.
  - [x] Pruebas con `renderHook`, mockeando `@/services/reloj`: valor inicial, actualización cuando el callback trae otro día y cancelación al desmontar.
- [x] **T7. Base sincrónica, señal de cambios y ejecución de comandos en `data/` (AC: 3, 5)**
  - [x] `src/data/contexto.ts`, con tipos compartidos entre la app (expo-sqlite) y las pruebas (better-sqlite3). Ya se verificó con `tsc` que ambos tipos se asignan:
    ```ts
    import type { ExtractTablesWithRelations } from 'drizzle-orm';
    import type { BaseSQLiteDatabase, SQLiteTransaction } from 'drizzle-orm/sqlite-core';
    import type * as schema from './schema';
    export type BaseSincrona = BaseSQLiteDatabase<'sync', unknown, typeof schema>;
    export type Transaccion = SQLiteTransaction<'sync', unknown, typeof schema, ExtractTablesWithRelations<typeof schema>>;
    export type ContextoComando = { db: BaseSincrona; ahora: string /* ISO UTC */; nuevoId: () => string };
    export type Comando<T> = { operacion: string; aplicar: (ctx: ContextoComando) => T };
    ```
    - `operacion` sigue la forma `capa.accion` del log: `'pagos.configurar'`, `'gastos.registrar'`…
    - `aplicar` es **sincrónico**. Las transacciones de drizzle con expo-sqlite y con better-sqlite3 son sync (`db.transaction((tx) => …)` devuelve `T`). Dentro de una transacción no hay `await`.
  - [x] `src/data/cambios.ts`: una señal mínima de módulo, `avisarCambio()` y `suscribirCambios(cb): () => void`, con un `Set` de oyentes.
  - [x] `src/data/ejecutar-comando.ts`: `ejecutarComando<T>(comando, opciones?)`, que devuelve `Resultado<T, { codigo: 'fallo'; causa: unknown }>`.
    - Arma el contexto: `db = obtenerDb()`, `ahora = new Date().toISOString()` y `nuevoId = randomUUID` de `expo-crypto` (AD-10). `opciones` permite inyectar `db`, `ahora` y `nuevoId` en las pruebas.
    - Llama `comando.aplicar(ctx)` dentro de `try`. Con éxito llama `avisarCambio()` y devuelve `ok(valor)`. Si lanza, devuelve `fallo(...)` **sin** avisar.
    - `data/` no importa `services/`, así que no registra nada: el registro es de `use-comando` (T9). Mismo criterio que `useMigraciones` en H1.2.
    - La transacción la abre cada comando, no `ejecutarComando` (AD-3: "cada comando abre una transacción"). Si `aplicar` lanza dentro de `db.transaction`, drizzle hace `ROLLBACK`.
  - [x] Pruebas en `src/data/ejecutar-comando.test.ts` (`@jest-environment node`), con `crearBaseDePrueba()` inyectada:
    - Un comando de prueba que inserta en `rastro` con `ahora` y `nuevoId` fijos → `ok`, la fila existe y los suscriptores fueron avisados una vez.
    - Un comando que inserta y luego lanza dentro de `db.transaction` → `fallo` con la causa, la fila **no** existe (rollback) y nadie fue avisado.
    - Si `nuevoId` no se inyecta, se usa `randomUUID` de `expo-crypto`. Jest **no** trae un mock de `ExpoCrypto`: mockea `expo-crypto` con `randomUUID: () => require('node:crypto').randomUUID()`.
- [x] **T8. Cargador y hechos reactivos (AC: 2, 3)**
  - [x] `src/data/queries/cargar-hechos.ts`: `cargarHechos(db: BaseSincrona): Hechos`.
    - **Hoy no hay tablas de hechos**: las de saldo inicial y Colchón nacen en H1.4. Devuelve `hechosVacios`, con un comentario que lo diga y una lista de las tablas que leerá cada historia. No inventes tablas ni filas.
    - Deja el patrón listo: cada lectura futura pasa por un helper `vigentes(tabla)` que aplica `isNull(tabla.deletedAt)`. Crea ese helper en `src/data/queries/vigentes.ts` y pruébalo con la tabla de prueba de T10.
    - Nunca lee `rastro`, `cuadres` ni `consultas_semaforo`. Escríbelo en el JSDoc para las historias siguientes.
  - [x] `src/data/use-hechos.ts` (vive en `data/` igual que `useMigraciones`: ver Dev Notes): `useHechos(): Hechos`.
    - El estado inicial sincrónico es `useState(() => cargarHechos(obtenerDb()))`. Las pantallas solo se montan después de `migraciones.exito` (layout de H1.2), así que la base ya está migrada.
    - En un efecto se suscribe con `suscribirCambios(() => setHechos(cargarHechos(obtenerDb())))` y cancela en el cleanup.
    - **Errores:** si `cargarHechos` lanza (inicial o en una recarga), guarda el error en estado y **lánzalo durante el render** para que lo capture el `ErrorBoundary` raíz, que ya registra `app.errorBoundary`. Así el error no queda tragado dentro de un efecto. `data/` no puede llamar a `log`.
  - [x] Exporta también `cargarHechosActuales(): Hechos` = `cargarHechos(obtenerDb())`, para el recálculo post-comando de T9. `hooks/` no puede importar `data/db` (lint AD-3).
  - [x] Pruebas:
    - `src/data/queries/cargar-hechos.test.ts` (node, base en memoria) → `hechosVacios`.
    - `src/data/use-hechos.test.tsx`: mockea `./db` para devolver una base de prueba, como hace `migraciones.test.tsx`. Casos: valor inicial; `avisarCambio()` → recarga, verificado con un `jest.spyOn` del cargador o con un conteo de llamadas; desmontar → ya no recarga; un cargador que lanza → el error llega a un ErrorBoundary de prueba.
- [x] **T9. `useEstado` y `ejecutar` (AC: 3, 5)**
  - [x] `src/hooks/use-estado.ts`: `useEstado(): Estado` = `calcularEstado(useHechos(), useHoy())`. React Compiler está activo (`app.config.ts`: `reactCompiler: true`), así que no hace falta `useMemo` a mano.
  - [x] `src/hooks/use-comando.ts`:
    - `export function ejecutar<T>(comando: Comando<T>): Resultado<T, 'fallo'>`. Exporta también `useComando()`, que devuelve `{ ejecutar }`, para quien prefiera la forma de hook. Las pantallas usan cualquiera de las dos: es la **única** vía de escritura.
    - Si `ejecutarComando` falla → `log.error(\`comando.${comando.operacion}\`, { error: causa })` y devuelve `fallo('fallo')`, sin la causa (AD-23: las excepciones no cruzan a `src/app/`).
    - Si tiene éxito → `const estado = calcularEstado(cargarHechosActuales(), hoy())` y llama cada función registrada en el punto de extensión, con `(estado, hoy)`.
      - El punto de extensión: `const trasComando: ((estado: Estado, hoy: string) => void)[] = []`, más `registrarTrasComando(fn): () => void`. En H1.3 está vacío; la Épica 6 conecta `notificaciones.reprogramar`.
      - Cada función corre en su propio `try/catch` con `log.error('comando.trasComando', { error })`: un fallo ahí no deshace el commit ni cambia el `ok`.
    - `ejecutar` usa `hoy()` de `services/reloj` directamente, no `useHoy`: corre fuera del render y necesita el "hoy" del momento.
  - [x] Pruebas:
    - `src/hooks/use-estado.test.ts`: mockea `@/data/use-hechos` y `@/hooks/use-hoy`, o `@/services/reloj`. Casos: sin configurar; configurado → Dinero libre; cambia el `hoy` del mock → recalcula.
    - `src/hooks/use-comando.test.ts`: mockea `@/data/ejecutar-comando`, `@/data/use-hechos`, `@/services/reloj` y `@/services/log`. Casos:
      - Éxito → `ok` y el post-comando recibe `(estado, hoy)`.
      - Fallo → `log.error('comando.x', …)`, `fallo('fallo')` y el post-comando **no** corre.
      - Un post-comando que lanza → `ok` igual, más `log.error('comando.trasComando')`.
      - `registrarTrasComando` devuelve un cancelador que funciona.
    - **Integración** en `src/hooks/use-estado.integracion.test.tsx`: `renderHook(useEstado)` con una base de prueba real (mock de `@/data/db`). Al ejecutar con `ejecutar()` un comando de prueba que hace `avisarCambio`, el hook recarga. Es la prueba de "tras el commit, `useEstado` refleja el cambio". Como hoy no hay tablas de hechos, verifica la recarga con el espía de `cargarHechos`, no con cifras.
- [x] **T10. Helper de rastro (AC: 6)**
  - [x] `src/data/tablas/rastro.ts` (módulo dueño de `rastro`, AD-3):
    - `registrarRastro(tx, ctx, { entidad, entidadId, operacion, antes, despues })` inserta la fila con `id = ctx.nuevoId()`, `createdAt = updatedAt = fecha = ctx.ahora`, `antes = JSON.stringify(filaAntes)` y `despues = JSON.stringify(filaDespues)`, o `null` al borrar.
    - `editarConRastro(tx, ctx, tabla, id, cambios)`, en la misma `tx`:
      1. Lee la fila vigente (`id` y `deletedAt` nulo). Si no existe, lanza `new Error('filaNoEncontrada')`; el comando hace rollback y `ejecutar` devuelve `fallo`.
      2. Hace el `update` con `{ ...cambios, updatedAt: ctx.ahora }`.
      3. Relee la fila y registra `operacion: 'editar'` con antes y después completos.
      4. Devuelve la fila nueva.
    - `borrarConRastro(tx, ctx, tabla, id)`: borrado **lógico** (AD-4). Pone `deletedAt = updatedAt = ctx.ahora` y registra `operacion: 'borrar'` con `despues: null`. Si la fila no existe o ya estaba borrada, lanza lo mismo que `editarConRastro`.
    - **Tipos genéricos:** la tabla debe tener `columnasComunes`. Restringe con un tipo como `SQLiteTableWithColumns<{ … columns: typeof columnasComunes & … }>`, o pasa las columnas `id`/`deletedAt` explícitamente si los genéricos de drizzle se complican. Cualquiera de las dos vale, siempre que `tsc` pase sin `any`.
    - `entidad` es el nombre SQL de la tabla (`getTableName(tabla)`, de `drizzle-orm`), p. ej. `'gastos'`.
    - **Fuera de alcance:** `restaurar` (está en el enum, pero lo usa H2.5) y `domain/diferencias` (H2.5).
  - [x] Pruebas en `src/data/tablas/rastro.test.ts` (node). No hay tablas de negocio todavía, así que crea una **tabla solo de prueba** en el archivo de prueba:
    - En la base en memoria, `sqlite.exec('CREATE TABLE prueba_rastro (id text primary key not null, created_at text not null, updated_at text not null, deleted_at text, nombre text not null)')`.
    - En el test, `const pruebaRastro = sqliteTable('prueba_rastro', { ...columnasComunes, nombre: text('nombre').notNull() })`. No va en `schema.ts` ni en ninguna migración.
    - Casos:
      - Editar → una fila en `rastro` con `entidad: 'prueba_rastro'`, `operacion: 'editar'` y `antes`/`despues` que son JSON de las filas completas; `updatedAt` cambió.
      - Borrar → `deletedAt` puesto y rastro con `despues: null`.
      - Editar o borrar una fila inexistente o ya borrada → lanza.
      - **Atomicidad:** editar y luego lanzar dentro de la misma `db.transaction` → ni el cambio ni el rastro quedan.
      - `vigentes()` (T8) excluye la fila borrada.
- [x] **T11. Guardia de lint para el reloj (AC: 1)**
  - [x] En `eslint.config.js`, prohíbe importar `@/services/reloj` (y su ruta relativa `(^|/)services/reloj$`) en `src/app/**` y `src/components/**`. El mensaje: "las pantallas leen 'hoy' con useHoy() (AD-8)".
    - **Trampa conocida (está comentada al inicio del archivo):** en flat config, dos bloques que configuran `no-restricted-imports` sobre el mismo archivo **no se fusionan; gana el último**. Si creas un bloque nuevo para `src/app/**`, tiene que **repetir** `patronesData` más el patrón del reloj, igual que el bloque de `domain/`. Si no, se pierden las restricciones de AD-3 en las pantallas.
  - [x] Agrega casos en `pruebas/eslint-reglas.test.ts`:
    - `src/app/x.tsx` que importa `@/services/reloj` → falla.
    - `src/app/x.tsx` que importa `drizzle-orm` → **sigue** fallando: es la prueba de que no se perdió AD-3.
    - `src/hooks/use-hoy.ts` que importa `@/services/reloj` → pasa.
- [x] **T12. Cierre**
  - [x] `npm run verificar` en verde. Hoy hay 223 pruebas.
  - [x] No hay cambios de UI: `src/app/index.tsx` sigue siendo el marcador de posición, y H1.4 conecta `useEstado` a la pantalla principal. No hay textos nuevos en `src/textos/`.
  - [x] No hay migraciones nuevas: `schema.ts` no cambia. Si algo te empuja a crear una tabla, para: es de H1.4.
  - [x] Llena el Dev Agent Record con la lista de archivos y cualquier desvío.

### Review Findings

- [x] [Review][Patch] `avisarCambio` relanza en un `setTimeout`, que en RN es fatal; reportar con `ErrorUtils.reportError` (no fatal) — decidido por Priettos [src/data/cambios.ts:24-26]
- [x] [Review][Patch] `useHechos` pierde un aviso de cambio entre el render inicial y la suscripción [src/data/use-hechos.ts:40-42]
- [x] [Review][Patch] `useHoy` se queda con el día viejo si la medianoche cae entre el render y el efecto [src/hooks/use-hoy.ts:11-12]
- [x] [Review][Patch] `redondeo` acepta enteros fuera del rango seguro (usar `Number.isSafeInteger`) [src/domain/redondeo.ts:28]
- [x] [Review][Patch] `ejecutarComando` trata como éxito un `aplicar` que devuelve una promesa [src/data/ejecutar-comando.ts:33-40]
- [x] [Review][Patch] Las pantallas pueden importar `@/data/ejecutar-comando` y `@/data/cambios` y saltarse `ejecutar`, el log y el post-comando [eslint.config.js:88-93]
- [x] [Review][Patch] `eslint-disable no-restricted-imports` cubre todo el archivo en vez de solo los dos imports [src/hooks/use-estado.integracion.test.tsx:1]
- [x] [Review][Defer] `calcularEstado` ignora un `saldoInicial.fecha` posterior a `hoy` [src/domain/calcular-estado.ts:18] — deferred, AD-2 llega con los movimientos de H1.4
- [x] [Review][Defer] Cada consumidor de `useHechos` recarga por separado en cada commit, `correrTrasComando` vuelve a cargar y `cargarHechos` siempre devuelve un objeto nuevo [src/data/use-hechos.ts:42] — deferred, revisar cuando H1.4 sume tablas y consumidores
- [x] [Review][Defer] `correrTrasComando` no tiene guarda de reentrada si un post-comando llama a `ejecutar` [src/hooks/use-comando.ts:28] — deferred, Épica 6
- [x] [Review][Defer] `Comando` entrega `ctx.db` completo, así que un comando definido en línea en una pantalla puede escribir sin rastro [src/data/contexto.ts:30] — deferred, decidir junto con `data/commands` en H1.4
- [x] [Review][Defer] `editarConRastro` con `cambios` vacío registra una edición que solo cambia `updatedAt` [src/data/tablas/rastro.ts:73] — deferred, sin comandos que lo usen todavía

## Dev Notes

### Qué es y qué no es esta historia

- **Es** el esqueleto del cálculo:
  - Reloj y `useHoy`.
  - Tipos `Hechos` y `Estado`.
  - `calcularEstado` mínimo.
  - El cargador y la reactividad.
  - `ejecutar` con su punto post-comando.
  - El helper de rastro.

  Todo probado, sin UI.
- **No es:**
  - Tablas de Pagos, saldo inicial o Colchón, ni sus comandos o formularios (H1.4).
  - Navegación ni pantalla principal (H1.4).
  - Ocurrencias de Pagos ni `pagoAtrasado` (H1.4, AD-5).
  - `domain/diferencias` ni `restaurar` (H2.5).
  - Notificaciones (Épica 6).
  - La prueba de rendimiento de NFR10 (cuando haya Gastos).
- La épica pide "Saldo calculado, Saldo proyectado y Dinero libre". Con `Hechos` mínimos (saldo inicial y Colchón), las cifras son triviales a propósito. Lo que importa es la **forma**: H1.4 agrega Pagos y flujos sin cambiar firmas.

### Decisiones fijadas en esta historia

- **`useLiveQuery` no se usa tal cual (desvío del texto de AD-18 y del AC de la épica).** Hay dos razones verificadas:
  1. El `useLiveQuery` de drizzle (`node_modules/drizzle-orm/expo-sqlite/query.js`) escucha **una sola tabla**, la del `from` de la consulta, mediante `addDatabaseChangeListener`. `Hechos` junta varias tablas, así que un cambio en otra no recargaría nada.
  2. ESLint (AD-3) prohíbe importar `drizzle-orm` fuera de `src/data/`, y `useEstado` vive en `hooks/`.

  **Reemplazo:** `useHechos()` vive en `data/`, con el mismo precedente que `useMigraciones` en H1.2, y se recarga con una **señal explícita** (`avisarCambio`) que emite `ejecutarComando` tras cada commit. Toda escritura pasa por comandos (AD-3), y restaurar también pasa por el post-comando (AD-14), así que la señal cubre todos los cambios. Además es determinista y se puede probar en Jest, donde no existe el listener nativo. Se conserva la intención de AD-18: un `Estado` reactivo con un solo cargador. `enableChangeListener: true` sigue en `db.ts`, sin uso por ahora.
- **"Hoy" en Bogotá con offset fijo −05:00:** sin `Intl` en `services/reloj`. Una prueba compara contra `Intl` en Jest.
- **`suscribirHoy` avisa en cada vuelta a primer plano**, no solo si cambió el día, porque AD-13 lo usará para reprogramar. `useHoy` no re-renderiza si el string es igual.
- **El mínimo del Horizonte, en empate, es el primer día.** Es el día que H1.4 muestra como "día del faltante".
- **`Estado` es una unión discriminada** (`'sinConfigurar' | 'calculado'`): nunca hay cifras inventadas cuando falta configuración.
- **`ContextoComando` con `ahora` y `nuevoId`:** los comandos no llaman `new Date()` ni `randomUUID()` por su cuenta. Así las pruebas son deterministas, y todas las filas de una misma transacción comparten la marca.
- **El error de un comando** viaja como `{ codigo: 'fallo', causa }` dentro de `data/`. Las pantallas solo ven `fallo('fallo')`, y la causa queda en el log (`comando.<operacion>`).

### Estado actual de los archivos que se modifican o se apoyan

| Archivo | Hoy | Qué cambia | Qué se preserva |
| --- | --- | --- | --- |
| `src/data/schema.ts` | `columnasComunes` y la tabla `rastro` (H1.1) | **Nada** | Todo |
| `src/data/db.ts` | `obtenerDb()` perezosa y memoizada, `enableChangeListener: true` y el tipo `BaseDeDatos` (H1.2) | Nada; solo se usa | El patrón perezoso: no abrir al importar |
| `src/data/migraciones.ts` | `useMigraciones()` con reintento (H1.2) | Nada | Es el precedente de un hook dentro de `data/` |
| `src/data/pruebas/base-en-memoria.ts` | `crearBaseDePrueba()` → `{ db, sqlite, cerrar }` | Nada; se reutiliza | Cierra las bases en `afterEach`, como en `base-en-memoria.test.ts` |
| `src/domain/resultado.ts` | `Resultado<T, E>`, `ok()` y `fallo()` (H1.2) | Nada; se usa en `ejecutar` | — |
| `src/services/log.ts` | `log.info/aviso/error(operacion, { ids?, error? })` (H1.2) | Nada; se usa en `use-comando` | La operación tiene forma `capa.accion` y no lleva datos libres |
| `src/app/_layout.tsx` | Bloqueo → migraciones → `Stack` con capa (H1.2) | **Nada** | Las pantallas se montan solo tras `migraciones.exito`, y `useHechos` depende de eso |
| `eslint.config.js` | Capas AD-1, AD-3 y AD-17 | Patrón del reloj en `src/app/**` y `src/components/**` (T11) | Todas las reglas actuales; ojo con la trampa de los bloques |
| `pruebas/eslint-reglas.test.ts` | Casos de capas | Casos nuevos de T11 | Los casos actuales |

### Capas y lint (vigentes; no aflojarlos)

- **`domain/`:** puro. Sin `Date`, `Intl.DateTimeFormat`, `Temporal`, `performance`, `Math.random` ni `crypto`, y sin importar otras capas, React, Expo, Drizzle ni `node:`. Las fechas son strings y la aritmética es entera (T1).
- **`data/`:** el único lugar con `drizzle-orm`, `expo-sqlite`, `data/db` y `data/schema`. No importa `services/`, que va por encima. Solo importa **tipos** y funciones puras de `domain/`. `cargarHechos` puede importar `hechosVacios`.
- **`hooks/`:** une `data/`, `domain/` y `services/`. No puede importar `drizzle-orm` ni `data/db` (patrón `(^|/)data/(schema|db)$`). Por eso existen `cargarHechosActuales()` y `ejecutarComando()` en `data/`.
- **`services/`:** puede importar `domain/` y `data/` (spine). En esta historia `reloj` no importa nada propio.
- **Sin `console`** (AD-23); el registro va por `services/log`.

### Trampas conocidas

- **No usar `await` dentro de `db.transaction(...)`:** los drivers son sync, y una promesa dentro rompería el rollback.
- **`useLiveQuery`:** ver Decisiones. No lo importes en `hooks/`; ESLint falla y además no serviría.
- **El orden de los bloques de ESLint** que repiten `no-restricted-imports` (T11).
- **`expo-crypto` en Jest:** `jest-expo` no mockea `ExpoCrypto.randomUUID`. Mockéalo con `node:crypto` o inyecta `nuevoId`.
- **Timers largos en Android:** el tope de 60 min de `suscribirHoy` evita depender de un `setTimeout` de horas. En segundo plano los timers se congelan; el aviso de `'active'` lo cubre.
- **React Compiler activo:** las refs se leen y escriben solo en efectos y manejadores (lección de H1.2). En `useHechos`, el error que se lanza en el render sale del **estado**, no de una ref.
- **`renderHook` y `render` son `await`ables** en `@testing-library/react-native` 14, como en las pruebas de H1.2.
- **Pruebas de `data/`:** `/** @jest-environment node */` al inicio, igual que `base-en-memoria.test.ts`.

### Testing

- Jest con jest-expo. Las pruebas van junto al archivo (`*.test.ts`). Las de pantallas van en `pruebas/pantallas/`, aunque esta historia no tiene.
- `domain/` se prueba sin base ni reloj. `data/` con `crearBaseDePrueba()` (better-sqlite3), nunca con un mock de `expo-sqlite`. `hooks/` con `renderHook` y mocks de módulo.
- Hay un caso de integración: `ejecutar` → `avisarCambio` → recarga de `useEstado`.

### Project Structure Notes

```text
src/
  domain/
    fechas.ts / fechas.test.ts                 # NUEVO (T1)
    redondeo.ts / redondeo.test.ts             # NUEVO (T2)
    hechos.ts                                  # NUEVO (T3)
    estado.ts                                  # NUEVO (T3, solo tipos)
    calcular-estado.ts / .test.ts              # NUEVO (T4)
  services/
    reloj.ts / reloj.test.ts                   # NUEVO (T5)
  hooks/
    use-hoy.ts / .test.ts                      # NUEVO (T6)
    use-estado.ts / .test.ts                   # NUEVO (T9)
    use-estado.integracion.test.tsx            # NUEVO (T9)
    use-comando.ts / .test.ts                  # NUEVO (T9)
  data/
    contexto.ts                                # NUEVO (T7, tipos)
    cambios.ts                                 # NUEVO (T7)
    ejecutar-comando.ts / .test.ts             # NUEVO (T7)
    use-hechos.ts / .test.tsx                  # NUEVO (T8)
    queries/cargar-hechos.ts / .test.ts        # NUEVO (T8); borra queries/.gitkeep
    queries/vigentes.ts                        # NUEVO (T8)
    tablas/rastro.ts / .test.ts                # NUEVO (T10); borra tablas/.gitkeep
eslint.config.js                               # MODIFICADO (T11)
pruebas/eslint-reglas.test.ts                  # MODIFICADO (T11)
```

- `data/commands/` sigue vacía (con su `.gitkeep`): no hay comandos de negocio en H1.3. Los comandos de prueba viven dentro de los archivos de prueba.
- Los nombres siguen el Glosario en camelCase y sin tildes (`saldoCalculado`, `saldoProyectado`, `dineroLibre`, `colchon`), y los archivos van en kebab-case.

### Previous Story Intelligence (H1.2)

- **Patrones que se reutilizan:**
  - `Resultado<T, E>`, con errores como códigos y nunca como texto libre.
  - `log.error('capa.accion', { error })`.
  - Hooks en `data/` cuando necesitan Drizzle (`useMigraciones`).
  - `obtenerDb()` perezosa.
  - Inyección para probar: `instalarRegistroDeErroresGlobales({ registro, utilidades })`.
  - Pruebas de AppState con un espía de `addEventListener` (`use-acceso.test.ts`) y relojes falsos con `jest.setSystemTime`.
- **Lecciones de los dos code reviews de H1.2:**
  - Cada rama de error se prueba de verdad. Una prueba que pasaría igual sin el guardia no sirve: la de "desmontado" se tuvo que rehacer.
  - Si un helper "nunca lanza", igual se protege al llamador. Por ejemplo, `.catch` y un guardia que se libera.
  - El reloj de pared puede moverse. `suscribirHoy` debe tolerar que `hoy()` retroceda: en ese caso solo avisa del nuevo valor, nunca entra en bucle.
  - Documentar en el Dev Agent Record cualquier desvío de la historia.
- **Formato:** el repo no tiene configuración de Prettier, pero el código sigue `--single-quote --print-width 120` (ver la nota del review de H1.2). Si formateas, usa esas opciones.

### Git Intelligence

- Hay un solo commit (`adbab6d`, H1.1). **Todo H1.2, incluidos los parches de review de H1.1, está sin commitear.** Antes de empezar H1.3, Priettos debería commitear H1.2, idealmente separado de los parches de H1.1, para que el diff de esta historia quede limpio.

### Información técnica verificada (node_modules del proyecto, 2026-11-05)

- **drizzle-orm 0.45.x:**
  - `useLiveQuery` (`drizzle-orm/expo-sqlite`) escucha solo `config.name === tableName` de la tabla principal.
  - `ExpoSQLiteDatabase` y `BetterSQLite3Database` extienden `BaseSQLiteDatabase<'sync', …>`, así que `transaction(fn)` es sincrónico.
  - Un tipo `BaseSQLiteDatabase<'sync', unknown, typeof schema>` acepta ambos (verificado con `tsc`).
- **expo-crypto 57:** `randomUUID()` llama al módulo nativo `ExpoCrypto`, y el preset de jest-expo no lo mockea.
- **Zona horaria:** con Node, `Intl` + `America/Bogota` da `2026-11-05` a las 04:59:59Z y `2026-11-06` a las 05:00:00Z. Es UTC−5 fijo.
- **React Native 0.86:** `AppState.addEventListener('change', cb)` devuelve una suscripción con `.remove()`.
- **`app.config.ts`:** `reactCompiler: true`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]: AC de la épica.
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]: lo que **no** entra aquí (tablas de configuración, pantalla principal y `pagoAtrasado`).
- [Source: _bmad-output/planning-artifacts/architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md]:
  - AD-1 (cálculo puro y total, `{valor, aproximado}` solo en ciertas cifras).
  - AD-2 (puntos de partida con fecha).
  - AD-3 (comandos, transacciones, rastro y lint).
  - AD-5 (Horizonte `hoy..hoy+31`).
  - AD-7 (enteros y redondeo en contra).
  - AD-8 (reloj, `useHoy`).
  - AD-10 (UUID v4 con `expo-crypto`).
  - AD-13 (cuándo se reprograma).
  - AD-18 (Hechos, cargador y ciclo post-comando).
  - AD-23 (`Resultado` y log).
  - Consistency Conventions (nombres y pruebas).
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-11-04.md]: partición de la antigua H1.3 y tabla de "cada tabla nace en la historia que la necesita".
- [Source: _bmad-output/implementation-artifacts/1-2-acceso-protegido-diagnostico-y-error-amable.md]: patrones, lecciones de review y desvíos documentados.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md]: el reloj de pared se puede manipular (límite conocido de `biometria`). `services/reloj` usa también el reloj de pared, y es aceptable para "hoy".

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), vía Claude Code (bmad-dev-story).

### Debug Log References

- T1: la referencia a mano de `diasEntre('1970-01-01', '2026-11-05')` estaba mal (20397); se verificó con `Date.UTC` → 20762.
- T2: `Math.ceil(-1 / 3)` da `-0`; los helpers devuelven `0`. La prueba compara con `Math.ceil(...) + 0` y verifica que nunca salga `-0`.
- T8: React reintenta una vez el render tras un error y vuelve a correr el inicializador de `useState`; las pruebas de error de `useHechos` usan un fallo persistente (`mockImplementation`), no `mockImplementationOnce`.
- T9: AD-3 (`no-restricted-imports`) también aplica a las pruebas de `hooks/`; la prueba de integración lleva un `eslint-disable` de archivo justificado.

### Completion Notes List

- Análisis de contexto completado: guía de desarrollo exhaustiva creada (create-story, 2026-11-05).
- T1–T4 (`domain/`): fechas con aritmética entera (Hinnant), redondeo en contra del usuario con resto exacto, tipos `Hechos`/`Estado` (unión discriminada) y `calcularEstado` puro y total con Horizonte de 32 días, mínimo (primer día en empate) y Dinero libre.
- T5–T6: `services/reloj` con offset fijo −05:00 (comparado contra `Intl` en Jest), espera hasta medianoche con tope de 60 min, aviso en cada `'active'` y tolerancia a reloj que retrocede; `useHoy` como único envoltorio.
- T7–T8: `ContextoComando`/`Comando`, señal `avisarCambio`/`suscribirCambios`, `ejecutarComando` (rollback → `fallo` sin aviso), `cargarHechos` (devuelve `hechosVacios`, con la lista de tablas por historia), `vigentes()` y `useHechos` (error guardado en estado y lanzado en el render).
- T9: `useEstado`, `ejecutar`/`useComando` con punto de extensión `registrarTrasComando` y prueba de integración `ejecutar → avisarCambio → recarga`.
- T10: `registrarRastro`, `editarConRastro` y `borrarConRastro` genéricos sobre tablas con `columnasComunes` (sin `any`), probados con una tabla solo de prueba, incluida la atomicidad.
- T11: bloque de ESLint para `src/app/**` y `src/components/**` que repite `patronesData` y agrega el patrón del reloj; pruebas de que AD-3 se conserva.
- T12: `npm run verificar` en verde: 25 suites, 345 pruebas (antes 223). Sin cambios de UI, sin textos nuevos, sin migraciones; `schema.ts` intacto.

**Desvíos y decisiones respecto a la historia:**

1. **`avisarCambio` nunca lanza.** Corre cada oyente en su `try/catch` y relanza el error en un `setTimeout(…, 0)`, donde lo registra el manejador global (`app.errorNoControlado`). Motivo: se llama después del commit; un oyente roto no debe convertir el commit en excepción ni dejar sin aviso a los demás, y `data/` no puede usar `log`.
2. **`ejecutar` no recalcula el Estado si no hay post-comandos registrados** (H1.3–Épica 5): evita una lectura de la base por comando sin oyentes. Si el recálculo falla, se registra como `comando.trasComando` y el resultado sigue siendo `ok`. `hoy()` también va dentro de ese `try`.
3. **`registrarTrasComando` y `suscribirCambios` envuelven la función** para que registrar dos veces la misma dé dos registros independientes, con cancelación separada. Se usa un `Set`, no un arreglo.
4. **`cargarHechos` devuelve una copia** (`{ ...hechosVacios }`), no la constante compartida.
5. **Redondeo:** además del divisor, un dividendo no entero también devuelve `0`, y nunca se devuelve `-0`.
6. **Prueba extra** `src/data/cambios.test.ts` para la señal (no estaba en la lista de archivos).
7. **Límite conocido (sin cambio):** `useHechos` se suscribe en un efecto; un comando que ocurriera entre el primer render y el efecto no recargaría. En la práctica los comandos salen de manejadores de eventos, después de montar.
8. En T7 la implementación de `cambios.ts` se escribió antes que su prueba (orden rojo-verde invertido en ese archivo pequeño).

**Git:** H1.2 sigue sin commitear (igual que al empezar), así que el diff contra `baseline_commit` mezcla H1.2 y H1.3. Para revisar solo H1.3, usar la File List de abajo.

### File List

Nuevos:

- src/domain/fechas.ts
- src/domain/fechas.test.ts
- src/domain/redondeo.ts
- src/domain/redondeo.test.ts
- src/domain/hechos.ts
- src/domain/estado.ts
- src/domain/calcular-estado.ts
- src/domain/calcular-estado.test.ts
- src/services/reloj.ts
- src/services/reloj.test.ts
- src/hooks/use-hoy.ts
- src/hooks/use-hoy.test.ts
- src/hooks/use-estado.ts
- src/hooks/use-estado.test.ts
- src/hooks/use-estado.integracion.test.tsx
- src/hooks/use-comando.ts
- src/hooks/use-comando.test.ts
- src/data/contexto.ts
- src/data/cambios.ts
- src/data/cambios.test.ts
- src/data/ejecutar-comando.ts
- src/data/ejecutar-comando.test.ts
- src/data/use-hechos.ts
- src/data/use-hechos.test.tsx
- src/data/queries/cargar-hechos.ts
- src/data/queries/cargar-hechos.test.ts
- src/data/queries/vigentes.ts
- src/data/tablas/rastro.ts
- src/data/tablas/rastro.test.ts

Modificados:

- eslint.config.js
- pruebas/eslint-reglas.test.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/1-3-nucleo-de-calculo-reloj-hechos-y-estado-reactivo.md

Borrados:

- src/data/queries/.gitkeep
- src/data/tablas/.gitkeep

## Change Log

- 2026-11-05: Historia creada con create-story. Estado → ready-for-dev.
- 2026-11-05: Implementación de H1.3 (dev-story): núcleo de cálculo (fechas, redondeo, `Hechos`/`Estado`, `calcularEstado`), reloj y `useHoy`, comandos con señal de cambios, `useHechos`/`useEstado`/`ejecutar`, helper de rastro y guardia de lint del reloj. 122 pruebas nuevas (345 en total). Estado → review.
- 2026-11-05: Code review (Blind Hunter, Edge Case Hunter, Acceptance Auditor). 7 patches aplicados: `avisarCambio` reporta el error de un oyente como no fatal (`ErrorUtils`) y lleva un contador de versión; `useHechos` y `useHoy` pasan a `useSyncExternalStore` (no pierden un cambio entre el render y la suscripción); `redondeo` exige enteros seguros; `ejecutarComando` rechaza un `aplicar` asíncrono; lint impide importar `data/ejecutar-comando` y `data/cambios` desde las pantallas; `eslint-disable` acotado en la prueba de integración. 5 diferidos a deferred-work.md. 360 pruebas. Estado → done.
