/** @jest-environment node */
import { ejecutarComando } from '../ejecutar-comando';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { ajustes, rastro } from '../schema';
import { guardarSaldoInicialYColchon } from './guardar-saldo-y-colchon';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../db', () => ({ obtenerDb: jest.fn() }));

const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';
const HOY = '2026-11-05';

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  let n = 0;
  const ejecutarEn = (comando: Parameters<typeof ejecutarComando>[0], ahora = AHORA) =>
    ejecutarComando(comando, { db: base.db, ahora, nuevoId: () => `id-${++n}` });
  return { ...base, ejecutarEn };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

const datos = { monto: 10_000_000, fecha: '2026-11-03', colchon: 4_000_000, hoy: HOY };

describe('guardarSaldoInicialYColchon', () => {
  it('usa la operación ajustes.saldoYColchon', () => {
    expect(guardarSaldoInicialYColchon(datos).operacion).toBe('ajustes.saldoYColchon');
  });

  it('la primera vez inserta la fila de ajustes, sin rastro', () => {
    const { db, ejecutarEn } = preparar();
    expect(ejecutarEn(guardarSaldoInicialYColchon(datos))).toEqual({ ok: true, valor: undefined });
    expect(db.select().from(ajustes).all()).toEqual([
      {
        id: 'id-1',
        createdAt: AHORA,
        updatedAt: AHORA,
        deletedAt: null,
        saldoInicialMonto: 10_000_000,
        saldoInicialFecha: '2026-11-03',
        colchon: 4_000_000,
      },
    ]);
    expect(db.select().from(rastro).all()).toHaveLength(0);
  });

  it('la segunda vez edita la misma fila con rastro', () => {
    const { db, ejecutarEn } = preparar();
    ejecutarEn(guardarSaldoInicialYColchon(datos));
    expect(ejecutarEn(guardarSaldoInicialYColchon({ ...datos, colchon: 3_000_000 }), DESPUES).ok).toBe(true);

    expect(db.select().from(ajustes).all()).toEqual([
      expect.objectContaining({ id: 'id-1', colchon: 3_000_000, updatedAt: DESPUES }),
    ]);
    const filasRastro = db.select().from(rastro).all();
    expect(filasRastro).toHaveLength(1);
    expect(filasRastro[0]).toMatchObject({ entidad: 'ajustes', entidadId: 'id-1', operacion: 'editar' });
    expect(JSON.parse(filasRastro[0].antes)).toMatchObject({ colchon: 4_000_000 });
    expect(JSON.parse(filasRastro[0].despues ?? 'null')).toMatchObject({ colchon: 3_000_000 });
  });

  it('repetir los mismos datos no deja rastro ni toca updatedAt', () => {
    const { db, ejecutarEn } = preparar();
    ejecutarEn(guardarSaldoInicialYColchon(datos));
    ejecutarEn(guardarSaldoInicialYColchon(datos), DESPUES);
    expect(db.select().from(rastro).all()).toHaveLength(0);
    expect(db.select().from(ajustes).get()?.updatedAt).toBe(AHORA);
  });

  it('acepta Colchón 0', () => {
    const { db, ejecutarEn } = preparar();
    expect(ejecutarEn(guardarSaldoInicialYColchon({ ...datos, colchon: 0 })).ok).toBe(true);
    expect(db.select().from(ajustes).get()?.colchon).toBe(0);
  });

  it.each([
    ['fecha futura', { ...datos, fecha: '2026-11-06' }],
    ['fecha nueva de hace más de 62 días', { ...datos, fecha: '2026-09-03' }],
    ['fecha inválida', { ...datos, fecha: '2026-02-30' }],
    ['saldo negativo', { ...datos, monto: -1 }],
    ['Colchón con decimales', { ...datos, colchon: 0.5 }],
  ])('con %s devuelve fallo y no escribe', (_caso, entrada) => {
    const { db, ejecutarEn } = preparar();
    expect(ejecutarEn(guardarSaldoInicialYColchon(entrada))).toEqual({
      ok: false,
      error: { codigo: 'fallo', causa: new Error('datosInvalidos') },
    });
    expect(db.select().from(ajustes).all()).toHaveLength(0);
  });

  it('acepta la fecha guardada aunque ya tenga más de 62 días: se puede editar solo el Colchón', () => {
    const { db, ejecutarEn } = preparar();
    const ahora = '2026-01-15T00:00:00.000Z';
    db.insert(ajustes)
      .values({
        id: 'a',
        createdAt: ahora,
        updatedAt: ahora,
        saldoInicialMonto: 10_000_000,
        saldoInicialFecha: '2026-01-15',
        colchon: 4_000_000,
      })
      .run();
    const resultado = ejecutarEn(
      guardarSaldoInicialYColchon({ monto: 10_000_000, fecha: '2026-01-15', colchon: 5_000_000, hoy: HOY }),
    );
    expect(resultado.ok).toBe(true);
    expect(db.select().from(ajustes).get()?.colchon).toBe(5_000_000);
  });

  it('con más de una fila vigente edita la de createdAt más antiguo', () => {
    const { db, ejecutarEn } = preparar();
    const vacia = { saldoInicialMonto: null, saldoInicialFecha: null, colchon: null };
    db.insert(ajustes)
      .values([
        { id: 'nueva', createdAt: '2026-11-02T00:00:00.000Z', updatedAt: '2026-11-02T00:00:00.000Z', ...vacia },
        { id: 'vieja', createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z', ...vacia },
      ])
      .run();
    ejecutarEn(guardarSaldoInicialYColchon(datos));
    const filas = db.select().from(ajustes).all();
    expect(filas.find((f) => f.id === 'vieja')).toMatchObject({ colchon: 4_000_000 });
    expect(filas.find((f) => f.id === 'nueva')).toMatchObject({ colchon: null });
  });
});
