import type { Estado, Faltante, OcurrenciaPago, SaldoDelDia } from './estado';
import { sumarDias } from './fechas';
import type { Hechos, PagoDefinido } from './hechos';
import { obligacionesEnHorizonte } from './obligaciones';
import { ocurrenciasMensuales } from './ocurrencias';

/** El Horizonte va de `hoy` a `hoy + HORIZONTE_DIAS`, ambos inclusive (AD-5). */
export const HORIZONTE_DIAS = 31;

/** Lo que falta para calcular, en el orden de `Faltante`. */
function faltantes(hechos: Hechos, hoy: string): Faltante[] {
  const faltan: Faltante[] = [];
  const numeros = new Set(hechos.pagos.map((p) => p.numero));
  if (!numeros.has(1) || !numeros.has(2)) faltan.push('pagos');
  // Un saldo con fecha futura (reloj que retrocede) no sirve: nunca hay cifras
  // de antes del punto de partida (AD-2).
  if (hechos.saldoInicial === null || hechos.saldoInicial.fecha > hoy) faltan.push('saldoInicial');
  if (hechos.colchon === null) faltan.push('colchon');
  return faltan;
}

/**
 * Ocurrencias esperadas de los Pagos (AD-5): las posteriores al punto de
 * partida (`fecha > saldoInicial.fecha`: en la duda, no se suma, AD-7) y
 * hasta el fin del Horizonte. Las vencidas sin confirmar se proyectan en
 * `hoy` como Pago atrasado.
 */
function ocurrenciasDePagos(pagos: PagoDefinido[], desdeExclusivo: string, hoy: string): OcurrenciaPago[] {
  const hasta = sumarDias(hoy, HORIZONTE_DIAS);
  const ocurrencias: OcurrenciaPago[] = [];
  for (const pago of pagos) {
    for (const { clave, fecha } of ocurrenciasMensuales(pago.dia, sumarDias(desdeExclusivo, 1), hasta)) {
      // H2.3: aquí se excluye la ocurrencia confirmada (pago.id, clave).
      const pagoAtrasado = fecha < hoy;
      ocurrencias.push({
        pagoId: pago.id,
        numero: pago.numero,
        clave,
        fecha,
        fechaProyectada: pagoAtrasado ? hoy : fecha,
        monto: pago.montoEsperado,
        pagoAtrasado,
      });
    }
  }
  return ocurrencias.sort(
    (a, b) =>
      compararTexto(a.fechaProyectada, b.fechaProyectada) || a.numero - b.numero || compararTexto(a.fecha, b.fecha),
  );
}

function compararTexto(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * El cálculo único (AD-1, AD-18): de los Hechos y `hoy` salen todas las
 * cifras. Puro y total: no lee el reloj ni la base, no muta `hechos` y no
 * lanza con hechos válidos. Todo monto es entero (AD-7).
 */
export function calcularEstado(hechos: Hechos, hoy: string): Estado {
  const faltan = faltantes(hechos, hoy);
  const { saldoInicial, colchon } = hechos;
  if (faltan.length > 0 || saldoInicial === null || colchon === null) return { tipo: 'sinConfigurar', hoy, faltan };

  // Épica 2: + movimientos con fecha > saldoInicial.fecha y <= hoy (AD-2).
  const saldoCalculado = saldoInicial.monto;

  const pagosEsperados = ocurrenciasDePagos(hechos.pagos, saldoInicial.fecha, hoy);

  // `faltantes` garantiza el Pago 2: en su fecha se acreditan los prorrateos (AD-20).
  const diaPago2 = hechos.pagos.find((p) => p.numero === 2)?.dia ?? 0;
  const obligaciones = obligacionesEnHorizonte(hechos.obligaciones, diaPago2, {
    fs: saldoInicial.fecha,
    hoy,
    hasta: sumarDias(hoy, HORIZONTE_DIAS),
  });
  const reservaAnual = obligaciones.reservasAnuales.reduce((suma, r) => suma + r.reserva, 0);
  const reservas = { anual: reservaAnual, total: reservaAnual };

  // Flujo esperado por fecha proyectada; luego un solo recorrido acumulando.
  const flujoPorDia = new Map<string, number>();
  const sumar = (fecha: string, monto: number) => flujoPorDia.set(fecha, (flujoPorDia.get(fecha) ?? 0) + monto);
  for (const p of pagosEsperados) sumar(p.fechaProyectada, p.monto);
  for (const o of obligaciones.pendientes) sumar(o.fechaProyectada, o.reservaLiberada - o.monto);
  for (const a of obligaciones.aportes) sumar(a.fecha, -a.monto);

  const saldoProyectado: SaldoDelDia[] = [];
  // Las Reservas actuales no están disponibles desde el primer día.
  let acumulado = saldoCalculado - reservas.total;
  for (let i = 0; i <= HORIZONTE_DIAS; i++) {
    const fecha = sumarDias(hoy, i);
    acumulado += flujoPorDia.get(fecha) ?? 0;
    saldoProyectado.push({ fecha, saldo: acumulado });
  }

  // Estricto `<`: en empate gana el primer día (el "día del faltante").
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
    pagosEsperados,
    pagosAtrasados: pagosEsperados.filter((p) => p.pagoAtrasado),
    obligacionesPendientes: obligaciones.pendientes,
    obligacionesVencidas: obligaciones.pendientes.filter((o) => o.vencida),
    reservas,
    reservasAnuales: obligaciones.reservasAnuales,
    aportesProgramados: obligaciones.aportes,
  };
}
