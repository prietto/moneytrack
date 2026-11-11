import { resultadoFondo, saldoFondoEn } from "./fondos";
import type { FondoProtegido } from "./hechos";
import type { Marco } from "./obligaciones";

function fondo(cambios: Partial<FondoProtegido> = {}): FondoProtegido {
  return {
    id: "enduro",
    nombre: "Fondo enduro",
    aporteMensual: 100_000,
    saldoInicial: { monto: 200_000, fecha: "2026-10-01" },
    ...cambios,
  };
}

const marco = (hoy: string, hasta: string): Marco => ({ fs: hoy, hoy, hasta });

describe("resultadoFondo", () => {
  it("F1. los créditos pasados suman al saldo y los futuros son Aportes programados", () => {
    expect(
      resultadoFondo(fondo(), 30, marco("2026-11-03", "2026-12-04")),
    ).toEqual({
      saldo: 300_000,
      aportes: [
        {
          fecha: "2026-11-30",
          tipo: "fondo",
          fondoId: "enduro",
          monto: 100_000,
        },
      ],
    });
  });

  it("F2. un crédito en hoy va al saldo; el siguiente es Aporte programado", () => {
    expect(
      resultadoFondo(fondo(), 30, marco("2026-11-30", "2026-12-31")),
    ).toEqual({
      saldo: 400_000,
      aportes: [
        {
          fecha: "2026-12-30",
          tipo: "fondo",
          fondoId: "enduro",
          monto: 100_000,
        },
      ],
    });
  });

  it("F3. un crédito en la misma fecha del saldo inicial no cuenta", () => {
    const f = fondo({ saldoInicial: { monto: 200_000, fecha: "2026-10-30" } });
    expect(
      resultadoFondo(f, 30, marco("2026-11-03", "2026-12-04"))?.saldo,
    ).toBe(200_000);
    const g = fondo({ saldoInicial: { monto: 200_000, fecha: "2026-10-29" } });
    expect(
      resultadoFondo(g, 30, marco("2026-11-03", "2026-12-04"))?.saldo,
    ).toBe(300_000);
  });

  it("F4. Pago 2 el día 31 cae el 30 en noviembre", () => {
    const f = fondo({ saldoInicial: { monto: 0, fecha: "2026-11-01" } });
    expect(
      resultadoFondo(f, 31, marco("2026-11-03", "2026-12-04"))?.aportes.map(
        (a) => a.fecha,
      ),
    ).toEqual(["2026-11-30"]);
  });

  it("F5. aporte 0: el saldo es el inicial y no hay Aportes programados", () => {
    expect(
      resultadoFondo(
        fondo({ aporteMensual: 0 }),
        30,
        marco("2026-11-03", "2026-12-04"),
      ),
    ).toEqual({
      saldo: 200_000,
      aportes: [],
    });
  });

  it("F5. sin configurar → null", () => {
    expect(
      resultadoFondo(
        fondo({ aporteMensual: null }),
        30,
        marco("2026-11-03", "2026-12-04"),
      ),
    ).toBeNull();
    expect(
      resultadoFondo(
        fondo({ saldoInicial: null }),
        30,
        marco("2026-11-03", "2026-12-04"),
      ),
    ).toBeNull();
  });

  it("lo no usado se acumula sin tope y usa la fecha esperada aunque el Pago 2 esté atrasado", () => {
    // Saldo al 2026-08-01; créditos el 30-ago, 30-sep y 30-oct; hoy 2026-11-03.
    const f = fondo({ saldoInicial: { monto: 0, fecha: "2026-08-01" } });
    expect(
      resultadoFondo(f, 30, marco("2026-11-03", "2026-12-04"))?.saldo,
    ).toBe(300_000);
  });
});

describe("saldoFondoEn", () => {
  it("es el saldo de resultadoFondo en hoy: suma los créditos ≤ hoy", () => {
    // Créditos el 30-oct (≤ hoy); el 30-nov es futuro.
    expect(saldoFondoEn(fondo(), 30, "2026-11-03")).toBe(300_000);
  });

  it("sin Pago 2 es el saldo inicial", () => {
    expect(saldoFondoEn(fondo(), null, "2026-11-03")).toBe(200_000);
  });

  it("con la fecha del saldo en hoy o después (reloj atrasado) es el saldo inicial", () => {
    expect(
      saldoFondoEn(
        fondo({ saldoInicial: { monto: 200_000, fecha: "2026-11-03" } }),
        3,
        "2026-11-03",
      ),
    ).toBe(200_000);
    expect(
      saldoFondoEn(
        fondo({ saldoInicial: { monto: 200_000, fecha: "2026-11-10" } }),
        5,
        "2026-11-03",
      ),
    ).toBe(200_000);
  });

  it("sin configurar → null", () => {
    expect(
      saldoFondoEn(fondo({ aporteMensual: null }), 30, "2026-11-03"),
    ).toBeNull();
    expect(
      saldoFondoEn(fondo({ saldoInicial: null }), 30, "2026-11-03"),
    ).toBeNull();
  });
});
