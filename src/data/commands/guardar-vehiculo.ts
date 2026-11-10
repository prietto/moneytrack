import { validarVehiculo } from '@/domain/entrada';

import { editarVehiculo, insertarVehiculo, leerVehiculosVigentes } from '../tablas/vehiculos';
import { definirComando } from './definir-comando';

/**
 * Crea (`id = null`) o edita un Vehículo (FR5, AD-3). Devuelve su `id`.
 *
 * Revalida con `validarVehiculo` contra los vigentes: nombre no vacío, de
 * hasta 40 caracteres y no repetido. Si falla, lanza `datosInvalidos` y hay
 * rollback. Guarda el nombre normalizado. Al editar conserva el `id` y deja
 * rastro solo si algo cambió; si el Vehículo no está vigente, lanza
 * `filaNoEncontrada`.
 */
export function guardarVehiculo({ id, nombre }: { id: string | null; nombre: string }) {
  return definirComando('vehiculos.guardar', (ctx) =>
    ctx.db.transaction((tx) => {
      const validado = validarVehiculo({ nombre }, leerVehiculosVigentes(tx), id);
      if (!validado.ok) throw new Error('datosInvalidos');
      if (id === null) return insertarVehiculo(tx, ctx, validado.valor).id;
      return editarVehiculo(tx, ctx, id, validado.valor).id;
    }),
  );
}
