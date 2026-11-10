import type { Faltante } from '@/domain/estado';

// Pantalla principal (AD-17, UX-DR3): la voz del socio, honesta y sin culpa.
// Las funciones reciben cifras y fechas YA formateadas.
export const textosInicio = {
  dineroLibre: 'Dinero libre',
  explicacionDineroLibre: 'Lo que puedes gastar hoy sin tocar lo que ya tiene destino ni tu Colchón.',
  saldoCalculado: 'Saldo calculado',
  faltante: (monto: string, dia: string) => `Ojo: el ${dia} te faltarían ${monto} para mantener tu Colchón.`,
  pagoAtrasado: (numero: number, dia: string) =>
    `Tu Pago ${numero} del ${dia} aún no está confirmado; lo cuento como si llegara hoy.`,
  obligacionesVencidas: 'Obligaciones vencidas',
  obligacionVencida: (nombre: string, monto: string, dia: string) =>
    `${nombre}: ${monto}, venció el ${dia}. Lo cuento como si lo pagaras hoy.`,
  accesos: {
    registro: 'Registrar un gasto',
    camara: 'Fotografiar una factura',
    puedo: '¿Puedo?',
  },
  vacio: {
    titulo: 'Aún no puedo hacer tus cuentas',
    mensaje: 'Me faltan unos datos para mostrarte cuánto tienes libre. No te invento cifras: completa esto y listo.',
    faltan: {
      pagos: 'Tus dos Pagos: qué día llegan y cuánto esperas.',
      saldoInicial: 'Tu Saldo real: lo que hoy dice tu cuenta del banco.',
      colchon: 'Tu Colchón: lo que nunca tocas.',
    } satisfies Record<Faltante, string>,
    vineta: (texto: string) => `• ${texto}`,
    irAPagos: 'Configurar mis Pagos',
    irASaldoYColchon: 'Configurar saldo y Colchón',
  },
} as const;
