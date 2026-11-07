import { asc } from 'drizzle-orm';

import type { Hechos, NumeroPago, PagoDefinido } from '@/domain/hechos';

import type { BaseSincrona } from '../contexto';
import { ajustes, pagos } from '../schema';
import { vigentes } from './vigentes';

function esNumeroPago(numero: number): numero is NumeroPago {
  return numero === 1 || numero === 2;
}

/**
 * El único cargador de Hechos (AD-18): la única función que lee tablas para
 * el cálculo. Es sincrónico (drivers sync) y devuelve un objeto y arreglos
 * nuevos en cada carga (nunca los de `hechosVacios`).
 *
 * Reglas para las historias que agreguen lecturas:
 * - Solo filas vigentes: toda lectura filtra con `.where(vigentes(tabla))`
 *   (`./vigentes`), que excluye las filas con `deletedAt`.
 * - Nunca lee instantáneas ni historial: `rastro`, `cuadres` ni
 *   `consultas_semaforo`. No son hechos del cálculo.
 *
 * Tablas que lee cada historia:
 * - H1.4: `pagos` y `ajustes` (saldo inicial y Colchón: configuración con fecha, AD-2).
 * - H1.5: Vehículos y Obligaciones.
 * - H1.6: Presupuestos, Fondo Enduro y Categorías.
 * - H1.7: Deudas y Meta.
 * - Épica 2: Gastos e ingresos (movimientos).
 */
export function cargarHechos(db: BaseSincrona): Hechos {
  const pagosDefinidos: PagoDefinido[] = [];
  for (const fila of db.select().from(pagos).where(vigentes(pagos)).orderBy(asc(pagos.numero)).all()) {
    // Defensa para que el tipo sea honesto: un número fuera de 1|2 se descarta.
    if (!esNumeroPago(fila.numero)) continue;
    pagosDefinidos.push({ id: fila.id, numero: fila.numero, dia: fila.dia, montoEsperado: fila.montoEsperado });
  }

  // Una sola fila vigente; si hubiera más, la más antigua (igual que el comando que la escribe).
  const fila = db
    .select()
    .from(ajustes)
    .where(vigentes(ajustes))
    .orderBy(asc(ajustes.createdAt), asc(ajustes.id))
    .limit(1)
    .get();

  const saldoInicial =
    fila?.saldoInicialMonto != null && fila.saldoInicialFecha != null
      ? { monto: fila.saldoInicialMonto, fecha: fila.saldoInicialFecha }
      : null;

  return { saldoInicial, colchon: fila?.colchon ?? null, pagos: pagosDefinidos };
}
