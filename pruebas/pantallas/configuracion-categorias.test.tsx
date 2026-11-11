import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import EditarCategoria from '@/app/configuracion/categorias/[id]';
import Categorias from '@/app/configuracion/categorias/index';
import * as comandoBorrar from '@/data/commands/borrar-categoria';
import * as comandoGuardar from '@/data/commands/guardar-categoria';
import type { Categoria } from '@/domain/hechos';
import { ejecutar } from '@/hooks/use-comando';
import { type Configuracion, useConfiguracion } from '@/hooks/use-configuracion';
import { nombresClase } from '@/textos/clases';
import { textosConfiguracion as t } from '@/textos/configuracion';
import { textosNavegacion } from '@/textos/navegacion';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: jest.fn(() => null) },
}));
jest.mock('@/hooks/use-comando', () => ({ ejecutar: jest.fn() }));
jest.mock('@/hooks/use-configuracion', () => ({ useConfiguracion: jest.fn() }));

const ejecutarMock = jest.mocked(ejecutar);
const useConfiguracionMock = jest.mocked(useConfiguracion);
const paramsMock = jest.mocked(useLocalSearchParams);
const pantallaMock = jest.mocked(Stack.Screen);

function categoria(id: string, nombre: string, cambios: Partial<Categoria> = {}): Categoria {
  return {
    id,
    nombre,
    claseDefault: 'gusto',
    presupuestoId: null,
    fondoId: null,
    requiereVehiculo: false,
    esSistema: false,
    ...cambios,
  };
}

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
  categorias: [
    categoria('combustible', 'Combustible', {
      claseDefault: 'esencial',
      presupuestoId: 'mant',
      requiereVehiculo: true,
    }),
    categoria('salud', 'Salud', { claseDefault: 'esencial' }),
    categoria('equipo', 'Equipo de enduro', { claseDefault: 'fondo', fondoId: 'enduro' }),
    categoria('salidas', 'Salidas'),
    categoria('pago', 'Pago de Obligación', { claseDefault: 'esencial', esSistema: true }),
    categoria('sin-registrar', 'Sin registrar', { esSistema: true }),
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  useConfiguracionMock.mockReturnValue(configuracion);
  ejecutarMock.mockReturnValue({ ok: true, valor: 'nueva-id' });
});

async function terminarGuardado() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function abrir(id: string) {
  paramsMock.mockReturnValue({ id });
  await render(<EditarCategoria />);
}

const escribir = (etiqueta: string, texto: string) => fireEvent.changeText(screen.getByLabelText(etiqueta), texto);
const guardar = () => fireEvent.press(screen.getByRole('button', { name: t.guardar }));
const elegir = (nombre: string) => fireEvent.press(screen.getByRole('radio', { name: nombre }));
const titulo = () => (pantallaMock.mock.calls.at(-1)?.[0] as { options: { title: string } }).options.title;

