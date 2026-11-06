// Textos del acceso protegido (AD-15, AD-17): la voz del socio, sin cifras.
export const textosAcceso = {
  dialogo: {
    promptMessage: 'Confirma que eres tú para ver tus finanzas.',
    cancelLabel: 'Cancelar',
  },
  titulo: 'MoneyTrack',
  bloqueado: 'Tus finanzas están protegidas. Desbloquea para verlas.',
  verificando: 'Confirmando que eres tú…',
  reintentar: 'Desbloquear',
  errores: {
    cancelado: 'No se desbloqueó. Cuando quieras ver tus finanzas, toca Desbloquear.',
    sinBloqueo:
      'Tu celular no tiene huella ni bloqueo de pantalla. Configura uno en los ajustes del teléfono y vuelve a intentarlo.',
    bloqueoTemporal: 'Hubo demasiados intentos. Espera un momento y vuelve a intentarlo.',
    fallo: 'No pude confirmar que eres tú. Inténtalo de nuevo.',
  },
} as const;
