import {
  ANTIGUEDAD_MAXIMA_SALDO_DIAS,
  erroresPago,
  erroresSaldoYColchon,
  leerDia,
  leerMonto,
  validarPago,
  validarSaldoYColchon,
} from './entrada';

const HOY = '2026-11-05';

describe('leerMonto', () => {
  it.each([
    ['2.000.000', 2_000_000],
    ['2000000', 2_000_000],
    [' 2 000 000 ', 2_000_000],
    ['0', 0],
    ['999', 999],
    ['1.000', 1000],
    ['007', 7],
    ['9007199254740991', Number.MAX_SAFE_INTEGER],
    ['9.007.199.254.740.991', Number.MAX_SAFE_INTEGER],
  ])('%p → %p', (texto, esperado) => {
    expect(leerMonto(texto)).toBe(esperado);
  });

  it.each(['', '   ', 'abc', '12a', '1,5', '1.5', '2.00.000', '2..000', '.000', '1.000.', '-5', '+5', '1e6', '9007199254740992'])(
    '%p → null',
    (texto) => {
      expect(leerMonto(texto)).toBeNull();
    },
  );
});

describe('leerDia', () => {
  it.each([
    ['1', 1],
    ['10', 10],
    [' 31 ', 31],
    ['05', 5],
  ])('%p → %p', (texto, esperado) => {
    expect(leerDia(texto)).toBe(esperado);
  });

  it.each(['', '0', '32', '1,5', '1.5', '-1', 'x', '100'])('%p → null', (texto) => {
    expect(leerDia(texto)).toBeNull();
  });
});

describe('validarPago', () => {
  it('acepta un Pago válido', () => {
    expect(validarPago({ dia: 10, montoEsperado: 2_000_000 })).toEqual({
      ok: true,
      valor: { dia: 10, montoEsperado: 2_000_000 },
    });
  });

  it.each([
    [{ dia: 1, montoEsperado: 1 }],
    [{ dia: 31, montoEsperado: Number.MAX_SAFE_INTEGER }],
  ])('acepta los bordes %p', (datos) => {
    expect(validarPago(datos).ok).toBe(true);
  });

  it.each([
    [{ dia: 0, montoEsperado: 1 }, 'diaInvalido'],
    [{ dia: 32, montoEsperado: 1 }, 'diaInvalido'],
    [{ dia: 1.5, montoEsperado: 1 }, 'diaInvalido'],
    [{ dia: null, montoEsperado: 1 }, 'diaInvalido'],
    [{ dia: 10, montoEsperado: 0 }, 'montoInvalido'],
    [{ dia: 10, montoEsperado: -5 }, 'montoInvalido'],
    [{ dia: 10, montoEsperado: 1.5 }, 'montoInvalido'],
    [{ dia: 10, montoEsperado: Number.MAX_SAFE_INTEGER + 1 }, 'montoInvalido'],
    [{ dia: 10, montoEsperado: null }, 'montoInvalido'],
    [{ dia: 0, montoEsperado: 0 }, 'diaInvalido'],
  ])('%p → %p', (datos, error) => {
    expect(validarPago(datos)).toEqual({ ok: false, error });
  });

  it('erroresPago marca cada campo con su error', () => {
    expect(erroresPago({ dia: 0, montoEsperado: 0 })).toEqual({ dia: 'diaInvalido', montoEsperado: 'montoInvalido' });
    expect(erroresPago({ dia: 10, montoEsperado: 1 })).toEqual({});
  });
});

describe('validarSaldoYColchon', () => {
  it('acepta datos válidos', () => {
    expect(validarSaldoYColchon({ monto: 10_000_000, fecha: '2026-11-03', colchon: 4_000_000 }, HOY)).toEqual({
      ok: true,
      valor: { monto: 10_000_000, fecha: '2026-11-03', colchon: 4_000_000 },
    });
  });

  it.each([
    [{ monto: 0, fecha: HOY, colchon: 0 }],
    [{ monto: Number.MAX_SAFE_INTEGER, fecha: HOY, colchon: Number.MAX_SAFE_INTEGER }],
  ])('acepta los bordes (saldo y Colchón 0, fecha igual a hoy, máximo seguro) %p', (datos) => {
    expect(validarSaldoYColchon(datos, HOY).ok).toBe(true);
  });

  it.each([
    [{ monto: -1, fecha: HOY, colchon: 0 }, 'montoInvalido'],
    [{ monto: 1.5, fecha: HOY, colchon: 0 }, 'montoInvalido'],
    [{ monto: null, fecha: HOY, colchon: 0 }, 'montoInvalido'],
    [{ monto: Number.MAX_SAFE_INTEGER + 1, fecha: HOY, colchon: 0 }, 'montoInvalido'],
    [{ monto: 1, fecha: '', colchon: 0 }, 'fechaInvalida'],
    [{ monto: 1, fecha: '2026-02-30', colchon: 0 }, 'fechaInvalida'],
    [{ monto: 1, fecha: '05/11/2026', colchon: 0 }, 'fechaInvalida'],
    [{ monto: 1, fecha: '2026-11-06', colchon: 0 }, 'fechaFutura'],
    [{ monto: 1, fecha: '2026-09-03', colchon: 0 }, 'fechaAntigua'],
    [{ monto: 1, fecha: '2016-11-05', colchon: 0 }, 'fechaAntigua'],
    [{ monto: 1, fecha: HOY, colchon: -1 }, 'colchonInvalido'],
    [{ monto: 1, fecha: HOY, colchon: null }, 'colchonInvalido'],
    [{ monto: 1, fecha: HOY, colchon: 0.5 }, 'colchonInvalido'],
  ])('%p → %p', (datos, error) => {
    expect(validarSaldoYColchon(datos, HOY)).toEqual({ ok: false, error });
  });

  it('erroresSaldoYColchon marca cada campo con su error', () => {
    expect(erroresSaldoYColchon({ monto: null, fecha: '2026-11-06', colchon: null }, HOY)).toEqual({
      monto: 'montoInvalido',
      fecha: 'fechaFutura',
      colchon: 'colchonInvalido',
    });
  });

  it('acepta una fecha nueva de hasta ANTIGUEDAD_MAXIMA_SALDO_DIAS días atrás, inclusive', () => {
    expect(ANTIGUEDAD_MAXIMA_SALDO_DIAS).toBe(62);
    expect(validarSaldoYColchon({ monto: 1, fecha: '2026-09-04', colchon: 0 }, HOY).ok).toBe(true);
  });

  it('acepta la fecha guardada aunque ya sea antigua (editar solo el Colchón)', () => {
    expect(validarSaldoYColchon({ monto: 1, fecha: '2026-01-15', colchon: 0 }, HOY, '2026-01-15').ok).toBe(true);
    expect(validarSaldoYColchon({ monto: 1, fecha: '2026-01-14', colchon: 0 }, HOY, '2026-01-15')).toEqual({
      ok: false,
      error: 'fechaAntigua',
    });
  });
});
