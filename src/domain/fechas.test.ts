import { diasDelMes, diasEntre, esFechaValida, fechaEnMes, mesDe, sumarDias, sumarMeses } from './fechas';

describe('esFechaValida', () => {
  it.each(['2026-11-05', '1970-01-01', '2099-12-31', '2028-02-29', '2000-02-29'])('acepta %s', (fecha) => {
    expect(esFechaValida(fecha)).toBe(true);
  });

  it.each(['2026-1-5', '2026-13-01', '2026-02-30', '', '2027-02-29', '1900-02-29', '2026-00-10', '2026-04-31', ' 2026-11-05', '2026-11-05T00:00'])(
    'rechaza %p',
    (fecha) => {
      expect(esFechaValida(fecha)).toBe(false);
    },
  );
});

describe('sumarDias', () => {
  it('cruza el fin de mes', () => {
    expect(sumarDias('2026-11-30', 1)).toBe('2026-12-01');
  });

  it('cruza el fin de año', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2026-12-15', 31)).toBe('2027-01-15');
  });

  it('pasa por el 29 de febrero en año bisiesto y lo salta en año no bisiesto', () => {
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
    expect(sumarDias('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('acepta n negativo', () => {
    expect(sumarDias('2027-01-01', -1)).toBe('2026-12-31');
    expect(sumarDias('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('con n = 0 devuelve la misma fecha', () => {
    expect(sumarDias('2026-11-05', 0)).toBe('2026-11-05');
  });

  it.each(['1970-01-01', '2026-11-05', '2099-12-31'])('ida y vuelta de %s', (fecha) => {
    expect(sumarDias(sumarDias(fecha, 400), -400)).toBe(fecha);
    expect(sumarDias(fecha, 0)).toBe(fecha);
  });
});

describe('diasEntre', () => {
  it('cuenta los días con signo', () => {
    expect(diasEntre('2026-11-03', '2026-12-04')).toBe(31);
    expect(diasEntre('2026-12-04', '2026-11-03')).toBe(-31);
    expect(diasEntre('2026-11-05', '2026-11-05')).toBe(0);
  });

  it('es simétrico', () => {
    const pares: [string, string][] = [
      ['1970-01-01', '2099-12-31'],
      ['2027-02-28', '2028-03-01'],
    ];
    for (const [a, b] of pares) expect(diasEntre(a, b)).toBe(-diasEntre(b, a));
  });

  it('cuenta los años bisiestos', () => {
    expect(diasEntre('2028-01-01', '2029-01-01')).toBe(366);
    expect(diasEntre('2027-01-01', '2028-01-01')).toBe(365);
    expect(diasEntre('1970-01-01', '2026-11-05')).toBe(20762);
  });

  it('es consistente con sumarDias', () => {
    expect(sumarDias('2026-11-05', diasEntre('2026-11-05', '2099-12-31'))).toBe('2099-12-31');
  });
});

describe('diasDelMes', () => {
  it.each([
    [2026, 1, 31],
    [2026, 2, 28],
    [2028, 2, 29],
    [1900, 2, 28],
    [2000, 2, 29],
    [2026, 4, 30],
    [2026, 12, 31],
  ])('%p-%p → %p', (anio, mes, dias) => {
    expect(diasDelMes(anio, mes)).toBe(dias);
  });
});

describe('mesDe', () => {
  it('devuelve la clave YYYY-MM', () => {
    expect(mesDe('2026-11-05')).toBe('2026-11');
    expect(mesDe('2027-01-31')).toBe('2027-01');
  });
});

describe('sumarMeses', () => {
  it.each([
    ['2026-12', 1, '2027-01'],
    ['2026-01', -1, '2025-12'],
    ['2026-11', 14, '2028-01'],
    ['2026-11', 0, '2026-11'],
    ['2026-03', -15, '2024-12'],
  ])('%p + %p → %p', (clave, n, esperado) => {
    expect(sumarMeses(clave, n)).toBe(esperado);
  });
});

describe('fechaEnMes', () => {
  it.each([
    ['2027-02', 30, '2027-02-28'],
    ['2028-02', 30, '2028-02-29'],
    ['2026-04', 31, '2026-04-30'],
    ['2026-12', 31, '2026-12-31'],
    ['2026-11', 10, '2026-11-10'],
    ['2026-11', 1, '2026-11-01'],
  ])('%p día %p → %p', (clave, dia, esperado) => {
    expect(fechaEnMes(clave, dia)).toBe(esperado);
  });
});
