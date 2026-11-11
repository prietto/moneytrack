// Pestaña Ajustes (AD-17). Los resúmenes reciben cifras ya formateadas.
export const textosAjustes = {
  pagos: 'Pagos',
  saldoYColchon: 'Saldo inicial y Colchón',
  sinConfigurar: 'Sin configurar',
  resumenPago: (numero: number, dia: number, monto: string) => `Pago ${numero}: día ${dia} · ${monto}`,
  resumenSaldoYColchon: (saldo: string, fecha: string, colchon: string) =>
    `Saldo ${saldo} al ${fecha} · Colchón ${colchon}`,
  resumenColchon: (colchon: string) => `Colchón ${colchon}`,
  vehiculos: 'Vehículos',
  obligaciones: 'Obligaciones',
  resumenVehiculos: (nombres: string[]) => (nombres.length === 0 ? 'Sin vehículos' : nombres.join(', ')),
  resumenObligaciones: (mensuales: number, anuales: number) => {
    const partes = [
      mensuales > 0 ? `${mensuales} ${mensuales === 1 ? 'mensual' : 'mensuales'}` : null,
      anuales > 0 ? `${anuales} ${anuales === 1 ? 'anual' : 'anuales'}` : null,
    ].filter((p) => p !== null);
    return partes.length === 0 ? 'Sin obligaciones' : partes.join(' · ');
  },
  presupuestosYFondo: 'Presupuestos y fondo',
  categorias: 'Categorías',
  lineaPresupuesto: (nombre: string, monto: string) => `${nombre} ${monto}`,
  /** `lineas`: "Comida 700.000", una por Presupuesto o Fondo configurado. */
  resumenPresupuestos: (lineas: string[]) => (lineas.length === 0 ? 'Sin configurar' : lineas.join(' · ')),
  resumenFondo: (nombre: string, aporte: string) => `${nombre}: ${aporte} al mes`,
  resumenCategorias: (cantidad: number) => `${cantidad} ${cantidad === 1 ? 'categoría' : 'categorías'}`,
} as const;
