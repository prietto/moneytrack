import { act, renderHook } from '@testing-library/react-native';

import { useGuardadoDiferido } from './use-guardado-diferido';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useGuardadoDiferido', () => {
  it('corre la acción en el tick siguiente y marca guardando mientras tanto', async () => {
    const accion = jest.fn();
    const { result } = await renderHook(() => useGuardadoDiferido());

    await act(async () => result.current.diferir(accion));
    expect(result.current.guardando).toBe(true);
    expect(result.current.ocupado()).toBe(true);
    expect(accion).not.toHaveBeenCalled();

    await act(async () => jest.runAllTimers());
    expect(accion).toHaveBeenCalledTimes(1);
    expect(result.current.guardando).toBe(false);
    expect(result.current.ocupado()).toBe(false);
  });

  it('dos llamadas en el mismo frame (sin re-render entre ellas) corren la acción una sola vez', async () => {
    const accion = jest.fn();
    const { result } = await renderHook(() => useGuardadoDiferido());

    await act(async () => {
      const { diferir } = result.current;
      diferir(accion);
      diferir(accion);
    });
    await act(async () => jest.runAllTimers());
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('al desmontar antes del tick, la acción no corre', async () => {
    const accion = jest.fn();
    const { result, unmount } = await renderHook(() => useGuardadoDiferido());

    await act(async () => result.current.diferir(accion));
    await act(async () => unmount());
    await act(async () => jest.runAllTimers());
    expect(accion).not.toHaveBeenCalled();
  });
});
