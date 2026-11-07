/**
 * Hechos (AD-18): todo lo que el cálculo necesita, leído de la base por un
 * único cargador (`data/queries/cargar-hechos.ts`). Solo filas vigentes; nunca
 * instantáneas (Cuadres, consultas del Semáforo) ni `rastro`.
 *
 * Cada historia agrega sus campos (Obligaciones en H1.5, etc.).
 */

/** Punto de partida con fecha (AD-2): el saldo del banco en `fecha`. */
export type SaldoInicial = { monto: number; fecha: string };

/** Pago 1 o Pago 2. El Pago 2 es especial: en su fecha se acreditan los Aportes programados (AD-20). */
export type NumeroPago = 1 | 2;

/** Definición de un Pago: llega cada mes el día `dia` (o el último del mes, AD-5). */
export type PagoDefinido = { id: string; numero: NumeroPago; dia: number; montoEsperado: number };

export type Hechos = {
  saldoInicial: SaldoInicial | null;
  colchon: number | null;
  /** Vigentes, ordenados por `numero`. */
  pagos: PagoDefinido[];
};

/**
 * Constante compartida: nadie la muta, y `cargarHechos` devuelve siempre
 * arreglos nuevos en lugar de reutilizar `hechosVacios.pagos`.
 */
export const hechosVacios: Hechos = { saldoInicial: null, colchon: null, pagos: [] };
