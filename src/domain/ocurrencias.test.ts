import { ocurrenciasMensuales } from './ocurrencias';

describe('ocurrenciasMensuales', () => {
  it('devuelve las ocurrencias del rango en orden, con su clave', () => {
    expect(ocurrenciasMensuales(10, '2026-11-04', '2027-01-15')).toEqual([
      { clave: '2026-11', fecha: '2026-11-10' },
      { clave: '2026-12', fecha: '2026-12-10' },
      { clave: '2027-01', fecha: '2027-01-10' },
    ]);
  });

  it('cruza el año y cae el último día en meses cortos', () => {
    expect(ocurrenciasMensuales(30, '2026-12-01', '2027-03-31')).toEqual([
      { clave: '2026-12', fecha: '2026-12-30' },
      { clave: '2027-01', fecha: '2027-01-30' },
      { clave: '2027-02', fecha: '2027-02-28' },
      { clave: '2027-03', fecha: '2027-03-30' },
    ]);
  });

  it('los bordes desde y hasta son inclusivos', () => {
    expect(ocurrenciasMensuales(10, '2026-11-10', '2026-12-10')).toEqual([
      { clave: '2026-11', fecha: '2026-11-10' },
      { clave: '2026-12', fecha: '2026-12-10' },
    ]);
  });

  it('excluye la del primer mes si es anterior a desde', () => {
    expect(ocurrenciasMensuales(10, '2026-11-11', '2026-12-09')).toEqual([]);
  });

  it('un rango sin ninguna ocurrencia devuelve []', () => {
    expect(ocurrenciasMensuales(30, '2026-11-01', '2026-11-29')).toEqual([]);
  });

  it('un rango de un solo día que coincide', () => {
    expect(ocurrenciasMensuales(28, '2027-02-28', '2027-02-28')).toEqual([{ clave: '2027-02', fecha: '2027-02-28' }]);
  });

  it.each([0, 32, 1.5, -1, NaN])('con dia %p devuelve []', (dia) => {
    expect(ocurrenciasMensuales(dia, '2026-11-01', '2027-11-01')).toEqual([]);
  });

  it('con desde > hasta devuelve []', () => {
    expect(ocurrenciasMensuales(10, '2026-12-01', '2026-11-01')).toEqual([]);
  });

  it('con fechas inválidas devuelve []', () => {
    expect(ocurrenciasMensuales(10, 'x', '2026-11-01')).toEqual([]);
    expect(ocurrenciasMensuales(10, '2026-11-01', '2026-13-01')).toEqual([]);
  });
});
