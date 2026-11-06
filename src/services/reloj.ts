import { AppState } from 'react-native';

/**
 * El único "hoy" de la app (AD-8): la fecha civil `YYYY-MM-DD` en
 * America/Bogota. Las pantallas lo leen con `useHoy()`; domain/ lo recibe
 * como parámetro.
 */

const DIA_MS = 86_400_000;
/**
 * America/Bogota es UTC−05:00 fijo: Colombia no tiene horario de verano desde
 * 1993. Se resta el offset en vez de usar `Intl` con `timeZone`, para no
 * depender del ICU de Hermes y para que sea determinista en las pruebas.
 */
const OFFSET_BOGOTA_MS = 5 * 3_600_000;
/** Tope de cada espera: evita timers de horas y corrige solo si el reloj se mueve. */
const ESPERA_MAXIMA_MS = 60 * 60_000;

/** Hoy en America/Bogota, `YYYY-MM-DD`. */
export function hoy(): string {
  return new Date(Date.now() - OFFSET_BOGOTA_MS).toISOString().slice(0, 10);
}

/** Milisegundos hasta la siguiente medianoche de Bogotá, con el tope de 60 min. */
function esperaHastaMedianoche(): number {
  const transcurrido = (((Date.now() - OFFSET_BOGOTA_MS) % DIA_MS) + DIA_MS) % DIA_MS;
  return Math.min(DIA_MS - transcurrido, ESPERA_MAXIMA_MS);
}

/**
 * Avisa a `cb`:
 * - al cruzar la medianoche de Bogotá (o si el reloj del teléfono cambia de
 *   día, también hacia atrás), con el nuevo `hoy`;
 * - cada vez que la app vuelve a primer plano ('active'), **siempre**, aunque
 *   el día no haya cambiado: AD-13 usará este aviso para reprogramar. Con la
 *   app en segundo plano Android congela los timers de JS; este aviso lo cubre.
 *
 * Devuelve la función para cancelar la suscripción.
 */
export function suscribirHoy(cb: (hoy: string) => void): () => void {
  let actual = hoy();
  let cancelado = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function programar() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (cancelado) return;
      const nuevo = hoy();
      // Se avisa solo si cambió; luego se reprograma una sola espera: aunque
      // el reloj retroceda no hay bucle.
      if (nuevo !== actual) {
        actual = nuevo;
        cb(nuevo);
      }
      programar();
    }, esperaHastaMedianoche());
  }

  const suscripcion = AppState.addEventListener('change', (estado) => {
    if (cancelado || estado !== 'active') return;
    actual = hoy();
    // Los timers pudieron quedar congelados: se recalcula la espera.
    programar();
    cb(actual);
  });

  programar();

  return () => {
    cancelado = true;
    clearTimeout(timer);
    suscripcion.remove();
  };
}
