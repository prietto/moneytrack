import { act, renderHook } from '@testing-library/react-native';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import { obtenerDb } from './db';
import { useMigraciones } from './migraciones';

// No se carga expo-sqlite: se prueba solo el ciclo de vida del hook.
jest.mock('./db', () => ({ obtenerDb: jest.fn(() => ({ base: 'falsa' })) }));
jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({ migrate: jest.fn() }));
jest.mock('../../drizzle/migrations', () => ({ journal: { entries: [] }, migrations: {} }));

const migrateMock = jest.mocked(migrate);
const obtenerDbMock = jest.mocked(obtenerDb);

beforeEach(() => {
  jest.clearAllMocks();
  obtenerDbMock.mockImplementation(() => ({ base: 'falsa' }) as unknown as ReturnType<typeof obtenerDb>);
});

describe('useMigraciones', () => {
  it('aplica las migraciones sobre la base y marca éxito', async () => {
    migrateMock.mockResolvedValue();
    const { result } = await renderHook(() => useMigraciones());
    await act(async () => {});
    expect(migrateMock).toHaveBeenCalledWith({ base: 'falsa' }, { journal: { entries: [] }, migrations: {} });
    expect(result.current).toMatchObject({ exito: true, error: undefined });
  });

  it('si migrar falla devuelve el error, y reintentar vuelve a intentarlo', async () => {
    const error = new Error('no migró');
    migrateMock.mockRejectedValueOnce(error).mockResolvedValueOnce();
    const { result } = await renderHook(() => useMigraciones());
    await act(async () => {});
    expect(result.current).toMatchObject({ exito: false, error });

    await act(async () => result.current.reintentar());
    expect(migrateMock).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ exito: true, error: undefined });
  });

  it('un fallo al abrir la base también llega como error, sin lanzar', async () => {
    const error = new Error('no abrió');
    obtenerDbMock.mockImplementationOnce(() => {
      throw error;
    });
    const { result } = await renderHook(() => useMigraciones());
    await act(async () => {});
    expect(result.current).toMatchObject({ exito: false, error });
    expect(migrateMock).not.toHaveBeenCalled();
  });

  it('un fallo que no es Error se envuelve en un Error', async () => {
    migrateMock.mockRejectedValue('texto');
    const { result } = await renderHook(() => useMigraciones());
    await act(async () => {});
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('un intento anterior que termina tarde no pisa el resultado del vigente', async () => {
    const pendientes: { resolver: () => void; rechazar: (e: Error) => void }[] = [];
    migrateMock.mockImplementation(
      () => new Promise<void>((resolve, reject) => pendientes.push({ resolver: resolve, rechazar: reject })),
    );
    const { result } = await renderHook(() => useMigraciones());
    // Reintentar con el primer intento aún en curso: el primero deja de ser vigente.
    await act(async () => result.current.reintentar());
    expect(pendientes).toHaveLength(2);

    const error = new Error('falló el vigente');
    await act(async () => pendientes[1].rechazar(error));
    await act(async () => pendientes[0].resolver());
    expect(result.current).toMatchObject({ exito: false, error });
  });
});
