import type { AporteProgramado, OcurrenciaObligacion } from './estado';
import { esFechaValida, sumarDias } from './fechas';
import type { ObligacionAnual, ObligacionDefinida, ObligacionMensual } from './hechos';
import { ocurrenciasAnuales, ocurrenciasMensuales } from './ocurrencias';
import { dividirHaciaArriba } from './redondeo';

/**
 * Obligaciones en el Horizonte (AD-5) y reserva anual (AD-20). Puro y total.
 *
 * Todas las funciones reciben el mismo marco:
 * - `fs`: fecha del saldo inicial. Solo cuentan las ocurrencias con
 *   `fecha > fs` (igual que los Pagos): las anteriores ya salieron del banco.
 * - `hoy` y `hasta` (= hoy + 31, el fin del Horizonte).
 */
export type Marco = { fs: string; hoy: string; hasta: string };

function compararTexto(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function maxFecha(a: string, b: string): string {
  return a > b ? a : b;
}

function minFecha(a: string, b: string): string {
  return a < b ? a : b;
}

/** Orden de `Estado.obligacionesPendientes`: (fechaProyectada, fecha, nombre, obligacionId). */
export function compararOcurrencias(a: OcurrenciaObligacion, b: OcurrenciaObligacion): number {
  return (
    compararTexto(a.fechaProyectada, b.fechaProyectada) ||
    compararTexto(a.fecha, b.fecha) ||
    compararTexto(a.nombre, b.nombre) ||
    compararTexto(a.obligacionId, b.obligacionId)
  );
}

/**
 * Ocurrencias pendientes de una Obligación mensual: las de `(fs, hasta]`. Una
 * con `fecha < hoy` está vencida y se proyecta en `hoy`.
 */
export function ocurrenciasMensualesPendientes(
  o: ObligacionMensual,
  { fs, hoy, hasta }: Marco,
): OcurrenciaObligacion[] {
  // H2.4: aquí se excluye la ocurrencia pagada (o.id, clave).
  return ocurrenciasMensuales(o.dia, sumarDias(fs, 1), hasta).map(({ clave, fecha }) => {
    const vencida = fecha < hoy;
    return {
      obligacionId: o.id,
      tipo: 'mensual',
      nombre: o.nombre,
      clave,
      fecha,
      fechaProyectada: vencida ? hoy : fecha,
      monto: o.monto,
      vencida,
      vehiculoId: null,
      reservaLiberada: 0,
    };
  });
}

/** Lo que una Obligación anual aporta al Estado. */
export type ResultadoAnual = {
  pendientes: OcurrenciaObligacion[];
  /** Reserva actual (en `hoy`, antes de las liberaciones de `hoy`). */
  reserva: number;
  /** Prorrateos con fecha en `(hoy, hasta]`. */
  aportes: AporteProgramado[];
};

/** Un evento de la reserva anual; `orden` desempata en la misma fecha. */
type Evento =
  | { fecha: string; orden: 0; tipo: 'credito' }
  | { fecha: string; orden: 1; tipo: 'reinicio' }
  | { fecha: string; orden: 2; tipo: 'liberacion'; ocurrencia: OcurrenciaObligacion };

/**
 * Ocurrencias pendientes, reserva actual y Aportes programados de una
 * Obligación anual (AD-20). Ver "Algoritmo de la reserva anual" en H1.5:
 *
 * 1. `p = monto ÷ 12` hacia arriba.
 * 2. Créditos: cada fecha esperada del Pago 2 en `(f0, hasta]` (f0 = fecha de
 *    la reserva inicial), aunque el Pago esté atrasado.
 * 3. Cierres: las ocurrencias `o ≥ ancla` hasta `hasta`.
 *    - `f0 < o ≤ fs`: asumida pagada (ya está en el saldo): reinicia la reserva.
 *    - `o > fs`: pendiente, proyectada en `max(o, hoy)`; libera la reserva.
 * 4. En la misma fecha: crédito, luego reinicio, luego liberación.
 *
 * Las ocurrencias `o ≤ min(f0, fs)` no cuentan: ya están dentro del saldo y
 * de la reserva inicial. Si `fs < o ≤ f0` (reserva anotada después de una
 * ocurrencia vencida sin pagar), la ocurrencia es pendiente y libera la
 * reserva, pero no la reinicia antes de `f0`.
 */
export function resultadoAnual(o: ObligacionAnual, diaPago2: number, { fs, hoy, hasta }: Marco): ResultadoAnual {
  const p = dividirHaciaArriba(o.monto, 12);
  const f0 = o.reservaInicial.fecha;
  const eventos: Evento[] = [];

  for (const { fecha } of ocurrenciasMensuales(diaPago2, sumarDias(f0, 1), hasta)) {
    eventos.push({ fecha, orden: 0, tipo: 'credito' });
  }

  const ancla = o.fechaVencimiento;
  if (esFechaValida(ancla)) {
    const mes = Number(ancla.slice(5, 7));
    const dia = Number(ancla.slice(8, 10));
    const desde = maxFecha(ancla, sumarDias(minFecha(f0, fs), 1));
    for (const { clave, fecha } of ocurrenciasAnuales(mes, dia, desde, hasta)) {
      if (fecha <= fs) {
        // Asumida pagada: con `fecha > min(f0, fs)` y `fecha ≤ fs`, también `fecha > f0`.
        eventos.push({ fecha, orden: 1, tipo: 'reinicio' });
        continue;
      }
      // H2.4: aquí se excluye la ocurrencia pagada (o.id, clave), y el pago
      // reinicia la reserva en la fecha del pago.
      const vencida = fecha < hoy;
      const fechaProyectada = vencida ? hoy : fecha;
      eventos.push({
        fecha: fechaProyectada,
        orden: 2,
        tipo: 'liberacion',
        ocurrencia: {
          obligacionId: o.id,
          tipo: 'anual',
          nombre: o.nombre,
          clave,
          fecha,
          fechaProyectada,
          monto: o.monto,
          vencida,
          vehiculoId: o.vehiculoId,
          reservaLiberada: 0,
        },
      });
    }
  }

  eventos.sort((a, b) => compararTexto(a.fecha, b.fecha) || a.orden - b.orden);

  let reserva = o.reservaInicial.monto;
  let reservaActual: number | null = null;
  const pendientes: OcurrenciaObligacion[] = [];
  const aportes: AporteProgramado[] = [];
  for (const evento of eventos) {
    // La reserva actual es la de `hoy` antes de liberar: se toma al llegar al
    // primer evento posterior a hoy o a la primera liberación de hoy.
    if (reservaActual === null && (evento.fecha > hoy || evento.orden === 2)) reservaActual = reserva;
    if (evento.tipo === 'credito') {
      reserva += p;
      if (evento.fecha > hoy)
        aportes.push({ fecha: evento.fecha, tipo: 'prorrateoAnual', obligacionId: o.id, monto: p });
    } else if (evento.tipo === 'reinicio') {
      reserva = 0;
    } else {
      pendientes.push({ ...evento.ocurrencia, reservaLiberada: reserva });
      reserva = 0;
    }
  }

  return { pendientes, reserva: reservaActual ?? reserva, aportes };
}

/** Lo que las Obligaciones aportan al Estado. */
export type ResultadoObligaciones = {
  pendientes: OcurrenciaObligacion[];
  reservasAnuales: { obligacionId: string; reserva: number }[];
  aportes: AporteProgramado[];
};

/** Compone mensuales y anuales, con el orden de `Estado`. */
export function obligacionesEnHorizonte(
  obligaciones: ObligacionDefinida[],
  diaPago2: number,
  marco: Marco,
): ResultadoObligaciones {
  const pendientes: OcurrenciaObligacion[] = [];
  const reservasAnuales: { obligacionId: string; reserva: number }[] = [];
  const aportes: AporteProgramado[] = [];
  for (const o of obligaciones) {
    if (o.tipo === 'mensual') {
      pendientes.push(...ocurrenciasMensualesPendientes(o, marco));
    } else {
      const anual = resultadoAnual(o, diaPago2, marco);
      pendientes.push(...anual.pendientes);
      reservasAnuales.push({ obligacionId: o.id, reserva: anual.reserva });
      aportes.push(...anual.aportes);
    }
  }
  pendientes.sort(compararOcurrencias);
  aportes.sort((a, b) => compararTexto(a.fecha, b.fecha) || compararTexto(a.obligacionId, b.obligacionId));
  return { pendientes, reservasAnuales, aportes };
}
