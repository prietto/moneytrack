/** @jest-environment node */
import type { ContextoComando } from '../contexto';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { rastro, vehiculos } from '../schema';
import { borrarVehiculo, editarVehiculo, insertarVehiculo, leerVehiculosVigentes } from './vehiculos';

const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  let n = 0;
  const ctx: ContextoComando = { db: base.db, ahora: AHORA, nuevoId: () => `id-${++n}` };
  return { ...base, ctx, ctx2: { ...ctx, ahora: DESPUES } };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

describe('tablas/vehiculos', () => {
  it('insertarVehiculo guarda la fila y leerVehiculosVigentes las da en orden de creación', () => {
    const { db, ctx, ctx2 } = preparar();
    db.transaction((tx) => insertarVehiculo(tx, ctx2, { nombre: 'Carro' }));
    db.transaction((tx) => insertarVehiculo(tx, ctx, { nombre: 'Moto azul' }));
    expect(db.transaction((tx) => leerVehiculosVigentes(tx))).toEqual([
      { id: 'id-2', createdAt: AHORA, updatedAt: AHORA, deletedAt: null, nombre: 'Moto azul' },
      { id: 'id-1', createdAt: DESPUES, updatedAt: DESPUES, deletedAt: null, nombre: 'Carro' },
    ]);
  });

  it('editarVehiculo conserva el id y deja rastro', () => {
    const { db, ctx, ctx2 } = preparar();
    db.transaction((tx) => insertarVehiculo(tx, ctx, { nombre: 'Moto' }));
    const fila = db.transaction((tx) => editarVehiculo(tx, ctx2, 'id-1', { nombre: 'Moto azul' }));
    expect(fila).toMatchObject({ id: 'id-1', nombre: 'Moto azul', updatedAt: DESPUES });
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ entidad: 'vehiculos', entidadId: 'id-1', operacion: 'editar' }),
    ]);
  });

  it('una edición sin cambios no deja rastro', () => {
    const { db, ctx, ctx2 } = preparar();
    db.transaction((tx) => insertarVehiculo(tx, ctx, { nombre: 'Moto' }));
    db.transaction((tx) => editarVehiculo(tx, ctx2, 'id-1', { nombre: 'Moto' }));
    expect(db.select().from(rastro).all()).toEqual([]);
    expect(db.select().from(vehiculos).get()?.updatedAt).toBe(AHORA);
  });

  it('borrarVehiculo hace borrado lógico con rastro y despues null', () => {
    const { db, ctx, ctx2 } = preparar();
    db.transaction((tx) => insertarVehiculo(tx, ctx, { nombre: 'Moto' }));
    db.transaction((tx) => borrarVehiculo(tx, ctx2, 'id-1'));
    expect(db.select().from(vehiculos).get()).toMatchObject({ id: 'id-1', deletedAt: DESPUES });
    expect(db.transaction((tx) => leerVehiculosVigentes(tx))).toEqual([]);
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ entidad: 'vehiculos', entidadId: 'id-1', operacion: 'borrar', despues: null }),
    ]);
  });
});
