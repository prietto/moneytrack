import { asc } from 'drizzle-orm';

import type { ContextoComando, Transaccion } from '../contexto';
import { vigentes } from '../queries/vigentes';
import { vehiculos } from '../schema';
import { borrarConRastro, editarConRastro } from './rastro';

/**
 * Módulo dueño de `vehiculos` (AD-3). Recibe la transacción del comando y
 * nunca abre una propia. Valida quien llama (el comando).
 */

export type FilaVehiculo = typeof vehiculos.$inferSelect;
export type DatosVehiculo = { nombre: string };

/** Vehículos vigentes, en orden de creación. */
export function leerVehiculosVigentes(tx: Transaccion): FilaVehiculo[] {
  return tx
    .select()
    .from(vehiculos)
    .where(vigentes(vehiculos))
    .orderBy(asc(vehiculos.createdAt), asc(vehiculos.id))
    .all();
}

/** Inserta un Vehículo con `id` UUID y las marcas del contexto (AD-10). */
export function insertarVehiculo(tx: Transaccion, ctx: ContextoComando, datos: DatosVehiculo): FilaVehiculo {
  const fila: FilaVehiculo = {
    id: ctx.nuevoId(),
    createdAt: ctx.ahora,
    updatedAt: ctx.ahora,
    deletedAt: null,
    ...datos,
  };
  tx.insert(vehiculos).values(fila).run();
  return fila;
}

/** Edita un Vehículo vigente conservando su `id`, con rastro (solo si algo cambió). */
export function editarVehiculo(
  tx: Transaccion,
  ctx: ContextoComando,
  id: string,
  cambios: DatosVehiculo,
): FilaVehiculo {
  return editarConRastro(tx, ctx, vehiculos, id, cambios);
}

/** Borrado lógico con rastro (AD-4). Lanza `filaNoEncontrada` si no está vigente. */
export function borrarVehiculo(tx: Transaccion, ctx: ContextoComando, id: string): void {
  borrarConRastro(tx, ctx, vehiculos, id);
}
