import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import ConfigurarPresupuestosYFondos from '@/app/configuracion/presupuestos-y-fondos';
import * as comando from '@/data/commands/guardar-presupuestos-y-fondos';
import type { Categoria } from '@/domain/hechos';
import { ejecutar } from '@/hooks/use-comando';
import { type Configuracion, useConfiguracion } from '@/hooks/use-configuracion';
import { textosConfiguracion as t } from '@/textos/configuracion';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@/hooks/use-comando', () => ({ ejecutar: jest.fn() }));
jest.mock('@/hooks/use-configuracion', () => ({ useConfiguracion: jest.fn() }));
jest.mock('@/hooks/use-hoy', () => ({ useHoy: () => HOY }));

const HOY = '2026-11-06';
const ejecutarMock = jest.mocked(ejecutar);
const useConfiguracionMock = jest.mocked(useConfiguracion);

const combustible: Categoria = {
  id: 'c1',
  nombre: 'Combustible',
  claseDefault: 'esencial',
  presupuestoId: 'mant',
  fondoId: null,
  requiereVehiculo: true,
  esSistema: false,
};

const configuracion: Configuracion = {
  pago1: null,
  pago2: null,
  saldoInicial: null,
  colchon: null,
  colchonSugerido: 4_000_000,
  vehiculos: [],
  obligaciones: [],
  presupuestos: [
    { id: 'comida', nombre: 'Comida', montoMensual: null },
    { id: 'mant', nombre: 'Mantenimiento de vehículos', montoMensual: null },
  ],
  fondos: [{ id: 'enduro', nombre: 'Fondo enduro', aporteMensual: null, saldoInicial: null }],
  categorias: [combustible],
};

beforeEach(() => {
  jest.clearAllMocks();
  useConfiguracionMock.mockReturnValue(configuracion);
  ejecutarMock.mockReturnValue({ ok: true, valor: undefined });
});

async function terminarGuardado() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

const campo = (etiqueta: string) => screen.getByLabelText(etiqueta);
const escribir = (etiqueta: string, texto: string) => fireEvent.changeText(campo(etiqueta), texto);
const guardar = () => fireEvent.press(screen.getByRole('button', { name: t.guardar }));

