/** @jest-environment node */
import { eq } from 'drizzle-orm';

import { ejecutarComando } from '../ejecutar-comando';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { fondos, presupuestos, rastro } from '../schema';
import { IDS_SIEMBRA } from '../siembra';
import { type EntradaPresupuestosYFondos, guardarPresupuestosYFondos } from './guardar-presupuestos-y-fondos';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../db', () => ({ obtenerDb: jest.fn() }));

const HOY = '2026-11-05';
const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';
const { presupuestoComida: COMIDA, presupuestoMantenimiento: MANT, fondoEnduro: ENDURO } = IDS_SIEMBRA;

const entrada: EntradaPresupuestosYFondos = {
  presupuestos: [
    { id: COMIDA, montoMensual: 700_000 },
    { id: MANT, montoMensual: 400_000 },
  ],
  fondos: [{ id: ENDURO, aporteMensual: 350_000, saldoInicial: { monto: 350_000, fecha: HOY } }],
};

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  let n = 0;
  const ejecutarEn = (comando: Parameters<typeof ejecutarComando>[0], ahora = AHORA) =>
    ejecutarComando(comando, { db: base.db, ahora, nuevoId: () => `r-${++n}` });
  const leer = () => ({
    presupuestos: base.db.select().from(presupuestos).all(),
    fondos: base.db.select().from(fondos).all(),
    rastro: base.db.select().from(rastro).all(),
  });
  return { ...base, ejecutarEn, leer };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

const fallo = (causa: string) => ({ ok: false, error: { codigo: 'fallo', causa: new Error(causa) } });

describe('guardarPresupuestosYFondos', () => {
  it('usa la operación presupuestosYFondos.guardar', () => {
    expect(guardarPresupuestosYFondos(entrada, HOY).operacion).toBe('presupuestosYFondos.guardar');
  });

  it('guarda los montos y deja un rastro editar por fila cambiada', () => {
    const { ejecutarEn, leer } = preparar();
    expect(ejecutarEn(guardarPresupuestosYFondos(entrada, HOY))).toEqual({ ok: true, valor: undefined });
    const { presupuestos: p, fondos: f, rastro: r } = leer();
    expect(p.map((x) => [x.id, x.montoMensual])).toEqual([
      [COMIDA, 700_000],
      [MANT, 400_000],
    ]);
    expect(f[0]).toMatchObject({
      aporteMensual: 350_000,
      saldoInicialMonto: 350_000,
      saldoInicialFecha: HOY,
      updatedAt: AHORA,
    });
    expect(r.map((x) => [x.entidad, x.entidadId, x.operacion])).toEqual([
      ['presupuestos', COMIDA, 'editar'],
      ['presupuestos', MANT, 'editar'],
      ['fondos', ENDURO, 'editar'],
    ]);
  });

  it('repetir los mismos datos no deja rastro nuevo; cambiar uno deja solo el suyo', () => {
    const { ejecutarEn, leer } = preparar();
    ejecutarEn(guardarPresupuestosYFondos(entrada, HOY));
    ejecutarEn(guardarPresupuestosYFondos(entrada, HOY), DESPUES);
    expect(leer().rastro).toHaveLength(3);
    const cambiada = { ...entrada, presupuestos: [{ id: COMIDA, montoMensual: 800_000 }, entrada.presupuestos[1]] };
    ejecutarEn(guardarPresupuestosYFondos(cambiada, HOY), DESPUES);
    expect(
      leer()
        .rastro.slice(3)
        .map((x) => x.entidadId),
    ).toEqual([COMIDA]);
  });

  it('un Presupuesto inválido junto a uno válido: fallo y ninguna fila cambia', () => {
    const { ejecutarEn, leer } = preparar();
    const antes = leer();
    const mala = {
      ...entrada,
      presupuestos: [
        { id: COMIDA, montoMensual: 700_000 },
        { id: MANT, montoMensual: -1 },
      ],
    };
    expect(ejecutarEn(guardarPresupuestosYFondos(mala, HOY))).toEqual(fallo('datosInvalidos'));
    expect(leer()).toEqual(antes);
  });

  it('un fondo inválido revierte también los Presupuestos', () => {
    const { ejecutarEn, leer } = preparar();
    const antes = leer();
    const mala = { ...entrada, fondos: [{ ...entrada.fondos[0], aporteMensual: 1.5 }] };
    expect(ejecutarEn(guardarPresupuestosYFondos(mala, HOY))).toEqual(fallo('datosInvalidos'));
    expect(leer()).toEqual(antes);
  });

  it('una fecha del fondo antigua y nueva falla; la guardada antigua se acepta al cambiar solo el aporte', () => {
    const { db, ejecutarEn, leer } = preparar();
    const antigua = '2026-08-01';
    const conFecha = (fecha: string, aporteMensual = 350_000): EntradaPresupuestosYFondos => ({
      presupuestos: [],
      fondos: [{ id: ENDURO, aporteMensual, saldoInicial: { monto: 0, fecha } }],
    });
    expect(ejecutarEn(guardarPresupuestosYFondos(conFecha(antigua), HOY))).toEqual(fallo('datosInvalidos'));
    // La fecha guardada envejeció: se escribe directo, como si se hubiera guardado hace meses.
    db.update(fondos)
      .set({ aporteMensual: 350_000, saldoInicialMonto: 0, saldoInicialFecha: antigua })
      .where(eq(fondos.id, ENDURO))
      .run();
    expect(ejecutarEn(guardarPresupuestosYFondos(conFecha(antigua, 400_000), HOY))).toEqual({
      ok: true,
      valor: undefined,
    });
    expect(leer().fondos[0]).toMatchObject({ aporteMensual: 400_000, saldoInicialFecha: antigua });
  });

  it('un id inexistente o borrado → fallo', () => {
    const { db, ejecutarEn } = preparar();
    const conId = (id: string) => ({ presupuestos: [{ id, montoMensual: 1 }], fondos: [] });
    expect(ejecutarEn(guardarPresupuestosYFondos(conId('nada'), HOY))).toEqual(fallo('filaNoEncontrada'));
    db.update(presupuestos).set({ deletedAt: AHORA }).where(eq(presupuestos.id, MANT)).run();
    expect(ejecutarEn(guardarPresupuestosYFondos(conId(MANT), HOY))).toEqual(fallo('filaNoEncontrada'));
    const fondoMalo = { presupuestos: [], fondos: [{ ...entrada.fondos[0], id: 'nada' }] };
    expect(ejecutarEn(guardarPresupuestosYFondos(fondoMalo, HOY))).toEqual(fallo('filaNoEncontrada'));
  });
});
