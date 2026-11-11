import { calcularEstado, HORIZONTE_DIAS } from './calcular-estado';
import type { Estado } from './estado';
import { sumarDias } from './fechas';
import {
  type Categoria,
  type FondoProtegido,
  type Hechos,
  hechosVacios,
  type ObligacionAnual,
  type ObligacionMensual,
  type PagoDefinido,
  type PresupuestoEsencial,
} from './hechos';

const HOY = '2026-11-03';

function pago(numero: 1 | 2, dia: number, montoEsperado: number): PagoDefinido {
  return { id: `pago-${numero}`, numero, dia, montoEsperado };
}

function mensual(id: string, nombre: string, dia: number, monto: number): ObligacionMensual {
  return { id, tipo: 'mensual', nombre, monto, dia };
}

function anual(
  id: string,
  nombre: string,
  monto: number,
  fechaVencimiento: string,
  reserva: number,
  fechaReserva: string,
): ObligacionAnual {
  return {
    id,
    tipo: 'anual',
    nombre,
    monto,
    fechaVencimiento,
    vehiculoId: null,
    reservaInicial: { monto: reserva, fecha: fechaReserva },
  };
}

/** Pagos que caen dentro del Horizonte de HOY (10-nov y 30-nov), pero después del primer día: no mueven el saldo de HOY. */
const pagosLejanos = [pago(1, 10, 2_000_000), pago(2, 30, 6_000_000)];

