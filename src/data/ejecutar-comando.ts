import { randomUUID } from 'expo-crypto';

import { fallo, ok, type Resultado } from '@/domain/resultado';

import { avisarCambio } from './cambios';
import type { Comando, ContextoComando } from './contexto';
import { obtenerDb } from './db';

export type ErrorComando = { codigo: 'fallo'; causa: unknown };

function esPromesa(valor: unknown): valor is PromiseLike<unknown> {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof (valor as { then?: unknown }).then === 'function'
  );
}

/**
 * Ejecuta un comando (AD-3, AD-18): arma el contexto, lo aplica y, si hace
 * commit, avisa el cambio para que `useHechos` recargue.
 *
 * La transacción la abre el propio comando; si lanza dentro de
 * `db.transaction`, drizzle hace ROLLBACK y aquí se devuelve `fallo` sin avisar.
 *
 * No registra el error: data/ no importa services/. Lo registra
 * `hooks/use-comando`, que es lo que usan las pantallas.
 */
export function ejecutarComando<T>(
  comando: Comando<T>,
  opciones: Partial<ContextoComando> = {},
): Resultado<T, ErrorComando> {
  let valor: T;
  try {
    // Dentro del try: un fallo al abrir la base también es un fallo del comando.
    const ctx: ContextoComando = {
      db: opciones.db ?? obtenerDb(),
      ahora: opciones.ahora ?? new Date().toISOString(),
      nuevoId: opciones.nuevoId ?? randomUUID,
    };
    valor = comando.aplicar(ctx);
  } catch (causa) {
    return fallo({ codigo: 'fallo', causa });
  }
  if (esPromesa(valor)) {
    // `aplicar` debe ser sincrónico: con una promesa no se sabe si hubo commit.
    // Se silencia su rechazo para que no quede sin controlar; el fallo ya lo informa.
    valor.then(undefined, () => {});
    return fallo({ codigo: 'fallo', causa: new Error('comandoAsincrono') });
  }
  // Fuera del try: el commit ya ocurrió. avisarCambio no lanza, así que un
  // oyente roto no convierte el commit en un fallo.
  avisarCambio();
  return ok(valor);
}
