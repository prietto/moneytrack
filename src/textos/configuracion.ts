import type {
  ErrorObligacionAnual,
  ErrorObligacionMensual,
  ErrorPago,
  ErrorSaldoYColchon,
  ErrorVehiculo,
} from '@/domain/entrada';

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
  // Vehículos y Obligaciones (H1.5).
  nombre: 'Nombre',
  placeholderVehiculo: 'Ej.: Moto azul',
  placeholderObligacion: 'Ej.: Arriendo',
  tipo: 'Cada cuánto se paga',
  tipos: { mensual: 'Mensual', anual: 'Anual' },
  ayudaTipoFijo: 'Esto no se cambia. Si lo necesitas, borra esta Obligación y créala de nuevo.',
  monto: 'Monto',
  fechaVencimiento: 'Fecha de vencimiento',
  ayudaFechaVencimiento:
    'La próxima vez que vence; si ya venció y no la has pagado, el día en que venció. Escríbela como año-mes-día.',
  vehiculo: 'Vehículo',
  sinVehiculo: 'Sin vehículo',
  reserva: 'Reserva inicial',
  ayudaReserva: 'Lo que ya tienes guardado para esto; si no tienes nada, déjalo en 0.',
  fechaReserva: 'Fecha de la reserva',
  ayudaFechaReserva: 'El día en que tenías guardado ese monto. No puede ser futura ni de hace más de dos meses.',
  borrar: 'Borrar',
  confirmarBorrar: (nombre: string) => `¿Seguro? Toca otra vez para borrar «${nombre}».`,
  siBorrar: 'Sí, borrar',
  cancelar: 'Cancelar',
  borrando: 'Borrando…',
  falloAlBorrar: 'No pude borrar. Inténtalo de nuevo.',
  vehiculoEnUso: 'Este Vehículo tiene Obligaciones. Bórralas o quítales el Vehículo antes de borrarlo.',
  noEncontrado: 'Esto ya no existe; quizás se borró.',
  listas: {
    agregarVehiculo: 'Agregar vehículo',
    agregarObligacion: 'Agregar obligación',
    vacioVehiculos: 'Aún no tienes vehículos. Agrégalos para asociarles sus Obligaciones anuales, como el SOAT.',
    vacioObligaciones:
      'Aún no tienes Obligaciones. Agrega lo que pagas cada mes o cada año, como el arriendo o el SOAT.',
    mensuales: 'Mensuales',
    anuales: 'Anuales',
    resumenMensual: (dia: number, monto: string) => `Día ${dia} · ${monto}`,
    resumenAnual: (fecha: string, monto: string, vehiculo: string | null) =>
      vehiculo === null ? `${fecha} · ${monto}` : `${fecha} · ${monto} · ${vehiculo}`,
  },
  /** Mensajes de un campo concreto que ganan sobre `errores[codigo]`. */
  erroresVencimiento: {
    fechaAntigua: 'La fecha no puede tener más de dos meses. Si ya la pagaste, pon la próxima vez que vence.',
  },
  erroresFechaReserva: {
    fechaAntigua: 'La fecha no puede tener más de dos meses. Usa lo que tenías guardado un día reciente.',
  },
  errores: {
    diaInvalido: 'Escribe un día entre 1 y 31.',
    montoInvalido: 'Escribe un monto en pesos, sin decimales; por ejemplo 2.000.000.',
    fechaInvalida: 'Escribe la fecha como año-mes-día, por ejemplo 2026-11-05.',
    fechaFutura: 'La fecha no puede ser posterior a hoy.',
    fechaAntigua: 'La fecha no puede tener más de dos meses. Usa el saldo de tu cuenta de un día reciente.',
    colchonInvalido: 'Escribe tu Colchón en pesos, sin decimales; puede ser 0.',
    nombreVacio: 'Escribe un nombre.',
    nombreLargo: 'El nombre puede tener hasta 40 caracteres.',
    nombreRepetido: 'Ya tienes un vehículo con ese nombre.',
    fechaLejana: 'La fecha no puede ser de dentro de más de un año.',
    vehiculoInvalido: 'Ese vehículo ya no existe; elige otro.',
    reservaInvalida: 'Escribe lo que tienes guardado en pesos, sin decimales; puede ser 0.',
    reservaMayorQueMonto: 'Lo guardado no puede ser más que el monto.',
  } satisfies Record<
    ErrorPago | ErrorSaldoYColchon | ErrorVehiculo | ErrorObligacionMensual | ErrorObligacionAnual,
    string
  >,
} as const;
