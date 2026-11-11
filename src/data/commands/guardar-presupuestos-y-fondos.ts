import { validarFondo, validarPresupuesto } from '@/domain/entrada';

import { editarFondo, leerFondosVigentes } from '../tablas/fondos';
import { editarPresupuesto, leerPresupuestosVigentes } from '../tablas/presupuestos';
import { definirComando } from './definir-comando';

export type EntradaPresupuestosYFondos = {
  presupuestos: { id: string; montoMensual: number }[];
  fondos: { id: string; aporteMensual: number; saldoInicial: { monto: number; fecha: string } }[];
};

/**
 * Guarda en una sola transacción el monto mensual de cada Presupuesto
 * esencial y, por cada Fondo protegido, el aporte mensual y el saldo inicial
 * con fecha (FR3, FR4, AD-2, AD-3).
 *
 * - Cada `id` debe estar vigente: si no, `filaNoEncontrada`.
 * - Revalida con `domain/`; la fecha guardada del fondo se acepta aunque
 *   envejezca. Si algo falla lanza `datosInvalidos` y hay rollback de todo.
 * - Edita con rastro cada fila; las que no cambian no dejan rastro.
 * - `hoy` llega como parámetro: el comando no lee el reloj.
 */
export function guardarPresupuestosYFondos(entrada: EntradaPresupuestosYFondos, hoy: string) {
  return definirComando('presupuestosYFondos.guardar', (ctx) =>
    ctx.db.transaction((tx) => {
      const presupuestosVigentes = leerPresupuestosVigentes(tx);
      for (const p of entrada.presupuestos) {
        if (!presupuestosVigentes.some((v) => v.id === p.id)) throw new Error('filaNoEncontrada');
        if (!validarPresupuesto({ montoMensual: p.montoMensual }).ok) throw new Error('datosInvalidos');
        editarPresupuesto(tx, ctx, p.id, { montoMensual: p.montoMensual });
      }

      const fondosVigentes = leerFondosVigentes(tx);
      for (const f of entrada.fondos) {
        const fila = fondosVigentes.find((v) => v.id === f.id);
        if (!fila) throw new Error('filaNoEncontrada');
        const validado = validarFondo(
          { aporteMensual: f.aporteMensual, saldoMonto: f.saldoInicial.monto, saldoFecha: f.saldoInicial.fecha },
          hoy,
          fila.saldoInicialFecha,
        );
        if (!validado.ok) throw new Error('datosInvalidos');
        const { aporteMensual, saldoInicial } = validado.valor;
        editarFondo(tx, ctx, f.id, {
          aporteMensual,
          saldoInicialMonto: saldoInicial.monto,
          saldoInicialFecha: saldoInicial.fecha,
        });
      }
    }),
  );
}
