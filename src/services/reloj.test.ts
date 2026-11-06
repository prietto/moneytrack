import { AppState, type AppStateStatus } from 'react-native';

import { hoy, suscribirHoy } from './reloj';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;

let cambiarEstadoApp: ((estado: AppStateStatus) => void) | undefined;
let remove: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  remove = jest.fn();
  cambiarEstadoApp = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_tipo, manejador) => {
    cambiarEstadoApp = manejador as (estado: AppStateStatus) => void;
    return { remove } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('hoy', () => {
  it('a las 23:59:59 de Bogotá sigue siendo el día anterior', () => {
    jest.setSystemTime(new Date('2026-11-06T04:59:59.999Z'));
    expect(hoy()).toBe('2026-11-05');
  });

  it('a las 00:00:00 de Bogotá ya es el nuevo día', () => {
    jest.setSystemTime(new Date('2026-11-06T05:00:00.000Z'));
    expect(hoy()).toBe('2026-11-06');
  });

  it.each([
    '2026-11-05T04:59:59.000Z',
    '2026-11-05T05:00:00.000Z',
    '2026-12-31T23:30:00.000Z',
    '2027-01-01T04:59:00.000Z',
    '2028-02-29T12:00:00.000Z',
    '2026-03-08T07:00:00.000Z', // cambio de horario en EE. UU.: Colombia no cambia
    '2026-06-15T18:00:00.000Z',
  ])('coincide con Intl America/Bogota en %s', (instante) => {
    jest.setSystemTime(new Date(instante));
    const conIntl = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(instante));
    expect(hoy()).toBe(conIntl);
  });
});

describe('suscribirHoy', () => {
  it('avisa una sola vez al pasar la medianoche de Bogotá', () => {
    jest.setSystemTime(new Date('2026-11-06T02:30:00.000Z')); // 21:30 en Bogotá
    const cb = jest.fn();
    suscribirHoy(cb);

    jest.advanceTimersByTime(2 * HORA + 29 * MINUTO); // 23:59
    expect(cb).not.toHaveBeenCalled();

    jest.advanceTimersByTime(MINUTO); // 00:00
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('2026-11-06');

    jest.advanceTimersByTime(23 * HORA);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('con el tope de 60 min no hay avisos espurios si el día no cambió', () => {
    jest.setSystemTime(new Date('2026-11-05T06:00:00.000Z')); // 01:00 en Bogotá
    const cb = jest.fn();
    suscribirHoy(cb);

    jest.advanceTimersByTime(22 * HORA); // 23:00: el tope disparó varias veces
    expect(cb).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(1);
  });

  it('ninguna espera supera los 60 min', () => {
    jest.setSystemTime(new Date('2026-11-05T06:00:00.000Z'));
    const espia = jest.spyOn(globalThis, 'setTimeout');
    suscribirHoy(jest.fn());
    jest.advanceTimersByTime(5 * HORA);
    const esperas = espia.mock.calls.map((llamada) => llamada[1] ?? 0);
    expect(esperas.length).toBeGreaterThan(1);
    expect(Math.max(...esperas)).toBeLessThanOrEqual(HORA);
  });

  it('si el reloj retrocede, avisa el nuevo valor una vez y no entra en bucle', () => {
    jest.setSystemTime(new Date('2026-11-05T15:00:00.000Z'));
    const cb = jest.fn();
    suscribirHoy(cb);

    jest.setSystemTime(new Date('2026-11-03T15:00:00.000Z'));
    jest.advanceTimersByTime(HORA);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('2026-11-03');

    jest.advanceTimersByTime(3 * HORA);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("al volver a 'active' avisa siempre, aunque el día no haya cambiado", () => {
    jest.setSystemTime(new Date('2026-11-05T15:00:00.000Z'));
    const cb = jest.fn();
    suscribirHoy(cb);

    cambiarEstadoApp?.('active');
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('2026-11-05');
  });

  it("al volver a 'active' tras pasar la medianoche en segundo plano trae el nuevo día", () => {
    jest.setSystemTime(new Date('2026-11-05T15:00:00.000Z'));
    const cb = jest.fn();
    suscribirHoy(cb);

    // En segundo plano Android congela los timers: el reloj avanza sin dispararlos.
    jest.setSystemTime(new Date('2026-11-06T15:00:00.000Z'));
    cambiarEstadoApp?.('active');
    expect(cb).toHaveBeenCalledWith('2026-11-06');

    // El timer pendiente, al disparar, no repite el aviso del mismo día.
    jest.advanceTimersByTime(HORA);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it.each<AppStateStatus>(['background', 'inactive'])("con '%s' no avisa", (estado) => {
    jest.setSystemTime(new Date('2026-11-05T15:00:00.000Z'));
    const cb = jest.fn();
    suscribirHoy(cb);
    cambiarEstadoApp?.(estado);
    expect(cb).not.toHaveBeenCalled();
  });

  it('tras cancelar no avisa ni por el timer ni por AppState, y quita la suscripción', () => {
    jest.setSystemTime(new Date('2026-11-06T04:30:00.000Z')); // 23:30 en Bogotá
    const cb = jest.fn();
    const cancelar = suscribirHoy(cb);
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    cancelar();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);

    jest.advanceTimersByTime(2 * HORA);
    cambiarEstadoApp?.('active');
    expect(cb).not.toHaveBeenCalled();
  });
});
