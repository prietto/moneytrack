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

/* --- Nombres --------------------------------------------------------------- */

/** Largo máximo de un nombre (Vehículo u Obligación), ya normalizado. */
export const NOMBRE_MAXIMO = 40;

/** Quita los espacios de los extremos y colapsa los internos a uno. */
export function normalizarNombre(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ');
}

/** Mismo nombre sin distinguir mayúsculas ni espacios (sin `Intl`: domain/ es puro). */
export function mismoNombre(a: string, b: string): boolean {
  return normalizarNombre(a).toLowerCase() === normalizarNombre(b).toLowerCase();
}

type ErrorNombre = 'nombreVacio' | 'nombreLargo';

function errorNombre(nombre: string): ErrorNombre | undefined {
  const normalizado = normalizarNombre(nombre);
  if (normalizado === '') return 'nombreVacio';
  if (normalizado.length > NOMBRE_MAXIMO) return 'nombreLargo';
  return undefined;
}

/** Monto de una Obligación: entero seguro > 0. */
function esMontoPositivo(monto: number | null): monto is number {
  return esMonto(monto) && monto > 0;
}

/* --- Vehículos ------------------------------------------------------------- */

export type DatosVehiculo = { nombre: string };
export type VehiculoValido = { nombre: string };
export type ErrorVehiculo = ErrorNombre | 'nombreRepetido';

/**
 * Error del nombre de un Vehículo; vacío si es válido. No se repite entre los
 * vigentes (`existentes`); al editar, `idPropio` excluye al mismo Vehículo.
 */
export function erroresVehiculo(
  datos: DatosVehiculo,
  existentes: { id: string; nombre: string }[],
  idPropio: string | null,
): { nombre?: ErrorVehiculo } {
  const error = errorNombre(datos.nombre);
  if (error) return { nombre: error };
  if (existentes.some((v) => v.id !== idPropio && mismoNombre(v.nombre, datos.nombre))) {
    return { nombre: 'nombreRepetido' };
  }
  return {};
}

/** Devuelve el nombre normalizado, o el error. */
export function validarVehiculo(
  datos: DatosVehiculo,
  existentes: { id: string; nombre: string }[],
  idPropio: string | null,
): Resultado<VehiculoValido, ErrorVehiculo> {
  return primero(erroresVehiculo(datos, existentes, idPropio), { nombre: normalizarNombre(datos.nombre) });
}

/* --- Obligación mensual ---------------------------------------------------- */

export type DatosObligacionMensual = { nombre: string; monto: number | null; dia: number | null };
export type ObligacionMensualValida = { nombre: string; monto: number; dia: number };
export type ErrorObligacionMensual = ErrorNombre | 'montoInvalido' | 'diaInvalido';

type ErroresObligacionMensual = { nombre?: ErrorNombre; monto?: 'montoInvalido'; dia?: 'diaInvalido' };

/** Error de cada campo de una Obligación mensual; vacío si todo es válido. */
export function erroresObligacionMensual(datos: DatosObligacionMensual): ErroresObligacionMensual {
  const errores: ErroresObligacionMensual = {};
  const nombre = errorNombre(datos.nombre);
  if (nombre) errores.nombre = nombre;
  if (!esMontoPositivo(datos.monto)) errores.monto = 'montoInvalido';
  if (!esDia(datos.dia)) errores.dia = 'diaInvalido';
  return errores;
}

export function validarObligacionMensual(
  datos: DatosObligacionMensual,
): Resultado<ObligacionMensualValida, ErrorObligacionMensual> {
  return primero(erroresObligacionMensual(datos), {
    nombre: normalizarNombre(datos.nombre),
    monto: datos.monto as number,
    dia: datos.dia as number,
  });
}

/* --- Obligación anual ------------------------------------------------------ */

/**
 * Lo más lejos que puede estar el próximo vencimiento de una Obligación
 * anual: un año y un día (366 cubre los bisiestos).
 */
export const LEJANIA_MAXIMA_VENCIMIENTO_DIAS = 366;

