import { calcularEstado, HORIZONTE_DIAS } from './calcular-estado';
import type { Estado } from './estado';
import { sumarDias } from './fechas';
import { type Hechos, hechosVacios, type PagoDefinido } from './hechos';

const HOY = '2026-11-03';

function pago(numero: 1 | 2, dia: number, montoEsperado: number): PagoDefinido {
  return { id: `pago-${numero}`, numero, dia, montoEsperado };
}

/** Pagos que caen dentro del Horizonte de HOY (10-nov y 30-nov), pero después del primer día: no mueven el saldo de HOY. */
const pagosLejanos = [pago(1, 10, 2_000_000), pago(2, 30, 6_000_000)];

function configurado(monto: number, colchon: number, cambios: Partial<Hechos> = {}): Hechos {
  return { saldoInicial: { monto, fecha: '2026-11-01' }, colchon, pagos: pagosLejanos, ...cambios };
}

function calculado(estado: Estado) {
  if (estado.tipo !== 'calculado') throw new Error(`se esperaba 'calculado' y llegó '${estado.tipo}'`);
  return estado;
}

function saldoEn(estado: ReturnType<typeof calculado>, fecha: string): number | undefined {
  return estado.saldoProyectado.find((d) => d.fecha === fecha)?.saldo;
}

/** Caso base del addendum, recortado a H1.4. */
const casoBase: Hechos = {
  saldoInicial: { monto: 10_000_000, fecha: '2026-11-03' },
  colchon: 4_000_000,
  pagos: [pago(1, 10, 2_000_000), pago(2, 30, 6_000_000)],
};

