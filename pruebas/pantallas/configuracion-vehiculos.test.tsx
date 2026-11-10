import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import EditarVehiculo from '@/app/configuracion/vehiculos/[id]';
import * as comandoGuardar from '@/data/commands/guardar-vehiculo';
import Vehiculos from '@/app/configuracion/vehiculos/index';
import { ejecutar } from '@/hooks/use-comando';
import { type Configuracion, useConfiguracion } from '@/hooks/use-configuracion';
import { textosConfiguracion as t } from '@/textos/configuracion';
import { textosNavegacion } from '@/textos/navegacion';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: jest.fn(() => null) },
}));
jest.mock('@/hooks/use-comando', () => ({ ejecutar: jest.fn() }));
jest.mock('@/hooks/use-configuracion', () => ({ useConfiguracion: jest.fn() }));
jest.mock('@/hooks/use-hoy', () => ({ useHoy: () => '2026-11-06' }));

const ejecutarMock = jest.mocked(ejecutar);
const useConfiguracionMock = jest.mocked(useConfiguracion);
const paramsMock = jest.mocked(useLocalSearchParams);
const pantallaMock = jest.mocked(Stack.Screen);

const vacia: Configuracion = {
  pago1: null,
  pago2: null,
  saldoInicial: null,
  colchon: null,
  colchonSugerido: 4_000_000,
  vehiculos: [],
  obligaciones: [],
};
const conVehiculos: Configuracion = {
  ...vacia,
  vehiculos: [
    { id: 'v1', nombre: 'Moto azul' },
    { id: 'v2', nombre: 'Carro' },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  useConfiguracionMock.mockReturnValue(conVehiculos);
  ejecutarMock.mockReturnValue({ ok: true, valor: 'v-nuevo' });
});

async function terminarGuardado() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function abrir(id: string) {
  paramsMock.mockReturnValue({ id });
  await render(<EditarVehiculo />);
}

const titulo = () => (pantallaMock.mock.calls.at(-1)?.[0] as { options: { title: string } }).options.title;

describe('lista de Vehículos', () => {
  it('vacía: el estado vacío y el botón de agregar, que lleva al alta', async () => {
    useConfiguracionMock.mockReturnValue(vacia);
    await render(<Vehiculos />);
    expect(screen.getByText(t.listas.vacioVehiculos)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.listas.agregarVehiculo }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/configuracion/vehiculos/[id]', params: { id: 'nuevo' } });
  });

  it('con datos: una fila por Vehículo que lleva a su edición', async () => {
    await render(<Vehiculos />);
    expect(screen.queryByText(t.listas.vacioVehiculos)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Carro' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/configuracion/vehiculos/[id]', params: { id: 'v2' } });
  });
});

describe('formulario de Vehículo', () => {
  it('alta: título "Nuevo vehículo", ejecuta vehiculos.guardar con id null y vuelve', async () => {
    const espia = jest.spyOn(comandoGuardar, 'guardarVehiculo');
    await abrir('nuevo');
    expect(titulo()).toBe(textosNavegacion.nuevoVehiculo);
    expect(screen.queryByRole('button', { name: t.borrar })).toBeNull();
    await fireEvent.changeText(screen.getByLabelText(t.nombre), '  Moto roja ');
    await fireEvent.press(screen.getByRole('button', { name: t.guardar }));
    await terminarGuardado();

    expect(ejecutarMock).toHaveBeenCalledTimes(1);
    const comando = ejecutarMock.mock.calls[0][0];
    expect(comando.operacion).toBe('vehiculos.guardar');
    expect(espia).toHaveBeenCalledWith({ id: null, nombre: '  Moto roja ' });
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('un nombre repetido muestra el error junto al campo y no ejecuta', async () => {
    await abrir('nuevo');
    await fireEvent.changeText(screen.getByLabelText(t.nombre), 'moto AZUL');
    await fireEvent.press(screen.getByRole('button', { name: t.guardar }));
    await terminarGuardado();
    expect(screen.getByText(t.errores.nombreRepetido)).toBeTruthy();
    expect(screen.getByLabelText(t.nombre).props.accessibilityHint).toBe(t.errores.nombreRepetido);
    expect(ejecutarMock).not.toHaveBeenCalled();
  });

  it('un nombre vacío muestra su error', async () => {
    await abrir('nuevo');
    await fireEvent.press(screen.getByRole('button', { name: t.guardar }));
    expect(screen.getByText(t.errores.nombreVacio)).toBeTruthy();
  });

  it('edición: título "Editar vehículo", nombre precargado y guardar sin cambiar el nombre no es repetido', async () => {
    await abrir('v1');
    expect(titulo()).toBe(textosNavegacion.editarVehiculo);
    expect(screen.getByLabelText(t.nombre).props.value).toBe('Moto azul');
    await fireEvent.press(screen.getByRole('button', { name: t.guardar }));
    await terminarGuardado();
    expect(ejecutarMock).toHaveBeenCalledTimes(1);
    expect(router.back).toHaveBeenCalled();
  });

  it('con fallo aparece el mensaje genérico y lo escrito se conserva', async () => {
    ejecutarMock.mockReturnValue({ ok: false, error: 'fallo' });
    await abrir('v1');
    await fireEvent.changeText(screen.getByLabelText(t.nombre), 'Moto vieja');
    await fireEvent.press(screen.getByRole('button', { name: t.guardar }));
    await terminarGuardado();
    expect(screen.getByText(t.falloAlGuardar)).toBeTruthy();
    expect(screen.getByLabelText(t.nombre).props.value).toBe('Moto vieja');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('borrado en dos pasos: confirma, ejecuta vehiculos.borrar y vuelve', async () => {
    await abrir('v2');
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    expect(ejecutarMock).not.toHaveBeenCalled();
    expect(screen.getByText(t.confirmarBorrar('Carro'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.siBorrar }));
    await terminarGuardado();
    expect(ejecutarMock).toHaveBeenCalledTimes(1);
    expect(ejecutarMock.mock.calls[0][0].operacion).toBe('vehiculos.borrar');
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('un Vehículo en uso muestra vehiculoEnUso y no llama a ejecutar', async () => {
    useConfiguracionMock.mockReturnValue({
      ...conVehiculos,
      obligaciones: [
        {
          id: 'o1',
          tipo: 'anual',
          nombre: 'SOAT',
          monto: 1,
          fechaVencimiento: '2027-03-15',
          vehiculoId: 'v1',
          reservaInicial: { monto: 0, fecha: '2026-11-06' },
        },
      ],
    });
    await abrir('v1');
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    await fireEvent.press(screen.getByRole('button', { name: t.siBorrar }));
    await terminarGuardado();
    expect(screen.getByText(t.vehiculoEnUso)).toBeTruthy();
    expect(ejecutarMock).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('si el borrado falla, avisa y no vuelve', async () => {
    ejecutarMock.mockReturnValue({ ok: false, error: 'fallo' });
    await abrir('v2');
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    await fireEvent.press(screen.getByRole('button', { name: t.siBorrar }));
    await terminarGuardado();
    expect(screen.getByText(t.falloAlBorrar)).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('con un id que no existe muestra noEncontrado y ningún campo', async () => {
    await abrir('no-existe');
    expect(screen.getByText(t.noEncontrado)).toBeTruthy();
    expect(screen.queryByLabelText(t.nombre)).toBeNull();
    expect(screen.queryByRole('button', { name: t.guardar })).toBeNull();
  });
});
