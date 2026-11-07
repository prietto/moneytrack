import { validarSaldoYColchon } from '@/domain/entrada';

import { editarAjustes, insertarAjustes, leerAjustesVigentes } from '../tablas/ajustes';
import { definirComando } from './definir-comando';

/**
 * Guarda el Saldo real inicial con su fecha y el Colchón (FR4, AD-2, AD-9)
 * en la única fila de `ajustes`: la crea si no existe y si no, la edita con
 * rastro (solo si algo cambió).
 *
 * `hoy` llega como parámetro porque el comando no lee el reloj: la pantalla
 * lo pasa desde `useHoy()`. Con datos inválidos (p. ej. fecha futura, o una
 * fecha nueva demasiado antigua) lanza `datosInvalidos` y hay rollback.
 *
 * Si hubiera más de una fila vigente (no debería), edita la de `createdAt`
 * más antiguo: es la que lee `cargarHechos`.
 */
export function guardarSaldoInicialYColchon({
  monto,
  fecha,
  colchon,
  hoy,
}: {
  monto: number;
  fecha: string;
  colchon: number;
  hoy: string;
}) {
  return definirComando('ajustes.saldoYColchon', (ctx) =>
    ctx.db.transaction((tx) => {
      const [existente] = leerAjustesVigentes(tx);
      const fechaGuardada = existente?.saldoInicialFecha ?? null;
      if (!validarSaldoYColchon({ monto, fecha, colchon }, hoy, fechaGuardada).ok) throw new Error('datosInvalidos');

      const datos = { saldoInicialMonto: monto, saldoInicialFecha: fecha, colchon };
      if (existente) editarAjustes(tx, ctx, existente.id, datos);
      else insertarAjustes(tx, ctx, datos);
    }),
  );
}
