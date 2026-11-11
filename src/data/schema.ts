import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Relativo y no `@/`: drizzle-kit carga este archivo sin los alias de tsconfig.
import { CLASES_GASTO } from '../domain/hechos';

/**
 * Columnas comunes de toda tabla (AD-10): id UUID v4 en texto generado en el
 * cliente y marcas técnicas en ISO 8601 UTC. En SQL van en snake_case y en TS
 * en camelCase.
 */
export const columnasComunes = {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
};

export const operacionesRastro = ['editar', 'borrar', 'restaurar'] as const;
export type OperacionRastro = (typeof operacionesRastro)[number];

/**
 * Rastro de ediciones y borrados de cualquier tabla (AD-3).
 * `antes` y `despues` guardan la fila completa en JSON; `despues` es null al borrar.
 */
export const rastro = sqliteTable('rastro', {
  ...columnasComunes,
  entidad: text('entidad').notNull(),
  entidadId: text('entidad_id').notNull(),
  operacion: text('operacion', { enum: operacionesRastro }).notNull(),
  antes: text('antes').notNull(),
  despues: text('despues'),
  fecha: text('fecha').notNull(),
});

/**
 * Definición de los dos Pagos (FR1, AD-3). Al editar se conserva el `id`:
 * H2.3 referencia la ocurrencia como `(pagoId, clave)`. Las ocurrencias, el
 * saldo proyectado y el "atrasado" no se guardan: se calculan (AD-2).
 */
export const pagos = sqliteTable(
  'pagos',
  {
    ...columnasComunes,
    numero: integer('numero').notNull(), // 1 | 2
    dia: integer('dia').notNull(), // 1..31
    montoEsperado: integer('monto_esperado').notNull(),
  },
  // Un solo Pago vigente por número; los borrados no cuentan.
  (t) => [uniqueIndex('pagos_numero_vigente').on(t.numero).where(sql`${t.deletedAt} is null`)],
);

/**
 * Configuración general (AD-9): una sola fila vigente. Todo es configuración
 * con fecha o valor simple, sin columnas derivadas (AD-2). Las columnas
 * admiten null: otras historias agregan las suyas (umbral del Semáforo, hora
 * de la Sesión de pagos) con migraciones nuevas.
 */
export const ajustes = sqliteTable('ajustes', {
  ...columnasComunes,
  saldoInicialMonto: integer('saldo_inicial_monto'),
  saldoInicialFecha: text('saldo_inicial_fecha'), // 'YYYY-MM-DD'
  colchon: integer('colchon'),
});

/**
 * Vehículos (FR5): solo el nombre, sin repetirse entre los vigentes (lo
 * garantiza el comando, sin distinguir mayúsculas). Gastos (Épica 2) y
 * Obligaciones anuales los referencian por `id`.
 */
export const vehiculos = sqliteTable('vehiculos', {
  ...columnasComunes,
  nombre: text('nombre').notNull(),
});

export const tiposObligacion = ['mensual', 'anual'] as const;
export type TipoObligacion = (typeof tiposObligacion)[number];

/**
 * Definición de las Obligaciones (FR3, AD-5). Nada derivado (AD-2): ni
 * ocurrencias, ni reserva acumulada, ni "vencida"; las calcula domain/.
 *
 * Las columnas de cada tipo admiten null: la mensual usa `monto` y `dia`; la
 * anual `monto`, `fechaVencimiento`, `vehiculoId` (opcional) y la reserva
 * inicial. Las cuotas de Deuda (H1.7) no tendrán monto ni día propios.
 *
 * Sin `.references()`: SQLite no tiene `PRAGMA foreign_keys` activo en la app
 * y la restauración (H7) reemplaza tablas completas. La integridad la
 * garantizan los comandos y `cargarHechos` (huérfano → null).
 */
export const obligaciones = sqliteTable('obligaciones', {
  ...columnasComunes,
  tipo: text('tipo', { enum: tiposObligacion }).notNull(),
  nombre: text('nombre').notNull(),
  monto: integer('monto'), // null solo en cuotas de Deuda (H1.7, AD-5)
  dia: integer('dia'), // mensual, 1..31
  fechaVencimiento: text('fecha_vencimiento'), // anual, 'YYYY-MM-DD'
  vehiculoId: text('vehiculo_id'), // anual, opcional
  reservaInicialMonto: integer('reserva_inicial_monto'), // anual
  reservaInicialFecha: text('reserva_inicial_fecha'), // anual, 'YYYY-MM-DD'
});

/**
 * Presupuestos esenciales (FR3, AD-9): N bolsas mensuales para esenciales
 * variables. La siembra (migración 0004) crea "Comida" y "Mantenimiento de
 * vehículos" sin monto. Nada derivado (AD-2): lo pendiente lo calcula domain/.
 */
export const presupuestos = sqliteTable('presupuestos', {
  ...columnasComunes,
  nombre: text('nombre').notNull(),
  montoMensual: integer('monto_mensual'), // null: sin configurar
});

/**
 * Fondos protegidos (FR4, AD-9): N bolsas para una pasión. El saldo no se
 * guarda: se calcula desde el saldo inicial con fecha (AD-2) y el aporte
 * mensual acreditado en el Pago 2 (AD-20). La siembra crea "Fondo enduro"
 * sin configurar (aporte y saldo en null).
 */
export const fondos = sqliteTable('fondos', {
  ...columnasComunes,
  nombre: text('nombre').notNull(),
  aporteMensual: integer('aporte_mensual'), // null: sin configurar
  saldoInicialMonto: integer('saldo_inicial_monto'),
  saldoInicialFecha: text('saldo_inicial_fecha'), // 'YYYY-MM-DD'
});

/**
 * Categorías (FR8, AD-9): reglas por defecto que se copian al Gasto (AD-19).
 * Enlaces por `id` (nunca por nombre), coherentes con la clase y sin
 * `.references()` (como `obligaciones`). Las de sistema ("Pago de
 * Obligación", "Sin registrar") no se editan ni se borran.
 */
export const categorias = sqliteTable('categorias', {
  ...columnasComunes,
  nombre: text('nombre').notNull(),
  claseDefault: text('clase_default', { enum: CLASES_GASTO }).notNull(),
  presupuestoId: text('presupuesto_id'), // solo Esencial, opcional
  fondoId: text('fondo_id'), // solo Fondo protegido, obligatorio
  requiereVehiculo: integer('requiere_vehiculo', { mode: 'boolean' }).notNull().default(false),
  esSistema: integer('es_sistema', { mode: 'boolean' }).notNull().default(false),
});
