import { borrarCategoria as borrarFila, leerCategoriasVigentes } from '../tablas/categorias';
import { definirComando } from './definir-comando';

/**
 * Borra una categoría (borrado lógico con rastro, AD-4). Las de sistema no se
 * borran: lanza `categoriaDeSistema` y hay rollback. Si no está vigente, lanza
 * `filaNoEncontrada`.
 *
 * Los Gastos (Épica 2) conservan su `categoriaId`: sus reglas ya se copiaron
 * al registrarlos (AD-19) y no se reclasifican.
 */
export function borrarCategoria(id: string) {
  return definirComando('categorias.borrar', (ctx) =>
    ctx.db.transaction((tx) => {
      if (leerCategoriasVigentes(tx).find((c) => c.id === id)?.esSistema) throw new Error('categoriaDeSistema');
      borrarFila(tx, ctx, id);
    }),
  );
}
