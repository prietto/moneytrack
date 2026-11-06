import { act, renderHook } from '@testing-library/react-native';

import { hoy, suscribirHoy } from '@/services/reloj';

import { useHoy } from './use-hoy';

jest.mock('@/services/reloj', () => ({ hoy: jest.fn(), suscribirHoy: jest.fn() }));

const hoyMock = jest.mocked(hoy);
const suscribirMock = jest.mocked(suscribirHoy);

let avisar: (hoy: string) => void;
let cancelar: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  hoyMock.mockReturnValue('2026-11-05');
  cancelar = jest.fn();
  suscribirMock.mockImplementation((cb) => {
    avisar = cb;
    return cancelar;
  });
});

describe('useHoy', () => {
  it('empieza con hoy() y se suscribe una vez', async () => {
    const { result } = await renderHook(() => useHoy());
    expect(result.current).toBe('2026-11-05');
    expect(suscribirMock).toHaveBeenCalledTimes(1);
  });

  it('se actualiza cuando el reloj avisa otro día', async () => {
    const { result } = await renderHook(() => useHoy());
    hoyMock.mockReturnValue('2026-11-06');
    await act(async () => avisar('2026-11-06'));
    expect(result.current).toBe('2026-11-06');
  });

  it('un aviso con el mismo día no re-renderiza', async () => {
    let renders = 0;
    await renderHook(() => {
      renders += 1;
      return useHoy();
    });
    const antes = renders;
    await act(async () => avisar('2026-11-05'));
    expect(renders).toBe(antes);
  });

  it('cancela la suscripción al desmontar', async () => {
    const { unmount } = await renderHook(() => useHoy());
    expect(cancelar).not.toHaveBeenCalled();
    await unmount();
    expect(cancelar).toHaveBeenCalledTimes(1);
  });

  it('si el día cambió entre el render y la suscripción, se actualiza', async () => {
    // La medianoche cae justo después del render, al suscribirse.
    suscribirMock.mockImplementation(() => {
      hoyMock.mockReturnValue('2026-11-06');
      return cancelar;
    });
    const { result } = await renderHook(() => useHoy());
    expect(result.current).toBe('2026-11-06');
  });
});
