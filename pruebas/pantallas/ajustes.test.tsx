import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import Ajustes from '@/app/(tabs)/ajustes';
import { type Configuracion, useConfiguracion } from '@/hooks/use-configuracion';
import { textosAjustes } from '@/textos/ajustes';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/hooks/use-configuracion', () => ({ useConfiguracion: jest.fn() }));
jest.mock('@/hooks/use-hoy', () => ({ useHoy: () => '2026-11-06' }));

const useConfiguracionMock = jest.mocked(useConfiguracion);

const vacia: Configuracion = { pago1: null, pago2: null, saldoInicial: null, colchon: null, colchonSugerido: 4_000_000 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Ajustes', () => {
  it('sin configuración: dos entradas que dicen "Sin configurar" y llevan a cada formulario', async () => {
    useConfiguracionMock.mockReturnValue(vacia);
    await render(<Ajustes />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getAllByText(textosAjustes.sinConfigurar)).toHaveLength(2);

    await fireEvent.press(screen.getByRole('button', { name: textosAjustes.pagos }));
    expect(router.push).toHaveBeenCalledWith('/configuracion/pagos');
    await fireEvent.press(screen.getByRole('button', { name: textosAjustes.saldoYColchon }));
    expect(router.push).toHaveBeenCalledWith('/configuracion/saldo-y-colchon');
  });

  it('con configuración: resumen de cada entrada con montos formateados', async () => {
    useConfiguracionMock.mockReturnValue({
      pago1: { id: 'p1', numero: 1, dia: 10, montoEsperado: 2_000_000 },
      pago2: { id: 'p2', numero: 2, dia: 30, montoEsperado: 6_000_000 },
      saldoInicial: { monto: 10_000_000, fecha: '2026-11-03' },
      colchon: 4_000_000,
      colchonSugerido: 4_000_000,
    });
    await render(<Ajustes />);

    expect(
      screen.getByText(
        `${textosAjustes.resumenPago(1, 10, '2.000.000')}\n${textosAjustes.resumenPago(2, 30, '6.000.000')}`,
      ),
    ).toBeTruthy();
    expect(screen.getByText(textosAjustes.resumenSaldoYColchon('10.000.000', '3 de nov.', '4.000.000'))).toBeTruthy();
    expect(screen.queryByText(textosAjustes.sinConfigurar)).toBeNull();
  });

  it('un saldo de otro año muestra el año en el resumen', async () => {
    useConfiguracionMock.mockReturnValue({
      pago1: null,
      pago2: null,
      saldoInicial: { monto: 10_000_000, fecha: '2025-12-30' },
      colchon: 4_000_000,
      colchonSugerido: 4_000_000,
    });
    await render(<Ajustes />);

    expect(
      screen.getByText(textosAjustes.resumenSaldoYColchon('10.000.000', '30 de dic. de 2025', '4.000.000')),
    ).toBeTruthy();
  });
});
