import { act, fireEvent, render, screen } from '@testing-library/react-native';

import * as comandoSaldo from '@/data/commands/guardar-saldo-y-colchon';
import { FormularioSaldoYColchon } from '@/components/configuracion/formulario-saldo-y-colchon';
import { ejecutar } from '@/hooks/use-comando';
import { type Configuracion, useConfiguracion } from '@/hooks/use-configuracion';
import { useHoy } from '@/hooks/use-hoy';
import { textosConfiguracion as t } from '@/textos/configuracion';

jest.mock('@/hooks/use-comando', () => ({ ejecutar: jest.fn() }));
jest.mock('@/hooks/use-configuracion', () => ({ useConfiguracion: jest.fn() }));
jest.mock('@/hooks/use-hoy', () => ({ useHoy: jest.fn() }));

const ejecutarMock = jest.mocked(ejecutar);
const useConfiguracionMock = jest.mocked(useConfiguracion);
const HOY = '2026-11-05';

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
  useConfiguracionMock.mockReturnValue(vacia);
  jest.mocked(useHoy).mockReturnValue(HOY);
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

describe('FormularioSaldoYColchon', () => {
  it('sin datos: saldo vacío, fecha de hoy y Colchón de siembra 4.000.000', async () => {
    await render(<FormularioSaldoYColchon onGuardado={jest.fn()} />);
    expect(campo(t.saldo).props.value).toBe('');
    expect(campo(t.fecha).props.value).toBe(HOY);
    expect(campo(t.colchon).props.value).toBe('4.000.000');
    expect(screen.getByText(t.ayudaSaldo)).toBeTruthy();
    expect(screen.getByText(t.ayudaColchon)).toBeTruthy();
  });

  it('precarga lo guardado', async () => {
    useConfiguracionMock.mockReturnValue({
      ...vacia,
      saldoInicial: { monto: 10_000_000, fecha: '2026-11-03' },
      colchon: 3_000_000,
      colchonSugerido: 3_000_000,
    });
    await render(<FormularioSaldoYColchon onGuardado={jest.fn()} />);
    expect(campo(t.saldo).props.value).toBe('10.000.000');
    expect(campo(t.fecha).props.value).toBe('2026-11-03');
    expect(campo(t.colchon).props.value).toBe('3.000.000');
  });

  it('muestra el error de cada campo (fecha futura incluida) y no ejecuta', async () => {
    await render(<FormularioSaldoYColchon onGuardado={jest.fn()} />);
    await escribir(t.saldo, 'abc');
    await escribir(t.fecha, '2026-11-06');
    await escribir(t.colchon, '-1');
    await guardar();
    await terminarGuardado();

    expect(screen.getByText(t.errores.montoInvalido)).toBeTruthy();
    expect(screen.getByText(t.errores.fechaFutura)).toBeTruthy();
    expect(screen.getByText(t.errores.colchonInvalido)).toBeTruthy();
    expect(ejecutarMock).not.toHaveBeenCalled();
  });

  it('una fecha mal escrita muestra fechaInvalida', async () => {
    await render(<FormularioSaldoYColchon onGuardado={jest.fn()} />);
    await escribir(t.saldo, '1');
    await escribir(t.fecha, '05/11/2026');
    await guardar();
    expect(screen.getByText(t.errores.fechaInvalida)).toBeTruthy();
  });

  it('ejecuta guardarSaldoInicialYColchon con los datos leídos y hoy, y llama onGuardado', async () => {
    const espia = jest.spyOn(comandoSaldo, 'guardarSaldoInicialYColchon');
    const onGuardado = jest.fn();
    await render(<FormularioSaldoYColchon onGuardado={onGuardado} />);
    await escribir(t.saldo, '10.000.000');
    await escribir(t.fecha, '2026-11-03');
    await guardar();
    await terminarGuardado();

    expect(espia).toHaveBeenCalledWith({ monto: 10_000_000, fecha: '2026-11-03', colchon: 4_000_000, hoy: HOY });
    expect(ejecutarMock.mock.calls[0][0].operacion).toBe('ajustes.saldoYColchon');
    expect(onGuardado).toHaveBeenCalledTimes(1);
    espia.mockRestore();
  });

  it('con fallo muestra el mensaje genérico y conserva lo escrito', async () => {
    ejecutarMock.mockReturnValue({ ok: false, error: 'fallo' });
    const onGuardado = jest.fn();
    await render(<FormularioSaldoYColchon onGuardado={onGuardado} />);
    await escribir(t.saldo, '10.000.000');
    await guardar();
    await terminarGuardado();

    expect(screen.getByText(t.falloAlGuardar)).toBeTruthy();
    expect(campo(t.saldo).props.value).toBe('10.000.000');
    expect(onGuardado).not.toHaveBeenCalled();
  });

  it('mientras guarda, el botón queda deshabilitado y un segundo toque no ejecuta otra vez', async () => {
    jest.useFakeTimers();
    try {
      await render(<FormularioSaldoYColchon onGuardado={jest.fn()} />);
      await escribir(t.saldo, '1');
      await guardar();
      const boton = screen.getByRole('button', { name: t.guardando });
      expect(boton).toBeDisabled();
      expect(ejecutarMock).not.toHaveBeenCalled();
      await fireEvent.press(boton);
      await act(async () => jest.runAllTimers());
      expect(ejecutarMock).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
