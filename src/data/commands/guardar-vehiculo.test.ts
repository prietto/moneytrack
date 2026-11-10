/** @jest-environment node */
import { ejecutarComando } from '../ejecutar-comando';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { rastro, vehiculos } from '../schema';
import { guardarVehiculo } from './guardar-vehiculo';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../db', () => ({ obtenerDb: jest.fn() }));

const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  const nodeCrypto = jest.requireActual<typeof import('node:crypto')>('node:crypto');
  const ejecutarEn = (comando: Parameters<typeof ejecutarComando>[0], ahora = AHORA) =>
    ejecutarComando(comando, { db: base.db, ahora, nuevoId: () => nodeCrypto.randomUUID() });
  return { ...base, ejecutarEn };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

describe('guardarVehiculo', () => {
  it('usa la operación vehiculos.guardar', () => {
    expect(guardarVehiculo({ id: null, nombre: 'x' }).operacion).toBe('vehiculos.guardar');
  });

  it('el alta guarda el nombre normalizado con UUID, sin rastro, y devuelve el id', () => {
    const { db, ejecutarEn } = preparar();
    const resultado = ejecutarEn(guardarVehiculo({ id: null, nombre: '  Moto   azul ' }));
    expect(resultado.ok).toBe(true);
    const filas = db.select().from(vehiculos).all();
    expect(filas).toEqual([
      { id: expect.stringMatching(UUID), createdAt: AHORA, updatedAt: AHORA, deletedAt: null, nombre: 'Moto azul' },
    ]);
    expect(resultado).toEqual({ ok: true, valor: filas[0].id });
    expect(db.select().from(rastro).all()).toEqual([]);
  });

  it('la edición conserva el id y deja rastro editar completo', () => {
    const { db, ejecutarEn } = preparar();
    const alta = ejecutarEn(guardarVehiculo({ id: null, nombre: 'Moto' }));
    const id = alta.ok ? (alta.valor as string) : '';
    const antes = db.select().from(vehiculos).get();
    expect(ejecutarEn(guardarVehiculo({ id, nombre: 'Moto azul' }), DESPUES)).toEqual({ ok: true, valor: id });
    const despues = db.select().from(vehiculos).get();
    expect(despues).toEqual({ ...antes, nombre: 'Moto azul', updatedAt: DESPUES });
    const [fila] = db.select().from(rastro).all();
    expect(fila).toMatchObject({ entidad: 'vehiculos', entidadId: id, operacion: 'editar' });
    expect(JSON.parse(fila.antes)).toEqual(antes);
    expect(JSON.parse(fila.despues ?? 'null')).toEqual(despues);
  });

  it('repetir los mismos datos no deja rastro', () => {
    const { db, ejecutarEn } = preparar();
    const alta = ejecutarEn(guardarVehiculo({ id: null, nombre: 'Moto' }));
    const id = alta.ok ? (alta.valor as string) : '';
    expect(ejecutarEn(guardarVehiculo({ id, nombre: ' Moto ' }), DESPUES).ok).toBe(true);
    expect(db.select().from(rastro).all()).toEqual([]);
  });

  it.each([
    ['vacío', '  '],
    ['largo', 'a'.repeat(41)],
    ['repetido', 'moto AZUL'],
  ])('con un nombre %s devuelve fallo y la base queda sin cambios', (_caso, nombre) => {
    const { db, ejecutarEn } = preparar();
    ejecutarEn(guardarVehiculo({ id: null, nombre: 'Moto azul' }));
    const antes = db.select().from(vehiculos).all();
    expect(ejecutarEn(guardarVehiculo({ id: null, nombre }))).toEqual({
      ok: false,
      error: { codigo: 'fallo', causa: new Error('datosInvalidos') },
    });
    expect(db.select().from(vehiculos).all()).toEqual(antes);
  });

  it('el nombre de un Vehículo borrado se puede reutilizar', () => {
    const { db, ejecutarEn } = preparar();
    const alta = ejecutarEn(guardarVehiculo({ id: null, nombre: 'Moto' }));
    db.update(vehiculos).set({ deletedAt: AHORA }).run();
    expect(alta.ok && ejecutarEn(guardarVehiculo({ id: null, nombre: 'Moto' })).ok).toBe(true);
  });

  it('editar un Vehículo que no está vigente devuelve fallo', () => {
    const { ejecutarEn } = preparar();
    expect(ejecutarEn(guardarVehiculo({ id: 'no-existe', nombre: 'Moto' }))).toEqual({
      ok: false,
      error: { codigo: 'fallo', causa: new Error('filaNoEncontrada') },
    });
  });
});
