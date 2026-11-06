import { fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler, Keyboard } from 'react-native';

import RootLayout, { ErrorBoundary } from '@/app/_layout';
import { type Acceso, useAcceso } from '@/hooks/use-acceso';
import { type EstadoMigraciones, useMigraciones } from '@/data/migraciones';
import { log } from '@/services/log';
import { textosAcceso } from '@/textos/acceso';
import { textosApp } from '@/textos/app';
import { textosError } from '@/textos/errores';

jest.mock('expo-router', () => {
  const { View } = jest.requireActual('react-native');
  return { Stack: () => <View testID="stack" /> };
});
jest.mock('@/hooks/use-acceso', () => ({ useAcceso: jest.fn() }));
// No se carga expo-sqlite en Jest.
jest.mock('@/data/migraciones', () => ({ useMigraciones: jest.fn() }));
jest.mock('@/services/log', () => ({
  log: { info: jest.fn(), aviso: jest.fn(), error: jest.fn() },
  instalarRegistroDeErroresGlobales: jest.fn(),
}));

type ManejadorAtras = Parameters<typeof BackHandler.addEventListener>[1];

const useAccesoMock = jest.mocked(useAcceso);
const useMigracionesMock = jest.mocked(useMigraciones);

function acceso(cambios: Partial<Acceso> = {}): Acceso {
  return { estado: 'desbloqueado', cubierto: false, haDesbloqueado: true, desbloquear: jest.fn(), ...cambios };
}

function migraciones(cambios: Partial<EstadoMigraciones> = {}): EstadoMigraciones {
  return { exito: true, reintentar: jest.fn(), ...cambios };
}

beforeEach(() => {
  jest.clearAllMocks();
  useAccesoMock.mockReturnValue(acceso());
  useMigracionesMock.mockReturnValue(migraciones());
});

