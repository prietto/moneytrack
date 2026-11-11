import { compararTexto } from './comparar';
import type { PresupuestoPendiente } from './estado';
import { esFechaValida, fechaEnMes, mesDe, sumarMeses } from './fechas';
import type { PresupuestoEsencial } from './hechos';

/**
 * Presupuesto esencial pendiente en el Horizonte (Glosario: "se descuenta
 * completo el primer día del mes, o hoy para el mes en curso"). Puro y total.
 *
 * - Mes en curso: en `hoy`, una sola vez (también si `hoy` es día 1).
 * - Cada mes siguiente cuyo día 1 cae en `(hoy, hasta]`: ese día 1. Con `hoy`
 *   el 31 de enero caben el 1 de febrero y el 1 de marzo (32 días).
 * - Un Presupuesto sin monto (`null`) o con monto 0 no descuenta nada.
 *
 * Ordenados por (fecha, presupuestoId). Con fechas inválidas devuelve `[]`.
 */
export function presupuestosPendientes(
  presupuestos: PresupuestoEsencial[],
  { hoy, hasta }: { hoy: string; hasta: string },
): PresupuestoPendiente[] {
  if (!esFechaValida(hoy) || !esFechaValida(hasta) || hoy > hasta) return [];

  const meses: { mes: string; fecha: string }[] = [{ mes: mesDe(hoy), fecha: hoy }];
  for (let k = 1; ; k++) {
    const mes = sumarMeses(mesDe(hoy), k);
    const fecha = fechaEnMes(mes, 1);
    if (fecha > hasta) break;
    meses.push({ mes, fecha });
  }

  const pendientes: PresupuestoPendiente[] = [];
  for (const p of presupuestos) {
    if (p.montoMensual === null || p.montoMensual === 0) continue;
    for (const { mes, fecha } of meses) {
      // H2.1/H2.2: aquí se resta lo consumido del mes (p.id, mes) y se
      // encadenan los adelantos de los meses siguientes (FR-9).
      pendientes.push({ presupuestoId: p.id, mes, fecha, monto: p.montoMensual });
    }
  }
  return pendientes.sort((a, b) => compararTexto(a.fecha, b.fecha) || compararTexto(a.presupuestoId, b.presupuestoId));
}
