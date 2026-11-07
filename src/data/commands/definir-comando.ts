import type { Comando, ContextoComando } from '../contexto';

declare const marca: unique symbol;

/**
 * Un comando fabricado en `data/commands` (AD-3). La marca hace que
 * `ejecutar()` no acepte un objeto `{ operacion, aplicar }` armado en línea:
 * las pantallas solo pueden ejecutar los comandos de `data/commands/*`, y el
 * lint les impide importar este archivo para fabricar uno.
 */
export type ComandoDefinido<T> = Comando<T> & { readonly [marca]: true };

/** `operacion` en forma `capa.accion` (log); `aplicar` abre su propia transacción. */
export function definirComando<T>(operacion: string, aplicar: (ctx: ContextoComando) => T): ComandoDefinido<T> {
  return { operacion, aplicar } as ComandoDefinido<T>;
}
