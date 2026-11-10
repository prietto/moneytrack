import { ocurrenciasAnuales, ocurrenciasMensuales } from './ocurrencias';

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

describe('ocurrenciasAnuales', () => {
  it('devuelve una ocurrencia por año en el rango, con clave YYYY', () => {
    expect(ocurrenciasAnuales(3, 15, '2026-11-01', '2029-12-31')).toEqual([
      { clave: '2027', fecha: '2027-03-15' },
      { clave: '2028', fecha: '2028-03-15' },
      { clave: '2029', fecha: '2029-03-15' },
    ]);
  });

  it('el 29 de febrero cae el 28 en los años no bisiestos', () => {
    expect(ocurrenciasAnuales(2, 29, '2028-02-29', '2032-12-31')).toEqual([
      { clave: '2028', fecha: '2028-02-29' },
      { clave: '2029', fecha: '2029-02-28' },
      { clave: '2030', fecha: '2030-02-28' },
      { clave: '2031', fecha: '2031-02-28' },
      { clave: '2032', fecha: '2032-02-29' },
    ]);
  });

  it('los bordes desde y hasta son inclusivos', () => {
    expect(ocurrenciasAnuales(3, 15, '2027-03-15', '2028-03-15')).toEqual([
      { clave: '2027', fecha: '2027-03-15' },
      { clave: '2028', fecha: '2028-03-15' },
    ]);
  });

  it('excluye la del primer año si es anterior a desde', () => {
    expect(ocurrenciasAnuales(3, 15, '2027-03-16', '2028-03-14')).toEqual([]);
  });

  it('un rango sin ninguna ocurrencia devuelve []', () => {
    expect(ocurrenciasAnuales(3, 15, '2026-11-01', '2026-12-31')).toEqual([]);
  });

  it.each([
    [0, 15],
    [13, 15],
    [1.5, 15],
    [3, 0],
    [3, 32],
    [3, 1.5],
    [NaN, 15],
    [3, NaN],
  ])('con mes %p y día %p devuelve []', (mes, dia) => {
    expect(ocurrenciasAnuales(mes, dia, '2026-01-01', '2030-12-31')).toEqual([]);
  });

  it('con desde > hasta o fechas inválidas devuelve []', () => {
    expect(ocurrenciasAnuales(3, 15, '2028-01-01', '2027-01-01')).toEqual([]);
    expect(ocurrenciasAnuales(3, 15, 'x', '2027-01-01')).toEqual([]);
    expect(ocurrenciasAnuales(3, 15, '2026-01-01', '2027-02-30')).toEqual([]);
  });
});
