import type { ComandoDefinido } from '@/data/commands/definir-comando';
import { ejecutarComando } from '@/data/ejecutar-comando';
import { cargarHechosActuales } from '@/data/use-hechos';
import { calcularEstado } from '@/domain/calcular-estado';
import type { Estado } from '@/domain/estado';
import { fallo, ok, type Resultado } from '@/domain/resultado';
import { log } from '@/services/log';
import { hoy } from '@/services/reloj';

export type TrasComando = (estado: Estado, hoy: string) => void;

/**
 * Punto de extensión post-comando (AD-18). En H1.3 está vacío; la Épica 6
 * conecta aquí `notificaciones.reprogramar`.
 */
const trasComando = new Set<TrasComando>();

/** Registra una función que corre tras cada commit. Devuelve su cancelador. */
export function registrarTrasComando(fn: TrasComando): () => void {
  // Envoltura propia: registrar dos veces la misma función da dos registros independientes.
  const registro: TrasComando = (estado, dia) => fn(estado, dia);
  trasComando.add(registro);
  return () => {
    trasComando.delete(registro);
  };
}

function correrTrasComando(): void {
  if (trasComando.size === 0) return;
  let estado: Estado;
  let dia: string;
  try {
    // `hoy()` del momento y no `useHoy`: esto corre fuera del render.
    dia = hoy();
    estado = calcularEstado(cargarHechosActuales(), dia);
  } catch (error) {
    log.error('comando.trasComando', { error });
    return;
  }
  for (const fn of [...trasComando]) {
    try {
      fn(estado, dia);
    } catch (error) {
      // Un fallo aquí no deshace el commit ni cambia el ok.
      log.error('comando.trasComando', { error });
    }
  }
}

/**
 * La única vía de escritura de las pantallas (AD-3, AD-18). Solo acepta
 * comandos fabricados en `data/commands` (`ComandoDefinido`). Nunca lanza
 * hacia src/app/ (AD-23): si el comando falla, registra la causa en el log
 * (`comando.<operacion>`) y devuelve `fallo('fallo')`, sin la causa.
 */
export function ejecutar<T>(comando: ComandoDefinido<T>): Resultado<T, 'fallo'> {
  const resultado = ejecutarComando(comando);
  if (!resultado.ok) {
    log.error(`comando.${comando.operacion}`, { error: resultado.error.causa });
    return fallo('fallo');
  }
  correrTrasComando();
  return ok(resultado.valor);
}

/** Forma de hook de `ejecutar`, para quien la prefiera. */
export function useComando(): { ejecutar: typeof ejecutar } {
  return { ejecutar };
}
