/**
 * Fechas de negocio: strings `YYYY-MM-DD` (fecha civil, sin hora ni zona).
 *
 * domain/ no puede usar `Date` ni `Intl` (AD-1), así que la aritmética es
 * entera: la fecha civil se convierte en un número de día desde 1970-01-01
 * con los algoritmos `days_from_civil` y `civil_from_days` de Howard Hinnant
 * (https://howardhinnant.github.io/date_algorithms.html).
 *
 * Para comparar dos fechas basta `<` / `>` entre strings: el formato ordena bien.
 */

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;

function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

/** Días del mes `mes` (1..12) de `anio`, con bisiestos. */
export function diasDelMes(anio: number, mes: number): number {
  if (mes === 2) return esBisiesto(anio) ? 29 : 28;
  return mes === 4 || mes === 6 || mes === 9 || mes === 11 ? 30 : 31;
}

function partes(fecha: string): [number, number, number] | null {
  const m = FORMATO.exec(fecha);
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > diasDelMes(anio, mes)) return null;
  return [anio, mes, dia];
}

/** Formato estricto `YYYY-MM-DD` y día existente (bisiestos incluidos). */
export function esFechaValida(texto: string): boolean {
  return partes(texto) !== null;
}

/** Días desde 1970-01-01 (Hinnant, `days_from_civil`). */
function aNumeroDeDia(anio: number, mes: number, dia: number): number {
  const a = mes <= 2 ? anio - 1 : anio;
  const era = Math.floor(a / 400);
  const anioDeEra = a - era * 400; // [0, 399]
  const diaDelAnio = Math.floor((153 * (mes + (mes > 2 ? -3 : 9)) + 2) / 5) + dia - 1; // [0, 365]
  const diaDeEra = anioDeEra * 365 + Math.floor(anioDeEra / 4) - Math.floor(anioDeEra / 100) + diaDelAnio; // [0, 146096]
  return era * 146097 + diaDeEra - 719468;
}

/** Fecha civil desde días desde 1970-01-01 (Hinnant, `civil_from_days`). */
function desdeNumeroDeDia(numero: number): string {
  const z = numero + 719468;
  const era = Math.floor(z / 146097);
  const diaDeEra = z - era * 146097; // [0, 146096]
  const anioDeEra = Math.floor(
    (diaDeEra - Math.floor(diaDeEra / 1460) + Math.floor(diaDeEra / 36524) - Math.floor(diaDeEra / 146096)) / 365,
  ); // [0, 399]
  const diaDelAnio = diaDeEra - (365 * anioDeEra + Math.floor(anioDeEra / 4) - Math.floor(anioDeEra / 100)); // [0, 365]
  const mp = Math.floor((5 * diaDelAnio + 2) / 153); // [0, 11]
  const dia = diaDelAnio - Math.floor((153 * mp + 2) / 5) + 1; // [1, 31]
  const mes = mp < 10 ? mp + 3 : mp - 9; // [1, 12]
  const anio = anioDeEra + era * 400 + (mes <= 2 ? 1 : 0);
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/**
 * Número de día de una fecha. Una fecha inválida no lanza (domain/ es total):
 * se trata como NaN, y quien llama debe validar con `esFechaValida` antes.
 */
function numeroDeDia(fecha: string): number {
  const p = partes(fecha);
  return p ? aNumeroDeDia(p[0], p[1], p[2]) : NaN;
}

/** Fecha `n` días después (o antes, con `n` negativo). `n` debe ser entero. */
export function sumarDias(fecha: string, n: number): string {
  return desdeNumeroDeDia(numeroDeDia(fecha) + n);
}

/** Días de `desde` a `hasta`, con signo: positivo si `hasta` es posterior. */
export function diasEntre(desde: string, hasta: string): number {
  return numeroDeDia(hasta) - numeroDeDia(desde);
}

/* --- Meses (AD-5): claves `YYYY-MM` -------------------------------------- */

const FORMATO_MES = /^(\d{4})-(\d{2})$/;

function dos(n: number): string {
  return String(n).padStart(2, '0');
}

/** Clave `'YYYY-MM'` del mes de una fecha `YYYY-MM-DD`. */
export function mesDe(fecha: string): string {
  return fecha.slice(0, 7);
}

/** Año y mes de una clave `'YYYY-MM'`, o null si no es válida. */
function partesMes(clave: string): [number, number] | null {
  const m = FORMATO_MES.exec(clave);
  if (!m) return null;
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return [Number(m[1]), mes];
}

/**
 * Suma `n` meses (entero, puede ser negativo) a una clave `'YYYY-MM'`. Con
 * una clave inválida devuelve `''` (domain/ es total; quien llama valida).
 */
export function sumarMeses(clave: string, n: number): string {
  const p = partesMes(clave);
  if (!p || !Number.isInteger(n)) return '';
  // Meses desde el año 0, con piso para que los negativos cuadren.
  const total = p[0] * 12 + (p[1] - 1) + n;
  const anio = Math.floor(total / 12);
  const mes = total - anio * 12 + 1;
  return `${String(anio).padStart(4, '0')}-${dos(mes)}`;
}

/**
 * Fecha del día `dia` en el mes `clave`. Si ese día no existe en el mes, cae
 * el último día del mes (AD-5): sin ajuste por fines de semana. Con una clave
 * inválida devuelve `''`.
 */
export function fechaEnMes(clave: string, dia: number): string {
  const p = partesMes(clave);
  if (!p) return '';
  return `${clave}-${dos(Math.min(dia, diasDelMes(p[0], p[1])))}`;
}