describe('lista de Categorías', () => {
  it('agrupa por clase y deja las de sistema al final, sin edición', async () => {
    await render(<Categorias />);
    expect(screen.getByRole('header', { name: t.listas.esenciales })).toBeTruthy();
    expect(screen.getByRole('header', { name: t.listas.fondosProtegidos })).toBeTruthy();
    expect(screen.getByRole('header', { name: t.listas.gustos })).toBeTruthy();
    expect(screen.getByRole('header', { name: t.listas.deLaApp })).toBeTruthy();
    expect(screen.getByText(t.listas.ayudaDeLaApp)).toBeTruthy();

    expect(screen.getByText('Esencial · Mantenimiento de vehículos · pide Vehículo')).toBeTruthy();
    expect(screen.getByText('Fondo protegido · Fondo enduro')).toBeTruthy();
    expect(screen.getAllByText('Gusto')).toHaveLength(2); // Salidas y Sin registrar.

    // Las propias se pueden tocar; las de sistema no son botones.
    expect(screen.getByRole('button', { name: 'Salud' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sin registrar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pago de Obligación' })).toBeNull();
    expect(screen.getByText('Sin registrar')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Salud' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/configuracion/categorias/[id]', params: { id: 'salud' } });
  });

  it('sin categorías propias: estado vacío y agregar lleva al alta', async () => {
    useConfiguracionMock.mockReturnValue({
      ...configuracion,
      categorias: configuracion.categorias.filter((c) => c.esSistema),
    });
    await render(<Categorias />);
    expect(screen.getByText(t.listas.vacioCategorias)).toBeTruthy();
    expect(screen.queryByRole('header', { name: t.listas.esenciales })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: t.listas.agregarCategoria }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/configuracion/categorias/[id]', params: { id: 'nueva' } });
  });
});

describe('formulario de Categoría', () => {
  it('alta de una Esencial sin Presupuesto: valores por defecto, ayuda y datos del comando', async () => {
    const espia = jest.spyOn(comandoGuardar, 'guardarCategoria');
    await abrir('nueva');
    expect(titulo()).toBe(textosNavegacion.nuevaCategoria);
    expect(screen.getByRole('radio', { name: nombresClase.esencial })).toBeChecked();
    expect(screen.getByRole('radio', { name: t.sinPresupuesto })).toBeChecked();
    expect(screen.getByText(t.ayudaSinPresupuesto)).toBeTruthy();
    expect(screen.getByRole('radio', { name: t.no })).toBeChecked();
    expect(screen.queryByRole('button', { name: t.borrar })).toBeNull();

    await escribir(t.nombre, ' Farmacia ');
    await guardar();
    await terminarGuardado();

    expect(ejecutarMock.mock.calls[0][0].operacion).toBe('categorias.guardar');
    expect(espia).toHaveBeenCalledWith({
      id: null,
      nombre: ' Farmacia ',
      claseDefault: 'esencial',
      presupuestoId: null,
      fondoId: null,
      requiereVehiculo: false,
    });
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('cambiar de clase limpia los enlaces que no van y preselecciona el primer fondo', async () => {
    const espia = jest.spyOn(comandoGuardar, 'guardarCategoria');
    await abrir('nueva');
    await escribir(t.nombre, 'Repuestos');
    await elegir('Mantenimiento de vehículos');
    await elegir(t.si);

    await elegir(nombresClase.fondo);
    expect(screen.queryByRole('radiogroup', { name: t.presupuesto })).toBeNull();
    expect(screen.getByRole('radio', { name: 'Fondo enduro' })).toBeChecked();

    await elegir(nombresClase.gusto);
    expect(screen.queryByRole('radiogroup', { name: t.fondo })).toBeNull();
    await guardar();
    await terminarGuardado();

    expect(espia).toHaveBeenCalledWith({
      id: null,
      nombre: 'Repuestos',
      claseDefault: 'gusto',
      presupuestoId: null,
      fondoId: null,
      requiereVehiculo: true,
    });
  });

  it('volver a Esencial no recupera el Presupuesto limpiado', async () => {
    await abrir('nueva');
    await elegir('Comida');
    await elegir(nombresClase.gusto);
    await elegir(nombresClase.esencial);
    expect(screen.getByRole('radio', { name: t.sinPresupuesto })).toBeChecked();
  });

  it('sin Fondos vigentes no ofrece la clase Fondo protegido', async () => {
    useConfiguracionMock.mockReturnValue({ ...configuracion, fondos: [] });
    await abrir('nueva');
    expect(screen.queryByRole('radio', { name: nombresClase.fondo })).toBeNull();
  });

  it('un nombre repetido (también con una de sistema) muestra su error y no guarda', async () => {
    await abrir('nueva');
    await escribir(t.nombre, '  sin REGISTRAR ');
    await guardar();
    expect(ejecutarMock).not.toHaveBeenCalled();
    expect(screen.getByText(t.erroresNombreCategoria.nombreRepetido)).toBeTruthy();
  });

  it('nombre vacío → su error', async () => {
    await abrir('nueva');
    await guardar();
    expect(ejecutarMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(t.nombre).props.accessibilityHint).toBe(t.errores.nombreVacio);
  });

  it('edición: precarga, título, conserva el nombre propio y guarda con su id', async () => {
    const espia = jest.spyOn(comandoGuardar, 'guardarCategoria');
    await abrir('combustible');
    expect(titulo()).toBe(textosNavegacion.editarCategoria);
    expect(screen.getByLabelText(t.nombre).props.value).toBe('Combustible');
    expect(screen.getByRole('radio', { name: nombresClase.esencial })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Mantenimiento de vehículos' })).toBeChecked();
    expect(screen.getByRole('radio', { name: t.si })).toBeChecked();

    await guardar();
    await terminarGuardado();
    expect(espia).toHaveBeenCalledWith({
      id: 'combustible',
      nombre: 'Combustible',
      claseDefault: 'esencial',
      presupuestoId: 'mant',
      fondoId: null,
      requiereVehiculo: true,
    });
  });

  it('borrado en dos pasos con categorias.borrar', async () => {
    const espia = jest.spyOn(comandoBorrar, 'borrarCategoria');
    await abrir('salidas');
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    expect(ejecutarMock).not.toHaveBeenCalled();
    expect(screen.getByText(t.confirmarBorrar('Salidas'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.siBorrar }));
    await terminarGuardado();
    expect(espia).toHaveBeenCalledWith('salidas');
    expect(ejecutarMock.mock.calls[0][0].operacion).toBe('categorias.borrar');
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('si el borrado falla, avisa y no vuelve', async () => {
    ejecutarMock.mockReturnValue({ ok: false, error: 'fallo' });
    await abrir('salidas');
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    await fireEvent.press(screen.getByRole('button', { name: t.siBorrar }));
    await terminarGuardado();
    expect(screen.getByText(t.falloAlBorrar)).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
  });

  it.each(['sin-registrar', 'pago', 'no-existe'])('con el id %p muestra NoEncontrado y ningún campo', async (id) => {
    await abrir(id);
    expect(screen.getByText(t.noEncontrado)).toBeTruthy();
    expect(screen.queryByLabelText(t.nombre)).toBeNull();
    expect(screen.queryByRole('button', { name: t.guardar })).toBeNull();
  });
});
