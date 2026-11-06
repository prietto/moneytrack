/**
 * Hechos (AD-18): todo lo que el cálculo necesita, leído de la base por un
 * único cargador (`data/queries/cargar-hechos.ts`). Solo filas vigentes; nunca
 * instantáneas (Cuadres, consultas del Semáforo) ni `rastro`.
 *
 * Es lo mínimo de H1.3. Cada historia agrega sus campos (Pagos en H1.4,
 * Obligaciones en H1.5, etc.).
 */

/** Punto de partida con fecha (AD-2): el saldo del banco en `fecha`. */
export type SaldoInicial = { monto: number; fecha: string };

export type Hechos = {
  saldoInicial: SaldoInicial | null;
  colchon: number | null;
};

export const hechosVacios: Hechos = { saldoInicial: null, colchon: null };
