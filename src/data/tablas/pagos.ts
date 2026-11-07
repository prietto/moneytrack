import { asc } from 'drizzle-orm';

import type { ContextoComando, Transaccion } from '../contexto';
import { vigentes } from '../queries/vigentes';
import { pagos } from '../schema';
import { editarConRastro } from './rastro';

/**
 * Módulo dueño de `pagos` (AD-3). Recibe la transacción del comando y nunca
 * abre una propia. No hay `borrarPago`: en v1 ninguna pantalla borra Pagos.
 */

export type FilaPago = typeof pagos.$inferSelect;
export type DatosPago = { numero: number; dia: number; montoEsperado: number };

/** Pagos vigentes, ordenados por `numero`. */
export function leerPagosVigentes(tx: Transaccion): FilaPago[] {
  return tx.select().from(pagos).where(vigentes(pagos)).orderBy(asc(pagos.numero)).all();
}

/** Inserta un Pago nuevo con `id` UUID y las marcas del contexto (AD-10). */
export function insertarPago(tx: Transaccion, ctx: ContextoComando, datos: DatosPago): FilaPago {
  const fila: FilaPago = { id: ctx.nuevoId(), createdAt: ctx.ahora, updatedAt: ctx.ahora, deletedAt: null, ...datos };
  tx.insert(pagos).values(fila).run();
  return fila;
}

/** Edita un Pago vigente conservando su `id`, con rastro (solo si algo cambió). */
export function editarPago(
  tx: Transaccion,
  ctx: ContextoComando,
  id: string,
  cambios: Partial<Omit<DatosPago, 'numero'>>,
): FilaPago {
  return editarConRastro(tx, ctx, pagos, id, cambios);
}
