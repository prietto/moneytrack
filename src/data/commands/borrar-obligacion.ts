import { borrarObligacion as borrarFila } from '../tablas/obligaciones';
import { definirComando } from './definir-comando';

/**
 * Borra una Obligación (borrado lógico con rastro, AD-4). Lanza
 * `filaNoEncontrada` si no está vigente. H2.4 decidirá qué pasa con sus
 * ocurrencias pagadas.
 */
export function borrarObligacion(id: string) {
  return definirComando('obligaciones.borrar', (ctx) => ctx.db.transaction((tx) => borrarFila(tx, ctx, id)));
}
