import { isNull, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

/**
 * Condición de "fila vigente" (AD-4): no borrada lógicamente. Toda lectura de
 * `cargarHechos` filtra con esto: `.where(vigentes(tabla))`.
 */
export function vigentes(tabla: { deletedAt: AnySQLiteColumn }): SQL {
  return isNull(tabla.deletedAt);
}
