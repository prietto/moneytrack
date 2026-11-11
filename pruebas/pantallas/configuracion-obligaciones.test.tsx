import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import EditarObligacion from '@/app/configuracion/obligaciones/[id]';
import Obligaciones from '@/app/configuracion/obligaciones/index';
import * as comandoGuardar from '@/data/commands/guardar-obligacion';
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
jest.mock('@/hooks/use-hoy', () => ({ useHoy: () => HOY }));

const HOY = '2026-11-06';
const ejecutarMock = jest.mocked(ejecutar);
const useConfiguracionMock = jest.mocked(useConfiguracion);
const paramsMock = jest.mocked(useLocalSearchParams);
const pantallaMock = jest.mocked(Stack.Screen);

const configuracion: Configuracion = {
  pago1: null,
  pago2: null,
  saldoInicial: null,
  colchon: null,
  colchonSugerido: 4_000_000,
  vehiculos: [{ id: 'v1', nombre: 'Moto azul' }],
  obligaciones: [
    { id: 'o1', tipo: 'mensual', nombre: 'Servicios', monto: 300_000, dia: 8 },
    {
      id: 'o2',
      tipo: 'anual',
      nombre: 'SOAT',
      monto: 1_800_000,
      fechaVencimiento: '2027-03-15',
      vehiculoId: 'v1',
      reservaInicial: { monto: 400_000, fecha: '2026-11-03' },
    },
  ],
  presupuestos: [],
  fondos: [],
  categorias: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  useConfiguracionMock.mockReturnValue(configuracion);
  ejecutarMock.mockReturnValue({ ok: true, valor: 'o-nuevo' });
});

async function terminarGuardado() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function abrir(id: string) {
  paramsMock.mockReturnValue({ id });
  await render(<EditarObligacion />);
}

const escribir = (etiqueta: string, texto: string) => fireEvent.changeText(screen.getByLabelText(etiqueta), texto);
const guardar = () => fireEvent.press(screen.getByRole('button', { name: t.guardar }));
const titulo = () => (pantallaMock.mock.calls.at(-1)?.[0] as { options: { title: string } }).options.title;

