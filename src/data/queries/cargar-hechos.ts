import { type Hechos, hechosVacios } from '@/domain/hechos';

import type { BaseSincrona } from '../contexto';

/**
 * El único cargador de Hechos (AD-18): la única función que lee tablas para
 * el cálculo. Es sincrónico (drivers sync) y devuelve un objeto nuevo en cada
 * carga.
 *
 * Reglas para las historias que agreguen lecturas:
 * - Solo filas vigentes: toda lectura filtra con `.where(vigentes(tabla))`
 *   (`./vigentes`), que excluye las filas con `deletedAt`.
 * - Nunca lee instantáneas ni historial: `rastro`, `cuadres` ni
 *   `consultas_semaforo`. No son hechos del cálculo.
 *
 * Hoy no hay tablas de hechos: las de saldo inicial y Colchón nacen en H1.4.
 * Tablas que leerá cada historia:
 * - H1.4: Pagos, saldo inicial, Colchón (configuración con fecha, AD-2).
 * - H1.5: Vehículos y Obligaciones.
 * - H1.6: Presupuestos, Fondo Enduro y Categorías.
 * - H1.7: Deudas y Meta.
 * - Épica 2: Gastos e ingresos (movimientos).
 */
export function cargarHechos(_db: BaseSincrona): Hechos {
  return { ...hechosVacios };
}
