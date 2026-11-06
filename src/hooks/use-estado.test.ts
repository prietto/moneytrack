import { act, renderHook } from '@testing-library/react-native';

import { useHechos } from '@/data/use-hechos';
import type { Hechos } from '@/domain/hechos';
import { hechosVacios } from '@/domain/hechos';

import { useEstado } from './use-estado';
import { useHoy } from './use-hoy';

jest.mock('@/data/use-hechos', () => ({ useHechos: jest.fn() }));
jest.mock('./use-hoy', () => ({ useHoy: jest.fn() }));

const useHechosMock = jest.mocked(useHechos);
const useHoyMock = jest.mocked(useHoy);

const configurados: Hechos = { saldoInicial: { monto: 5_000_000, fecha: '2026-11-01' }, colchon: 1_000_000 };

beforeEach(() => {
  useHechosMock.mockReturnValue(hechosVacios);
  useHoyMock.mockReturnValue('2026-11-05');
});

describe('useEstado', () => {
  it('sin configurar', async () => {
    const { result } = await renderHook(() => useEstado());
    expect(result.current).toEqual({ tipo: 'sinConfigurar', hoy: '2026-11-05' });
  });

  it('configurado: calcula el Dinero libre', async () => {
    useHechosMock.mockReturnValue(configurados);
    const { result } = await renderHook(() => useEstado());
    expect(result.current).toMatchObject({ tipo: 'calculado', hoy: '2026-11-05', dineroLibre: 4_000_000 });
  });

  it('recalcula cuando cambia hoy', async () => {
    useHechosMock.mockReturnValue(configurados);
    const { result, rerender } = await renderHook(() => useEstado());
    useHoyMock.mockReturnValue('2026-11-06');
    await act(async () => rerender({}));
    expect(result.current).toMatchObject({ hoy: '2026-11-06' });
    if (result.current.tipo === 'calculado') {
      expect(result.current.saldoProyectado[0].fecha).toBe('2026-11-06');
    }
  });

  it('recalcula cuando cambian los hechos', async () => {
    const { result, rerender } = await renderHook(() => useEstado());
    expect(result.current.tipo).toBe('sinConfigurar');
    useHechosMock.mockReturnValue(configurados);
    await act(async () => rerender({}));
    expect(result.current.tipo).toBe('calculado');
  });
});
