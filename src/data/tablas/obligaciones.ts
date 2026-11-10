import { asc } from 'drizzle-orm';

import type { ContextoComando, Transaccion } from '../contexto';
import { vigentes } from '../queries/vigentes';
import { obligaciones } from '../schema';
import { borrarConRastro, editarConRastro } from './rastro';

/**
 * Módulo dueño de `obligaciones` (AD-3). Recibe la transacción del comando y
 * nunca abre una propia. Valida quien llama (el comando).
 */

export type FilaObligacion = typeof obligaciones.$inferSelect;
export type DatosObligacion = Omit<FilaObligacion, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

/** Obligaciones vigentes, en orden de creación. */
export function leerObligacionesVigentes(tx: Transaccion): FilaObligacion[] {
  return tx
    .select()
    .from(obligaciones)
    .where(vigentes(obligaciones))
    .orderBy(asc(obligaciones.createdAt), asc(obligaciones.id))
    .all();
}

/** Inserta una Obligación con `id` UUID y las marcas del contexto (AD-10). */
export function insertarObligacion(tx: Transaccion, ctx: ContextoComando, datos: DatosObligacion): FilaObligacion {
  const fila: FilaObligacion = {
    id: ctx.nuevoId(),
    createdAt: ctx.ahora,
    updatedAt: ctx.ahora,
    deletedAt: null,
    ...datos,
  };
  tx.insert(obligaciones).values(fila).run();
  return fila;
}

/**
 * Edita una Obligación vigente conservando su `id`, con rastro (solo si algo
 * cambió). El `tipo` no se edita: cambiaría la forma de las claves (AD-5).
 */
export function editarObligacion(
  tx: Transaccion,
  ctx: ContextoComando,
  id: string,
  cambios: Partial<Omit<DatosObligacion, 'tipo'>>,
): FilaObligacion {
  return editarConRastro(tx, ctx, obligaciones, id, cambios);
}

/** Borrado lógico con rastro (AD-4). Lanza `filaNoEncontrada` si no está vigente. */
export function borrarObligacion(tx: Transaccion, ctx: ContextoComando, id: string): void {
  borrarConRastro(tx, ctx, obligaciones, id);
}
