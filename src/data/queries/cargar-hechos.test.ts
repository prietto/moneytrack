/** @jest-environment node */
import { eq, sql } from "drizzle-orm";

import { hechosVacios } from "@/domain/hechos";

import { crearBaseDePrueba } from "../pruebas/base-en-memoria";
import { hechosSembrados } from "../pruebas/hechos-sembrados";
import {
  ajustes,
  categorias,
  fondos,
  obligaciones,
  pagos,
  presupuestos,
  vehiculos,
} from "../schema";
import { IDS_SIEMBRA } from "../siembra";
import { cargarHechos } from "./cargar-hechos";

const AHORA = "2026-11-05T15:00:00.000Z";
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

describe("cargarHechos", () => {
  it("con la base recién migrada da la siembra: Presupuestos y fondo sin montos y 11 categorías", () => {
    const { db } = abrir();
    expect(cargarHechos(db)).toEqual(hechosSembrados);
  });

  it("devuelve un objeto y arreglos nuevos en cada carga, nunca los de hechosVacios", () => {
    const { db } = abrir();
    const hechos = cargarHechos(db);
    expect(hechos).not.toBe(hechosVacios);
    expect(hechos.pagos).not.toBe(hechosVacios.pagos);
    expect(cargarHechos(db).pagos).not.toBe(hechos.pagos);
    expect(hechos.vehiculos).not.toBe(hechosVacios.vehiculos);
    expect(hechos.obligaciones).not.toBe(hechosVacios.obligaciones);
    expect(hechos.presupuestos).not.toBe(cargarHechos(db).presupuestos);
    expect(hechos.fondos).not.toBe(cargarHechos(db).fondos);
    expect(hechos.categorias).not.toBe(cargarHechos(db).categorias);
  });

  it("con filas devuelve los Hechos esperados, con los Pagos ordenados por número", () => {
    const { db } = abrir();
    db.insert(pagos)
      .values([
        { id: "p2", ...marcas, numero: 2, dia: 30, montoEsperado: 6_000_000 },
        { id: "p1", ...marcas, numero: 1, dia: 10, montoEsperado: 2_000_000 },
      ])
      .run();
    db.insert(ajustes)
      .values({
        id: "a",
        ...marcas,
        saldoInicialMonto: 10_000_000,
        saldoInicialFecha: "2026-11-03",
        colchon: 4_000_000,
      })
      .run();

    expect(cargarHechos(db)).toEqual({
      ...hechosSembrados,
      saldoInicial: { monto: 10_000_000, fecha: "2026-11-03" },
      colchon: 4_000_000,
      pagos: [
        { id: "p1", numero: 1, dia: 10, montoEsperado: 2_000_000 },
        { id: "p2", numero: 2, dia: 30, montoEsperado: 6_000_000 },
      ],
      vehiculos: [],
      obligaciones: [],
    });
  });

  it("excluye las filas con deletedAt", () => {
    const { db } = abrir();
    db.insert(pagos)
      .values({
        id: "p1",
        ...marcas,
        deletedAt: AHORA,
        numero: 1,
        dia: 10,
        montoEsperado: 1,
      })
      .run();
    db.insert(ajustes)
      .values({
        id: "a",
        ...marcas,
        deletedAt: AHORA,
        saldoInicialMonto: 1,
        saldoInicialFecha: "2026-11-03",
        colchon: 1,
      })
      .run();
    expect(cargarHechos(db)).toEqual(hechosSembrados);
  });

  it("un saldo sin fecha (o una fecha sin monto) da saldoInicial null; el Colchón se lee aparte", () => {
    const { db } = abrir();
    db.insert(ajustes)
      .values({ id: "a", ...marcas, saldoInicialMonto: 1, colchon: 0 })
      .run();
    expect(cargarHechos(db)).toMatchObject({ saldoInicial: null, colchon: 0 });

    const otra = abrir();
    otra.db
      .insert(ajustes)
      .values({ id: "a", ...marcas, saldoInicialFecha: "2026-11-03" })
      .run();
    expect(cargarHechos(otra.db)).toMatchObject({
      saldoInicial: null,
      colchon: null,
    });
  });

  it("descarta un Pago con número fuera de 1 o 2", () => {
    const { db } = abrir();
    db.insert(pagos)
      .values([
        { id: "p1", ...marcas, numero: 1, dia: 10, montoEsperado: 1 },
        { id: "p3", ...marcas, numero: 3, dia: 15, montoEsperado: 1 },
      ])
      .run();
    expect(cargarHechos(db).pagos.map((p) => p.id)).toEqual(["p1"]);
  });

  it("con más de una fila de ajustes vigente, usa la de createdAt más antiguo", () => {
    const { db } = abrir();
    db.insert(ajustes)
      .values([
        {
          id: "nueva",
          createdAt: "2026-11-02T00:00:00.000Z",
          updatedAt: AHORA,
          colchon: 2,
        },
        {
          id: "vieja",
          createdAt: "2026-11-01T00:00:00.000Z",
          updatedAt: AHORA,
          colchon: 1,
        },
      ])
      .run();
    expect(cargarHechos(db).colchon).toBe(1);
  });
});

