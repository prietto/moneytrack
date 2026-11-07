/** @jest-environment node */
import type { ContextoComando } from '../contexto';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { ajustes, rastro } from '../schema';
import { editarAjustes, insertarAjustes, leerAjustesVigentes } from './ajustes';

const AHORA = '2026-11-05T15:00:00.000Z';

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  let n = 0;
  const ctx: ContextoComando = { db: base.db, ahora: AHORA, nuevoId: () => `id-${++n}` };
  return { ...base, ctx };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

describe('tablas/ajustes', () => {
  it('insertarAjustes completa con null las columnas que no recibe', () => {
    const { db, ctx } = preparar();
    const fila = db.transaction((tx) => insertarAjustes(tx, ctx, { colchon: 4_000_000 }));
    expect(fila).toEqual({
      id: 'id-1',
      createdAt: AHORA,
      updatedAt: AHORA,
      deletedAt: null,
      saldoInicialMonto: null,
      saldoInicialFecha: null,
      colchon: 4_000_000,
    });
    expect(db.select().from(ajustes).all()).toEqual([fila]);
  });

  it('leerAjustesVigentes excluye los borrados y ordena por createdAt', () => {
    const { db } = preparar();
    const base = { saldoInicialMonto: null, saldoInicialFecha: null, colchon: null };
    db.insert(ajustes)
      .values([
        { id: 'nueva', createdAt: '2026-11-03T00:00:00.000Z', updatedAt: AHORA, ...base },
        { id: 'vieja', createdAt: '2026-11-01T00:00:00.000Z', updatedAt: AHORA, ...base },
        { id: 'borrada', createdAt: '2026-10-01T00:00:00.000Z', updatedAt: AHORA, deletedAt: AHORA, ...base },
      ])
      .run();
    expect(db.transaction((tx) => leerAjustesVigentes(tx)).map((f) => f.id)).toEqual(['vieja', 'nueva']);
  });

  it('editarAjustes deja rastro', () => {
    const { db, ctx } = preparar();
    db.transaction((tx) => insertarAjustes(tx, ctx, { colchon: 4_000_000 }));
    db.transaction((tx) => editarAjustes(tx, ctx, 'id-1', { colchon: 3_000_000 }));
    expect(db.select().from(rastro).all()).toEqual([expect.objectContaining({ entidad: 'ajustes', entidadId: 'id-1' })]);
  });
});
