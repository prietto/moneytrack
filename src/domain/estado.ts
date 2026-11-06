/**
 * Estado (AD-18): el resultado de `calcularEstado(hechos, hoy)`. Todas las
 * cifras de la app salen de aquí.
 *
 * Saldo calculado y Dinero libre nunca son aproximados (AD-1): son números
 * enteros, sin `{valor, aproximado}`.
 */

export type SaldoDelDia = { fecha: string; saldo: number };

export type Estado =
  /** Falta configuración mínima: no hay cifras (nada inventado). */
  | { tipo: 'sinConfigurar'; hoy: string }
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
    };
