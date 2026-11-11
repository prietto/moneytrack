import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import Ajustes from '@/app/(tabs)/ajustes';
import { type Configuracion, useConfiguracion } from '@/hooks/use-configuracion';
import { textosAjustes } from '@/textos/ajustes';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/hooks/use-configuracion', () => ({ useConfiguracion: jest.fn() }));
jest.mock('@/hooks/use-hoy', () => ({ useHoy: () => '2026-11-06' }));

const useConfiguracionMock = jest.mocked(useConfiguracion);

const vacia: Configuracion = {
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
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Ajustes', () => {
  it('sin configuración: Pagos y saldo dicen "Sin configurar" y llevan a cada formulario', async () => {
    useConfiguracionMock.mockReturnValue(vacia);
    await render(<Ajustes />);

    // H1.5 agrega Vehículos y Obligaciones y H1.6 Presupuestos y fondo y Categorías.
    expect(screen.getAllByRole('button')).toHaveLength(6);
    // Pagos, saldo y Presupuestos y fondo.
    expect(screen.getAllByText(textosAjustes.sinConfigurar)).toHaveLength(3);

    await fireEvent.press(screen.getByRole('button', { name: textosAjustes.pagos }));
    expect(router.push).toHaveBeenCalledWith('/configuracion/pagos');
    await fireEvent.press(screen.getByRole('button', { name: textosAjustes.saldoYColchon }));
    expect(router.push).toHaveBeenCalledWith('/configuracion/saldo-y-colchon');
  });

  it('con configuración: resumen de cada entrada con montos formateados', async () => {
    useConfiguracionMock.mockReturnValue({
      ...vacia,
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
    // Solo queda sin configurar Presupuestos y fondo.
    expect(screen.getAllByText(textosAjustes.sinConfigurar)).toHaveLength(1);
  });

  it('un saldo de otro año muestra el año en el resumen', async () => {
    useConfiguracionMock.mockReturnValue({
      ...vacia,
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

describe('Ajustes: Vehículos y Obligaciones', () => {
  it('muestra las seis entradas, con los resúmenes vacíos', async () => {
    useConfiguracionMock.mockReturnValue(vacia);
    await render(<Ajustes />);
    expect(screen.getAllByRole('button')).toHaveLength(6);
    expect(screen.getByText(textosAjustes.resumenVehiculos([]))).toBeTruthy();
    expect(screen.getByText(textosAjustes.resumenObligaciones(0, 0))).toBeTruthy();
    expect(textosAjustes.resumenVehiculos([])).toBe('Sin vehículos');
    expect(textosAjustes.resumenObligaciones(0, 0)).toBe('Sin obligaciones');
  });

  it('resume los Vehículos por nombre y las Obligaciones por tipo', async () => {
    useConfiguracionMock.mockReturnValue({
      ...vacia,
      vehiculos: [
        { id: 'v1', nombre: 'Moto azul' },
        { id: 'v2', nombre: 'Carro' },
      ],
      obligaciones: [
        { id: 'o1', tipo: 'mensual', nombre: 'Arriendo', monto: 1, dia: 1 },
        { id: 'o2', tipo: 'mensual', nombre: 'Servicios', monto: 1, dia: 8 },
        { id: 'o3', tipo: 'mensual', nombre: 'Internet', monto: 1, dia: 15 },
        {
          id: 'o4',
          tipo: 'anual',
          nombre: 'SOAT',
          monto: 1,
          fechaVencimiento: '2027-03-15',
          vehiculoId: 'v1',
          reservaInicial: { monto: 0, fecha: '2026-11-06' },
        },
      ],
    });
    await render(<Ajustes />);
    expect(screen.getByText('Moto azul, Carro')).toBeTruthy();
    expect(screen.getByText('3 mensuales · 1 anual')).toBeTruthy();
  });

  it('navega a Vehículos y a Obligaciones', async () => {
    useConfiguracionMock.mockReturnValue(vacia);
    await render(<Ajustes />);
    await fireEvent.press(screen.getByRole('button', { name: textosAjustes.vehiculos }));
    expect(router.push).toHaveBeenCalledWith('/configuracion/vehiculos');
    await fireEvent.press(screen.getByRole('button', { name: textosAjustes.obligaciones }));
    expect(router.push).toHaveBeenCalledWith('/configuracion/obligaciones');
  });

  it('una sola Obligación de cada tipo usa el singular, y omite el tipo sin ninguna', () => {
    expect(textosAjustes.resumenObligaciones(1, 0)).toBe('1 mensual');
    expect(textosAjustes.resumenObligaciones(0, 2)).toBe('2 anuales');
  });
});

describe('Ajustes: Presupuestos y fondo y Categorías', () => {
  const categoria = (id: string, esSistema = false) => ({
    id,
    nombre: id,
    claseDefault: 'gusto' as const,
    presupuestoId: null,
    fondoId: null,
    requiereVehiculo: false,
    esSistema,
  });

  it('resume los Presupuestos y el fondo configurados y cuenta las categorías', async () => {
    useConfiguracionMock.mockReturnValue({
      ...vacia,
      presupuestos: [
        { id: 'pr1', nombre: 'Comida', montoMensual: 700_000 },
        { id: 'pr2', nombre: 'Mantenimiento de vehículos', montoMensual: 400_000 },
        { id: 'pr3', nombre: 'Sin monto', montoMensual: null },
      ],
      fondos: [
        {
          id: 'f1',
          nombre: 'Fondo enduro',
          aporteMensual: 350_000,
          saldoInicial: { monto: 0, fecha: '2026-11-06' },
        },
      ],
      categorias: [categoria('a'), categoria('b'), categoria('c', true)],
    });
    await render(<Ajustes />);
    expect(
      screen.getByText('Comida 700.000 · Mantenimiento de vehículos 400.000 · Fondo enduro: 350.000 al mes'),
    ).toBeTruthy();
    expect(screen.getByText('3 categorías')).toBeTruthy();
  });

  it('sin montos dice "Sin configurar"; una sola categoría va en singular', async () => {
    useConfiguracionMock.mockReturnValue({
      ...vacia,
      presupuestos: [{ id: 'pr1', nombre: 'Comida', montoMensual: null }],
      fondos: [{ id: 'f1', nombre: 'Fondo enduro', aporteMensual: null, saldoInicial: null }],
      categorias: [categoria('a')],
    });
    await render(<Ajustes />);
    expect(screen.getByRole('button', { name: textosAjustes.presupuestosYFondo }).props.accessibilityHint).toBe(
      textosAjustes.sinConfigurar,
    );
    expect(screen.getByText('1 categoría')).toBeTruthy();
  });

  it('navega a Presupuestos y fondo y a Categorías', async () => {
    useConfiguracionMock.mockReturnValue(vacia);
    await render(<Ajustes />);
    await fireEvent.press(screen.getByRole('button', { name: textosAjustes.presupuestosYFondo }));
    expect(router.push).toHaveBeenCalledWith('/configuracion/presupuestos-y-fondos');
    await fireEvent.press(screen.getByRole('button', { name: textosAjustes.categorias }));
    expect(router.push).toHaveBeenCalledWith('/configuracion/categorias');
  });
});
