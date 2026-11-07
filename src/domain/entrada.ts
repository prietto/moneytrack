import { esFechaValida, sumarDias } from './fechas';
import { fallo, ok, type Resultado } from './resultado';

/**
 * Entrada y validación de la configuración (puras). Las pantallas las usan
 * para leer lo que escribe Priettos y mostrar el error junto a su campo; los
 * comandos las repiten como defensa antes de escribir.
 */

/** Dígitos solos, o en grupos de tres separados por punto o espacio. */
const MONTO = /^(\d+|\d{1,3}([. ]\d{3})+)$/;

/**
 * Lee un monto en pesos: `'2.000.000'`, `'2000000'` o `' 2 000 000 '`.
 * Devuelve un entero seguro ≥ 0, o `null` si viene vacío, con letras, comas
 * decimales, signo o más grande que `Number.MAX_SAFE_INTEGER`. Nunca redondea.
 */
export function leerMonto(texto: string): number | null {
  const limpio = texto.trim();
  if (!MONTO.test(limpio)) return null;
  const monto = Number(limpio.replace(/[. ]/g, ''));
  return Number.isSafeInteger(monto) ? monto : null;
}

/** Lee el día del mes: entero de 1 a 31, o `null`. */
export function leerDia(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^\d{1,2}$/.test(limpio)) return null;
  const dia = Number(limpio);
  return dia >= 1 && dia <= 31 ? dia : null;
}

function esDia(dia: number | null): dia is number {
  return dia !== null && Number.isInteger(dia) && dia >= 1 && dia <= 31;
}

function esMonto(monto: number | null): monto is number {
  return monto !== null && Number.isSafeInteger(monto) && monto >= 0;
}

/** El primer error de los campos, en el orden en que se declaran. */
function primero<T, E>(errores: Partial<Record<string, E>>, valor: T): Resultado<T, E> {
  const error = Object.values(errores).find((e) => e !== undefined);
  return error === undefined ? ok(valor) : fallo(error);
}

/* --- Pagos ---------------------------------------------------------------- */

export type DatosPago = { dia: number | null; montoEsperado: number | null };
export type PagoValido = { dia: number; montoEsperado: number };
export type ErrorPago = 'diaInvalido' | 'montoInvalido';

/** Error de cada campo de un Pago; vacío si todo es válido. */
export function erroresPago(datos: DatosPago): { dia?: 'diaInvalido'; montoEsperado?: 'montoInvalido' } {
  const errores: { dia?: 'diaInvalido'; montoEsperado?: 'montoInvalido' } = {};
  if (!esDia(datos.dia)) errores.dia = 'diaInvalido';
  // Un Pago de 0 no es un Pago: el monto esperado debe ser > 0.
  if (!esMonto(datos.montoEsperado) || datos.montoEsperado === 0) errores.montoEsperado = 'montoInvalido';
  return errores;
}

export function validarPago(datos: DatosPago): Resultado<PagoValido, ErrorPago> {
  return primero(erroresPago(datos), { dia: datos.dia as number, montoEsperado: datos.montoEsperado as number });
}

/* --- Saldo inicial y Colchón ---------------------------------------------- */

export type DatosSaldoYColchon = { monto: number | null; fecha: string; colchon: number | null };
export type SaldoYColchonValido = { monto: number; fecha: string; colchon: number };
export type ErrorSaldoYColchon = 'montoInvalido' | 'fechaInvalida' | 'fechaFutura' | 'fechaAntigua' | 'colchonInvalido';

/**
 * Antigüedad máxima de una fecha de saldo nueva. Cada Pago entre esa fecha y
 * hoy cuenta como atrasado (AD-5): una fecha mal tecleada (`2016-…`) inflaría
 * el Dinero libre con años de Pagos. 62 días cubren dos meses de Pagos.
 */
export const ANTIGUEDAD_MAXIMA_SALDO_DIAS = 62;

type ErroresSaldoYColchon = {
  monto?: 'montoInvalido';
  fecha?: 'fechaInvalida' | 'fechaFutura' | 'fechaAntigua';
  colchon?: 'colchonInvalido';
};

/**
 * Error de cada campo; vacío si todo es válido. El saldo y el Colchón se
 * aceptan ≥ 0: la cuenta es de ahorros, sin sobregiro. La fecha del saldo no
 * puede ser posterior a `hoy` ni, si es nueva, más antigua que
 * `ANTIGUEDAD_MAXIMA_SALDO_DIAS`. La `fechaGuardada` se acepta tal cual aunque
 * haya envejecido: así se puede editar solo el Colchón.
 */
export function erroresSaldoYColchon(
  datos: DatosSaldoYColchon,
  hoy: string,
  fechaGuardada: string | null = null,
): ErroresSaldoYColchon {
  const errores: ErroresSaldoYColchon = {};
  if (!esMonto(datos.monto)) errores.monto = 'montoInvalido';
  if (!esFechaValida(datos.fecha)) errores.fecha = 'fechaInvalida';
  else if (datos.fecha > hoy) errores.fecha = 'fechaFutura';
  else if (datos.fecha !== fechaGuardada && datos.fecha < sumarDias(hoy, -ANTIGUEDAD_MAXIMA_SALDO_DIAS)) {
    errores.fecha = 'fechaAntigua';
  }
  if (!esMonto(datos.colchon)) errores.colchon = 'colchonInvalido';
  return errores;
}

export function validarSaldoYColchon(
  datos: DatosSaldoYColchon,
  hoy: string,
  fechaGuardada: string | null = null,
): Resultado<SaldoYColchonValido, ErrorSaldoYColchon> {
  return primero(erroresSaldoYColchon(datos, hoy, fechaGuardada), {
    monto: datos.monto as number,
    fecha: datos.fecha,
    colchon: datos.colchon as number,
  });
}
