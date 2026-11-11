/** @jest-environment node */
import type { ContextoComando } from '../contexto';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { fondos, presupuestos, rastro } from '../schema';
import { IDS_SIEMBRA } from '../siembra';
import { editarFondo, leerFondosVigentes } from './fondos';
import { editarPresupuesto, leerPresupuestosVigentes } from './presupuestos';

const AHORA = '2026-11-05T15:00:00.000Z';
const { presupuestoComida: COMIDA, presupuestoMantenimiento: MANT, fondoEnduro: ENDURO } = IDS_SIEMBRA;

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

describe('tablas/presupuestos', () => {
  it('leerPresupuestosVigentes da los sembrados en orden', () => {
    const { db } = preparar();
    expect(db.transaction((tx) => leerPresupuestosVigentes(tx)).map((p) => p.id)).toEqual([COMIDA, MANT]);
  });

  it('editarPresupuesto conserva el id y deja rastro', () => {
    const { db, ctx } = preparar();
    const fila = db.transaction((tx) => editarPresupuesto(tx, ctx, COMIDA, { montoMensual: 700_000 }));
    expect(fila).toMatchObject({ id: COMIDA, nombre: 'Comida', montoMensual: 700_000, updatedAt: AHORA });
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ entidad: 'presupuestos', entidadId: COMIDA, operacion: 'editar' }),
    ]);
  });

  it('una edición sin cambios no deja rastro', () => {
    const { db, ctx } = preparar();
    db.transaction((tx) => editarPresupuesto(tx, ctx, COMIDA, { montoMensual: 700_000 }));
    db.transaction((tx) =>
      editarPresupuesto(tx, { ...ctx, ahora: '2026-11-06T00:00:00.000Z' }, COMIDA, { montoMensual: 700_000 }),
    );
    expect(db.select().from(rastro).all()).toHaveLength(1);
    expect(
      db
        .select()
        .from(presupuestos)
        .all()
        .find((p) => p.id === COMIDA)?.updatedAt,
    ).toBe(AHORA);
  });
});

describe('tablas/fondos', () => {
  it('leerFondosVigentes da el sembrado', () => {
    const { db } = preparar();
    expect(db.transaction((tx) => leerFondosVigentes(tx)).map((f) => f.id)).toEqual([ENDURO]);
  });

  it('editarFondo conserva el id y deja rastro; sin cambios, no', () => {
    const { db, ctx } = preparar();
    const cambios = { aporteMensual: 350_000, saldoInicialMonto: 0, saldoInicialFecha: '2026-11-05' };
    const fila = db.transaction((tx) => editarFondo(tx, ctx, ENDURO, cambios));
    expect(fila).toMatchObject({ id: ENDURO, ...cambios });
    db.transaction((tx) => editarFondo(tx, ctx, ENDURO, cambios));
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ entidad: 'fondos', entidadId: ENDURO, operacion: 'editar' }),
    ]);
    expect(db.select().from(fondos).get()).toMatchObject(cambios);
  });
});
