import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
