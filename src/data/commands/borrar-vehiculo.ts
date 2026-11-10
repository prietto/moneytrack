import { leerObligacionesVigentes } from '../tablas/obligaciones';
import { borrarVehiculo as borrarFila } from '../tablas/vehiculos';
import { definirComando } from './definir-comando';

/**
 * Borra un Vehículo (borrado lógico con rastro, AD-4). Si alguna Obligación
 * vigente lo usa, lanza `vehiculoEnUso` y hay rollback: borrar en cascada
 * sería destructivo y desenlazar en silencio ocultaría el cambio. La pantalla
 * lo detecta antes; esto es la defensa.
 */
export function borrarVehiculo(id: string) {
  return definirComando('vehiculos.borrar', (ctx) =>
    ctx.db.transaction((tx) => {
      if (leerObligacionesVigentes(tx).some((o) => o.vehiculoId === id)) throw new Error('vehiculoEnUso');
      borrarFila(tx, ctx, id);
    }),
  );
}
