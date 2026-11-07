/** @jest-environment node */
import { hechosVacios } from '@/domain/hechos';

import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { ajustes, pagos } from '../schema';
import { cargarHechos } from './cargar-hechos';

const AHORA = '2026-11-05T15:00:00.000Z';
const marcas = { createdAt: AHORA, updatedAt: AHORA };

const abiertas: (() => void)[] = [];
function abrir() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  return base;
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

describe('cargarHechos', () => {
  it('con la base vacía equivale a hechosVacios', () => {
    const { db } = abrir();
    expect(cargarHechos(db)).toEqual(hechosVacios);
  });

  it('devuelve un objeto y arreglos nuevos en cada carga, nunca los de hechosVacios', () => {
    const { db } = abrir();
    const hechos = cargarHechos(db);
    expect(hechos).not.toBe(hechosVacios);
    expect(hechos.pagos).not.toBe(hechosVacios.pagos);
    expect(cargarHechos(db).pagos).not.toBe(hechos.pagos);
  });

  it('con filas devuelve los Hechos esperados, con los Pagos ordenados por número', () => {
    const { db } = abrir();
    db.insert(pagos)
      .values([
        { id: 'p2', ...marcas, numero: 2, dia: 30, montoEsperado: 6_000_000 },
        { id: 'p1', ...marcas, numero: 1, dia: 10, montoEsperado: 2_000_000 },
      ])
      .run();
    db.insert(ajustes)
      .values({ id: 'a', ...marcas, saldoInicialMonto: 10_000_000, saldoInicialFecha: '2026-11-03', colchon: 4_000_000 })
      .run();

    expect(cargarHechos(db)).toEqual({
      saldoInicial: { monto: 10_000_000, fecha: '2026-11-03' },
      colchon: 4_000_000,
      pagos: [
        { id: 'p1', numero: 1, dia: 10, montoEsperado: 2_000_000 },
        { id: 'p2', numero: 2, dia: 30, montoEsperado: 6_000_000 },
      ],
    });
  });

  it('excluye las filas con deletedAt', () => {
    const { db } = abrir();
    db.insert(pagos)
      .values({ id: 'p1', ...marcas, deletedAt: AHORA, numero: 1, dia: 10, montoEsperado: 1 })
      .run();
    db.insert(ajustes)
      .values({ id: 'a', ...marcas, deletedAt: AHORA, saldoInicialMonto: 1, saldoInicialFecha: '2026-11-03', colchon: 1 })
      .run();
    expect(cargarHechos(db)).toEqual(hechosVacios);
  });

  it('un saldo sin fecha (o una fecha sin monto) da saldoInicial null; el Colchón se lee aparte', () => {
    const { db } = abrir();
    db.insert(ajustes).values({ id: 'a', ...marcas, saldoInicialMonto: 1, colchon: 0 }).run();
    expect(cargarHechos(db)).toMatchObject({ saldoInicial: null, colchon: 0 });

    const otra = abrir();
    otra.db.insert(ajustes).values({ id: 'a', ...marcas, saldoInicialFecha: '2026-11-03' }).run();
    expect(cargarHechos(otra.db)).toMatchObject({ saldoInicial: null, colchon: null });
  });

  it('descarta un Pago con número fuera de 1 o 2', () => {
    const { db } = abrir();
    db.insert(pagos)
      .values([
        { id: 'p1', ...marcas, numero: 1, dia: 10, montoEsperado: 1 },
        { id: 'p3', ...marcas, numero: 3, dia: 15, montoEsperado: 1 },
      ])
      .run();
    expect(cargarHechos(db).pagos.map((p) => p.id)).toEqual(['p1']);
  });

  it('con más de una fila de ajustes vigente, usa la de createdAt más antiguo', () => {
    const { db } = abrir();
    db.insert(ajustes)
      .values([
        { id: 'nueva', createdAt: '2026-11-02T00:00:00.000Z', updatedAt: AHORA, colchon: 2 },
        { id: 'vieja', createdAt: '2026-11-01T00:00:00.000Z', updatedAt: AHORA, colchon: 1 },
      ])
      .run();
    expect(cargarHechos(db).colchon).toBe(1);
  });
});
