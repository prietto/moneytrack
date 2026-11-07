/** @jest-environment node */
import { ejecutarComando } from '../ejecutar-comando';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { pagos, rastro } from '../schema';
import { configurarPagos } from './configurar-pagos';

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
  const ejecutarEn = (
    comando: Parameters<typeof ejecutarComando>[0],
    ahora = AHORA,
    nuevoId: () => string = () => nodeCrypto.randomUUID(),
  ) => ejecutarComando(comando, { db: base.db, ahora, nuevoId });
  return { ...base, ejecutarEn };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

const datos = { pago1: { dia: 10, montoEsperado: 2_000_000 }, pago2: { dia: 30, montoEsperado: 6_000_000 } };

describe('configurarPagos', () => {
  it('usa la operación pagos.configurar', () => {
    expect(configurarPagos(datos).operacion).toBe('pagos.configurar');
  });

  it('la primera vez inserta los dos Pagos con UUID y marcas, sin rastro', () => {
    const { db, ejecutarEn } = preparar();
    expect(ejecutarEn(configurarPagos(datos))).toEqual({ ok: true, valor: undefined });

    const filas = db.select().from(pagos).all();
    expect(filas).toHaveLength(2);
    expect(filas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ numero: 1, dia: 10, montoEsperado: 2_000_000, createdAt: AHORA, updatedAt: AHORA }),
        expect.objectContaining({ numero: 2, dia: 30, montoEsperado: 6_000_000, createdAt: AHORA, updatedAt: AHORA }),
      ]),
    );
    expect(filas.every((f) => UUID.test(f.id) && f.deletedAt === null)).toBe(true);
    expect(db.select().from(rastro).all()).toHaveLength(0);
  });

  it('la segunda vez con otro monto conserva los id y deja rastro con antes y después', () => {
    const { db, ejecutarEn } = preparar();
    ejecutarEn(configurarPagos(datos));
    const antes = db.select().from(pagos).all();
    const pago1Antes = antes.find((f) => f.numero === 1)!;

    const cambio = { ...datos, pago1: { dia: 10, montoEsperado: 2_500_000 } };
    expect(ejecutarEn(configurarPagos(cambio), DESPUES).ok).toBe(true);

    const despues = db.select().from(pagos).all();
    expect(despues.map((f) => f.id).sort()).toEqual(antes.map((f) => f.id).sort());
    const pago1 = despues.find((f) => f.numero === 1)!;
    expect(pago1).toMatchObject({ id: pago1Antes.id, montoEsperado: 2_500_000, updatedAt: DESPUES, createdAt: AHORA });
    // El Pago 2 no cambió: ni updatedAt nuevo ni rastro.
    expect(despues.find((f) => f.numero === 2)?.updatedAt).toBe(AHORA);

    const filasRastro = db.select().from(rastro).all();
    expect(filasRastro).toHaveLength(1);
    expect(filasRastro[0]).toMatchObject({ entidad: 'pagos', entidadId: pago1Antes.id, operacion: 'editar' });
    expect(JSON.parse(filasRastro[0].antes)).toEqual(pago1Antes);
    expect(JSON.parse(filasRastro[0].despues ?? 'null')).toEqual(pago1);
  });

  it('repetir los mismos datos no deja rastro ni toca updatedAt', () => {
    const { db, ejecutarEn } = preparar();
    ejecutarEn(configurarPagos(datos));
    expect(ejecutarEn(configurarPagos(datos), DESPUES).ok).toBe(true);
    expect(db.select().from(rastro).all()).toHaveLength(0);
    expect(db.select().from(pagos).all().every((f) => f.updatedAt === AHORA)).toBe(true);
  });

  it.each([
    ['día 0 en el Pago 1', { ...datos, pago1: { dia: 0, montoEsperado: 1 } }],
    ['monto 0 en el Pago 1', { ...datos, pago1: { dia: 10, montoEsperado: 0 } }],
    ['día 32 en el Pago 2', { ...datos, pago2: { dia: 32, montoEsperado: 1 } }],
    ['monto con decimales en el Pago 2', { ...datos, pago2: { dia: 30, montoEsperado: 1.5 } }],
  ])('con %s devuelve fallo y la base queda sin cambios', (_caso, entrada) => {
    const { db, ejecutarEn } = preparar();
    const resultado = ejecutarEn(configurarPagos(entrada));
    expect(resultado).toEqual({ ok: false, error: { codigo: 'fallo', causa: new Error('datosInvalidos') } });
    expect(db.select().from(pagos).all()).toHaveLength(0);
  });

  it('con datos inválidos al editar, los Pagos guardados quedan intactos', () => {
    const { db, ejecutarEn } = preparar();
    ejecutarEn(configurarPagos(datos));
    const antes = db.select().from(pagos).all();
    expect(ejecutarEn(configurarPagos({ ...datos, pago2: { dia: 0, montoEsperado: 1 } }), DESPUES).ok).toBe(false);
    expect(db.select().from(pagos).all()).toEqual(antes);
    expect(db.select().from(rastro).all()).toHaveLength(0);
  });

  it('atomicidad: si falla al escribir el segundo Pago, tampoco queda el primero', () => {
    const { db, ejecutarEn } = preparar();
    let llamadas = 0;
    const nuevoId = () => {
      llamadas += 1;
      if (llamadas === 2) throw new Error('falla en el segundo');
      return 'id-1';
    };
    expect(ejecutarEn(configurarPagos(datos), AHORA, nuevoId).ok).toBe(false);
    expect(llamadas).toBe(2);
    expect(db.select().from(pagos).all()).toHaveLength(0);
  });
});
