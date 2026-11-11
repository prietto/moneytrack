import { asc } from 'drizzle-orm';

import type { ContextoComando, Transaccion } from '../contexto';
import { vigentes } from '../queries/vigentes';
import { categorias } from '../schema';
import { borrarConRastro, editarConRastro } from './rastro';

/**
 * Módulo dueño de `categorias` (AD-3). Recibe la transacción del comando y
 * nunca abre una propia. Valida quien llama (el comando), incluido que no se
 * toquen las de sistema.
 */

export type FilaCategoria = typeof categorias.$inferSelect;
export type DatosCategoria = Omit<FilaCategoria, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

/** Categorías vigentes, en orden de creación. */
export function leerCategoriasVigentes(tx: Transaccion): FilaCategoria[] {
  return tx
    .select()
    .from(categorias)
    .where(vigentes(categorias))
    .orderBy(asc(categorias.createdAt), asc(categorias.id))
    .all();
}

/** Inserta una categoría con `id` UUID y las marcas del contexto (AD-10). */
export function insertarCategoria(tx: Transaccion, ctx: ContextoComando, datos: DatosCategoria): FilaCategoria {
  const fila: FilaCategoria = {
    id: ctx.nuevoId(),
    createdAt: ctx.ahora,
    updatedAt: ctx.ahora,
    deletedAt: null,
    ...datos,
  };
  tx.insert(categorias).values(fila).run();
  return fila;
}

/** Edita una categoría vigente conservando su `id`, con rastro (solo si algo cambió). */
export function editarCategoria(
  tx: Transaccion,
  ctx: ContextoComando,
  id: string,
  cambios: Partial<Omit<DatosCategoria, 'esSistema'>>,
): FilaCategoria {
  return editarConRastro(tx, ctx, categorias, id, cambios);
}

/** Borrado lógico con rastro (AD-4). Lanza `filaNoEncontrada` si no está vigente. */
export function borrarCategoria(tx: Transaccion, ctx: ContextoComando, id: string): void {
  borrarConRastro(tx, ctx, categorias, id);
}
