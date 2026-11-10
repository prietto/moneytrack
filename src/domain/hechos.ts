/**
 * Hechos (AD-18): todo lo que el cálculo necesita, leído de la base por un
 * único cargador (`data/queries/cargar-hechos.ts`). Solo filas vigentes; nunca
 * instantáneas (Cuadres, consultas del Semáforo) ni `rastro`.
 *
 * Cada historia agrega sus campos: Pagos, saldo y Colchón (H1.4); Vehículos y
 * Obligaciones (H1.5); Presupuestos y fondo (H1.6); Deudas y Meta (H1.7).
 */

/** Punto de partida con fecha (AD-2): el saldo del banco en `fecha`. */
export type SaldoInicial = { monto: number; fecha: string };

/** Pago 1 o Pago 2. El Pago 2 es especial: en su fecha se acreditan los Aportes programados (AD-20). */
export type NumeroPago = 1 | 2;

/** Definición de un Pago: llega cada mes el día `dia` (o el último del mes, AD-5). */
export type PagoDefinido = { id: string; numero: NumeroPago; dia: number; montoEsperado: number };

export type Vehiculo = { id: string; nombre: string };

/**
 * Se repite cada mes el día `dia` (o el último del mes, AD-5). Solo la
 * definición: las ocurrencias las genera domain/.
 */
export type ObligacionMensual = { id: string; tipo: 'mensual'; nombre: string; monto: number; dia: number };

/** Se repite cada año en el mes y día de `fechaVencimiento`. Su reserva anual crece con el prorrateo (AD-20). */
export type ObligacionAnual = {
  id: string;
  tipo: 'anual';
  nombre: string;
  monto: number;
  /** `'YYYY-MM-DD'`: ancla; se repite cada año desde aquí, nunca antes. */
  fechaVencimiento: string;
  vehiculoId: string | null;
  /** Punto de partida con fecha (AD-2): lo ya guardado para esta Obligación en `fecha`. */
  reservaInicial: { monto: number; fecha: string };
};

export type ObligacionDefinida = ObligacionMensual | ObligacionAnual;

export type Hechos = {
  saldoInicial: SaldoInicial | null;
  colchon: number | null;
  /** Vigentes, ordenados por `numero`. */
  pagos: PagoDefinido[];
  /** Vigentes, ordenados por creación. */
  vehiculos: Vehiculo[];
  /** Vigentes, ordenadas por creación. */
  obligaciones: ObligacionDefinida[];
};

/**
 * Constante compartida: nadie la muta, y `cargarHechos` devuelve siempre
 * arreglos nuevos en lugar de reutilizar los de `hechosVacios`.
 */
export const hechosVacios: Hechos = { saldoInicial: null, colchon: null, pagos: [], vehiculos: [], obligaciones: [] };
