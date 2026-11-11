import { renderHook } from '@testing-library/react-native';

import { definirComando } from '@/data/commands/definir-comando';
import { ejecutarComando } from '@/data/ejecutar-comando';
import { cargarHechosActuales } from '@/data/use-hechos';
import type { Hechos } from '@/domain/hechos';
import { hoy } from '@/services/reloj';
import { log } from '@/services/log';

import { ejecutar, registrarTrasComando, useComando } from './use-comando';

jest.mock('@/data/ejecutar-comando', () => ({ ejecutarComando: jest.fn() }));
jest.mock('@/data/use-hechos', () => ({ cargarHechosActuales: jest.fn() }));
jest.mock('@/services/reloj', () => ({ hoy: jest.fn() }));
jest.mock('@/services/log', () => ({ log: { info: jest.fn(), aviso: jest.fn(), error: jest.fn() } }));

const ejecutarComandoMock = jest.mocked(ejecutarComando);
const cargarMock = jest.mocked(cargarHechosActuales);
const hoyMock = jest.mocked(hoy);

const hechos: Hechos = {
  saldoInicial: { monto: 2_000_000, fecha: '2026-11-01' },
  colchon: 500_000,
  pagos: [
    { id: 'p1', numero: 1, dia: 10, montoEsperado: 1 },
    { id: 'p2', numero: 2, dia: 30, montoEsperado: 1 },
  ],
  vehiculos: [],
  obligaciones: [],
  presupuestos: [],
  fondos: [],
  categorias: [],
};
const comando = definirComando('prueba.x', () => 'valor');

const cancelaciones: (() => void)[] = [];
function registrar(fn: Parameters<typeof registrarTrasComando>[0]) {
  cancelaciones.push(registrarTrasComando(fn));
}

beforeEach(() => {
  jest.clearAllMocks();
  cargarMock.mockReturnValue(hechos);
  hoyMock.mockReturnValue('2026-11-05');
  ejecutarComandoMock.mockImplementation((c) => ({ ok: true, valor: c.aplicar({} as never) }));
});

afterEach(() => {
  cancelaciones.splice(0).forEach((c) => c());
});

describe('ejecutar', () => {
  it('con éxito devuelve ok y el post-comando recibe (estado, hoy)', () => {
    const tras = jest.fn();
    registrar(tras);

    expect(ejecutar(comando)).toEqual({ ok: true, valor: 'valor' });
    expect(ejecutarComandoMock).toHaveBeenCalledWith(comando);
    expect(tras).toHaveBeenCalledTimes(1);
    expect(tras).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'calculado', hoy: '2026-11-05', dineroLibre: 1_500_000 }),
      '2026-11-05',
    );
    expect(log.error).not.toHaveBeenCalled();
  });

  it('con fallo registra la causa, devuelve fallo("fallo") y no corre el post-comando', () => {
    const tras = jest.fn();
    registrar(tras);
    const causa = new Error('rompió');
    ejecutarComandoMock.mockReturnValue({ ok: false, error: { codigo: 'fallo', causa } });

    expect(ejecutar(comando)).toEqual({ ok: false, error: 'fallo' });
    expect(log.error).toHaveBeenCalledWith('comando.prueba.x', { error: causa });
    expect(tras).not.toHaveBeenCalled();
    expect(cargarMock).not.toHaveBeenCalled();
  });

  it('un post-comando que lanza no cambia el ok, se registra y los demás corren igual', () => {
    const error = new Error('tras roto');
    const otro = jest.fn();
    registrar(() => {
      throw error;
    });
    registrar(otro);

    expect(ejecutar(comando)).toEqual({ ok: true, valor: 'valor' });
    expect(log.error).toHaveBeenCalledWith('comando.trasComando', { error });
    expect(otro).toHaveBeenCalledTimes(1);
  });

  it('si recalcular el Estado falla, devuelve ok igual y lo registra', () => {
    const tras = jest.fn();
    registrar(tras);
    const error = new Error('no cargó');
    cargarMock.mockImplementation(() => {
      throw error;
    });

    expect(ejecutar(comando)).toEqual({ ok: true, valor: 'valor' });
    expect(log.error).toHaveBeenCalledWith('comando.trasComando', { error });
    expect(tras).not.toHaveBeenCalled();
  });

  it('sin post-comandos registrados no recalcula el Estado', () => {
    expect(ejecutar(comando)).toEqual({ ok: true, valor: 'valor' });
    expect(cargarMock).not.toHaveBeenCalled();
  });

  it('registrarTrasComando devuelve un cancelador que funciona', () => {
    const tras = jest.fn();
    const cancelar = registrarTrasComando(tras);
    cancelar();
    ejecutar(comando);
    expect(tras).not.toHaveBeenCalled();
  });

  it('el mismo post-comando registrado dos veces se cancela por separado', () => {
    const tras = jest.fn();
    const cancelar1 = registrarTrasComando(tras);
    registrar(tras);
    cancelar1();
    ejecutar(comando);
    expect(tras).toHaveBeenCalledTimes(1);
  });
});

describe('useComando', () => {
  it('devuelve el mismo ejecutar', async () => {
    const { result } = await renderHook(() => useComando());
    expect(result.current.ejecutar).toBe(ejecutar);
  });
});