describe('lista de Obligaciones', () => {
  it('vacía: estado vacío y agregar lleva al alta', async () => {
    useConfiguracionMock.mockReturnValue({ ...configuracion, obligaciones: [] });
    await render(<Obligaciones />);
    expect(screen.getByText(t.listas.vacioObligaciones)).toBeTruthy();
    expect(screen.queryByText(t.listas.mensuales)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: t.listas.agregarObligacion }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/configuracion/obligaciones/[id]', params: { id: 'nuevo' } });
  });

  it('agrupa en Mensuales y Anuales, con el resumen de cada fila', async () => {
    await render(<Obligaciones />);
    expect(screen.getByRole('header', { name: t.listas.mensuales })).toBeTruthy();
    expect(screen.getByRole('header', { name: t.listas.anuales })).toBeTruthy();
    expect(screen.getByText('Día 8 · 300.000')).toBeTruthy();
    expect(screen.getByText('15 de mar. · 1.800.000 · Moto azul')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'SOAT' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/configuracion/obligaciones/[id]', params: { id: 'o2' } });
  });

  it('una anual sin Vehículo no lo menciona', async () => {
    const [mensual, anual] = configuracion.obligaciones;
    useConfiguracionMock.mockReturnValue({
      ...configuracion,
      obligaciones: [mensual, { ...anual, vehiculoId: null } as typeof anual],
    });
    await render(<Obligaciones />);
    expect(screen.getByText('15 de mar. · 1.800.000')).toBeTruthy();
  });
});

describe('formulario de Obligación', () => {
  it('alta mensual: tipo Mensual por defecto, ejecuta obligaciones.guardar con sus datos y vuelve', async () => {
    const espia = jest.spyOn(comandoGuardar, 'guardarObligacion');
    await abrir('nuevo');
    expect(titulo()).toBe(textosNavegacion.nuevaObligacion);
    expect(screen.getByRole('radio', { name: t.tipos.mensual })).toBeChecked();
    expect(screen.queryByLabelText(t.fechaVencimiento)).toBeNull();
    expect(screen.queryByRole('button', { name: t.borrar })).toBeNull();

    await escribir(t.nombre, 'Arriendo');
    await escribir(t.monto, '1.500.000');
    await escribir(t.dia, '1');
    await guardar();
    await terminarGuardado();

    expect(ejecutarMock).toHaveBeenCalledTimes(1);
    expect(ejecutarMock.mock.calls[0][0].operacion).toBe('obligaciones.guardar');
    expect(espia).toHaveBeenCalledWith(
      { id: null, tipo: 'mensual', nombre: 'Arriendo', monto: 1_500_000, dia: 1 },
      HOY,
    );
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('el cambio de tipo muestra los campos de la anual, con reserva 0 y fecha de hoy por defecto', async () => {
    await abrir('nuevo');
    await fireEvent.press(screen.getByRole('radio', { name: t.tipos.anual }));
    expect(screen.getByRole('radio', { name: t.tipos.anual })).toBeChecked();
    expect(screen.queryByLabelText(t.dia)).toBeNull();
    expect(screen.getByLabelText(t.fechaVencimiento)).toBeTruthy();
    expect(screen.getByRole('radio', { name: t.sinVehiculo })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Moto azul' })).toBeTruthy();
    expect(screen.getByLabelText(t.reserva).props.value).toBe('0');
    expect(screen.getByLabelText(t.fechaReserva).props.value).toBe(HOY);
  });

  it('sin Vehículos registrados solo aparece "Sin vehículo"', async () => {
    useConfiguracionMock.mockReturnValue({ ...configuracion, vehiculos: [] });
    await abrir('nuevo');
    await fireEvent.press(screen.getByRole('radio', { name: t.tipos.anual }));
    // Mensual, Anual y "Sin vehículo".
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: t.sinVehiculo })).toBeChecked();
  });

  it('alta anual: ejecuta con Vehículo y reserva inicial', async () => {
    const espia = jest.spyOn(comandoGuardar, 'guardarObligacion');
    await abrir('nuevo');
    await fireEvent.press(screen.getByRole('radio', { name: t.tipos.anual }));
    await escribir(t.nombre, 'SOAT');
    await escribir(t.monto, '1.800.000');
    await escribir(t.fechaVencimiento, '2027-03-15');
    await fireEvent.press(screen.getByRole('radio', { name: 'Moto azul' }));
    await escribir(t.reserva, '400.000');
    await escribir(t.fechaReserva, '2026-11-03');
    await guardar();
    await terminarGuardado();

    expect(espia).toHaveBeenCalledWith(
      {
        id: null,
        tipo: 'anual',
        nombre: 'SOAT',
        monto: 1_800_000,
        fechaVencimiento: '2027-03-15',
        vehiculoId: 'v1',
        reservaInicial: { monto: 400_000, fecha: '2026-11-03' },
      },
      HOY,
    );
    expect(router.back).toHaveBeenCalled();
  });

  it('errores por campo en la mensual, sin ejecutar', async () => {
    await abrir('nuevo');
    await escribir(t.monto, '0');
    await escribir(t.dia, '32');
    await guardar();
    await terminarGuardado();
    expect(screen.getByText(t.errores.nombreVacio)).toBeTruthy();
    expect(screen.getByLabelText(t.monto).props.accessibilityHint).toBe(t.errores.montoInvalido);
    expect(screen.getByLabelText(t.dia).props.accessibilityHint).toBe(t.errores.diaInvalido);
    expect(ejecutarMock).not.toHaveBeenCalled();
  });

  it('errores por campo en la anual, con los mensajes propios de cada fecha', async () => {
    await abrir('nuevo');
    await fireEvent.press(screen.getByRole('radio', { name: t.tipos.anual }));
    await escribir(t.nombre, 'SOAT');
    await escribir(t.monto, '1.000');
    await escribir(t.fechaVencimiento, '2026-01-01');
    await escribir(t.reserva, '2.000');
    await escribir(t.fechaReserva, '2026-01-01');
    await guardar();
    await terminarGuardado();
    expect(screen.getByLabelText(t.fechaVencimiento).props.accessibilityHint).toBe(t.erroresVencimiento.fechaAntigua);
    expect(screen.getByLabelText(t.reserva).props.accessibilityHint).toBe(t.errores.reservaMayorQueMonto);
    expect(screen.getByLabelText(t.fechaReserva).props.accessibilityHint).toBe(t.erroresFechaReserva.fechaAntigua);
    expect(ejecutarMock).not.toHaveBeenCalled();

    await escribir(t.fechaVencimiento, '2028-01-01');
    await escribir(t.fechaReserva, '2026-11-07');
    await guardar();
    expect(screen.getByLabelText(t.fechaVencimiento).props.accessibilityHint).toBe(t.errores.fechaLejana);
    expect(screen.getByLabelText(t.fechaReserva).props.accessibilityHint).toBe(t.errores.fechaFutura);
  });

  it('edición anual: precarga, el tipo se ve pero no se cambia, y conserva el id', async () => {
    const espia = jest.spyOn(comandoGuardar, 'guardarObligacion');
    await abrir('o2');
    expect(titulo()).toBe(textosNavegacion.editarObligacion);
    expect(screen.getByRole('radio', { name: t.tipos.anual })).toBeChecked();
    expect(screen.getByRole('radio', { name: t.tipos.mensual })).toBeDisabled();
    expect(screen.getByText(t.ayudaTipoFijo)).toBeTruthy();
    expect(screen.getByLabelText(t.nombre).props.value).toBe('SOAT');
    expect(screen.getByLabelText(t.monto).props.value).toBe('1.800.000');
    expect(screen.getByLabelText(t.fechaVencimiento).props.value).toBe('2027-03-15');
    expect(screen.getByRole('radio', { name: 'Moto azul' })).toBeChecked();
    expect(screen.getByLabelText(t.reserva).props.value).toBe('400.000');
    expect(screen.getByLabelText(t.fechaReserva).props.value).toBe('2026-11-03');

    await fireEvent.press(screen.getByRole('radio', { name: t.tipos.mensual }));
    expect(screen.getByRole('radio', { name: t.tipos.anual })).toBeChecked();

    await escribir(t.monto, '2.000.000');
    await guardar();
    await terminarGuardado();
    expect(espia).toHaveBeenCalledWith(expect.objectContaining({ id: 'o2', tipo: 'anual', monto: 2_000_000 }), HOY);
  });

  it('edición mensual: precarga el día', async () => {
    await abrir('o1');
    expect(screen.getByLabelText(t.dia).props.value).toBe('8');
    expect(screen.getByLabelText(t.monto).props.value).toBe('300.000');
  });

  it('con fallo al guardar aparece el mensaje genérico y lo escrito se conserva', async () => {
    ejecutarMock.mockReturnValue({ ok: false, error: 'fallo' });
    await abrir('o1');
    await escribir(t.monto, '350.000');
    await guardar();
    await terminarGuardado();
    expect(screen.getByText(t.falloAlGuardar)).toBeTruthy();
    expect(screen.getByLabelText(t.monto).props.value).toBe('350.000');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('borrado en dos pasos: ejecuta obligaciones.borrar y vuelve', async () => {
    await abrir('o1');
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    expect(screen.getByText(t.confirmarBorrar('Servicios'))).toBeTruthy();
    expect(ejecutarMock).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: t.siBorrar }));
    await terminarGuardado();
    expect(ejecutarMock.mock.calls[0][0].operacion).toBe('obligaciones.borrar');
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('si el borrado falla, avisa y no vuelve', async () => {
    ejecutarMock.mockReturnValue({ ok: false, error: 'fallo' });
    await abrir('o1');
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
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });
});
