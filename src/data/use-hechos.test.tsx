import { act, render, renderHook, screen } from '@testing-library/react-native';
import { Component, type ReactNode } from 'react';
import { Text } from 'react-native';

import { hechosVacios } from '@/domain/hechos';

import { avisarCambio } from './cambios';
import { obtenerDb } from './db';
import { crearBaseDePrueba } from './pruebas/base-en-memoria';
import { cargarHechos } from './queries/cargar-hechos';
import { cargarHechosActuales, useHechos } from './use-hechos';

// La base de prueba reemplaza a expo-sqlite (nunca se mockea expo-sqlite).
jest.mock('./db', () => ({ obtenerDb: jest.fn() }));
jest.mock('./queries/cargar-hechos', () => ({
  cargarHechos: jest.fn(jest.requireActual('./queries/cargar-hechos').cargarHechos),
}));

const cargarMock = jest.mocked(cargarHechos);
const obtenerDbMock = jest.mocked(obtenerDb);

let base: ReturnType<typeof crearBaseDePrueba>;

beforeEach(() => {
  // La caché de hechos es de módulo y se indexa por la versión de la señal:
  // un aviso la invalida para que cada prueba lea su propia base.
  avisarCambio();
  base = crearBaseDePrueba();
  obtenerDbMock.mockReturnValue(base.db as unknown as ReturnType<typeof obtenerDb>);
  cargarMock.mockClear();
  cargarMock.mockImplementation(jest.requireActual('./queries/cargar-hechos').cargarHechos);
});

afterEach(() => {
  base.cerrar();
});

class Barrera extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: undefined as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  render() {
    if (this.state.error !== undefined) {
      return <Text>{this.state.error instanceof Error ? this.state.error.message : 'otro'}</Text>;
    }
    return this.props.children;
  }
}

function Consumidor() {
  useHechos();
  return null;
}

describe('useHechos', () => {
  it('devuelve los hechos cargados de la base', async () => {
    const { result } = await renderHook(() => useHechos());
    expect(result.current).toEqual(hechosVacios);
    expect(cargarMock).toHaveBeenCalledTimes(1);
    expect(cargarMock).toHaveBeenCalledWith(base.db);
  });

  it('recarga cuando se avisa un cambio', async () => {
    const { result } = await renderHook(() => useHechos());
    const nuevos = { saldoInicial: { monto: 1, fecha: '2026-11-05' }, colchon: 0, pagos: [] };
    cargarMock.mockReturnValueOnce(nuevos);

    await act(async () => avisarCambio());

    expect(cargarMock).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual(nuevos);
  });

  it('si hubo un cambio entre la carga del render y la suscripción, recarga', async () => {
    const nuevos = { saldoInicial: { monto: 1, fecha: '2026-11-05' }, colchon: 0, pagos: [] };
    let primera = true;
    cargarMock.mockImplementation(() => {
      // Simula un commit justo después de la carga del render, antes del efecto.
      if (primera) {
        primera = false;
        avisarCambio();
        return hechosVacios;
      }
      return nuevos;
    });
    const { result } = await renderHook(() => useHechos());
    expect(result.current).toEqual(nuevos);
  });

  it('sin cambios entre la carga y la suscripción, no recarga', async () => {
    await renderHook(() => useHechos());
    expect(cargarMock).toHaveBeenCalledTimes(1);
  });

  it('al desmontar ya no recarga', async () => {
    const { unmount } = await renderHook(() => useHechos());
    await unmount();
    avisarCambio();
    expect(cargarMock).toHaveBeenCalledTimes(1);
  });

  describe('errores', () => {
    // React escribe en console.error los errores que captura un ErrorBoundary.
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('si la carga inicial falla, el error llega al ErrorBoundary', async () => {
      // Persistente: React reintenta el render una vez tras un error.
      cargarMock.mockImplementation(() => {
        throw new Error('carga inicial rota');
      });
      await render(
        <Barrera>
          <Consumidor />
        </Barrera>,
      );
      expect(screen.getByText('carga inicial rota')).toBeTruthy();
    });

    it('si una recarga falla, el error llega al ErrorBoundary y avisarCambio no lanza', async () => {
      await render(
        <Barrera>
          <Consumidor />
        </Barrera>,
      );
      // Persistente: React reintenta el render una vez y la recarga se repite
      // (un fallo pasajero se recupera solo).
      cargarMock.mockImplementation(() => {
        throw new Error('recarga rota');
      });
      await act(async () => {
        expect(() => avisarCambio()).not.toThrow();
      });
      expect(screen.getByText('recarga rota')).toBeTruthy();
    });

    it('si no se puede obtener la base, el error llega al ErrorBoundary', async () => {
      obtenerDbMock.mockImplementation(() => {
        throw new Error('sin base');
      });
      await render(
        <Barrera>
          <Consumidor />
        </Barrera>,
      );
      expect(screen.getByText('sin base')).toBeTruthy();
    });
  });
});

describe('caché por versión (N+1 cargas)', () => {
  function Dos() {
    return (
      <>
        <Consumidor />
        <Consumidor />
      </>
    );
  }

  it('dos consumidores y cargarHechosActuales en la misma versión leen una sola vez y comparten el objeto', async () => {
    const vistos: unknown[] = [];
    function Registra() {
      vistos.push(useHechos());
      return null;
    }
    await render(
      <>
        <Registra />
        <Registra />
      </>,
    );
    const actuales = cargarHechosActuales();
    expect(cargarMock).toHaveBeenCalledTimes(1);
    expect(vistos[0]).toBe(vistos[1]);
    expect(actuales).toBe(vistos[0]);
  });

  it('tras avisarCambio vuelve a cargar una sola vez', async () => {
    await render(<Dos />);
    expect(cargarMock).toHaveBeenCalledTimes(1);
    await act(async () => avisarCambio());
    cargarHechosActuales();
    expect(cargarMock).toHaveBeenCalledTimes(2);
  });

  it('una carga fallida no se guarda como éxito: la siguiente llamada reintenta', () => {
    cargarMock.mockImplementationOnce(() => {
      throw new Error('falló una vez');
    });
    expect(() => cargarHechosActuales()).toThrow('falló una vez');
    expect(cargarHechosActuales()).toEqual(hechosVacios);
    expect(cargarMock).toHaveBeenCalledTimes(2);
  });

  it('si hay un cambio durante la carga, esos hechos no quedan como los de la versión nueva', () => {
    const nuevos = { saldoInicial: null, colchon: 7, pagos: [] };
    cargarMock.mockImplementationOnce((db) => {
      avisarCambio();
      return jest.requireActual('./queries/cargar-hechos').cargarHechos(db);
    });
    cargarHechosActuales();
    cargarMock.mockReturnValueOnce(nuevos);
    expect(cargarHechosActuales()).toBe(nuevos);
  });
});

describe('cargarHechosActuales', () => {
  it('carga los hechos de la base de la app', () => {
    expect(cargarHechosActuales()).toEqual(hechosVacios);
    expect(cargarMock).toHaveBeenCalledWith(base.db);
  });
});
