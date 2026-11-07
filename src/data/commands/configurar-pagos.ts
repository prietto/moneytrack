import { validarPago } from '@/domain/entrada';
import type { NumeroPago } from '@/domain/hechos';

import { editarPago, insertarPago, leerPagosVigentes } from '../tablas/pagos';
import { definirComando } from './definir-comando';

export type EntradaPago = { dia: number; montoEsperado: number };

/**
 * Guarda el Pago 1 y el Pago 2 en una sola transacción (FR1, AD-3). Si ya
 * existían, los edita conservando su `id` (H2.3 referencia `(pagoId, clave)`)
 * y deja rastro solo si algo cambió.
 *
 * Revalida con `validarPago`: con datos inválidos lanza `datosInvalidos`,
 * hay rollback y `ejecutar` devuelve `fallo`.
 */
export function configurarPagos({ pago1, pago2 }: { pago1: EntradaPago; pago2: EntradaPago }) {
  return definirComando('pagos.configurar', (ctx) =>
    ctx.db.transaction((tx) => {
      const entradas: [NumeroPago, EntradaPago][] = [
        [1, pago1],
        [2, pago2],
      ];
      for (const [, entrada] of entradas) {
        if (!validarPago(entrada).ok) throw new Error('datosInvalidos');
      }

      const vigentes = leerPagosVigentes(tx);
      for (const [numero, { dia, montoEsperado }] of entradas) {
        const existente = vigentes.find((p) => p.numero === numero);
        if (existente) editarPago(tx, ctx, existente.id, { dia, montoEsperado });
        else insertarPago(tx, ctx, { numero, dia, montoEsperado });
      }
    }),
  );
}
