/** @jest-environment node */
import { formatearFechaCorta } from './fechas';

describe('formatearFechaCorta', () => {
  it.each([
    ['2026-11-08', '2026-11-05', '8 de nov.'],
    ['2026-01-01', '2026-11-05', '1 de ene.'],
    ['2026-12-31', '2026-11-05', '31 de dic.'],
    ['2026-05-15', '2026-11-05', '15 de may.'],
    ['2027-01-10', '2026-12-20', '10 de ene. de 2027'],
    ['2025-12-30', '2026-01-02', '30 de dic. de 2025'],
  ])('%p con hoy %p → %p', (fecha, hoy, esperado) => {
    expect(formatearFechaCorta(fecha, hoy)).toBe(esperado);
  });

  it('sin hoy no agrega el año', () => {
    expect(formatearFechaCorta('2027-02-28')).toBe('28 de feb.');
  });

  it('con una fecha mal formada la devuelve tal cual (no inventa)', () => {
    expect(formatearFechaCorta('x', '2026-11-05')).toBe('x');
  });
});
