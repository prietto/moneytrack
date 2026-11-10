import { validarObligacionAnual, validarObligacionMensual } from '@/domain/entrada';

import type { Transaccion } from '../contexto';
import {
  type DatosObligacion,
  editarObligacion,
  insertarObligacion,
  leerObligacionesVigentes,
} from '../tablas/obligaciones';
import { leerVehiculosVigentes } from '../tablas/vehiculos';
import { definirComando } from './definir-comando';

export type EntradaObligacion =
  | { id: string | null; tipo: 'mensual'; nombre: string; monto: number; dia: number }
  | {
      id: string | null;
      tipo: 'anual';
      nombre: string;
      monto: number;
      fechaVencimiento: string;
      vehiculoId: string | null;
      reservaInicial: { monto: number; fecha: string };
    };

/** Las columnas de la fila, con `null` en las que no son del tipo. Lanza `datosInvalidos`. */
function datosValidados(
  tx: Transaccion,
  entrada: EntradaObligacion,
  hoy: string,
  guardada: { fechaVencimiento: string; reservaFecha: string } | null,
): DatosObligacion {
  if (entrada.tipo === 'mensual') {
    const validado = validarObligacionMensual(entrada);
    if (!validado.ok) throw new Error('datosInvalidos');
    return {
      tipo: 'mensual',
      ...validado.valor,
      fechaVencimiento: null,
      vehiculoId: null,
      reservaInicialMonto: null,
      reservaInicialFecha: null,
    };
  }
  const validado = validarObligacionAnual(
    {
      nombre: entrada.nombre,
      monto: entrada.monto,
      fechaVencimiento: entrada.fechaVencimiento,
      vehiculoId: entrada.vehiculoId,
      reservaMonto: entrada.reservaInicial.monto,
      reservaFecha: entrada.reservaInicial.fecha,
    },
    hoy,
    guardada,
    leerVehiculosVigentes(tx),
  );
  if (!validado.ok) throw new Error('datosInvalidos');
  const { nombre, monto, fechaVencimiento, vehiculoId, reservaInicial } = validado.valor;
  return {
    tipo: 'anual',
    nombre,
    monto,
    dia: null,
    fechaVencimiento,
    vehiculoId,
    reservaInicialMonto: reservaInicial.monto,
    reservaInicialFecha: reservaInicial.fecha,
  };
}

/**
 * Crea (`id = null`) o edita una Obligación mensual o anual (FR3, AD-3, AD-5).
 * Devuelve su `id`. Solo guarda la definición (AD-2).
 *
 * - Revalida con la función de su tipo; la anual comprueba que el Vehículo
 *   esté vigente y, al editar, acepta las fechas guardadas aunque envejezcan.
 *   Si falla, lanza `datosInvalidos` y hay rollback.
 * - Al editar conserva el `id` y deja rastro solo si algo cambió. Si no está
 *   vigente lanza `filaNoEncontrada`; si cambia el tipo, `tipoNoEditable`.
 * - `hoy` llega como parámetro: el comando no lee el reloj.
 */
export function guardarObligacion(entrada: EntradaObligacion, hoy: string) {
  return definirComando('obligaciones.guardar', (ctx) =>
    ctx.db.transaction((tx) => {
      if (entrada.id === null) return insertarObligacion(tx, ctx, datosValidados(tx, entrada, hoy, null)).id;

      const fila = leerObligacionesVigentes(tx).find((o) => o.id === entrada.id);
      if (!fila) throw new Error('filaNoEncontrada');
      if (fila.tipo !== entrada.tipo) throw new Error('tipoNoEditable');
      const guardada =
        fila.fechaVencimiento !== null && fila.reservaInicialFecha !== null
          ? { fechaVencimiento: fila.fechaVencimiento, reservaFecha: fila.reservaInicialFecha }
          : null;
      const { tipo: _tipo, ...cambios } = datosValidados(tx, entrada, hoy, guardada);
      return editarObligacion(tx, ctx, fila.id, cambios).id;
    }),
  );
}
