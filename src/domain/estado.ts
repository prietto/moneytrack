import type { NumeroPago } from './hechos';

/**
 * Estado (AD-18): el resultado de `calcularEstado(hechos, hoy)`. Todas las
 * cifras de la app salen de aquí.
 *
 * Saldo calculado y Dinero libre nunca son aproximados (AD-1): son números
 * enteros, sin `{valor, aproximado}`.
 */

export type SaldoDelDia = { fecha: string; saldo: number };

/** Lo que falta para poder calcular, en este orden. */
export type Faltante = 'pagos' | 'saldoInicial' | 'colchon';

/** Una ocurrencia esperada y no confirmada de un Pago (AD-5). */
export type OcurrenciaPago = {
  pagoId: string;
  numero: NumeroPago;
  /** `'YYYY-MM'`: con `pagoId` identifica la ocurrencia que confirmará H2.3. */
  clave: string;
  /** Fecha esperada. */
  fecha: string;
  /** `fecha`, o `hoy` si está atrasado. */
  fechaProyectada: string;
  /** Monto esperado. */
  monto: number;
  pagoAtrasado: boolean;
};

export type Estado =
  /** Falta configuración mínima: no hay cifras (nada inventado). `faltan` no está vacío. */
  | { tipo: 'sinConfigurar'; hoy: string; faltan: Faltante[] }
  | {
      tipo: 'calculado';
      hoy: string;
      saldoCalculado: number;
      /** 32 entradas: de `hoy` a `hoy + 31`, en orden (el Horizonte, AD-5). */
      saldoProyectado: SaldoDelDia[];
      /** El menor Saldo proyectado; en empate, el día más temprano. */
      minimo: SaldoDelDia;
      /** `minimo.saldo − colchon`. Puede ser negativo. */
      dineroLibre: number;
      /** Las que entran en la proyección, ordenadas por (fechaProyectada, numero, fecha). */
      pagosEsperados: OcurrenciaPago[];
      /** El subconjunto con `pagoAtrasado` (AD-1: "Pagos atrasados"), en el mismo orden. */
      pagosAtrasados: OcurrenciaPago[];
    };