describe('RootLayout', () => {
  it('pide el diálogo con los textos de textos/acceso', async () => {
    await render(<RootLayout />);
    expect(useAccesoMock).toHaveBeenCalledWith(textosAcceso.dialogo);
  });

  it('sin desbloquear muestra la pantalla de bloqueo y no monta el Stack', async () => {
    const desbloquear = jest.fn();
    useAccesoMock.mockReturnValue(acceso({ estado: 'bloqueado', haDesbloqueado: false, desbloquear }));
    await render(<RootLayout />);

    expect(screen.getByTestId('pantalla-bloqueo')).toBeTruthy();
    expect(screen.queryByTestId('stack')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: textosAcceso.reintentar }));
    expect(desbloquear).toHaveBeenCalledTimes(1);
  });

  it('sin desbloquear tampoco muestra el error de migración', async () => {
    useAccesoMock.mockReturnValue(acceso({ estado: 'verificando', haDesbloqueado: false }));
    useMigracionesMock.mockReturnValue(migraciones({ exito: false, error: new Error('x') }));
    await render(<RootLayout />);

    expect(screen.getByTestId('pantalla-bloqueo')).toBeTruthy();
    expect(screen.queryByText(textosApp.errorMigracion)).toBeNull();
  });

  it('desbloqueado y con las migraciones listas monta el Stack sin capa', async () => {
    await render(<RootLayout />);
    expect(screen.getByTestId('stack')).toBeTruthy();
    expect(screen.queryByTestId('pantalla-bloqueo')).toBeNull();
  });

  it('desbloqueado mientras migra muestra el indicador', async () => {
    useMigracionesMock.mockReturnValue(migraciones({ exito: false }));
    await render(<RootLayout />);
    expect(screen.getByLabelText(textosApp.preparandoDatos)).toBeTruthy();
    expect(screen.queryByTestId('stack')).toBeNull();
  });

  it.each([
    ['re-bloqueado', { estado: 'bloqueado' as const }],
    ['verificando de nuevo', { estado: 'verificando' as const }],
    ['cubierto en segundo plano', { cubierto: true }],
  ])('%s: conserva el Stack y lo tapa con la capa de bloqueo', async (_caso, cambios) => {
    useAccesoMock.mockReturnValue(acceso(cambios));
    await render(<RootLayout />);
    // Montado (se conserva la navegación), pero oculto al lector de pantalla.
    expect(screen.getByTestId('stack', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('stack')).toBeNull();
    expect(screen.getByTestId('pantalla-bloqueo')).toBeTruthy();
  });

  it('tapado, el Stack se oculta a TalkBack y a VoiceOver, se cierra el teclado y el botón atrás no llega a él', async () => {
    const cerrarTeclado = jest.spyOn(Keyboard, 'dismiss');
    const remove = jest.fn();
    let manejador: ManejadorAtras | undefined;
    const espia = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_tipo, fn) => {
      manejador = fn;
      return { remove };
    });
    useAccesoMock.mockReturnValue(acceso({ cubierto: true }));
    const { rerender } = await render(<RootLayout />);

    expect(screen.getByTestId('stack', { includeHiddenElements: true }).parent?.props).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    });
    expect(cerrarTeclado).toHaveBeenCalled();
    cerrarTeclado.mockRestore();
    expect(espia).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    expect(manejador?.({} as Parameters<ManejadorAtras>[0])).toBe(true);

    useAccesoMock.mockReturnValue(acceso());
    await rerender(<RootLayout />);
    expect(remove).toHaveBeenCalledTimes(1);
    espia.mockRestore();
  });

  it.each([
    ['desbloqueado y sin tapar', acceso()],
    ['en la primera pantalla de bloqueo', acceso({ estado: 'bloqueado', haDesbloqueado: false, error: 'sinBloqueo' })],
  ])('%s no intercepta el botón atrás', async (_caso, valor) => {
    const espia = jest.spyOn(BackHandler, 'addEventListener');
    useAccesoMock.mockReturnValue(valor);
    await render(<RootLayout />);
    expect(espia).not.toHaveBeenCalled();
    espia.mockRestore();
  });

  it.each([
    ['el error de migración', migraciones({ exito: false, error: new Error('x') }), textosApp.errorMigracion],
    ['la carga', migraciones({ exito: false }), undefined],
  ])('re-bloqueado sobre %s, la capa lo tapa', async (_caso, valor, texto) => {
    useAccesoMock.mockReturnValue(acceso({ estado: 'bloqueado' }));
    useMigracionesMock.mockReturnValue(valor);
    await render(<RootLayout />);
    expect(screen.getByTestId('pantalla-bloqueo')).toBeTruthy();
    if (texto) {
      expect(screen.queryByText(texto)).toBeNull();
      expect(screen.getByText(texto, { includeHiddenElements: true })).toBeTruthy();
    }
  });

  it('con error de migración muestra el texto, registra y permite reintentar', async () => {
    const error = new Error('no migró');
    const reintentar = jest.fn();
    useMigracionesMock.mockReturnValue(migraciones({ exito: false, error, reintentar }));
    await render(<RootLayout />);

    expect(screen.getByText(textosApp.errorMigracion)).toBeTruthy();
    expect(screen.queryByTestId('stack')).toBeNull();
    expect(log.error).toHaveBeenCalledWith('migraciones.aplicar', { error });
    await fireEvent.press(screen.getByRole('button', { name: textosApp.reintentar }));
    expect(reintentar).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorBoundary', () => {
  it('muestra el error amable sin detalles técnicos, registra y reintenta', async () => {
    const error = new Error('detalle técnico 1.350.000');
    const retry = jest.fn(() => Promise.resolve());
    await render(<ErrorBoundary error={error} retry={retry} />);

    expect(screen.getByText(textosError.mensaje)).toBeTruthy();
    expect(screen.queryByText(/detalle técnico/)).toBeNull();
    expect(screen.queryByText(/1\.350\.000/)).toBeNull();
    expect(log.error).toHaveBeenCalledWith('app.errorBoundary', { error });

    await fireEvent.press(screen.getByRole('button', { name: textosError.reintentar }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
