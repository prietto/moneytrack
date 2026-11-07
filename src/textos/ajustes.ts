// Pestaña Ajustes (AD-17). Los resúmenes reciben cifras ya formateadas.
export const textosAjustes = {
  pagos: 'Pagos',
  saldoYColchon: 'Saldo inicial y Colchón',
  sinConfigurar: 'Sin configurar',
  resumenPago: (numero: number, dia: number, monto: string) => `Pago ${numero}: día ${dia} · ${monto}`,
  resumenSaldoYColchon: (saldo: string, fecha: string, colchon: string) =>
    `Saldo ${saldo} al ${fecha} · Colchón ${colchon}`,
  resumenColchon: (colchon: string) => `Colchón ${colchon}`,
} as const;
