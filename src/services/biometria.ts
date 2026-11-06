import {
  authenticateAsync,
  getEnrolledLevelAsync,
  type LocalAuthenticationError,
  SecurityLevel,
} from 'expo-local-authentication';

import { fallo, ok, type Resultado } from '@/domain/resultado';

import { log } from './log';

/** Por qué no se pudo entrar (AD-15). Códigos, nunca texto libre (AD-23). */
export type ErrorAcceso = 'cancelado' | 'sinBloqueo' | 'bloqueoTemporal' | 'fallo';

export type MensajesDialogo = { promptMessage: string; cancelLabel: string };

/** Más de 5 minutos en segundo plano exige autenticarse de nuevo (AD-15). */
export const UMBRAL_REAUTENTICACION_MS = 5 * 60 * 1000;

const ERRORES: Record<LocalAuthenticationError, ErrorAcceso> = {
  user_cancel: 'cancelado',
  system_cancel: 'cancelado',
  app_cancel: 'cancelado',
  user_fallback: 'cancelado',
  not_enrolled: 'sinBloqueo',
  passcode_not_set: 'sinBloqueo',
  not_available: 'sinBloqueo',
  lockout: 'bloqueoTemporal',
  authentication_failed: 'fallo',
  timeout: 'fallo',
  unknown: 'fallo',
  unable_to_process: 'fallo',
  no_space: 'fallo',
  invalid_context: 'fallo',
};

function rechazar(error: ErrorAcceso): Resultado<void, ErrorAcceso> {
  // Fallo esperado: solo el código, sin más datos.
  log.aviso(`biometria.${error}`);
  return fallo(error);
}

/**
 * Pide la huella o el bloqueo del teléfono (PIN, patrón o contraseña). Nunca
 * lanza. Los textos del diálogo llegan por parámetro porque services/ no
 * importa textos/.
 */
export async function autenticar(mensajes: MensajesDialogo): Promise<Resultado<void, ErrorAcceso>> {
  try {
    if ((await getEnrolledLevelAsync()) === SecurityLevel.NONE) return rechazar('sinBloqueo');

    const resultado = await authenticateAsync({
      promptMessage: mensajes.promptMessage,
      cancelLabel: mensajes.cancelLabel,
      // Se acepta el bloqueo del teléfono además de la biometría (AD-15).
      disableDeviceFallback: false,
    });
    if (resultado.success) return ok(undefined);
    return rechazar(ERRORES[resultado.error] ?? 'fallo');
  } catch (error) {
    log.error('biometria.autenticar', { error });
    return fallo('fallo');
  }
}

/**
 * ¿Hay que autenticarse de nuevo al volver a primer plano? Solo si pasaron
 * estrictamente más de 5 minutos desde que la app se fue a segundo plano.
 * Si el reloj quedó atrás de la marca (alguien lo atrasó), también: el tiempo
 * real transcurrido es desconocido.
 */
export function requiereAutenticacion(desdeMs: number | null, ahoraMs: number): boolean {
  if (desdeMs === null) return false;
  return ahoraMs < desdeMs || ahoraMs - desdeMs > UMBRAL_REAUTENTICACION_MS;
}
