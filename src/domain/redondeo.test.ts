import { dividirHaciaAbajo, dividirHaciaArriba } from './redondeo';

describe('dividirHaciaArriba / dividirHaciaAbajo', () => {
  it('división exacta', () => {
    expect(dividirHaciaArriba(12, 12)).toBe(1);
    expect(dividirHaciaAbajo(12, 12)).toBe(1);
    expect(dividirHaciaArriba(0, 12)).toBe(0);
    expect(dividirHaciaAbajo(0, 12)).toBe(0);
  });

  it('división inexacta: lo que se reserva sube, lo disponible baja', () => {
    expect(dividirHaciaArriba(13, 12)).toBe(2);
    expect(dividirHaciaAbajo(13, 12)).toBe(1);
    expect(dividirHaciaArriba(1_350_000, 12)).toBe(112_500);
    expect(dividirHaciaArriba(1_350_001, 12)).toBe(112_501);
  });

  it('negativos', () => {
    expect(dividirHaciaArriba(-13, 12)).toBe(-1);
    expect(dividirHaciaAbajo(-13, 12)).toBe(-2);
    expect(dividirHaciaArriba(-12, 12)).toBe(-1);
    expect(dividirHaciaAbajo(-12, 12)).toBe(-1);
  });

  it('Number.MAX_SAFE_INTEGER ÷ 7 coincide con BigInt', () => {
    const max = Number.MAX_SAFE_INTEGER;
    const abajo = BigInt(max) / 7n; // BigInt trunca; con positivos es piso
    const arriba = abajo + (BigInt(max) % 7n === 0n ? 0n : 1n);
    expect(BigInt(dividirHaciaAbajo(max, 7))).toBe(abajo);
    expect(BigInt(dividirHaciaArriba(max, 7))).toBe(arriba);
    expect(BigInt(dividirHaciaAbajo(-max, 7))).toBe(-arriba);
    expect(BigInt(dividirHaciaArriba(-max, 7))).toBe(-abajo);
  });

  it.each([0, -1, -12])('con divisor %p devuelve 0 en vez de lanzar', (divisor) => {
    expect(dividirHaciaArriba(13, divisor)).toBe(0);
    expect(dividirHaciaAbajo(13, divisor)).toBe(0);
  });

  it('con dividendo -0 devuelve 0, no -0', () => {
    expect(Object.is(dividirHaciaAbajo(-0, 3), 0)).toBe(true);
    expect(Object.is(dividirHaciaArriba(-0, 3), 0)).toBe(true);
  });

  it.each([2 ** 60 + 1, 1e20, 1e300, -1e300])('con dividendo %p fuera del rango seguro devuelve 0', (dividendo) => {
    expect(dividirHaciaArriba(dividendo, 7)).toBe(0);
    expect(dividirHaciaAbajo(dividendo, 7)).toBe(0);
  });

  it('con divisor no entero devuelve 0', () => {
    expect(dividirHaciaArriba(13, 1.5)).toBe(0);
    expect(dividirHaciaAbajo(13, 1.5)).toBe(0);
  });

  it('siempre devuelve enteros', () => {
    for (let a = -50; a <= 50; a++) {
      for (const b of [1, 3, 7, 12]) {
        expect(Number.isInteger(dividirHaciaArriba(a, b))).toBe(true);
        expect(Number.isInteger(dividirHaciaAbajo(a, b))).toBe(true);
        // `+ 0` convierte el -0 de Math.ceil en 0: los helpers nunca devuelven -0.
        expect(dividirHaciaArriba(a, b)).toBe(Math.ceil(a / b) + 0);
        expect(dividirHaciaAbajo(a, b)).toBe(Math.floor(a / b) + 0);
        expect(Object.is(dividirHaciaArriba(a, b), -0)).toBe(false);
        expect(Object.is(dividirHaciaAbajo(a, b), -0)).toBe(false);
      }
    }
  });
});