export type DatosObligacionAnual = {
  nombre: string;
  monto: number | null;
  fechaVencimiento: string;
  vehiculoId: string | null;
  reservaMonto: number | null;
  reservaFecha: string;
};
export type ObligacionAnualValida = {
  nombre: string;
  monto: number;
  fechaVencimiento: string;
  vehiculoId: string | null;
  reservaInicial: { monto: number; fecha: string };
};
export type ErrorObligacionAnual =
  | ErrorNombre
  | 'montoInvalido'
  | 'fechaInvalida'
  | 'fechaAntigua'
  | 'fechaLejana'
  | 'fechaFutura'
  | 'vehiculoInvalido'
  | 'reservaInvalida'
  | 'reservaMayorQueMonto';

/** Las fechas guardadas de una anual que se edita: se aceptan aunque envejezcan. */
export type FechasGuardadasAnual = { fechaVencimiento: string; reservaFecha: string };

type ErroresObligacionAnual = {
  nombre?: ErrorNombre;
  monto?: 'montoInvalido';
  fechaVencimiento?: 'fechaInvalida' | 'fechaAntigua' | 'fechaLejana';
  vehiculoId?: 'vehiculoInvalido';
  reservaMonto?: 'reservaInvalida' | 'reservaMayorQueMonto';
  reservaFecha?: 'fechaInvalida' | 'fechaFutura' | 'fechaAntigua';
};

/**
 * Error de cada campo de una Obligación anual; vacío si todo es válido.
 *
 * - La fecha de vencimiento es la próxima (o la vencida sin pagar): no más
 *   antigua que `ANTIGUEDAD_MAXIMA_SALDO_DIAS` ni más lejana que
 *   `LEJANIA_MAXIMA_VENCIMIENTO_DIAS`.
 * - La reserva inicial es un punto de partida con fecha (AD-2): de 0 al monto,
 *   con fecha no futura ni más antigua que `ANTIGUEDAD_MAXIMA_SALDO_DIAS`.
 * - Las fechas `guardada` se aceptan tal cual aunque envejezcan (como el saldo).
 */
export function erroresObligacionAnual(
  datos: DatosObligacionAnual,
  hoy: string,
  guardada: FechasGuardadasAnual | null,
  vehiculosVigentes: { id: string }[],
): ErroresObligacionAnual {
  const errores: ErroresObligacionAnual = {};
  const limiteAntiguo = sumarDias(hoy, -ANTIGUEDAD_MAXIMA_SALDO_DIAS);

  const nombre = errorNombre(datos.nombre);
  if (nombre) errores.nombre = nombre;

  if (!esMontoPositivo(datos.monto)) errores.monto = 'montoInvalido';

  if (!esFechaValida(datos.fechaVencimiento)) errores.fechaVencimiento = 'fechaInvalida';
  else if (datos.fechaVencimiento !== guardada?.fechaVencimiento && datos.fechaVencimiento < limiteAntiguo) {
    errores.fechaVencimiento = 'fechaAntigua';
  } else if (datos.fechaVencimiento > sumarDias(hoy, LEJANIA_MAXIMA_VENCIMIENTO_DIAS)) {
    errores.fechaVencimiento = 'fechaLejana';
  }

  if (datos.vehiculoId !== null && !vehiculosVigentes.some((v) => v.id === datos.vehiculoId)) {
    errores.vehiculoId = 'vehiculoInvalido';
  }

  if (!esMonto(datos.reservaMonto)) errores.reservaMonto = 'reservaInvalida';
  else if (esMontoPositivo(datos.monto) && datos.reservaMonto > datos.monto) {
    errores.reservaMonto = 'reservaMayorQueMonto';
  }

  if (!esFechaValida(datos.reservaFecha)) errores.reservaFecha = 'fechaInvalida';
  else if (datos.reservaFecha > hoy) errores.reservaFecha = 'fechaFutura';
  else if (datos.reservaFecha !== guardada?.reservaFecha && datos.reservaFecha < limiteAntiguo) {
    errores.reservaFecha = 'fechaAntigua';
  }

  return errores;
}

export function validarObligacionAnual(
  datos: DatosObligacionAnual,
  hoy: string,
  guardada: FechasGuardadasAnual | null,
  vehiculosVigentes: { id: string }[],
): Resultado<ObligacionAnualValida, ErrorObligacionAnual> {
  return primero(erroresObligacionAnual(datos, hoy, guardada, vehiculosVigentes), {
    nombre: normalizarNombre(datos.nombre),
    monto: datos.monto as number,
    fechaVencimiento: datos.fechaVencimiento,
    vehiculoId: datos.vehiculoId,
    reservaInicial: { monto: datos.reservaMonto as number, fecha: datos.reservaFecha },
  });
}
