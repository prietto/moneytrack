import { renderHook } from '@testing-library/react-native';

import { useHechos } from '@/data/use-hechos';
import { type Hechos, hechosVacios } from '@/domain/hechos';

import { useConfiguracion } from './use-configuracion';

jest.mock('@/data/use-hechos', () => ({ useHechos: jest.fn() }));

const useHechosMock = jest.mocked(useHechos);

describe('useConfiguracion', () => {
  it('sin datos: todo null y el Colchón sugerido es el de siembra (4.000.000)', async () => {
    useHechosMock.mockReturnValue(hechosVacios);
    const { result } = await renderHook(() => useConfiguracion());
    expect(result.current).toEqual({
      pago1: null,
      pago2: null,
      saldoInicial: null,
      colchon: null,
      colchonSugerido: 4_000_000,
      vehiculos: [],
      obligaciones: [],
      presupuestos: [],
      fondos: [],
      categorias: [],
    });
  });

  it('con datos: los Pagos por número y el Colchón guardado como sugerido', async () => {
    const hechos: Hechos = {
      saldoInicial: { monto: 10_000_000, fecha: '2026-11-03' },
      colchon: 3_000_000,
      pagos: [
        { id: 'p1', numero: 1, dia: 10, montoEsperado: 2_000_000 },
        { id: 'p2', numero: 2, dia: 30, montoEsperado: 6_000_000 },
      ],
      vehiculos: [{ id: 'v1', nombre: 'Moto azul' }],
      obligaciones: [{ id: 'o1', tipo: 'mensual', nombre: 'Arriendo', monto: 1_500_000, dia: 1 }],
      presupuestos: [{ id: 'pr1', nombre: 'Comida', montoMensual: 700_000 }],
      fondos: [{ id: 'f1', nombre: 'Fondo enduro', aporteMensual: null, saldoInicial: null }],
      categorias: [
        {
          id: 'c1',
          nombre: 'Salud',
          claseDefault: 'esencial',
          presupuestoId: null,
          fondoId: null,
          requiereVehiculo: false,
          esSistema: false,
        },
      ],
    };
    useHechosMock.mockReturnValue(hechos);
    const { result } = await renderHook(() => useConfiguracion());
    expect(result.current).toEqual({
      pago1: hechos.pagos[0],
      pago2: hechos.pagos[1],
      saldoInicial: hechos.saldoInicial,
      colchon: 3_000_000,
      colchonSugerido: 3_000_000,
      vehiculos: hechos.vehiculos,
      obligaciones: hechos.obligaciones,
      presupuestos: hechos.presupuestos,
      fondos: hechos.fondos,
      categorias: hechos.categorias,
    });
  });

  it('con Colchón 0 guardado, sugiere 0 (no la siembra)', async () => {
    useHechosMock.mockReturnValue({ ...hechosVacios, colchon: 0 });
    const { result } = await renderHook(() => useConfiguracion());
    expect(result.current.colchonSugerido).toBe(0);
  });
});
