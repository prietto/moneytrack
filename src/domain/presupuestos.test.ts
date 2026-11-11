import type { PresupuestoEsencial } from './hechos';
import { presupuestosPendientes } from './presupuestos';

const comida: PresupuestoEsencial = { id: 'comida', nombre: 'Comida', montoMensual: 700_000 };
const mantenimiento: PresupuestoEsencial = { id: 'mant', nombre: 'Mantenimiento de vehículos', montoMensual: 400_000 };

describe('presupuestosPendientes', () => {
  it('P1. mes en curso en hoy y el siguiente el día 1', () => {
    expect(presupuestosPendientes([comida, mantenimiento], { hoy: '2026-11-03', hasta: '2026-12-04' })).toEqual([
      { presupuestoId: 'comida', mes: '2026-11', fecha: '2026-11-03', monto: 700_000 },
      { presupuestoId: 'mant', mes: '2026-11', fecha: '2026-11-03', monto: 400_000 },
      { presupuestoId: 'comida', mes: '2026-12', fecha: '2026-12-01', monto: 700_000 },
      { presupuestoId: 'mant', mes: '2026-12', fecha: '2026-12-01', monto: 400_000 },
    ]);
  });

  it('P2. con hoy el 31-ene caben el 1-feb y el 1-mar', () => {
    expect(
      presupuestosPendientes([comida], { hoy: '2027-01-31', hasta: '2027-03-03' }).map((p) => [p.mes, p.fecha]),
    ).toEqual([
      ['2027-01', '2027-01-31'],
      ['2027-02', '2027-02-01'],
      ['2027-03', '2027-03-01'],
    ]);
  });

  it('P3. con hoy día 1, el mes en curso entra una sola vez', () => {
    expect(
      presupuestosPendientes([comida], { hoy: '2026-11-01', hasta: '2026-12-02' }).map((p) => [p.mes, p.fecha]),
    ).toEqual([
      ['2026-11', '2026-11-01'],
      ['2026-12', '2026-12-01'],
    ]);
  });

  it('P4. el fin del Horizonte es inclusivo', () => {
    expect(presupuestosPendientes([comida], { hoy: '2026-10-31', hasta: '2026-12-01' }).map((p) => p.fecha)).toEqual([
      '2026-10-31',
      '2026-11-01',
      '2026-12-01',
    ]);
    expect(
      presupuestosPendientes([comida], { hoy: '2026-11-01', hasta: '2026-12-02' }).map((p) => p.fecha),
    ).not.toContain('2027-01-01');
  });

  it.each([null, 0])('P5. montoMensual %p no descuenta nada', (montoMensual) => {
    expect(presupuestosPendientes([{ ...comida, montoMensual }], { hoy: '2026-11-03', hasta: '2026-12-04' })).toEqual(
      [],
    );
  });

  it('ordena por (fecha, presupuestoId) aunque los hechos vengan en otro orden', () => {
    expect(
      presupuestosPendientes([mantenimiento, comida], { hoy: '2026-11-03', hasta: '2026-12-04' }).map(
        (p) => p.presupuestoId,
      ),
    ).toEqual(['comida', 'mant', 'comida', 'mant']);
  });

  it('es total: con fechas inválidas devuelve []', () => {
    expect(presupuestosPendientes([comida], { hoy: 'x', hasta: '2026-12-04' })).toEqual([]);
    expect(presupuestosPendientes([comida], { hoy: '2026-11-03', hasta: '2026-13-01' })).toEqual([]);
    expect(presupuestosPendientes([comida], { hoy: '2026-12-04', hasta: '2026-11-03' })).toEqual([]);
  });
});
