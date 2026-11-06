/** @jest-environment node */
import { formatearDinero } from './dinero';

describe('formatearDinero', () => {
  it.each([
    [0, '0'],
    [-0, '0'],
    [5, '5'],
    [999, '999'],
    [1000, '1.000'],
    [1350000, '1.350.000'],
    [-1350000, '-1.350.000'],
    [-500, '-500'],
    [1000000000, '1.000.000.000'],
    [Number.MAX_SAFE_INTEGER, '9.007.199.254.740.991'],
    [Number.MIN_SAFE_INTEGER, '-9.007.199.254.740.991'],
  ])('%p → %p', (monto, esperado) => {
    expect(formatearDinero(monto)).toBe(esperado);
  });

  it.each([1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'lanza RangeError con %p sin incluir el valor en el mensaje',
    (monto) => {
      expect(() => formatearDinero(monto)).toThrow(RangeError);
      expect(() => formatearDinero(monto)).toThrow('formatearDinero espera un entero de pesos');
    },
  );
});
