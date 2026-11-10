import type { ObligacionAnual, ObligacionMensual } from './hechos';
import { obligacionesEnHorizonte, ocurrenciasMensualesPendientes, resultadoAnual, type Marco } from './obligaciones';

const marco: Marco = { fs: '2026-11-01', hoy: '2026-11-03', hasta: '2026-12-04' };

function anual(cambios: Partial<ObligacionAnual> = {}): ObligacionAnual {
  return {
    id: 'a',
    tipo: 'anual',
    nombre: 'SOAT',
    monto: 1_200_000,
    fechaVencimiento: '2027-03-15',
    vehiculoId: null,
    reservaInicial: { monto: 300_000, fecha: '2026-11-01' },
    ...cambios,
  };
}

describe('ocurrenciasMensualesPendientes', () => {
  const m: ObligacionMensual = { id: 'm', tipo: 'mensual', nombre: 'Arriendo', monto: 100, dia: 2 };

  it('excluye la del día del saldo y marca vencidas las anteriores a hoy', () => {
    expect(ocurrenciasMensualesPendientes(m, { ...marco, fs: '2026-10-01' }).map((o) => [o.fecha, o.vencida])).toEqual([
      ['2026-10-02', true],
      ['2026-11-02', true],
      ['2026-12-02', false],
    ]);
    expect(ocurrenciasMensualesPendientes(m, { ...marco, fs: '2026-11-02' }).map((o) => o.fecha)).toEqual([
      '2026-12-02',
    ]);
  });
});

describe('resultadoAnual', () => {
  it('sin cierres en el Horizonte: reserva inicial y un Aporte por cada Pago 2 futuro', () => {
    expect(resultadoAnual(anual(), 30, marco)).toEqual({
      pendientes: [],
      reserva: 300_000,
      aportes: [{ fecha: '2026-11-30', tipo: 'prorrateoAnual', obligacionId: 'a', monto: 100_000 }],
    });
  });

  it('un crédito en hoy entra en la reserva actual y no es Aporte', () => {
    const r = resultadoAnual(anual(), 3, marco);
    expect(r.reserva).toBe(400_000);
    expect(r.aportes.map((a) => a.fecha)).toEqual(['2026-12-03']);
  });

  it('el crédito del mismo día de la reserva inicial no cuenta (ya está dentro)', () => {
    expect(resultadoAnual(anual(), 1, marco).reserva).toBe(300_000);
  });

  it('una liberación en hoy no baja la reserva actual', () => {
    const r = resultadoAnual(anual({ fechaVencimiento: '2026-11-03' }), 30, marco);
    expect(r.reserva).toBe(300_000);
    expect(r.pendientes[0]).toMatchObject({ fecha: '2026-11-03', vencida: false, reservaLiberada: 300_000 });
    // Tras liberar se reinicia: el Aporte del 30-nov empieza de cero.
    expect(r.aportes).toHaveLength(1);
  });

  it('una asumida pagada en hoy reinicia la reserva actual', () => {
    const r = resultadoAnual(
      anual({ fechaVencimiento: '2026-11-03', reservaInicial: { monto: 300_000, fecha: '2026-11-01' } }),
      30,
      { ...marco, fs: '2026-11-03' },
    );
    expect(r.pendientes).toEqual([]);
    expect(r.reserva).toBe(0);
  });

  it('una ocurrencia antes de la reserva inicial y del saldo no cuenta', () => {
    const r = resultadoAnual(
      anual({ fechaVencimiento: '2026-10-15', reservaInicial: { monto: 300_000, fecha: '2026-10-20' } }),
      30,
      marco,
    );
    expect(r.pendientes).toEqual([]);
    expect(r.reserva).toBe(400_000); // 300.000 + el prorrateo del 30-oct.
  });

  it('reserva anotada después de una vencida sin pagar (fs < o ≤ f0): pendiente que libera la reserva', () => {
    const r = resultadoAnual(
      anual({ fechaVencimiento: '2026-11-02', reservaInicial: { monto: 1_000_000, fecha: '2026-11-03' } }),
      30,
      marco,
    );
    expect(r.reserva).toBe(1_000_000);
    expect(r.pendientes).toEqual([
      expect.objectContaining({
        fecha: '2026-11-02',
        fechaProyectada: '2026-11-03',
        vencida: true,
        reservaLiberada: 1_000_000,
      }),
    ]);
  });

  it('con un ancla inválida no hay cierres, pero sí prorrateos', () => {
    const r = resultadoAnual(anual({ fechaVencimiento: 'x' }), 30, marco);
    expect(r.pendientes).toEqual([]);
    expect(r.aportes).toHaveLength(1);
  });
});

describe('obligacionesEnHorizonte', () => {
  it('ordena pendientes y Aportes, y deja reservasAnuales en el orden de entrada', () => {
    const r = obligacionesEnHorizonte(
      [
        anual({ id: 'z', fechaVencimiento: '2026-11-20' }),
        { id: 'm', tipo: 'mensual', nombre: 'Agua', monto: 5, dia: 20 },
        anual({ id: 'b' }),
      ],
      30,
      marco,
    );
    expect(r.pendientes.map((o) => o.obligacionId)).toEqual(['m', 'z']);
    expect(r.reservasAnuales.map((x) => x.obligacionId)).toEqual(['z', 'b']);
    expect(r.aportes.map((a) => [a.fecha, a.obligacionId])).toEqual([
      ['2026-11-30', 'b'],
      ['2026-11-30', 'z'],
    ]);
  });
});
