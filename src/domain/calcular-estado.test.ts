import { calcularEstado, HORIZONTE_DIAS } from './calcular-estado';
import type { Estado } from './estado';
import { type Hechos, hechosVacios } from './hechos';

const HOY = '2026-11-03';

function configurado(monto: number, colchon: number): Hechos {
  return { saldoInicial: { monto, fecha: '2026-11-01' }, colchon };
}

function calculado(estado: Estado) {
  if (estado.tipo !== 'calculado') throw new Error(`se esperaba 'calculado' y llegó '${estado.tipo}'`);
  return estado;
}

describe('calcularEstado', () => {
  describe('sin configurar', () => {
    it('con hechosVacios', () => {
      expect(calcularEstado(hechosVacios, HOY)).toEqual({ tipo: 'sinConfigurar', hoy: HOY });
    });

    it('solo con saldo inicial', () => {
      const hechos: Hechos = { saldoInicial: { monto: 1_000_000, fecha: HOY }, colchon: null };
      expect(calcularEstado(hechos, HOY)).toEqual({ tipo: 'sinConfigurar', hoy: HOY });
    });

    it('solo con colchón', () => {
      const hechos: Hechos = { saldoInicial: null, colchon: 500_000 };
      expect(calcularEstado(hechos, HOY)).toEqual({ tipo: 'sinConfigurar', hoy: HOY });
    });
  });

  describe('configurado', () => {
    it('el Horizonte tiene 32 días, de hoy a hoy+31', () => {
      const estado = calculado(calcularEstado(configurado(5_000_000, 1_000_000), HOY));
      expect(HORIZONTE_DIAS).toBe(31);
      expect(estado.saldoProyectado).toHaveLength(32);
      expect(estado.saldoProyectado[0].fecha).toBe('2026-11-03');
      expect(estado.saldoProyectado[1].fecha).toBe('2026-11-04');
      expect(estado.saldoProyectado[31].fecha).toBe('2026-12-04');
      expect(estado.hoy).toBe(HOY);
    });

    it('los días van en orden y sin huecos', () => {
      const { saldoProyectado } = calculado(calcularEstado(configurado(5_000_000, 0), HOY));
      for (let i = 1; i < saldoProyectado.length; i++) {
        expect(saldoProyectado[i].fecha > saldoProyectado[i - 1].fecha).toBe(true);
      }
    });

    it('sin flujos, el saldo es constante y Dinero libre = saldo − colchón', () => {
      const estado = calculado(calcularEstado(configurado(5_000_000, 1_200_000), HOY));
      expect(estado.saldoCalculado).toBe(5_000_000);
      expect(estado.saldoProyectado.every((d) => d.saldo === 5_000_000)).toBe(true);
      expect(estado.dineroLibre).toBe(3_800_000);
    });

    it('Dinero libre puede ser negativo', () => {
      const estado = calculado(calcularEstado(configurado(1_000_000, 4_000_000), HOY));
      expect(estado.dineroLibre).toBe(-3_000_000);
    });

    it('con colchón 0, Dinero libre es el mínimo', () => {
      const estado = calculado(calcularEstado(configurado(2_500_000, 0), HOY));
      expect(estado.dineroLibre).toBe(2_500_000);
    });

    it('en empate, el mínimo es el primer día', () => {
      const estado = calculado(calcularEstado(configurado(2_500_000, 0), HOY));
      expect(estado.minimo).toEqual({ fecha: HOY, saldo: 2_500_000 });
    });

    it('el Horizonte cruza el fin de año', () => {
      const estado = calculado(calcularEstado(configurado(1_000_000, 0), '2026-12-15'));
      expect(estado.saldoProyectado[0].fecha).toBe('2026-12-15');
      expect(estado.saldoProyectado[16].fecha).toBe('2026-12-31');
      expect(estado.saldoProyectado[17].fecha).toBe('2027-01-01');
      expect(estado.saldoProyectado[31].fecha).toBe('2027-01-15');
    });

    it('todos los montos son enteros', () => {
      const estado = calculado(calcularEstado(configurado(1_234_567, 89_012), HOY));
      const montos = [
        estado.saldoCalculado,
        estado.dineroLibre,
        estado.minimo.saldo,
        ...estado.saldoProyectado.map((d) => d.saldo),
      ];
      expect(montos.every(Number.isInteger)).toBe(true);
    });
  });

  it('es pura: mismo resultado con los mismos datos y no muta los hechos', () => {
    const saldoInicial = Object.freeze({ monto: 3_000_000, fecha: '2026-11-01' });
    const hechos: Hechos = Object.freeze({ saldoInicial, colchon: 500_000 });
    const a = calcularEstado(hechos, HOY);
    const b = calcularEstado(hechos, HOY);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(hechos).toEqual({ saldoInicial: { monto: 3_000_000, fecha: '2026-11-01' }, colchon: 500_000 });
  });
});
