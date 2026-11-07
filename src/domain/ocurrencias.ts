import { esFechaValida, fechaEnMes, mesDe, sumarMeses } from './fechas';

/**
 * Ocurrencias de algo que se repite cada mes el mismo día (AD-5): Pagos,
 * Obligaciones (H1.5) y cuotas (H1.7). No sabe nada de quién se repite.
 */

/** `clave` identifica el mes (`'YYYY-MM'`); con el id de la definición identifica la ocurrencia. */
export type Ocurrencia = { clave: string; fecha: string };

/**
 * Ocurrencias mensuales del día `dia`, con fecha en `[desde, hasta]` (ambos
 * inclusive), en orden. Si el día no existe en un mes, cae el último día.
 *
 * Total: con `dia` fuera de `1..31` o no entero, fechas inválidas o
 * `desde > hasta`, devuelve `[]`.
 */
export function ocurrenciasMensuales(dia: number, desde: string, hasta: string): Ocurrencia[] {
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return [];
  if (!esFechaValida(desde) || !esFechaValida(hasta) || desde > hasta) return [];

  const ocurrencias: Ocurrencia[] = [];
  for (let clave = mesDe(desde); ; clave = sumarMeses(clave, 1)) {
    const fecha = fechaEnMes(clave, dia);
    if (fecha > hasta) break;
    // Solo el primer mes puede tener la ocurrencia antes de `desde`.
    if (fecha >= desde) ocurrencias.push({ clave, fecha });
  }
  return ocurrencias;
}
