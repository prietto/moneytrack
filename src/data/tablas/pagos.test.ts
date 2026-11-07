/** @jest-environment node */
import type { ContextoComando } from '../contexto';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { pagos, rastro } from '../schema';
import { editarPago, insertarPago, leerPagosVigentes } from './pagos';

const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';

const abiertas: (() => void)[] = [];

function preparar(ahora = AHORA) {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  let n = 0;
  const ctx: ContextoComando = { db: base.db, ahora, nuevoId: () => `id-${++n}` };
  return { ...base, ctx };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

describe('tablas/pagos', () => {
  it('insertarPago guarda la fila con id y marcas, y leerPagosVigentes la ordena por número', () => {
    const { db, ctx } = preparar();
    db.transaction((tx) => {
      insertarPago(tx, ctx, { numero: 2, dia: 30, montoEsperado: 6_000_000 });
      insertarPago(tx, ctx, { numero: 1, dia: 10, montoEsperado: 2_000_000 });
    });
    const filas = db.transaction((tx) => leerPagosVigentes(tx));
    expect(filas).toEqual([
      { id: 'id-2', createdAt: AHORA, updatedAt: AHORA, deletedAt: null, numero: 1, dia: 10, montoEsperado: 2_000_000 },
      { id: 'id-1', createdAt: AHORA, updatedAt: AHORA, deletedAt: null, numero: 2, dia: 30, montoEsperado: 6_000_000 },
    ]);
  });

  it('leerPagosVigentes excluye los borrados', () => {
    const { db } = preparar();
    db.insert(pagos)
      .values({ id: 'x', createdAt: AHORA, updatedAt: AHORA, deletedAt: AHORA, numero: 1, dia: 1, montoEsperado: 1 })
      .run();
    expect(db.transaction((tx) => leerPagosVigentes(tx))).toEqual([]);
  });

  it('editarPago conserva el id y deja rastro', () => {
    const { db, ctx } = preparar();
    db.transaction((tx) => insertarPago(tx, ctx, { numero: 1, dia: 10, montoEsperado: 2_000_000 }));
    const ctx2 = { ...ctx, ahora: DESPUES };
    const fila = db.transaction((tx) => editarPago(tx, ctx2, 'id-1', { montoEsperado: 2_500_000 }));
    expect(fila).toMatchObject({ id: 'id-1', updatedAt: DESPUES, montoEsperado: 2_500_000 });
    expect(db.select().from(rastro).all()).toEqual([expect.objectContaining({ entidad: 'pagos', entidadId: 'id-1' })]);
  });

  describe('índice parcial pagos_numero_vigente', () => {
    it('un segundo Pago 1 vigente lanza', () => {
      const { db } = preparar();
      const fila = { createdAt: AHORA, updatedAt: AHORA, numero: 1, dia: 10, montoEsperado: 1 };
      db.insert(pagos).values({ id: 'a', ...fila }).run();
      expect(() => db.insert(pagos).values({ id: 'b', ...fila }).run()).toThrow(/UNIQUE/);
    });

    it('un Pago 1 borrado no choca con el vigente', () => {
      const { db } = preparar();
      const fila = { createdAt: AHORA, updatedAt: AHORA, numero: 1, dia: 10, montoEsperado: 1 };
      db.insert(pagos).values({ id: 'a', ...fila }).run();
      expect(() => db.insert(pagos).values({ id: 'b', ...fila, deletedAt: AHORA }).run()).not.toThrow();
    });
  });
});
