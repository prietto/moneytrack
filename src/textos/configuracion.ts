import type { ErrorPago, ErrorSaldoYColchon } from '@/domain/entrada';

// Formularios de configuración (AD-17): etiquetas, ayuda y errores por código.
export const textosConfiguracion = {
  pago: (numero: number) => `Pago ${numero}`,
  dia: 'Día del mes',
  diaPago: (numero: number) => `Día del mes del Pago ${numero}`,
  placeholderDia: 'Ej.: 10',
  montoEsperado: 'Monto esperado',
  montoPago: (numero: number) => `Monto esperado del Pago ${numero}`,
  placeholderMonto: 'Ej.: 2.000.000',
  ayudaPagos:
    'Si el día no existe en un mes (por ejemplo, el 30 en febrero), lo cuento el último día de ese mes.',
  saldo: 'Saldo real',
  ayudaSaldo: 'Lo que hoy dice tu cuenta del banco.',
  fecha: 'Fecha del saldo',
  placeholderFecha: 'AAAA-MM-DD',
  ayudaFecha: 'Escríbela como año-mes-día, por ejemplo 2026-11-05. No puede ser futura ni de hace más de dos meses.',
  colchon: 'Colchón',
  ayudaColchon: 'Lo que nunca tocas. Puedes cambiarlo cuando quieras.',
  guardar: 'Guardar',
  guardando: 'Guardando…',
  falloAlGuardar: 'No pude guardar. Lo que escribiste sigue aquí; inténtalo de nuevo.',
  errores: {
    diaInvalido: 'Escribe un día entre 1 y 31.',
    montoInvalido: 'Escribe un monto en pesos, sin decimales; por ejemplo 2.000.000.',
    fechaInvalida: 'Escribe la fecha como año-mes-día, por ejemplo 2026-11-05.',
    fechaFutura: 'La fecha no puede ser posterior a hoy.',
    fechaAntigua: 'La fecha no puede tener más de dos meses. Usa el saldo de tu cuenta de un día reciente.',
    colchonInvalido: 'Escribe tu Colchón en pesos, sin decimales; puede ser 0.',
  } satisfies Record<ErrorPago | ErrorSaldoYColchon, string>,
} as const;