describe('calcularEstado', () => {
  describe('sin configurar', () => {
    it('sin nada faltan los tres, en orden', () => {
      expect(calcularEstado(hechosVacios, HOY)).toEqual({
        tipo: 'sinConfigurar',
        hoy: HOY,
        faltan: ['pagos', 'saldoInicial', 'colchon'],
      });
    });

    it('solo con el Pago 1, siguen faltando los pagos', () => {
      const hechos = configurado(1_000_000, 0, { pagos: [pago(1, 10, 1)] });
      expect(calcularEstado(hechos, HOY)).toEqual({ tipo: 'sinConfigurar', hoy: HOY, faltan: ['pagos'] });
    });

    it('solo con el Pago 2, siguen faltando los pagos', () => {
      const hechos = configurado(1_000_000, 0, { pagos: [pago(2, 30, 1)] });
      expect(calcularEstado(hechos, HOY)).toEqual({ tipo: 'sinConfigurar', hoy: HOY, faltan: ['pagos'] });
    });

    it('sin saldo inicial', () => {
      const hechos = configurado(1, 0, { saldoInicial: null });
      expect(calcularEstado(hechos, HOY)).toEqual({ tipo: 'sinConfigurar', hoy: HOY, faltan: ['saldoInicial'] });
    });

    it('sin Colchón', () => {
      const hechos = configurado(1, 0, { colchon: null });
      expect(calcularEstado(hechos, HOY)).toEqual({ tipo: 'sinConfigurar', hoy: HOY, faltan: ['colchon'] });
    });

    it('un saldo inicial con fecha futura cuenta como faltante (reloj que retrocede)', () => {
      const hechos = configurado(1, 0, { saldoInicial: { monto: 1, fecha: '2026-11-04' } });
      expect(calcularEstado(hechos, HOY)).toEqual({ tipo: 'sinConfigurar', hoy: HOY, faltan: ['saldoInicial'] });
    });

    it('un saldo inicial con fecha igual a hoy sí sirve', () => {
      const hechos = configurado(1, 0, { saldoInicial: { monto: 1, fecha: HOY } });
      expect(calcularEstado(hechos, HOY).tipo).toBe('calculado');
    });
  });

  describe('Horizonte', () => {
    it('tiene 32 días, de hoy a hoy+31', () => {
      const estado = calculado(calcularEstado(configurado(5_000_000, 1_000_000), HOY));
      expect(HORIZONTE_DIAS).toBe(31);
      expect(estado.saldoProyectado).toHaveLength(32);
      expect(estado.saldoProyectado[0].fecha).toBe('2026-11-03');
      expect(estado.saldoProyectado[31].fecha).toBe('2026-12-04');
      expect(estado.hoy).toBe(HOY);
    });

    it('los días van en orden y sin huecos', () => {
      const { saldoProyectado } = calculado(calcularEstado(configurado(5_000_000, 0), HOY));
      for (let i = 1; i < saldoProyectado.length; i++) {
        expect(saldoProyectado[i].fecha).toBe(sumarDias(saldoProyectado[i - 1].fecha, 1));
      }
    });

    it('cruza el fin de año', () => {
      const estado = calculado(calcularEstado(configurado(1_000_000, 0), '2026-12-15'));
      expect(estado.saldoProyectado[16].fecha).toBe('2026-12-31');
      expect(estado.saldoProyectado[17].fecha).toBe('2027-01-01');
      expect(estado.saldoProyectado[31].fecha).toBe('2027-01-15');
    });

    it('una ocurrencia en hoy+31 cuenta y una en hoy+32 no', () => {
      // hoy = 2026-11-09: hoy+31 = 2026-12-10, hoy+32 = 2026-12-11.
      const hechos = configurado(1_000_000, 0, {
        saldoInicial: { monto: 1_000_000, fecha: '2026-11-09' },
        pagos: [pago(1, 10, 100), pago(2, 11, 7)],
      });
      const estado = calculado(calcularEstado(hechos, '2026-11-09'));
      expect(estado.pagosEsperados.map((p) => p.fecha)).toEqual(['2026-11-10', '2026-11-11', '2026-12-10']);
      expect(saldoEn(estado, '2026-12-10')).toBe(1_000_000 + 100 + 7 + 100);
    });
  });

  describe('Pagos esperados', () => {
    it('caso base del addendum: saldo proyectado, mínimo y Dinero libre', () => {
      const estado = calculado(calcularEstado(casoBase, HOY));
      expect(estado.saldoCalculado).toBe(10_000_000);
      for (const d of estado.saldoProyectado) {
        const esperado = d.fecha < '2026-11-10' ? 10_000_000 : d.fecha < '2026-11-30' ? 12_000_000 : 18_000_000;
        expect(d.saldo).toBe(esperado);
      }
      expect(estado.minimo).toEqual({ fecha: '2026-11-03', saldo: 10_000_000 });
      expect(estado.dineroLibre).toBe(6_000_000);
      // El 10-dic queda fuera del Horizonte (hoy+31 = 4-dic).
      expect(estado.pagosEsperados).toEqual([
        {
          pagoId: 'pago-1',
          numero: 1,
          clave: '2026-11',
          fecha: '2026-11-10',
          fechaProyectada: '2026-11-10',
          monto: 2_000_000,
          pagoAtrasado: false,
        },
        {
          pagoId: 'pago-2',
          numero: 2,
          clave: '2026-11',
          fecha: '2026-11-30',
          fechaProyectada: '2026-11-30',
          monto: 6_000_000,
          pagoAtrasado: false,
        },
      ]);
      expect(estado.pagosAtrasados).toEqual([]);
    });

    it('una ocurrencia en hoy no está atrasada', () => {
      const hechos = { ...casoBase, saldoInicial: { monto: 10_000_000, fecha: '2026-11-09' } };
      const estado = calculado(calcularEstado(hechos, '2026-11-10'));
      expect(estado.pagosEsperados[0]).toMatchObject({ fecha: '2026-11-10', pagoAtrasado: false });
      expect(estado.saldoProyectado[0].saldo).toBe(12_000_000);
      expect(estado.pagosAtrasados).toEqual([]);
    });

    it('atrasado: la ocurrencia vencida se proyecta en hoy y suma desde el primer día', () => {
      const hechos = { ...casoBase, saldoInicial: { monto: 10_000_000, fecha: '2026-11-05' } };
      const estado = calculado(calcularEstado(hechos, '2026-11-12'));
      const atrasada = {
        pagoId: 'pago-1',
        numero: 1,
        clave: '2026-11',
        fecha: '2026-11-10',
        fechaProyectada: '2026-11-12',
        monto: 2_000_000,
        pagoAtrasado: true,
      };
      expect(estado.pagosEsperados[0]).toEqual(atrasada);
      expect(estado.pagosAtrasados).toEqual([atrasada]);
      expect(estado.saldoProyectado[0]).toEqual({ fecha: '2026-11-12', saldo: 12_000_000 });
      expect(estado.saldoCalculado).toBe(10_000_000);
    });

    it('varios atrasados: cada ocurrencia pendiente se proyecta en hoy', () => {
      const hechos = { ...casoBase, saldoInicial: { monto: 10_000_000, fecha: '2026-09-01' } };
      const estado = calculado(calcularEstado(hechos, '2026-11-12'));
      // Mismo orden que pagosEsperados: (fechaProyectada, numero) y luego la fecha.
      expect(estado.pagosAtrasados.map((p) => p.fecha)).toEqual([
        '2026-09-10',
        '2026-10-10',
        '2026-11-10',
        '2026-09-30',
        '2026-10-30',
      ]);
      expect(estado.pagosAtrasados.every((p) => p.fechaProyectada === '2026-11-12')).toBe(true);
      // 3 × 2M + 2 × 6M = 18M, todo desde hoy.
      expect(estado.saldoProyectado[0].saldo).toBe(28_000_000);
      // Ordenadas por (fechaProyectada, numero): primero las de hoy, el Pago 1 antes que el 2.
      expect(estado.pagosEsperados.map((p) => p.numero)).toEqual([1, 1, 1, 2, 2, 2, 1]);
      expect(estado.pagosEsperados.at(-1)).toMatchObject({ fecha: '2026-12-10', pagoAtrasado: false });
    });

    it('punto de partida: la ocurrencia del mismo día del saldo no cuenta; la del día siguiente sí', () => {
      const mismoDia = { ...casoBase, saldoInicial: { monto: 10_000_000, fecha: '2026-11-10' } };
      expect(calculado(calcularEstado(mismoDia, '2026-11-12')).pagosEsperados.map((p) => p.fecha)).toEqual([
        '2026-11-30',
        '2026-12-10',
      ]);
      const diaAntes = { ...casoBase, saldoInicial: { monto: 10_000_000, fecha: '2026-11-09' } };
      expect(calculado(calcularEstado(diaAntes, '2026-11-12')).pagosEsperados[0]).toMatchObject({
        fecha: '2026-11-10',
        pagoAtrasado: true,
      });
    });

    it('febrero: el día 30 cae el 28 (y el 29 en bisiesto)', () => {
      const hechos = (fecha: string) => ({ ...casoBase, saldoInicial: { monto: 1, fecha } });
      const comun = calculado(calcularEstado(hechos('2027-02-01'), '2027-02-01'));
      expect(comun.pagosEsperados.find((p) => p.numero === 2)).toMatchObject({ clave: '2027-02', fecha: '2027-02-28' });
      const bisiesto = calculado(calcularEstado(hechos('2028-02-01'), '2028-02-01'));
      expect(bisiesto.pagosEsperados.find((p) => p.numero === 2)).toMatchObject({
        clave: '2028-02',
        fecha: '2028-02-29',
      });
    });
  });

  describe('mínimo y Dinero libre', () => {
    it('sin Pagos en el primer día, Dinero libre = saldo − Colchón', () => {
      const estado = calculado(calcularEstado(configurado(5_000_000, 1_200_000), HOY));
      expect(estado.dineroLibre).toBe(3_800_000);
    });

    it('Dinero libre negativo: saldo 1M y Colchón 4M → −3M el día de hoy', () => {
      const estado = calculado(calcularEstado(configurado(1_000_000, 4_000_000), HOY));
      expect(estado.minimo).toEqual({ fecha: HOY, saldo: 1_000_000 });
      expect(estado.dineroLibre).toBe(-3_000_000);
    });

    it('en empate, el mínimo es el primer día', () => {
      const estado = calculado(calcularEstado(configurado(2_500_000, 0), HOY));
      expect(estado.minimo).toEqual({ fecha: HOY, saldo: 2_500_000 });
    });

    it('todos los montos son enteros', () => {
      const estado = calculado(calcularEstado({ ...casoBase, colchon: 89_012 }, HOY));
      const montos = [
        estado.saldoCalculado,
        estado.dineroLibre,
        estado.minimo.saldo,
        ...estado.saldoProyectado.map((d) => d.saldo),
        ...estado.pagosEsperados.map((p) => p.monto),
      ];
      expect(montos.every(Number.isInteger)).toBe(true);
    });
  });

  it('es pura: mismo resultado con los mismos datos y no muta los hechos', () => {
    const congelar = <T extends object>(o: T): T => Object.freeze(o);
    const hechos: Hechos = congelar({
      saldoInicial: congelar({ monto: 3_000_000, fecha: '2026-11-01' }),
      colchon: 500_000,
      pagos: congelar([congelar(pago(1, 10, 2_000_000)), congelar(pago(2, 30, 6_000_000))]),
    });
    const copia = JSON.parse(JSON.stringify(hechos));
    const a = calcularEstado(hechos, HOY);
    const b = calcularEstado(hechos, HOY);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(hechos).toEqual(copia);
  });
});
