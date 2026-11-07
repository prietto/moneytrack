import { and, eq, getTableName } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable, SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core';

import type { ContextoComando, Transaccion } from '../contexto';
import { vigentes } from '../queries/vigentes';
import { type OperacionRastro, rastro } from '../schema';

/**
 * Módulo dueño de `rastro` (AD-3). Los comandos que editan o borran una fila
 * usan estos helpers dentro de **su** transacción: el cambio y su rastro se
 * escriben juntos, y si la transacción falla no queda ninguno de los dos.
 */

/** Una tabla con `columnasComunes` (AD-10). */
type TablaConComunes = SQLiteTable & {
  id: SQLiteColumn;
  updatedAt: SQLiteColumn;
  deletedAt: SQLiteColumn;
};

export type DatosRastro = {
  /** Nombre SQL de la tabla, p. ej. 'gastos'. */
  entidad: string;
  entidadId: string;
  operacion: OperacionRastro;
  /** Fila completa antes del cambio. */
  antes: unknown;
  /** Fila completa después del cambio; `null` al borrar. */
  despues: unknown;
};

/** Inserta una fila de rastro con las marcas del contexto. */
export function registrarRastro(tx: Transaccion, ctx: ContextoComando, datos: DatosRastro): void {
  tx.insert(rastro)
    .values({
      id: ctx.nuevoId(),
      createdAt: ctx.ahora,
      updatedAt: ctx.ahora,
      entidad: datos.entidad,
      entidadId: datos.entidadId,
      operacion: datos.operacion,
      antes: JSON.stringify(datos.antes),
      despues: datos.despues === null ? null : JSON.stringify(datos.despues),
      fecha: ctx.ahora,
    })
    .run();
}

function leerVigente<T extends TablaConComunes>(tx: Transaccion, tabla: T, id: string): T['$inferSelect'] {
  const fila = tx
    .select()
    .from(tabla as SQLiteTable)
    .where(and(eq(tabla.id, id), vigentes(tabla)))
    .get() as T['$inferSelect'] | undefined;
  // El comando hace rollback y `ejecutar` devuelve fallo.
  if (fila === undefined) throw new Error('filaNoEncontrada');
  return fila;
}

function leer<T extends TablaConComunes>(tx: Transaccion, tabla: T, id: string): T['$inferSelect'] {
  return tx
    .select()
    .from(tabla as SQLiteTable)
    .where(eq(tabla.id, id))
    .get() as T['$inferSelect'];
}

/** Algún valor de `cambios` difiere del de la fila (comparación por valor; las columnas son escalares). */
function hayCambios(fila: Record<string, unknown>, cambios: Record<string, unknown>): boolean {
  return Object.entries(cambios).some(([columna, valor]) => valor !== undefined && !Object.is(fila[columna], valor));
}

/**
 * Edita una fila vigente y registra el rastro (antes y después completos) en
 * la misma transacción. Lanza `filaNoEncontrada` si no existe o está borrada.
 * Devuelve la fila nueva.
 *
 * Si `cambios` no altera ninguna columna, no escribe nada: ni `update`, ni
 * `updatedAt`, ni rastro. Devuelve la fila tal como está.
 */
export function editarConRastro<T extends TablaConComunes>(
  tx: Transaccion,
  ctx: ContextoComando,
  tabla: T,
  id: string,
  cambios: Partial<Omit<T['$inferInsert'], 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>,
): T['$inferSelect'] {
  const antes = leerVigente(tx, tabla, id);
  if (!hayCambios(antes as Record<string, unknown>, cambios as Record<string, unknown>)) return antes;
  tx.update(tabla)
    .set({ ...cambios, updatedAt: ctx.ahora } as SQLiteUpdateSetSource<T>)
    .where(eq(tabla.id, id))
    .run();
  const despues = leer(tx, tabla, id);
  registrarRastro(tx, ctx, { entidad: getTableName(tabla), entidadId: id, operacion: 'editar', antes, despues });
  return despues;
}

/**
 * Borrado lógico (AD-4): pone `deletedAt` y registra el rastro con
 * `despues: null`, en la misma transacción. Lanza `filaNoEncontrada` si no
 * existe o ya estaba borrada.
 */
export function borrarConRastro<T extends TablaConComunes>(
  tx: Transaccion,
  ctx: ContextoComando,
  tabla: T,
  id: string,
): void {
  const antes = leerVigente(tx, tabla, id);
  tx.update(tabla)
    .set({ deletedAt: ctx.ahora, updatedAt: ctx.ahora } as SQLiteUpdateSetSource<T>)
    .where(eq(tabla.id, id))
    .run();
  registrarRastro(tx, ctx, { entidad: getTableName(tabla), entidadId: id, operacion: 'borrar', antes, despues: null });
}
