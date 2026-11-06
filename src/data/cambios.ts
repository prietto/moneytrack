/**
 * Señal de "cambiaron los datos" (AD-18). La emite `ejecutarComando` tras
 * cada commit y la escucha `useHechos` para recargar. Toda escritura pasa por
 * un comando (AD-3), así que la señal cubre todos los cambios.
 */

type Oyente = () => void;

const oyentes = new Set<Oyente>();

/** Cuenta los avisos: permite saber si hubo un cambio entre una carga y la suscripción. */
let version = 0;

/** Número de avisos emitidos hasta ahora. */
export function versionCambios(): number {
  return version;
}

/**
 * Avisa a todos los oyentes. Nunca lanza: se llama después del commit y un
 * oyente roto no debe convertir el commit en un error ni dejar sin aviso a
 * los demás. El error del oyente va al manejador global como **no fatal**
 * (`app.errorNoControlado`). Relanzarlo en un timer no sirve: en React Native
 * un error dentro de un timer es fatal y en release cierra la app.
 * data/ no puede importar services/log.
 */
export function avisarCambio(): void {
  version += 1;
  // Copia: un oyente que se cancela durante el aviso no altera la iteración.
  for (const oyente of [...oyentes]) {
    try {
      oyente();
    } catch (error) {
      ErrorUtils.getGlobalHandler()(error, false);
    }
  }
}

/** Devuelve la función para cancelar la suscripción. */
export function suscribirCambios(cb: Oyente): () => void {
  // Envoltura propia: suscribir dos veces la misma función da dos suscripciones independientes.
  const oyente: Oyente = () => cb();
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}
