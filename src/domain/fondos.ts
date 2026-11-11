import type { AporteProgramado } from './estado';
import { sumarDias } from './fechas';
import type { FondoProtegido } from './hechos';
import type { Marco } from './obligaciones';
import { ocurrenciasMensuales } from './ocurrencias';

/** Lo que un Fondo protegido configurado aporta al Estado. */
export type ResultadoFondo = {
  /** Saldo actual (en `hoy`): es parte de las Reservas. */
  saldo: number;
  /** Aportes con fecha en `(hoy, hasta]`. */
  aportes: AporteProgramado[];
};

/**
 * Saldo y Aportes programados de un Fondo protegido (AD-2, AD-20). Puro y total.
 *
 * El aporte mensual se acredita en cada fecha **esperada** del Pago 2
 * posterior a la fecha del saldo inicial (`f0`), aunque el Pago esté atrasado
 * (igual que el prorrateo anual). Los créditos `≤ hoy` suman al saldo; los de
 * `(hoy, hasta]` son Aportes programados. Lo no usado se acumula, sin tope.
 *
 * `null` si el fondo no está configurado.
 */
export function resultadoFondo(fondo: FondoProtegido, diaPago2: number, { hoy, hasta }: Marco): ResultadoFondo | null {
  const { aporteMensual, saldoInicial } = fondo;
  if (aporteMensual === null || saldoInicial === null) return null;

  let saldo = saldoInicial.monto;
  const aportes: AporteProgramado[] = [];
  for (const { fecha } of ocurrenciasMensuales(diaPago2, sumarDias(saldoInicial.fecha, 1), hasta)) {
    if (fecha <= hoy) saldo += aporteMensual;
    else if (aporteMensual > 0) aportes.push({ fecha, tipo: 'fondo', fondoId: fondo.id, monto: aporteMensual });
  }
  // H2.1: aquí se restan los Gastos del fondo con fecha en `(f0, hoy]`, en
  // orden (fecha, createdAt).
  return { saldo, aportes };
}

/**
 * Saldo de un Fondo protegido en `hoy` (los créditos con fecha `≤ hoy`), o
 * `null` si no está configurado. Sin Pago 2 no hay créditos: el saldo inicial.
 *
 * Lo usa el formulario para re-anclar el punto de partida en `hoy` al editar:
 * así un aporte nuevo solo rige hacia adelante y el saldo escrito no vuelve a
 * sumar los aportes ya acreditados.
 */
export function saldoFondoEn(fondo: FondoProtegido, diaPago2: number | null, hoy: string): number | null {
  if (fondo.aporteMensual === null || fondo.saldoInicial === null) return null;
  if (diaPago2 === null) return fondo.saldoInicial.monto;
  return resultadoFondo(fondo, diaPago2, { fs: fondo.saldoInicial.fecha, hoy, hasta: hoy })?.saldo ?? null;
}
