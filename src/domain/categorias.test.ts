import { esPresupuestoDeVehiculos } from './categorias';
import type { Categoria } from './hechos';

function categoria(cambios: Partial<Categoria>): Categoria {
  return {
    id: 'c',
    nombre: 'C',
    claseDefault: 'esencial',
    presupuestoId: null,
    fondoId: null,
    requiereVehiculo: false,
    esSistema: false,
    ...cambios,
  };
}

describe('esPresupuestoDeVehiculos', () => {
  it('C1. verdadero si una categoría con Vehículo apunta al Presupuesto', () => {
    const categorias = [
      categoria({ id: 'mercado', presupuestoId: 'comida' }),
      categoria({ id: 'combustible', presupuestoId: 'mant', requiereVehiculo: true }),
    ];
    expect(esPresupuestoDeVehiculos('mant', categorias)).toBe(true);
    expect(esPresupuestoDeVehiculos('comida', categorias)).toBe(false);
  });

  it('C1. falso si la única categoría que apunta no requiere Vehículo', () => {
    expect(esPresupuestoDeVehiculos('mant', [categoria({ presupuestoId: 'mant' })])).toBe(false);
    expect(esPresupuestoDeVehiculos('mant', [])).toBe(false);
  });
});
