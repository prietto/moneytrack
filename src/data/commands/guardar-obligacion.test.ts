/** @jest-environment node */
import { ejecutarComando } from '../ejecutar-comando';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { obligaciones, rastro, vehiculos } from '../schema';
import { type EntradaObligacion, guardarObligacion } from './guardar-obligacion';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../db', () => ({ obtenerDb: jest.fn() }));

const HOY = '2026-11-05';
const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const mensual: EntradaObligacion = { id: null, tipo: 'mensual', nombre: ' Arriendo ', monto: 1_500_000, dia: 1 };
const anual: EntradaObligacion = {
  id: null,
  tipo: 'anual',
  nombre: 'SOAT',
  monto: 1_800_000,
  fechaVencimiento: '2027-03-15',
  vehiculoId: 'v1',
  reservaInicial: { monto: 400_000, fecha: HOY },
};

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  base.db.insert(vehiculos).values({ id: 'v1', createdAt: AHORA, updatedAt: AHORA, nombre: 'Moto azul' }).run();
  base.db
    .insert(vehiculos)
    .values({ id: 'v2', createdAt: AHORA, updatedAt: AHORA, deletedAt: AHORA, nombre: 'Viejo' })
    .run();
  const nodeCrypto = jest.requireActual<typeof import('node:crypto')>('node:crypto');
  const ejecutarEn = (comando: Parameters<typeof ejecutarComando>[0], ahora = AHORA) =>
    ejecutarComando(comando, { db: base.db, ahora, nuevoId: () => nodeCrypto.randomUUID() });
  const alta = (entrada: EntradaObligacion, hoy = HOY): string => {
    const r = ejecutarEn(guardarObligacion(entrada, hoy));
    if (!r.ok) throw new Error('alta falló');
    return r.valor as string;
  };
  return { ...base, ejecutarEn, alta };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

const fallo = (causa: string) => ({ ok: false, error: { codigo: 'fallo', causa: new Error(causa) } });

describe('guardarObligacion', () => {
  it('usa la operación obligaciones.guardar', () => {
    expect(guardarObligacion(mensual, HOY).operacion).toBe('obligaciones.guardar');
  });

  it('el alta mensual guarda solo sus columnas, con UUID, nombre normalizado y sin rastro', () => {
    const { db, alta } = preparar();
    const id = alta(mensual);
    expect(id).toMatch(UUID);
    expect(db.select().from(obligaciones).all()).toEqual([
      {
        id,
        createdAt: AHORA,
        updatedAt: AHORA,
        deletedAt: null,
        tipo: 'mensual',
        nombre: 'Arriendo',
        monto: 1_500_000,
        dia: 1,
        fechaVencimiento: null,
        vehiculoId: null,
        reservaInicialMonto: null,
        reservaInicialFecha: null,
      },
    ]);
    expect(db.select().from(rastro).all()).toEqual([]);
  });

  it('el alta anual guarda su definición con la reserva inicial', () => {
    const { db, alta } = preparar();
    const id = alta(anual);
    expect(db.select().from(obligaciones).get()).toEqual({
      id,
      createdAt: AHORA,
      updatedAt: AHORA,
      deletedAt: null,
      tipo: 'anual',
      nombre: 'SOAT',
      monto: 1_800_000,
      dia: null,
      fechaVencimiento: '2027-03-15',
      vehiculoId: 'v1',
      reservaInicialMonto: 400_000,
      reservaInicialFecha: HOY,
    });
  });

  it('la edición conserva el id y deja rastro editar completo', () => {
    const { db, ejecutarEn, alta } = preparar();
    const id = alta(mensual);
    const antes = db.select().from(obligaciones).get();
    expect(ejecutarEn(guardarObligacion({ ...mensual, id, monto: 1_600_000 }, HOY), DESPUES)).toEqual({
      ok: true,
      valor: id,
    });
    const despues = db.select().from(obligaciones).get();
    expect(despues).toEqual({ ...antes, monto: 1_600_000, updatedAt: DESPUES });
    const filas = db.select().from(rastro).all();
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ entidad: 'obligaciones', entidadId: id, operacion: 'editar' });
    expect(JSON.parse(filas[0].antes)).toEqual(antes);
    expect(JSON.parse(filas[0].despues ?? 'null')).toEqual(despues);
  });

  it('repetir los mismos datos no deja rastro nuevo', () => {
    const { db, ejecutarEn, alta } = preparar();
    const id = alta(anual);
    expect(ejecutarEn(guardarObligacion({ ...anual, id }, HOY), DESPUES).ok).toBe(true);
    expect(db.select().from(rastro).all()).toEqual([]);
  });

  it.each([
    ['nombre vacío', { ...mensual, nombre: ' ' }],
    ['monto 0', { ...mensual, monto: 0 }],
    ['día 32', { ...mensual, dia: 32 }],
    ['reserva mayor que el monto', { ...anual, reservaInicial: { monto: 1_800_001, fecha: HOY } }],
    ['Vehículo borrado', { ...anual, vehiculoId: 'v2' }],
    ['Vehículo inexistente', { ...anual, vehiculoId: 'nada' }],
    ['fecha de reserva futura', { ...anual, reservaInicial: { monto: 0, fecha: '2026-11-06' } }],
    ['vencimiento lejano', { ...anual, fechaVencimiento: '2027-11-07' }],
  ] as [string, EntradaObligacion][])('con %s devuelve fallo y la base queda sin cambios', (_caso, entrada) => {
    const { db, ejecutarEn } = preparar();
    expect(ejecutarEn(guardarObligacion(entrada, HOY))).toEqual(fallo('datosInvalidos'));
    expect(db.select().from(obligaciones).all()).toEqual([]);
  });

  it('cambiar el tipo al editar devuelve fallo y no toca la fila', () => {
    const { db, ejecutarEn, alta } = preparar();
    const id = alta(mensual);
    const antes = db.select().from(obligaciones).all();
    expect(ejecutarEn(guardarObligacion({ ...anual, id }, HOY), DESPUES)).toEqual(fallo('tipoNoEditable'));
    expect(db.select().from(obligaciones).all()).toEqual(antes);
    expect(db.select().from(rastro).all()).toEqual([]);
  });

  it('editar una Obligación que no está vigente devuelve fallo', () => {
    const { ejecutarEn } = preparar();
    expect(ejecutarEn(guardarObligacion({ ...mensual, id: 'nada' }, HOY))).toEqual(fallo('filaNoEncontrada'));
  });

  it('editar una anual cuyas fechas guardadas envejecieron más de 62 días, cambiando solo el monto, se acepta', () => {
    const { db, ejecutarEn, alta } = preparar();
    const id = alta(anual);
    // Cuatro meses después, la fecha de la reserva guardada (5-nov) ya tiene más de 62 días.
    const despues = '2027-03-10';
    expect(ejecutarEn(guardarObligacion({ ...anual, id, monto: 2_000_000 }, despues), DESPUES).ok).toBe(true);
    expect(db.select().from(obligaciones).get()?.monto).toBe(2_000_000);
    // Una fecha de reserva nueva igual de antigua sí se rechaza.
    const otra = { ...anual, id, reservaInicial: { monto: 400_000, fecha: '2026-11-04' } };
    expect(ejecutarEn(guardarObligacion(otra, despues), DESPUES)).toEqual(fallo('datosInvalidos'));
  });
});
