import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { FormularioPagos } from '@/components/configuracion/formulario-pagos';
import * as comandoPagos from '@/data/commands/configurar-pagos';
import { ejecutar } from '@/hooks/use-comando';
import { type Configuracion, useConfiguracion } from '@/hooks/use-configuracion';
import { textosConfiguracion as t } from '@/textos/configuracion';

jest.mock('@/hooks/use-comando', () => ({ ejecutar: jest.fn() }));
jest.mock('@/hooks/use-configuracion', () => ({ useConfiguracion: jest.fn() }));

const ejecutarMock = jest.mocked(ejecutar);
const useConfiguracionMock = jest.mocked(useConfiguracion);

const vacia: Configuracion = { pago1: null, pago2: null, saldoInicial: null, colchon: null, colchonSugerido: 4_000_000 };

beforeEach(() => {
  jest.clearAllMocks();
  useConfiguracionMock.mockReturnValue(vacia);
  ejecutarMock.mockReturnValue({ ok: true, valor: undefined });
});

/** Deja correr el tick diferido en el que se ejecuta el comando. */
async function terminarGuardado() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function escribir(etiqueta: string, texto: string) {
  await fireEvent.changeText(screen.getByLabelText(etiqueta), texto);
}

async function llenarValido() {
  await escribir(t.diaPago(1), '10');
  await escribir(t.montoPago(1), '2.000.000');
  await escribir(t.diaPago(2), '30');
  await escribir(t.montoPago(2), '6000000');
}

const guardar = () => fireEvent.press(screen.getByRole('button', { name: t.guardar }));

describe('FormularioPagos', () => {
  it('precarga los Pagos guardados, con el monto formateado', async () => {
    useConfiguracionMock.mockReturnValue({
      ...vacia,
      pago1: { id: 'p1', numero: 1, dia: 10, montoEsperado: 2_000_000 },
      pago2: { id: 'p2', numero: 2, dia: 30, montoEsperado: 6_000_000 },
    });
    await render(<FormularioPagos onGuardado={jest.fn()} />);
    expect(screen.getByLabelText(t.diaPago(1)).props.value).toBe('10');
    expect(screen.getByLabelText(t.montoPago(1)).props.value).toBe('2.000.000');
    expect(screen.getByLabelText(t.diaPago(2)).props.value).toBe('30');
    expect(screen.getByLabelText(t.montoPago(2)).props.value).toBe('6.000.000');
  });

  it('muestra cada error junto a su campo y no ejecuta', async () => {
    await render(<FormularioPagos onGuardado={jest.fn()} />);
    await escribir(t.diaPago(1), '0');
    await escribir(t.montoPago(1), '2.000.000');
    await escribir(t.diaPago(2), '30');
    await escribir(t.montoPago(2), '1,5');
    await guardar();

    expect(screen.getByText(t.errores.diaInvalido)).toBeTruthy();
    expect(screen.getByText(t.errores.montoInvalido)).toBeTruthy();
    expect(screen.getByLabelText(t.diaPago(1)).props.accessibilityHint).toBe(t.errores.diaInvalido);
    expect(screen.getByLabelText(t.montoPago(2)).props.accessibilityHint).toBe(t.errores.montoInvalido);
    await terminarGuardado();
    expect(ejecutarMock).not.toHaveBeenCalled();
  });

  it('ejecuta configurarPagos con los datos leídos y llama onGuardado con ok', async () => {
    const onGuardado = jest.fn();
    await render(<FormularioPagos onGuardado={onGuardado} />);
    await llenarValido();
    await guardar();
    await terminarGuardado();

    expect(ejecutarMock).toHaveBeenCalledTimes(1);
    const comando = ejecutarMock.mock.calls[0][0];
    expect(comando.operacion).toBe('pagos.configurar');
    expect(onGuardado).toHaveBeenCalledTimes(1);
  });

  it('pasa al comando los Pagos leídos (montos con o sin puntos)', async () => {
    const espia = jest.spyOn(comandoPagos, 'configurarPagos');
    await render(<FormularioPagos onGuardado={jest.fn()} />);
    await llenarValido();
    await guardar();
    await terminarGuardado();
    expect(espia).toHaveBeenCalledWith({
      pago1: { dia: 10, montoEsperado: 2_000_000 },
      pago2: { dia: 30, montoEsperado: 6_000_000 },
    });
    espia.mockRestore();
  });

  it('con fallo muestra el mensaje genérico, conserva lo escrito y no llama onGuardado', async () => {
    ejecutarMock.mockReturnValue({ ok: false, error: 'fallo' });
    const onGuardado = jest.fn();
    await render(<FormularioPagos onGuardado={onGuardado} />);
    await llenarValido();
    await guardar();
    await terminarGuardado();

    expect(screen.getByText(t.falloAlGuardar)).toBeTruthy();
    expect(screen.getByLabelText(t.montoPago(1)).props.value).toBe('2.000.000');
    expect(onGuardado).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: t.guardar })).toBeEnabled();
  });

  it('si se desmonta antes del tick diferido, no ejecuta ni llama onGuardado', async () => {
    jest.useFakeTimers();
    try {
      const onGuardado = jest.fn();
      const { unmount } = await render(<FormularioPagos onGuardado={onGuardado} />);
      await llenarValido();
      await guardar();
      await act(async () => unmount());
      await act(async () => jest.runAllTimers());
      expect(ejecutarMock).not.toHaveBeenCalled();
      expect(onGuardado).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('mientras guarda, el botón queda deshabilitado y un segundo toque no ejecuta otra vez', async () => {
    jest.useFakeTimers();
    try {
      await render(<FormularioPagos onGuardado={jest.fn()} />);
      await llenarValido();
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
