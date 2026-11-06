import type { Estado, SaldoDelDia } from './estado';
import { sumarDias } from './fechas';
import type { Hechos } from './hechos';

/** El Horizonte va de `hoy` a `hoy + HORIZONTE_DIAS`, ambos inclusive (AD-5). */
export const HORIZONTE_DIAS = 31;

/**
 * El cálculo único (AD-1, AD-18): de los Hechos y `hoy` salen todas las
 * cifras. Puro y total: no lee el reloj ni la base, no muta `hechos` y no
 * lanza con hechos válidos. Todo monto es entero (AD-7).
 */
export function calcularEstado(hechos: Hechos, hoy: string): Estado {
  const { saldoInicial, colchon } = hechos;
  if (saldoInicial === null || colchon === null) return { tipo: 'sinConfigurar', hoy };

  // Más adelante: + movimientos con fecha >= saldoInicial.fecha y <= hoy (AD-2).
  const saldoCalculado = saldoInicial.monto;

  // Más adelante (H1.4+): + los flujos esperados hasta cada día.
  const saldoProyectado: SaldoDelDia[] = [];
  for (let i = 0; i <= HORIZONTE_DIAS; i++) {
    saldoProyectado.push({ fecha: sumarDias(hoy, i), saldo: saldoCalculado });
  }

  // Estricto `<`: en empate gana el primer día (el "día del faltante" de H1.4).
  let minimo = saldoProyectado[0];
  for (const dia of saldoProyectado) {
    if (dia.saldo < minimo.saldo) minimo = dia;
  }

  return {
    tipo: 'calculado',
    hoy,
    saldoCalculado,
    saldoProyectado,
    minimo: { ...minimo },
    dineroLibre: minimo.saldo - colchon,
  };
}
