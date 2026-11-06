import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fallo, type Resultado } from '@/domain/resultado';
import { autenticar, type ErrorAcceso, type MensajesDialogo, requiereAutenticacion } from '@/services/biometria';
import { log } from '@/services/log';

export type EstadoDeAcceso = 'bloqueado' | 'verificando' | 'desbloqueado';

export type Acceso = {
  estado: EstadoDeAcceso;
  error?: ErrorAcceso;
  /** Contenido tapado mientras la app está en segundo plano o al volver. */
  cubierto: boolean;
  /** Se desbloqueó al menos una vez desde que se abrió la app. */
  haDesbloqueado: boolean;
  desbloquear: () => void;
};

/**
 * Estado del acceso protegido (AD-15): pide la huella o el bloqueo del
 * teléfono al abrir y al volver después de más de 5 minutos en segundo plano.
 * No guarda datos ni cifras.
 *
 * React Compiler: las refs solo se leen y escriben en efectos y manejadores.
 */
export function useAcceso(mensajes: MensajesDialogo): Acceso {
  const [estado, setEstado] = useState<EstadoDeAcceso>('bloqueado');
  const [error, setError] = useState<ErrorAcceso>();
  const [cubierto, setCubierto] = useState(false);
  const [haDesbloqueado, setHaDesbloqueado] = useState(false);

  const autenticandoRef = useRef(false);
  const desdeMsRef = useRef<number | null>(null);
  const estadoRef = useRef<EstadoDeAcceso>('bloqueado');
  const montadoRef = useRef(false);
  const mensajesRef = useRef(mensajes);

  useEffect(() => {
    mensajesRef.current = mensajes;
  }, [mensajes]);

  const cambiarEstado = useCallback((siguiente: EstadoDeAcceso) => {
    estadoRef.current = siguiente;
    setEstado(siguiente);
  }, []);

  const desbloquear = useCallback(() => {
    // Un solo intento a la vez: evita diálogos en cadena.
    if (autenticandoRef.current) return;
    autenticandoRef.current = true;
    setError(undefined);
    cambiarEstado('verificando');

    void autenticar(mensajesRef.current)
      // autenticar no lanza, pero si lo hiciera el guardia quedaría puesto
      // para siempre y la app no se podría desbloquear.
      .catch((error: unknown): Resultado<void, ErrorAcceso> => {
        log.error('acceso.desbloquear', { error });
        return fallo('fallo');
      })
      .then((resultado) => {
        autenticandoRef.current = false;
        if (!montadoRef.current) return;
        if (resultado.ok) {
          cambiarEstado('desbloqueado');
          setHaDesbloqueado(true);
          setCubierto(false);
        } else {
          // No se relanza solo: se espera el toque en "Desbloquear".
          cambiarEstado('bloqueado');
          setError(resultado.error);
        }
      });
  }, [cambiarEstado]);

  // Intento automático al montar (idempotente gracias a autenticandoRef).
  useEffect(() => {
    montadoRef.current = true;
    desbloquear();
    return () => {
      montadoRef.current = false;
    };
  }, [desbloquear]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      // En Android el PIN del teléfono abre otra actividad y la app recibe
      // background/active: sin este guardia, autenticarse dispararía otra
      // autenticación.
      if (autenticandoRef.current) return;

      if (siguiente === 'background') {
        if (estadoRef.current === 'desbloqueado') {
          desdeMsRef.current = Date.now();
          setCubierto(true);
        }
      } else if (siguiente === 'active') {
        const pedir = requiereAutenticacion(desdeMsRef.current, Date.now());
        desdeMsRef.current = null;
        if (pedir) {
          cambiarEstado('bloqueado');
          desbloquear();
        } else {
          setCubierto(false);
        }
      }
      // 'inactive' (iOS) se ignora.
    });
    return () => suscripcion.remove();
  }, [cambiarEstado, desbloquear]);

  return { estado, error, cubierto, haDesbloqueado, desbloquear };
}
