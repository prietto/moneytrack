import { type DatosCategoria, validarCategoria } from '@/domain/entrada';

import { editarCategoria, insertarCategoria, leerCategoriasVigentes } from '../tablas/categorias';
import { leerFondosVigentes } from '../tablas/fondos';
import { leerPresupuestosVigentes } from '../tablas/presupuestos';
import { definirComando } from './definir-comando';

export type EntradaCategoria = DatosCategoria & { id: string | null };

/**
 * Crea (`id = null`) o edita una categoría (FR8, AD-3, AD-9). Devuelve su `id`.
 *
 * - Revalida contra las categorías (incluidas las de sistema), Presupuestos y
 *   Fondos vigentes: nombre único y enlaces coherentes con la clase. Si falla,
 *   lanza `datosInvalidos` y hay rollback.
 * - Guarda el nombre normalizado. Las nuevas nunca son de sistema.
 * - Al editar conserva el `id` y deja rastro solo si algo cambió. Si no está
 *   vigente lanza `filaNoEncontrada`; si es de sistema, `categoriaDeSistema`.
 */
export function guardarCategoria(entrada: EntradaCategoria) {
  return definirComando('categorias.guardar', (ctx) =>
    ctx.db.transaction((tx) => {
      const existentes = leerCategoriasVigentes(tx);
      if (entrada.id !== null) {
        const fila = existentes.find((c) => c.id === entrada.id);
        if (!fila) throw new Error('filaNoEncontrada');
        if (fila.esSistema) throw new Error('categoriaDeSistema');
      }

      const { id, ...datos } = entrada;
      const validado = validarCategoria(datos, existentes, id, leerPresupuestosVigentes(tx), leerFondosVigentes(tx));
      if (!validado.ok) throw new Error('datosInvalidos');

      if (id === null) return insertarCategoria(tx, ctx, { ...validado.valor, esSistema: false }).id;
      return editarCategoria(tx, ctx, id, validado.valor).id;
    }),
  );
}