describe("cargarHechos: Vehículos y Obligaciones", () => {
  const DESPUES = "2026-11-06T15:00:00.000Z";
  const anual = {
    tipo: "anual" as const,
    nombre: "SOAT",
    monto: 1_800_000,
    fechaVencimiento: "2027-03-15",
    vehiculoId: "v1",
    reservaInicialMonto: 400_000,
    reservaInicialFecha: "2026-11-03",
  };

  it("lee los dos tipos y los Vehículos vigentes, en orden de creación", () => {
    const { db } = abrir();
    db.insert(vehiculos)
      .values([
        { id: "v2", createdAt: DESPUES, updatedAt: DESPUES, nombre: "Carro" },
        { id: "v1", ...marcas, nombre: "Moto azul" },
      ])
      .run();
    db.insert(obligaciones)
      .values([
        { id: "o2", createdAt: DESPUES, updatedAt: DESPUES, ...anual },
        {
          id: "o1",
          ...marcas,
          tipo: "mensual",
          nombre: "Arriendo",
          monto: 1_500_000,
          dia: 1,
        },
      ])
      .run();
    const hechos = cargarHechos(db);
    expect(hechos.vehiculos).toEqual([
      { id: "v1", nombre: "Moto azul" },
      { id: "v2", nombre: "Carro" },
    ]);
    expect(hechos.obligaciones).toEqual([
      {
        id: "o1",
        tipo: "mensual",
        nombre: "Arriendo",
        monto: 1_500_000,
        dia: 1,
      },
      {
        id: "o2",
        tipo: "anual",
        nombre: "SOAT",
        monto: 1_800_000,
        fechaVencimiento: "2027-03-15",
        vehiculoId: "v1",
        reservaInicial: { monto: 400_000, fecha: "2026-11-03" },
      },
    ]);
  });

  it("excluye los Vehículos y Obligaciones borrados", () => {
    const { db } = abrir();
    db.insert(vehiculos)
      .values({ id: "v1", ...marcas, deletedAt: AHORA, nombre: "Moto" })
      .run();
    db.insert(obligaciones)
      .values({
        id: "o1",
        ...marcas,
        deletedAt: AHORA,
        tipo: "mensual",
        nombre: "A",
        monto: 1,
        dia: 1,
      })
      .run();
    expect(cargarHechos(db)).toMatchObject({ vehiculos: [], obligaciones: [] });
  });

  it.each([
    [
      "mensual sin monto",
      { tipo: "mensual" as const, nombre: "A", monto: null, dia: 1 },
    ],
    [
      "mensual sin día",
      { tipo: "mensual" as const, nombre: "A", monto: 1, dia: null },
    ],
    ["anual sin monto", { ...anual, monto: null }],
    ["anual sin vencimiento", { ...anual, fechaVencimiento: null }],
    ["anual sin monto de reserva", { ...anual, reservaInicialMonto: null }],
    ["anual sin fecha de reserva", { ...anual, reservaInicialFecha: null }],
  ])("descarta una fila incompleta (%s) sin lanzar", (_caso, valores) => {
    const { db } = abrir();
    db.insert(obligaciones)
      .values({ id: "o1", ...marcas, ...valores })
      .run();
    expect(cargarHechos(db).obligaciones).toEqual([]);
  });

  it("un vehiculoId huérfano o de un Vehículo borrado pasa a null", () => {
    const { db } = abrir();
    db.insert(vehiculos)
      .values({ id: "v1", ...marcas, deletedAt: AHORA, nombre: "Moto" })
      .run();
    db.insert(obligaciones)
      .values([
        { id: "o1", ...marcas, ...anual },
        { id: "o2", ...marcas, ...anual, vehiculoId: "nunca-existio" },
      ])
      .run();
    expect(
      cargarHechos(db).obligaciones.map((o) =>
        o.tipo === "anual" ? o.vehiculoId : "x",
      ),
    ).toEqual([null, null]);
  });

  describe("Presupuestos, Fondos y categorías (H1.6)", () => {
    it("lee los montos configurados", () => {
      const { db } = abrir();
      db.update(presupuestos)
        .set({ montoMensual: 700_000 })
        .where(eq(presupuestos.id, IDS_SIEMBRA.presupuestoComida))
        .run();
      db.update(fondos)
        .set({
          aporteMensual: 350_000,
          saldoInicialMonto: 100_000,
          saldoInicialFecha: "2026-11-03",
        })
        .run();
      const hechos = cargarHechos(db);
      expect(hechos.presupuestos[0]).toEqual({
        id: IDS_SIEMBRA.presupuestoComida,
        nombre: "Comida",
        montoMensual: 700_000,
      });
      expect(hechos.fondos).toEqual([
        {
          id: IDS_SIEMBRA.fondoEnduro,
          nombre: "Fondo enduro",
          aporteMensual: 350_000,
          saldoInicial: { monto: 100_000, fecha: "2026-11-03" },
        },
      ]);
    });

    it.each([
      [
        "sin aporte",
        {
          aporteMensual: null,
          saldoInicialMonto: 1,
          saldoInicialFecha: "2026-11-03",
        },
      ],
      [
        "sin monto del saldo",
        {
          aporteMensual: 1,
          saldoInicialMonto: null,
          saldoInicialFecha: "2026-11-03",
        },
      ],
      [
        "sin fecha del saldo",
        { aporteMensual: 1, saldoInicialMonto: 1, saldoInicialFecha: null },
      ],
    ])(
      "un fondo a medio configurar (%s) da aporte y saldo en null",
      (_caso, valores) => {
        const { db } = abrir();
        db.update(fondos).set(valores).run();
        expect(cargarHechos(db).fondos).toEqual([
          {
            id: IDS_SIEMBRA.fondoEnduro,
            nombre: "Fondo enduro",
            aporteMensual: null,
            saldoInicial: null,
          },
        ]);
      },
    );

    it("un enlace huérfano o a una fila borrada pasa a null", () => {
      const { db } = abrir();
      db.update(presupuestos)
        .set({ deletedAt: AHORA })
        .where(eq(presupuestos.id, IDS_SIEMBRA.presupuestoMantenimiento))
        .run();
      db.update(fondos).set({ deletedAt: AHORA }).run();
      db.insert(categorias)
        .values({
          id: "c1",
          ...marcas,
          nombre: "Rara",
          claseDefault: "esencial",
          presupuestoId: "nunca-existio",
          fondoId: "tampoco",
        })
        .run();
      const porId = new Map(cargarHechos(db).categorias.map((c) => [c.id, c]));
      expect(
        porId.get(IDS_SIEMBRA.categoriaCombustible)?.presupuestoId,
      ).toBeNull();
      // Fondo protegido sin Fondo vigente: pasa a Gusto, nunca 'fondo' con fondoId null.
      expect(porId.get(IDS_SIEMBRA.categoriaEquipoEnduro)).toMatchObject({
        claseDefault: "gusto",
        fondoId: null,
      });
      expect(porId.get(IDS_SIEMBRA.categoriaMercado)?.presupuestoId).toBe(
        IDS_SIEMBRA.presupuestoComida,
      );
      expect(porId.get("c1")).toMatchObject({
        presupuestoId: null,
        fondoId: null,
      });
      expect(cargarHechos(db).presupuestos.map((p) => p.id)).toEqual([
        IDS_SIEMBRA.presupuestoComida,
      ]);
      expect(cargarHechos(db).fondos).toEqual([]);
    });

    it("un enlace que no corresponde a la clase pasa a null", () => {
      const { db } = abrir();
      db.insert(categorias)
        .values([
          {
            id: "g1",
            ...marcas,
            nombre: "Gusto con enlaces",
            claseDefault: "gusto",
            presupuestoId: IDS_SIEMBRA.presupuestoComida,
            fondoId: IDS_SIEMBRA.fondoEnduro,
          },
          {
            id: "e1",
            ...marcas,
            nombre: "Esencial con fondo",
            claseDefault: "esencial",
            presupuestoId: IDS_SIEMBRA.presupuestoComida,
            fondoId: IDS_SIEMBRA.fondoEnduro,
          },
          {
            id: "f1",
            ...marcas,
            nombre: "Fondo con presupuesto",
            claseDefault: "fondo",
            presupuestoId: IDS_SIEMBRA.presupuestoComida,
            fondoId: IDS_SIEMBRA.fondoEnduro,
          },
        ])
        .run();
      const porId = new Map(cargarHechos(db).categorias.map((c) => [c.id, c]));
      expect(porId.get("g1")).toMatchObject({
        claseDefault: "gusto",
        presupuestoId: null,
        fondoId: null,
      });
      expect(porId.get("e1")).toMatchObject({
        claseDefault: "esencial",
        presupuestoId: IDS_SIEMBRA.presupuestoComida,
        fondoId: null,
      });
      expect(porId.get("f1")).toMatchObject({
        claseDefault: "fondo",
        presupuestoId: null,
        fondoId: IDS_SIEMBRA.fondoEnduro,
      });
    });

    it("excluye las categorías borradas", () => {
      const { db } = abrir();
      db.update(categorias)
        .set({ deletedAt: AHORA })
        .where(eq(categorias.id, IDS_SIEMBRA.categoriaOtros))
        .run();
      const ids = cargarHechos(db).categorias.map((c) => c.id);
      expect(ids).toHaveLength(10);
      expect(ids).not.toContain(IDS_SIEMBRA.categoriaOtros);
    });

    it("descarta sin lanzar una categoría con clase desconocida", () => {
      const { db } = abrir();
      // Sin CHECK en SQL: una fila así solo llega escrita a mano (o desde una copia ajena).
      db.run(
        sql`insert into categorias (id, created_at, updated_at, nombre, clase_default) values ('c1', ${AHORA}, ${AHORA}, 'Rara', 'lujo')`,
      );
      expect(cargarHechos(db).categorias.map((c) => c.id)).not.toContain("c1");
      expect(cargarHechos(db).categorias).toHaveLength(11);
    });

    it("las categorías nuevas van después de las sembradas (orden de creación)", () => {
      const { db } = abrir();
      db.insert(categorias)
        .values({
          id: "c1",
          createdAt: "2999-01-01T00:00:00.000Z",
          updatedAt: AHORA,
          nombre: "Nueva",
          claseDefault: "gusto",
        })
        .run();
      expect(cargarHechos(db).categorias.at(-1)?.id).toBe("c1");
    });
  });
});
