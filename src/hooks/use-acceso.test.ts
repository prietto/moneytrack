import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import type { Resultado } from '@/domain/resultado';
import { autenticar, type ErrorAcceso } from '@/services/biometria';
import { log } from '@/services/log';

import { useAcceso } from './use-acceso';

jest.mock('@/services/biometria', () => ({
  ...jest.requireActual('@/services/biometria'),
  autenticar: jest.fn(),
}));
// biometria importa log, y log importa expo-file-system: no hace falta en estas pruebas.
jest.mock('@/services/log', () => ({ log: { info: jest.fn(), aviso: jest.fn(), error: jest.fn() } }));

const autenticarMock = jest.mocked(autenticar);
const mensajes = { promptMessage: 'Confirma', cancelLabel: 'Cancelar' };
const MINUTO = 60_000;
const INICIO = new Date('2026-11-05T12:00:00.000Z').getTime();

type Resolver = (r: Resultado<void, ErrorAcceso>) => void;

let cambiarEstadoApp: (estado: AppStateStatus) => void;
let remove: jest.Mock;
let pendientes: Resolver[];

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(INICIO);
  pendientes = [];
  autenticarMock.mockReset();
  // Cada intento queda pendiente hasta que la prueba lo resuelve.
  autenticarMock.mockImplementation(() => new Promise((resolve) => pendientes.push(resolve)));
  remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_tipo, manejador) => {
    cambiarEstadoApp = manejador as (estado: AppStateStatus) => void;
    return { remove } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function responder(resultado: Resultado<void, ErrorAcceso>) {
  const resolver = pendientes.shift();
  if (!resolver) throw new Error('no hay un intento pendiente');
  await act(async () => resolver(resultado));
}

async function montarDesbloqueado() {
  const hook = await renderHook(() => useAcceso(mensajes));
  await responder({ ok: true, valor: undefined });
  return hook;
}

async function moverApp(estado: AppStateStatus) {
  await act(async () => cambiarEstadoApp(estado));
}

describe('useAcceso', () => {
  it('al montar lanza un solo intento automático y queda verificando', async () => {
    const { result } = await renderHook(() => useAcceso(mensajes));
    expect(autenticarMock).toHaveBeenCalledTimes(1);
    expect(autenticarMock).toHaveBeenCalledWith(mensajes);
    expect(result.current.estado).toBe('verificando');
    expect(result.current.haDesbloqueado).toBe(false);
  });

  it('con éxito queda desbloqueado', async () => {
    const { result } = await montarDesbloqueado();
    expect(result.current).toMatchObject({ estado: 'desbloqueado', haDesbloqueado: true, cubierto: false });
    expect(result.current.error).toBeUndefined();
  });

  it('si se cancela queda bloqueado con el error y no reintenta solo', async () => {
    const { result } = await renderHook(() => useAcceso(mensajes));
    await responder({ ok: false, error: 'cancelado' });

    expect(result.current).toMatchObject({ estado: 'bloqueado', error: 'cancelado', haDesbloqueado: false });
    await act(async () => jest.advanceTimersByTime(10 * MINUTO));
    expect(autenticarMock).toHaveBeenCalledTimes(1);
  });

  it('desbloquear() tras un fallo reintenta, y dos toques seguidos lanzan un solo intento', async () => {
    const { result } = await renderHook(() => useAcceso(mensajes));
    await responder({ ok: false, error: 'cancelado' });

    await act(async () => {
      result.current.desbloquear();
      result.current.desbloquear();
    });
    expect(autenticarMock).toHaveBeenCalledTimes(2);
    expect(result.current.estado).toBe('verificando');

    await responder({ ok: true, valor: undefined });
    expect(result.current.estado).toBe('desbloqueado');
  });

  it('si autenticar llegara a rechazar, queda bloqueado con "fallo" y se puede reintentar', async () => {
    const error = new Error('inesperado');
    autenticarMock.mockImplementationOnce(() => Promise.reject(error));
    const { result } = await renderHook(() => useAcceso(mensajes));
    await act(async () => {});
    expect(result.current).toMatchObject({ estado: 'bloqueado', error: 'fallo' });
    expect(log.error).toHaveBeenCalledWith('acceso.desbloquear', { error });

    await act(async () => result.current.desbloquear());
    expect(autenticarMock).toHaveBeenCalledTimes(2);
    await responder({ ok: true, valor: undefined });
    expect(result.current.estado).toBe('desbloqueado');
  });

  it('al pasar a segundo plano cubre el contenido al instante', async () => {
    const { result } = await montarDesbloqueado();
    await moverApp('background');
    expect(result.current.cubierto).toBe(true);
    expect(result.current.estado).toBe('desbloqueado');
  });

  it('si vuelve a los 4 minutos descubre sin autenticar', async () => {
    const { result } = await montarDesbloqueado();
    await moverApp('background');
    jest.setSystemTime(INICIO + 4 * MINUTO);
    await moverApp('active');

    expect(result.current).toMatchObject({ estado: 'desbloqueado', cubierto: false });
    expect(autenticarMock).toHaveBeenCalledTimes(1);
  });

  it('si vuelve a los 5 minutos exactos no pide', async () => {
    const { result } = await montarDesbloqueado();
    await moverApp('background');
    jest.setSystemTime(INICIO + 5 * MINUTO);
    await moverApp('active');
    expect(result.current.estado).toBe('desbloqueado');
    expect(autenticarMock).toHaveBeenCalledTimes(1);
  });

  it('si vuelve a los 5 minutos + 1 ms se bloquea y lanza un intento', async () => {
    const { result } = await montarDesbloqueado();
    await moverApp('background');
    jest.setSystemTime(INICIO + 5 * MINUTO + 1);
    await moverApp('active');

    expect(autenticarMock).toHaveBeenCalledTimes(2);
    expect(result.current.estado).toBe('verificando');
    expect(result.current.haDesbloqueado).toBe(true);

    await responder({ ok: true, valor: undefined });
    expect(result.current).toMatchObject({ estado: 'desbloqueado', cubierto: false });
  });

  it('ignora los cambios de AppState mientras hay un intento en curso', async () => {
    const { result } = await renderHook(() => useAcceso(mensajes));
    // En Android el PIN del teléfono abre otra actividad: background y active.
    await moverApp('background');
    jest.setSystemTime(INICIO + 10 * MINUTO);
    await moverApp('active');

    expect(autenticarMock).toHaveBeenCalledTimes(1);
    expect(result.current.cubierto).toBe(false);

    await responder({ ok: true, valor: undefined });
    expect(result.current).toMatchObject({ estado: 'desbloqueado', cubierto: false });
  });

  it('ignora inactive', async () => {
    const { result } = await montarDesbloqueado();
    await moverApp('inactive');
    expect(result.current.cubierto).toBe(false);
  });

  it('al desmontar quita la suscripción a AppState', async () => {
    const { unmount } = await montarDesbloqueado();
    await unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
