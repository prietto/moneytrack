import type { Categoria } from './hechos';

/**
 * `true` si alguna categoría que pide Vehículo apunta a ese Presupuesto: es
 * el de mantenimiento de vehículos, cuyo monto debe incluir el combustible.
 * Sale de los datos, no de un id fijo (AD-9).
 */
export function esPresupuestoDeVehiculos(presupuestoId: string, categorias: Categoria[]): boolean {
  return categorias.some((c) => c.requiereVehiculo && c.presupuestoId === presupuestoId);
}
