import { esFechaValida, fechaEnMes, mesDe, sumarMeses } from './fechas';

/**
 * Ocurrencias de algo que se repite cada mes el mismo día (AD-5): Pagos,
 * Obligaciones (H1.5) y cuotas (H1.7). No sabe nada de quién se repite.
 */

/** `clave` identifica el mes (`'YYYY-MM'`) o el año (`'YYYY'`); con el id de la definición identifica la ocurrencia. */
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

/**
 * Ocurrencias anuales del mes `mes` (1..12) y día `dia`, con fecha en
 * `[desde, hasta]` (ambos inclusive), en orden. `clave` = `'YYYY'` (AD-5).
 * Si el día no existe ese año (29 de febrero), cae el último día del mes.
 *
 * Total: con `mes` fuera de `1..12`, `dia` fuera de `1..31` o no enteros,
 * fechas inválidas o `desde > hasta`, devuelve `[]`.
 */
export function ocurrenciasAnuales(mes: number, dia: number, desde: string, hasta: string): Ocurrencia[] {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) return [];
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return [];
  if (!esFechaValida(desde) || !esFechaValida(hasta) || desde > hasta) return [];

  const mm = String(mes).padStart(2, '0');
  const ocurrencias: Ocurrencia[] = [];
  for (let anio = Number(desde.slice(0, 4)); ; anio++) {
    const clave = String(anio).padStart(4, '0');
    const fecha = fechaEnMes(`${clave}-${mm}`, dia);
    if (fecha > hasta) break;
    // Solo el primer año puede tener la ocurrencia antes de `desde`.
    if (fecha >= desde) ocurrencias.push({ clave, fecha });
  }
  return ocurrencias;
}
