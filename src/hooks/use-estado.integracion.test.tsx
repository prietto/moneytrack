import { act, renderHook } from '@testing-library/react-native';

import { configurarPagos } from '@/data/commands/configurar-pagos';
import { definirComando } from '@/data/commands/definir-comando';
import { guardarSaldoInicialYColchon } from '@/data/commands/guardar-saldo-y-colchon';
// Prueba de integración: sustituye data/db por la base en memoria (AD-3 aplica a la app, no a esta prueba).
// eslint-disable-next-line no-restricted-imports
import { obtenerDb } from '@/data/db';
// eslint-disable-next-line no-restricted-imports
import { crearBaseDePrueba } from '@/data/pruebas/base-en-memoria';
import { cargarHechos } from '@/data/queries/cargar-hechos';
import { avisarCambio } from '@/data/cambios';
import { hoy } from '@/services/reloj';

import { ejecutar } from './use-comando';
import { useEstado } from './use-estado';

// Base real en memoria (better-sqlite3) en lugar de expo-sqlite.
jest.mock('@/data/db', () => ({ obtenerDb: jest.fn() }));
jest.mock('@/data/queries/cargar-hechos', () => ({
  cargarHechos: jest.fn(jest.requireActual('@/data/queries/cargar-hechos').cargarHechos),
}));
jest.mock('@/services/reloj', () => ({ hoy: jest.fn(), suscribirHoy: jest.fn(() => () => {}) }));
jest.mock('@/services/log', () => ({ log: { info: jest.fn(), aviso: jest.fn(), error: jest.fn() } }));
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));

const cargarMock = jest.mocked(cargarHechos);

let base: ReturnType<typeof crearBaseDePrueba>;

beforeEach(() => {
  // Invalida la caché de hechos (de módulo, por versión) entre pruebas.
  avisarCambio();
  base = crearBaseDePrueba();
  jest.mocked(obtenerDb).mockReturnValue(base.db as unknown as ReturnType<typeof obtenerDb>);
  jest.mocked(hoy).mockReturnValue('2026-11-05');
  cargarMock.mockClear();
});

afterEach(() => {
  base.cerrar();
});

describe('ejecutar → useEstado (integración)', () => {
  it('tras el commit de un comando, useEstado recarga los hechos', async () => {
    const { result } = await renderHook(() => useEstado());
    expect(result.current).toMatchObject({ tipo: 'sinConfigurar', hoy: '2026-11-05' });
    expect(cargarMock).toHaveBeenCalledTimes(1);

    const comando = definirComando('prueba.nada', ({ db }) => db.transaction(() => 1));
    let resultado: ReturnType<typeof ejecutar<number>> | undefined;
    await act(async () => {
      resultado = ejecutar(comando);
    });

    expect(resultado).toEqual({ ok: true, valor: 1 });
    expect(cargarMock).toHaveBeenCalledTimes(2);
    expect(cargarMock).toHaveBeenLastCalledWith(base.db);
  });

  it('un comando que falla no recarga', async () => {
    await renderHook(() => useEstado());
    const comando = definirComando('prueba.falla', ({ db }) =>
      db.transaction(() => {
        throw new Error('no');
      }),
    );
    await act(async () => {
      expect(ejecutar(comando)).toEqual({ ok: false, error: 'fallo' });
    });
    expect(cargarMock).toHaveBeenCalledTimes(1);
  });

  it('de punta a punta: configurar Pagos y saldo con Colchón pasa de sinConfigurar a calculado', async () => {
    const { result } = await renderHook(() => useEstado());
    expect(result.current).toEqual({
      tipo: 'sinConfigurar',
      hoy: '2026-11-05',
      faltan: ['pagos', 'saldoInicial', 'colchon'],
    });

    await act(async () => {
      expect(
        ejecutar(
          configurarPagos({ pago1: { dia: 10, montoEsperado: 2_000_000 }, pago2: { dia: 30, montoEsperado: 6_000_000 } }),
        ).ok,
      ).toBe(true);
    });
    expect(result.current).toMatchObject({ tipo: 'sinConfigurar', faltan: ['saldoInicial', 'colchon'] });

    await act(async () => {
      expect(
        ejecutar(
          guardarSaldoInicialYColchon({ monto: 10_000_000, fecha: '2026-11-03', colchon: 4_000_000, hoy: '2026-11-05' }),
        ).ok,
      ).toBe(true);
    });

    // Mínimo 10M hoy (los Pagos del 10 y el 30 solo suben el saldo) − Colchón 4M.
    expect(result.current).toMatchObject({
      tipo: 'calculado',
      saldoCalculado: 10_000_000,
      minimo: { fecha: '2026-11-05', saldo: 10_000_000 },
      dineroLibre: 6_000_000,
    });
    if (result.current.tipo === 'calculado') {
      expect(result.current.pagosEsperados.map((p) => p.fecha)).toEqual(['2026-11-10', '2026-11-30']);
    }
  });
});
