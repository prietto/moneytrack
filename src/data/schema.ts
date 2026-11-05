import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
