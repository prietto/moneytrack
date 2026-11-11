/** @jest-environment node */
import { eq } from 'drizzle-orm';

import type { ContextoComando } from '../contexto';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { categorias, rastro } from '../schema';
import { borrarCategoria, editarCategoria, insertarCategoria, leerCategoriasVigentes } from './categorias';

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

const farmacia = {
  nombre: 'Farmacia',
  claseDefault: 'esencial' as const,
  presupuestoId: null,
  fondoId: null,
  requiereVehiculo: false,
  esSistema: false,
};

describe('tablas/categorias', () => {
  it('insertarCategoria guarda la fila al final del orden de creación', () => {
    const { db, ctx } = preparar();
    // La siembra corre con la hora real; una categoría creada después va al final.
    const futuro = { ...ctx, ahora: '2999-01-01T00:00:00.000Z' };
    const fila = db.transaction((tx) => insertarCategoria(tx, futuro, farmacia));
    expect(fila).toEqual({
      id: 'id-1',
      createdAt: futuro.ahora,
      updatedAt: futuro.ahora,
      deletedAt: null,
      ...farmacia,
    });
    const vigentes = db.transaction((tx) => leerCategoriasVigentes(tx));
    expect(vigentes).toHaveLength(12);
    expect(vigentes[11]).toEqual(fila);
  });

  it('editarCategoria conserva el id y deja rastro; sin cambios, no', () => {
    const { db, ctx, ctx2 } = preparar();
    db.transaction((tx) => insertarCategoria(tx, ctx, farmacia));
    const fila = db.transaction((tx) =>
      editarCategoria(tx, ctx2, 'id-1', { nombre: 'Droguería', requiereVehiculo: true }),
    );
    expect(fila).toMatchObject({ id: 'id-1', nombre: 'Droguería', requiereVehiculo: true, updatedAt: DESPUES });
    db.transaction((tx) => editarCategoria(tx, ctx2, 'id-1', { nombre: 'Droguería', requiereVehiculo: true }));
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ entidad: 'categorias', entidadId: 'id-1', operacion: 'editar' }),
    ]);
  });

  it('borrarCategoria hace borrado lógico con rastro y despues null', () => {
    const { db, ctx, ctx2 } = preparar();
    db.transaction((tx) => insertarCategoria(tx, ctx, farmacia));
    db.transaction((tx) => borrarCategoria(tx, ctx2, 'id-1'));
    expect(db.select().from(categorias).where(eq(categorias.id, 'id-1')).get()).toMatchObject({ deletedAt: DESPUES });
    expect(db.transaction((tx) => leerCategoriasVigentes(tx)).some((c) => c.id === 'id-1')).toBe(false);
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ entidad: 'categorias', entidadId: 'id-1', operacion: 'borrar', despues: null }),
    ]);
  });
});
