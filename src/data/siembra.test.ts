/** @jest-environment node */
import { asc } from 'drizzle-orm';

import { crearBaseDePrueba } from './pruebas/base-en-memoria';
import { categorias, fondos, presupuestos } from './schema';
import { IDS_SIEMBRA } from './siembra';

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const abiertas: (() => void)[] = [];

function leer() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  return {
    presupuestos: base.db.select().from(presupuestos).orderBy(asc(presupuestos.id)).all(),
    fondos: base.db.select().from(fondos).orderBy(asc(fondos.id)).all(),
    categorias: base.db.select().from(categorias).orderBy(asc(categorias.id)).all(),
  };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

describe('siembra (migración 0004)', () => {
  it('crea los dos Presupuestos esenciales sin monto', () => {
    expect(leer().presupuestos.map((p) => [p.id, p.nombre, p.montoMensual, p.deletedAt])).toEqual([
      [IDS_SIEMBRA.presupuestoComida, 'Comida', null, null],
      [IDS_SIEMBRA.presupuestoMantenimiento, 'Mantenimiento de vehículos', null, null],
    ]);
  });

  it('crea el Fondo enduro sin configurar', () => {
    expect(leer().fondos).toEqual([
      expect.objectContaining({
        id: IDS_SIEMBRA.fondoEnduro,
        nombre: 'Fondo enduro',
        aporteMensual: null,
        saldoInicialMonto: null,
        saldoInicialFecha: null,
        deletedAt: null,
      }),
    ]);
  });

  it('crea exactamente las 11 categorías iniciales con sus reglas', () => {
    const { presupuestoComida: comida, presupuestoMantenimiento: mant, fondoEnduro: enduro } = IDS_SIEMBRA;
    expect(
      leer().categorias.map((c) => [
        c.id,
        c.nombre,
        c.claseDefault,
        c.presupuestoId,
        c.fondoId,
        c.requiereVehiculo,
        c.esSistema,
        c.deletedAt,
      ]),
    ).toEqual([
      [IDS_SIEMBRA.categoriaMercado, 'Mercado y comida', 'esencial', comida, null, false, false, null],
      [IDS_SIEMBRA.categoriaMantenimiento, 'Mantenimiento de vehículo', 'esencial', mant, null, true, false, null],
      [IDS_SIEMBRA.categoriaCombustible, 'Combustible', 'esencial', mant, null, true, false, null],
      [IDS_SIEMBRA.categoriaEquipoEnduro, 'Equipo de enduro', 'fondo', null, enduro, false, false, null],
      [IDS_SIEMBRA.categoriaSalud, 'Salud', 'esencial', null, null, false, false, null],
      [IDS_SIEMBRA.categoriaComidaAfuera, 'Comida afuera', 'gusto', null, null, false, false, null],
      [IDS_SIEMBRA.categoriaSalidas, 'Salidas', 'gusto', null, null, false, false, null],
      [IDS_SIEMBRA.categoriaComprasPersonales, 'Compras personales', 'gusto', null, null, false, false, null],
      [IDS_SIEMBRA.categoriaOtros, 'Otros', 'gusto', null, null, false, false, null],
      [IDS_SIEMBRA.categoriaPagoObligacion, 'Pago de Obligación', 'esencial', null, null, false, true, null],
      [IDS_SIEMBRA.categoriaSinRegistrar, 'Sin registrar', 'gusto', null, null, false, true, null],
    ]);
  });

  it('IDS_SIEMBRA cubre exactamente las filas sembradas, con forma UUID v4', () => {
    const { presupuestos: p, fondos: f, categorias: c } = leer();
    const ids = [...p, ...f, ...c].map((fila) => fila.id).sort();
    expect(ids).toEqual(Object.values(IDS_SIEMBRA).sort());
    expect(ids.every((id) => UUID_V4.test(id))).toBe(true);
  });

  it('las marcas técnicas tienen forma ISO 8601 UTC', () => {
    const { presupuestos: p, fondos: f, categorias: c } = leer();
    for (const fila of [...p, ...f, ...c]) {
      expect(fila.createdAt).toMatch(ISO_UTC);
      expect(fila.updatedAt).toBe(fila.createdAt);
    }
  });

  it('todo enlace apunta a una fila sembrada vigente', () => {
    const { presupuestos: p, fondos: f, categorias: c } = leer();
    for (const cat of c) {
      if (cat.presupuestoId !== null) expect(p.some((x) => x.id === cat.presupuestoId && !x.deletedAt)).toBe(true);
      if (cat.fondoId !== null) expect(f.some((x) => x.id === cat.fondoId && !x.deletedAt)).toBe(true);
    }
  });
});
