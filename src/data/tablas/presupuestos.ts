import { asc } from 'drizzle-orm';

import type { ContextoComando, Transaccion } from '../contexto';
import { vigentes } from '../queries/vigentes';
import { presupuestos } from '../schema';
import { editarConRastro } from './rastro';

/**
 * Módulo dueño de `presupuestos` (AD-3). Recibe la transacción del comando y
 * nunca abre una propia. Valida quien llama (el comando).
 *
 * Sin insertar ni borrar: las filas vienen de la siembra y la UI solo edita
 * montos (el modelo ya admite N Presupuestos).
 */

export type FilaPresupuesto = typeof presupuestos.$inferSelect;

/** Presupuestos vigentes, en orden de creación. */
export function leerPresupuestosVigentes(tx: Transaccion): FilaPresupuesto[] {
  return tx
    .select()
    .from(presupuestos)
    .where(vigentes(presupuestos))
    .orderBy(asc(presupuestos.createdAt), asc(presupuestos.id))
    .all();
}

/** Edita un Presupuesto vigente conservando su `id`, con rastro (solo si algo cambió). */
export function editarPresupuesto(
  tx: Transaccion,
  ctx: ContextoComando,
  id: string,
  cambios: { montoMensual: number },
): FilaPresupuesto {
  return editarConRastro(tx, ctx, presupuestos, id, cambios);
}