describe('Presupuestos y fondo', () => {
  it('sin configurar: montos vacíos, saldo del fondo en 0 y fecha de hoy', async () => {
    await render(<ConfigurarPresupuestosYFondos />);
    expect(campo('Comida').props.value).toBe('');
    expect(campo('Mantenimiento de vehículos').props.value).toBe('');
    expect(screen.getByRole('header', { name: 'Fondo enduro' })).toBeTruthy();
    expect(campo(t.aporteFondo).props.value).toBe('');
    expect(campo(t.saldoFondo).props.value).toBe('0');
    expect(campo(t.fechaSaldoFondo).props.value).toBe(HOY);
  });

  it('precarga los montos guardados', async () => {
    useConfiguracionMock.mockReturnValue({
      ...configuracion,
      presupuestos: [
        { id: 'comida', nombre: 'Comida', montoMensual: 700_000 },
        { id: 'mant', nombre: 'Mantenimiento de vehículos', montoMensual: 0 },
      ],
      fondos: [
        {
          id: 'enduro',
          nombre: 'Fondo enduro',
          aporteMensual: 350_000,
          saldoInicial: { monto: 120_000, fecha: '2026-11-01' },
        },
      ],
    });
    await render(<ConfigurarPresupuestosYFondos />);
    expect(campo('Comida').props.value).toBe('700.000');
    expect(campo('Mantenimiento de vehículos').props.value).toBe('0');
    expect(campo(t.aporteFondo).props.value).toBe('350.000');
    // Sin Pago 2 no hay créditos: el saldo calculado es el inicial, re-anclado en hoy.
    expect(campo(t.saldoFondo).props.value).toBe('120.000');
    expect(campo(t.fechaSaldoFondo).props.value).toBe(HOY);
  });

  describe('fondo configurado: se re-ancla en hoy', () => {
    const enduro = {
      id: 'enduro',
      nombre: 'Fondo enduro',
      aporteMensual: 350_000,
      saldoInicial: { monto: 100_000, fecha: '2026-09-03' },
    };
    const configurado: Configuracion = {
      ...configuracion,
      pago2: { id: 'p2', numero: 2, dia: 20, montoEsperado: 1_000_000 },
      presupuestos: [
        { id: 'comida', nombre: 'Comida', montoMensual: 700_000 },
        { id: 'mant', nombre: 'Mantenimiento de vehículos', montoMensual: 400_000 },
      ],
      fondos: [enduro],
    };

    beforeEach(() => useConfiguracionMock.mockReturnValue(configurado));

    async function fondoGuardado() {
      const espia = jest.spyOn(comando, 'guardarPresupuestosYFondos');
      await guardar();
      await terminarGuardado();
      return espia.mock.calls[0][0].fondos[0];
    }

    it('precarga el saldo calculado en hoy (créditos del 20-sep y 20-oct) y la fecha de hoy', async () => {
      await render(<ConfigurarPresupuestosYFondos />);
      expect(campo(t.saldoFondo).props.value).toBe('800.000');
      expect(campo(t.fechaSaldoFondo).props.value).toBe(HOY);
    });

    it('sin cambios conserva el punto de partida guardado', async () => {
      await render(<ConfigurarPresupuestosYFondos />);
      expect(await fondoGuardado()).toEqual({ id: 'enduro', aporteMensual: 350_000, saldoInicial: enduro.saldoInicial });
    });

    it('al cambiar solo el aporte, guarda el saldo calculado en hoy: el aporte nuevo no rige hacia atrás', async () => {
      await render(<ConfigurarPresupuestosYFondos />);
      await escribir(t.aporteFondo, '0');
      expect(await fondoGuardado()).toEqual({
        id: 'enduro',
        aporteMensual: 0,
        saldoInicial: { monto: 800_000, fecha: HOY },
      });
    });

    it('al escribir el saldo real, lo guarda con fecha de hoy: no vuelve a sumar los aportes', async () => {
      await render(<ConfigurarPresupuestosYFondos />);
      await escribir(t.saldoFondo, '750.000');
      expect(await fondoGuardado()).toEqual({
        id: 'enduro',
        aporteMensual: 350_000,
        saldoInicial: { monto: 750_000, fecha: HOY },
      });
    });
  });

  it('la ayuda del combustible aparece solo en el Presupuesto enlazado a una categoría con Vehículo', async () => {
    await render(<ConfigurarPresupuestosYFondos />);
    expect(screen.getAllByText(t.ayudaPresupuestoVehiculos)).toHaveLength(1);
    expect(campo('Mantenimiento de vehículos').props.accessibilityHint).toBe(t.ayudaPresupuestoVehiculos);
    expect(campo('Comida').props.accessibilityHint).toBe(t.ayudaPresupuesto);
  });

  it('sin una categoría con Vehículo, ningún Presupuesto muestra la ayuda del combustible', async () => {
    useConfiguracionMock.mockReturnValue({
      ...configuracion,
      categorias: [{ ...combustible, requiereVehiculo: false }],
    });
    await render(<ConfigurarPresupuestosYFondos />);
    expect(screen.queryByText(t.ayudaPresupuestoVehiculos)).toBeNull();
  });

  it('guarda con presupuestosYFondos.guardar y los datos leídos, y vuelve', async () => {
    const espia = jest.spyOn(comando, 'guardarPresupuestosYFondos');
    await render(<ConfigurarPresupuestosYFondos />);
    await escribir('Comida', '700.000');
    await escribir('Mantenimiento de vehículos', '400000');
    await escribir(t.aporteFondo, '350.000');
    await escribir(t.saldoFondo, '350.000');
    await guardar();
    await terminarGuardado();

    expect(ejecutarMock).toHaveBeenCalledTimes(1);
    expect(ejecutarMock.mock.calls[0][0].operacion).toBe('presupuestosYFondos.guardar');
    expect(espia).toHaveBeenCalledWith(
      {
        presupuestos: [
          { id: 'comida', montoMensual: 700_000 },
          { id: 'mant', montoMensual: 400_000 },
        ],
        fondos: [{ id: 'enduro', aporteMensual: 350_000, saldoInicial: { monto: 350_000, fecha: HOY } }],
      },
      HOY,
    );
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('muestra el error junto a cada campo y no guarda', async () => {
    await render(<ConfigurarPresupuestosYFondos />);
    await escribir('Comida', '700.000');
    await escribir(t.saldoFondo, '-5');
    await escribir(t.fechaSaldoFondo, '2026-12-01');
    await guardar();

    expect(ejecutarMock).not.toHaveBeenCalled();
    // Mantenimiento vacío y el aporte vacío.
    expect(campo('Mantenimiento de vehículos').props.accessibilityHint).toBe(t.errores.montoInvalido);
    expect(campo('Comida').props.accessibilityHint).toBe(t.ayudaPresupuesto);
    expect(campo(t.aporteFondo).props.accessibilityHint).toBe(t.errores.aporteInvalido);
    expect(campo(t.saldoFondo).props.accessibilityHint).toBe(t.errores.montoInvalido);
    expect(campo(t.fechaSaldoFondo).props.accessibilityHint).toBe(t.errores.fechaFutura);
  });

  it('una fecha del fondo de hace más de dos meses usa el mensaje de lo guardado', async () => {
    await render(<ConfigurarPresupuestosYFondos />);
    await escribir('Comida', '1');
    await escribir('Mantenimiento de vehículos', '1');
    await escribir(t.aporteFondo, '1');
    await escribir(t.fechaSaldoFondo, '2026-08-01');
    await guardar();
    expect(ejecutarMock).not.toHaveBeenCalled();
    expect(campo(t.fechaSaldoFondo).props.accessibilityHint).toBe(t.erroresFechaReserva.fechaAntigua);
  });

  it('con fallo muestra el mensaje genérico y conserva lo escrito', async () => {
    ejecutarMock.mockReturnValue({ ok: false, error: 'fallo' });
    await render(<ConfigurarPresupuestosYFondos />);
    await escribir('Comida', '700.000');
    await escribir('Mantenimiento de vehículos', '400.000');
    await escribir(t.aporteFondo, '350.000');
    await guardar();
    await terminarGuardado();

    expect(screen.getByText(t.falloAlGuardar)).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
    expect(campo('Comida').props.value).toBe('700.000');
  });
});