function configurado(monto: number, colchon: number, cambios: Partial<Hechos> = {}): Hechos {
  return { ...hechosVacios, saldoInicial: { monto, fecha: '2026-11-01' }, colchon, pagos: pagosLejanos, ...cambios };
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
  ...hechosVacios,
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
      // Sin Obligaciones: sin Reservas ni listas, y las mismas cifras de H1.4.
      expect(estado.obligacionesPendientes).toEqual([]);
      expect(estado.obligacionesVencidas).toEqual([]);
      expect(estado.reservas).toEqual({ anual: 0, fondo: 0, total: 0 });
      expect(estado.reservasAnuales).toEqual([]);
      expect(estado.aportesProgramados).toEqual([]);
      expect(estado.presupuestosPendientes).toEqual([]);
      expect(estado.fondos).toEqual([]);
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

  describe('Obligaciones y reserva anual', () => {
    /** Caso A: el addendum recortado a H1.5. */
    const casoA: Hechos = {
      ...casoBase,
      obligaciones: [
        mensual('servicios', 'Servicios', 8, 300_000),
        mensual('arriendo', 'Arriendo', 1, 1_500_000),
        anual('soat', 'SOAT', 1_800_000, '2027-03-15', 400_000, '2026-11-03'),
      ],
    };

    it('A. addendum recortado: Reservas, Aportes, saldo proyectado, mínimo y Dinero libre', () => {
      const estado = calculado(calcularEstado(casoA, HOY));
      expect(estado.reservas).toEqual({ anual: 400_000, fondo: 0, total: 400_000 });
      expect(estado.reservasAnuales).toEqual([{ obligacionId: 'soat', reserva: 400_000 }]);
      expect(estado.aportesProgramados).toEqual([
        { fecha: '2026-11-30', tipo: 'prorrateoAnual', obligacionId: 'soat', monto: 150_000 },
      ]);
      for (const d of estado.saldoProyectado) {
        const esperado =
          d.fecha < '2026-11-08'
            ? 9_600_000
            : d.fecha < '2026-11-10'
              ? 9_300_000
              : d.fecha < '2026-11-30'
                ? 11_300_000
                : d.fecha < '2026-12-01'
                  ? 17_150_000
                  : 15_650_000;
        expect(d).toEqual({ fecha: d.fecha, saldo: esperado });
      }
      expect(estado.minimo).toEqual({ fecha: '2026-11-08', saldo: 9_300_000 });
      expect(estado.dineroLibre).toBe(5_300_000);
      // El arriendo del 1-nov no cuenta (≤ punto de partida); los servicios del 8-dic quedan fuera.
      expect(estado.obligacionesPendientes).toEqual([
        {
          obligacionId: 'servicios',
          tipo: 'mensual',
          nombre: 'Servicios',
          clave: '2026-11',
          fecha: '2026-11-08',
          fechaProyectada: '2026-11-08',
          monto: 300_000,
          vencida: false,
          vehiculoId: null,
          reservaLiberada: 0,
        },
        {
          obligacionId: 'arriendo',
          tipo: 'mensual',
          nombre: 'Arriendo',
          clave: '2026-12',
          fecha: '2026-12-01',
          fechaProyectada: '2026-12-01',
          monto: 1_500_000,
          vencida: false,
          vehiculoId: null,
          reservaLiberada: 0,
        },
      ]);
      expect(estado.obligacionesVencidas).toEqual([]);
    });

    it('B. anual dentro del Horizonte: el prorrateo entra en la reserva que se libera', () => {
      const hechos: Hechos = {
        ...casoBase,
        saldoInicial: { monto: 10_000_000, fecha: '2026-11-01' },
        obligaciones: [
          { ...anual('tecno', 'Tecnomecánica', 1_200_000, '2026-12-01', 1_000_000, '2026-11-01'), vehiculoId: 'v1' },
        ],
      };
      const estado = calculado(calcularEstado(hechos, HOY));
      expect(estado.reservas).toEqual({ anual: 1_000_000, fondo: 0, total: 1_000_000 });
      expect(estado.aportesProgramados).toEqual([
        { fecha: '2026-11-30', tipo: 'prorrateoAnual', obligacionId: 'tecno', monto: 100_000 },
      ]);
      expect(estado.obligacionesPendientes).toEqual([
        {
          obligacionId: 'tecno',
          tipo: 'anual',
          nombre: 'Tecnomecánica',
          clave: '2026',
          fecha: '2026-12-01',
          fechaProyectada: '2026-12-01',
          monto: 1_200_000,
          vencida: false,
          vehiculoId: 'v1',
          reservaLiberada: 1_100_000,
        },
      ]);
      expect(saldoEn(estado, '2026-11-03')).toBe(9_000_000);
      expect(saldoEn(estado, '2026-11-10')).toBe(11_000_000);
      expect(saldoEn(estado, '2026-11-30')).toBe(16_900_000);
      expect(saldoEn(estado, '2026-12-01')).toBe(16_800_000);
      expect(estado.minimo).toEqual({ fecha: '2026-11-03', saldo: 9_000_000 });
      expect(estado.dineroLibre).toBe(5_000_000);
    });

    it('C. vencidas: se proyectan en hoy y la anual libera toda su reserva', () => {
      const hechos: Hechos = {
        ...casoBase,
        saldoInicial: { monto: 10_000_000, fecha: '2026-11-05' },
        obligaciones: [
          anual('soat', 'SOAT', 1_200_000, '2026-11-08', 1_100_000, '2026-11-05'),
          mensual('arriendo', 'Arriendo', 8, 1_500_000),
        ],
      };
      const estado = calculado(calcularEstado(hechos, '2026-11-12'));
      expect(estado.obligacionesVencidas.map((o) => [o.nombre, o.fecha, o.fechaProyectada])).toEqual([
        ['Arriendo', '2026-11-08', '2026-11-12'],
        ['SOAT', '2026-11-08', '2026-11-12'],
      ]);
      expect(estado.obligacionesVencidas.every((o) => o.vencida)).toBe(true);
      expect(estado.reservas.anual).toBe(1_100_000);
      expect(estado.obligacionesVencidas[1].reservaLiberada).toBe(1_100_000);
      // 10M − 1,1M (reserva) + 2M (Pago 1 atrasado) − 1,5M − 1,2M + 1,1M (liberada).
      expect(estado.saldoProyectado[0]).toEqual({ fecha: '2026-11-12', saldo: 9_300_000 });
      expect(estado.minimo).toEqual({ fecha: '2026-11-12', saldo: 9_300_000 });
      expect(estado.dineroLibre).toBe(5_300_000);
      // El arriendo de diciembre sigue pendiente y no vencido.
      expect(estado.obligacionesPendientes.at(-1)).toMatchObject({
        nombre: 'Arriendo',
        fecha: '2026-12-08',
        vencida: false,
      });
    });

    it('D. una ocurrencia entre la reserva y el saldo se asume pagada y reinicia la reserva', () => {
      // f0 = 1-oct, ancla = 20-oct, fs = 1-nov, Pago 2 día 30: créditos el 30-oct (ya) y el 30-nov (Aporte).
      const hechos: Hechos = {
        ...casoBase,
        saldoInicial: { monto: 10_000_000, fecha: '2026-11-01' },
        obligaciones: [anual('soat', 'SOAT', 1_200_000, '2026-10-20', 500_000, '2026-10-01')],
      };
      const estado = calculado(calcularEstado(hechos, HOY));
      expect(estado.obligacionesPendientes).toEqual([]);
      // Reinicio a 0 el 20-oct y un prorrateo de 100.000 el 30-oct.
      expect(estado.reservas.anual).toBe(100_000);
      expect(estado.aportesProgramados.map((a) => [a.fecha, a.monto])).toEqual([['2026-11-30', 100_000]]);
      expect(estado.saldoProyectado[0].saldo).toBe(9_900_000);
    });

    it('E. el prorrateo se redondea hacia arriba', () => {
      const hechos: Hechos = {
        ...casoBase,
        obligaciones: [anual('x', 'X', 1_000_001, '2027-06-01', 0, HOY)],
      };
      const estado = calculado(calcularEstado(hechos, HOY));
      expect(estado.aportesProgramados).toEqual([
        { fecha: '2026-11-30', tipo: 'prorrateoAnual', obligacionId: 'x', monto: 83_334 },
      ]);
    });

    it('F. mismo día: el prorrateo del Pago 2 se acredita antes de liberar', () => {
      const hechos: Hechos = {
        ...casoBase,
        obligaciones: [anual('x', 'X', 1_200_000, '2026-11-30', 300_000, HOY)],
      };
      const estado = calculado(calcularEstado(hechos, HOY));
      expect(estado.obligacionesPendientes[0]).toMatchObject({ fecha: '2026-11-30', reservaLiberada: 400_000 });
      // 30-nov: +6M (Pago 2) − 100.000 (Aporte) − 1,2M + 400.000 (liberada).
      expect(saldoEn(estado, '2026-11-30')).toBe(
        10_000_000 - 300_000 + 2_000_000 + 6_000_000 - 100_000 - 1_200_000 + 400_000,
      );
      // Tras liberar, la reserva vuelve a 0: no hay más Aportes en el Horizonte.
      expect(estado.aportesProgramados).toHaveLength(1);
    });

    it('G. los prorrateos ya acreditados suman a la reserva actual, sin Aporte', () => {
      const hechos: Hechos = {
        ...casoBase,
        obligaciones: [anual('x', 'X', 1_200_000, '2027-06-01', 500_000, '2026-10-01')],
      };
      const estado = calculado(calcularEstado(hechos, HOY));
      expect(estado.reservasAnuales).toEqual([{ obligacionId: 'x', reserva: 600_000 }]);
      expect(estado.aportesProgramados.map((a) => a.fecha)).toEqual(['2026-11-30']);
    });

    it('G. un prorrateo con el Pago 2 atrasado usa la fecha esperada', () => {
      // Pago 2 del 30-oct atrasado (saldo al 25-oct): el prorrateo del 30-oct ya se acreditó.
      const hechos: Hechos = {
        ...casoBase,
        saldoInicial: { monto: 10_000_000, fecha: '2026-10-25' },
        obligaciones: [anual('x', 'X', 1_200_000, '2027-06-01', 0, '2026-10-25')],
      };
      const estado = calculado(calcularEstado(hechos, HOY));
      expect(estado.pagosAtrasados.map((p) => p.fecha)).toEqual(['2026-10-30']);
      expect(estado.reservas.anual).toBe(100_000);
    });

    describe('H. bordes', () => {
      it('una ocurrencia en hoy está pendiente pero no vencida', () => {
        const hechos: Hechos = { ...casoBase, obligaciones: [mensual('m', 'M', 3, 100)] };
        const estado = calculado(
          calcularEstado({ ...hechos, saldoInicial: { monto: 1_000, fecha: '2026-11-02' } }, HOY),
        );
        expect(estado.obligacionesPendientes[0]).toMatchObject({ fecha: HOY, fechaProyectada: HOY, vencida: false });
        expect(estado.obligacionesVencidas).toEqual([]);
        expect(estado.saldoProyectado[0].saldo).toBe(900);
      });

      it('una ocurrencia en hoy+31 cuenta y una en hoy+32 no', () => {
        // hoy+31 = 4-dic, hoy+32 = 5-dic.
        const hechos: Hechos = {
          ...casoBase,
          obligaciones: [
            mensual('a', 'A', 4, 100),
            mensual('b', 'B', 5, 7),
            anual('c', 'C', 1_200, '2026-12-05', 0, HOY),
          ],
        };
        const estado = calculado(calcularEstado(hechos, HOY));
        expect(estado.obligacionesPendientes.map((o) => o.fecha)).toEqual(['2026-11-04', '2026-11-05', '2026-12-04']);
      });

      it('una ocurrencia el mismo día del saldo inicial no cuenta', () => {
        const hechos: Hechos = {
          ...casoBase,
          saldoInicial: { monto: 1_000, fecha: '2026-11-02' },
          obligaciones: [mensual('m', 'M', 2, 100), anual('a', 'A', 1_200, '2026-11-02', 0, '2026-11-02')],
        };
        const estado = calculado(calcularEstado(hechos, HOY));
        expect(estado.obligacionesPendientes.map((o) => o.fecha)).toEqual(['2026-12-02']);
      });

      it('una mensual del día 31 cae el 30 en noviembre', () => {
        const hechos: Hechos = { ...casoBase, obligaciones: [mensual('m', 'M', 31, 100)] };
        const estado = calculado(calcularEstado(hechos, HOY));
        expect(estado.obligacionesPendientes.map((o) => [o.clave, o.fecha])).toEqual([['2026-11', '2026-11-30']]);
      });

      it('dos vencidas con la misma fecha y nombre se ordenan por id; reservasAnuales sigue el orden de los hechos', () => {
        const hechos: Hechos = {
          ...casoBase,
          saldoInicial: { monto: 10_000_000, fecha: '2026-11-05' },
          obligaciones: [
            anual('b', 'B', 1_200, '2026-11-08', 100, '2026-11-05'),
            anual('a', 'B', 1_200, '2026-11-08', 50, '2026-11-05'),
          ],
        };
        const estado = calculado(calcularEstado(hechos, '2026-11-12'));
        // Mismo nombre y fecha: desempata el id.
        expect(estado.obligacionesVencidas.map((o) => [o.obligacionId, o.reservaLiberada])).toEqual([
          ['a', 50],
          ['b', 100],
        ]);
        expect(estado.reservasAnuales).toEqual([
          { obligacionId: 'b', reserva: 100 },
          { obligacionId: 'a', reserva: 50 },
        ]);
      });
    });

    it('todos los montos son enteros', () => {
      const estado = calculado(calcularEstado(casoA, HOY));
      const montos = [
        estado.dineroLibre,
        estado.reservas.total,
        ...estado.saldoProyectado.map((d) => d.saldo),
        ...estado.obligacionesPendientes.flatMap((o) => [o.monto, o.reservaLiberada]),
        ...estado.aportesProgramados.map((a) => a.monto),
      ];
      expect(montos.every(Number.isInteger)).toBe(true);
    });
  });

  describe('Presupuestos esenciales y Fondos protegidos', () => {
    function presupuesto(id: string, nombre: string, montoMensual: number | null): PresupuestoEsencial {
      return { id, nombre, montoMensual };
    }

    function fondo(aporteMensual: number | null, saldo: { monto: number; fecha: string } | null): FondoProtegido {
      return { id: 'enduro', nombre: 'Fondo enduro', aporteMensual, saldoInicial: saldo };
    }

    const categorias: Categoria[] = [
      {
        id: 'combustible',
        nombre: 'Combustible',
        claseDefault: 'esencial',
        presupuestoId: 'mant',
        fondoId: null,
        requiereVehiculo: true,
        esSistema: false,
      },
      {
        id: 'equipo',
        nombre: 'Equipo de enduro',
        claseDefault: 'fondo',
        presupuestoId: null,
        fondoId: 'enduro',
        requiereVehiculo: false,
        esSistema: false,
      },
    ];

    const casoA: Hechos = {
      ...casoBase,
      obligaciones: [
        mensual('servicios', 'Servicios', 8, 300_000),
        mensual('arriendo', 'Arriendo', 1, 1_500_000),
        anual('soat', 'SOAT', 1_800_000, '2027-03-15', 400_000, '2026-11-03'),
      ],
    };

    /** Caso A6: el addendum recortado a H1.6 (caso A de H1.5 + Presupuestos y fondo). */
    const casoA6: Hechos = {
      ...casoA,
      presupuestos: [
        presupuesto('comida', 'Comida', 700_000),
        presupuesto('mant', 'Mantenimiento de vehículos', 400_000),
      ],
      fondos: [fondo(350_000, { monto: 350_000, fecha: '2026-11-03' })],
      categorias,
    };

    it('A6. addendum recortado: Reservas, fondo, Aportes, saldo proyectado, mínimo y Dinero libre', () => {
      const estado = calculado(calcularEstado(casoA6, HOY));
      expect(estado.reservas).toEqual({ anual: 400_000, fondo: 350_000, total: 750_000 });
      expect(estado.fondos).toEqual([{ fondoId: 'enduro', nombre: 'Fondo enduro', saldo: 350_000 }]);
      expect(estado.aportesProgramados).toEqual([
        { fecha: '2026-11-30', tipo: 'fondo', fondoId: 'enduro', monto: 350_000 },
        { fecha: '2026-11-30', tipo: 'prorrateoAnual', obligacionId: 'soat', monto: 150_000 },
      ]);
      expect(estado.presupuestosPendientes).toEqual([
        { presupuestoId: 'comida', mes: '2026-11', fecha: '2026-11-03', monto: 700_000 },
        { presupuestoId: 'mant', mes: '2026-11', fecha: '2026-11-03', monto: 400_000 },
        { presupuestoId: 'comida', mes: '2026-12', fecha: '2026-12-01', monto: 700_000 },
        { presupuestoId: 'mant', mes: '2026-12', fecha: '2026-12-01', monto: 400_000 },
      ]);
      for (const d of estado.saldoProyectado) {
        const esperado =
          d.fecha < '2026-11-08'
            ? 8_150_000
            : d.fecha < '2026-11-10'
              ? 7_850_000
              : d.fecha < '2026-11-30'
                ? 9_850_000
                : d.fecha < '2026-12-01'
                  ? 15_350_000
                  : 12_750_000;
        expect(d).toEqual({ fecha: d.fecha, saldo: esperado });
      }
      expect(estado.minimo).toEqual({ fecha: '2026-11-08', saldo: 7_850_000 });
      expect(estado.dineroLibre).toBe(3_850_000);
    });

    it('sin montos ni fondo configurado: las mismas cifras de H1.5', () => {
      const sembrado: Hechos = {
        ...casoA,
        presupuestos: [presupuesto('comida', 'Comida', null), presupuesto('mant', 'Mantenimiento de vehículos', null)],
        fondos: [fondo(null, null)],
        categorias,
      };
      const estado = calculado(calcularEstado(sembrado, HOY));
      expect(estado).toEqual(calcularEstado(casoA, HOY));
      expect(estado.dineroLibre).toBe(5_300_000);
      expect(estado.fondos).toEqual([]);
      expect(estado.reservas).toEqual({ anual: 400_000, fondo: 0, total: 400_000 });
    });

    it('un fondo con saldo y aporte 0 aparece y reserva su saldo, sin Aportes', () => {
      const hechos: Hechos = { ...casoBase, fondos: [fondo(0, { monto: 100_000, fecha: '2026-11-03' })] };
      const estado = calculado(calcularEstado(hechos, HOY));
      expect(estado.fondos).toEqual([{ fondoId: 'enduro', nombre: 'Fondo enduro', saldo: 100_000 }]);
      expect(estado.aportesProgramados).toEqual([]);
      expect(estado.saldoProyectado[0].saldo).toBe(9_900_000);
    });

    it('las categorías no cambian ninguna cifra', () => {
      expect(calcularEstado({ ...casoA6, categorias: [] }, HOY)).toEqual(calcularEstado(casoA6, HOY));
    });

    it('todos los montos son enteros', () => {
      const estado = calculado(calcularEstado(casoA6, HOY));
      const montos = [
        estado.dineroLibre,
        estado.reservas.total,
        estado.reservas.fondo,
        ...estado.saldoProyectado.map((d) => d.saldo),
        ...estado.presupuestosPendientes.map((p) => p.monto),
        ...estado.fondos.map((f) => f.saldo),
        ...estado.aportesProgramados.map((a) => a.monto),
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
      vehiculos: congelar([congelar({ id: 'v1', nombre: 'Moto azul' })]),
      obligaciones: congelar([
        congelar(mensual('servicios', 'Servicios', 8, 300_000)),
        congelar({
          ...anual('soat', 'SOAT', 1_800_000, '2026-12-01', 400_000, '2026-11-01'),
          vehiculoId: 'v1',
          reservaInicial: congelar({ monto: 400_000, fecha: '2026-11-01' }),
        }),
      ]),
      presupuestos: congelar([congelar({ id: 'comida', nombre: 'Comida', montoMensual: 700_000 })]),
      fondos: congelar([
        congelar({
          id: 'enduro',
          nombre: 'Fondo enduro',
          aporteMensual: 350_000,
          saldoInicial: congelar({ monto: 100_000, fecha: '2026-10-01' }),
        }),
      ]),
      categorias: congelar([
        congelar({
          id: 'salud',
          nombre: 'Salud',
          claseDefault: 'esencial' as const,
          presupuestoId: null,
          fondoId: null,
          requiereVehiculo: false,
          esSistema: false,
        }),
      ]),
    });
    const copia = JSON.parse(JSON.stringify(hechos));
    const a = calcularEstado(hechos, HOY);
    const b = calcularEstado(hechos, HOY);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(hechos).toEqual(copia);
  });
});
