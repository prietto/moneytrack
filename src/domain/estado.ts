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

/** Una ocurrencia pendiente de una Obligación (AD-5). */
export type OcurrenciaObligacion = {
  obligacionId: string;
  tipo: 'mensual' | 'anual';
  nombre: string;
  /** `'YYYY-MM'` o `'YYYY'` (AD-5): con `obligacionId` identifica la ocurrencia que cerrará H2.4. */
  clave: string;
  /** Fecha de vencimiento de la ocurrencia. */
  fecha: string;
  /** `fecha`, o `hoy` si está vencida. */
  fechaProyectada: string;
  monto: number;
  vencida: boolean;
  vehiculoId: string | null;
  /** Anual: la reserva que se libera al proyectarla (AD-20). Mensual: 0. */
  reservaLiberada: number;
};

/** Un Aporte programado (AD-20): dinero que se aparta en una fecha futura del Horizonte. */
export type AporteProgramado = { fecha: string; tipo: 'prorrateoAnual'; obligacionId: string; monto: number };
// H1.6 agrega 'fondo' y H1.7 'meta' a `tipo`.

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
      /** Las que entran en la proyección, ordenadas por (fechaProyectada, fecha, nombre, obligacionId). */
      obligacionesPendientes: OcurrenciaObligacion[];
      /** El subconjunto con `vencida` (AD-1: "Obligaciones vencidas"), en el mismo orden. */
      obligacionesVencidas: OcurrenciaObligacion[];
      /**
       * Reservas actuales (en `hoy`), restadas del Saldo proyectado desde el
       * primer día. H1.6 suma el fondo y H1.7 la Meta.
       */
      reservas: { anual: number; total: number };
      /** La reserva actual de cada Obligación anual, en el orden de los hechos. */
      reservasAnuales: { obligacionId: string; reserva: number }[];
      /** En `(hoy, hoy+31]`, ordenados por (fecha, obligacionId). */
      aportesProgramados: AporteProgramado[];
    };
