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
} as const;
