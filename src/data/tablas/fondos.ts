import { asc } from 'drizzle-orm';

import type { ContextoComando, Transaccion } from '../contexto';
import { vigentes } from '../queries/vigentes';
import { fondos } from '../schema';
import { editarConRastro } from './rastro';

/**
 * Módulo dueño de `fondos` (AD-3). Recibe la transacción del comando y nunca
 * abre una propia. Valida quien llama (el comando).
 *
 * Sin insertar ni borrar: las filas vienen de la siembra y la UI solo edita
 * el aporte y el saldo inicial (el modelo ya admite N Fondos).
 */

export type FilaFondo = typeof fondos.$inferSelect;

/** Fondos vigentes, en orden de creación. */
export function leerFondosVigentes(tx: Transaccion): FilaFondo[] {
  return tx.select().from(fondos).where(vigentes(fondos)).orderBy(asc(fondos.createdAt), asc(fondos.id)).all();
}

/** Edita un Fondo vigente conservando su `id`, con rastro (solo si algo cambió). */
export function editarFondo(
  tx: Transaccion,
  ctx: ContextoComando,
  id: string,
  cambios: { aporteMensual: number; saldoInicialMonto: number; saldoInicialFecha: string },
): FilaFondo {
  return editarConRastro(tx, ctx, fondos, id, cambios);
}
