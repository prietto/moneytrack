/** @jest-environment node */
import type { ContextoComando } from '../contexto';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { obligaciones, rastro } from '../schema';
import {
  borrarObligacion,
  type DatosObligacion,
  editarObligacion,
  insertarObligacion,
  leerObligacionesVigentes,
} from './obligaciones';

const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';

const mensual: DatosObligacion = {
  tipo: 'mensual',
  nombre: 'Arriendo',
  monto: 1_500_000,
  dia: 1,
  fechaVencimiento: null,
  vehiculoId: null,
  reservaInicialMonto: null,
  reservaInicialFecha: null,
};

const anual: DatosObligacion = {
  tipo: 'anual',
  nombre: 'SOAT',
  monto: 1_800_000,
  dia: null,
  fechaVencimiento: '2027-03-15',
  vehiculoId: 'v1',
  reservaInicialMonto: 400_000,
  reservaInicialFecha: '2026-11-05',
};

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

describe('tablas/obligaciones', () => {
  it('inserta los dos tipos y los lee en orden de creación', () => {
    const { db, ctx } = preparar();
    db.transaction((tx) => {
      insertarObligacion(tx, ctx, mensual);
      insertarObligacion(tx, ctx, anual);
    });
    expect(db.transaction((tx) => leerObligacionesVigentes(tx))).toEqual([
      { id: 'id-1', createdAt: AHORA, updatedAt: AHORA, deletedAt: null, ...mensual },
      { id: 'id-2', createdAt: AHORA, updatedAt: AHORA, deletedAt: null, ...anual },
    ]);
  });

  it('editarObligacion conserva el id y deja rastro completo', () => {
    const { db, ctx, ctx2 } = preparar();
    const antes = db.transaction((tx) => insertarObligacion(tx, ctx, anual));
    const despues = db.transaction((tx) => editarObligacion(tx, ctx2, 'id-1', { monto: 2_000_000 }));
    expect(despues).toEqual({ ...antes, monto: 2_000_000, updatedAt: DESPUES });
    const [fila] = db.select().from(rastro).all();
    expect(fila).toMatchObject({ entidad: 'obligaciones', entidadId: 'id-1', operacion: 'editar' });
    expect(JSON.parse(fila.antes)).toEqual(antes);
    expect(JSON.parse(fila.despues ?? 'null')).toEqual(despues);
  });

  it('una edición sin cambios no deja rastro', () => {
    const { db, ctx, ctx2 } = preparar();
    db.transaction((tx) => insertarObligacion(tx, ctx, mensual));
    db.transaction((tx) => editarObligacion(tx, ctx2, 'id-1', { nombre: 'Arriendo', monto: 1_500_000, dia: 1 }));
    expect(db.select().from(rastro).all()).toEqual([]);
  });

  it('borrarObligacion hace borrado lógico con rastro y despues null', () => {
    const { db, ctx, ctx2 } = preparar();
    db.transaction((tx) => insertarObligacion(tx, ctx, mensual));
    db.transaction((tx) => borrarObligacion(tx, ctx2, 'id-1'));
    expect(db.select().from(obligaciones).get()).toMatchObject({ deletedAt: DESPUES });
    expect(db.transaction((tx) => leerObligacionesVigentes(tx))).toEqual([]);
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ entidad: 'obligaciones', operacion: 'borrar', despues: null }),
    ]);
  });
});
