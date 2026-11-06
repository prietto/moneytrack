import { useSyncExternalStore } from 'react';

import { hoy, suscribirHoy } from '@/services/reloj';

// Estable fuera del componente: si cambiara en cada render, React re-suscribiría.
function suscribir(avisar: () => void): () => void {
  return suscribirHoy(() => avisar());
}

/**
 * El "hoy" de Bogotá para las pantallas (AD-8). Es el único hook que envuelve
 * `services/reloj`: se actualiza al cruzar la medianoche y al volver a primer
 * plano. Un aviso con el mismo día no re-renderiza (mismo string).
 *
 * `useSyncExternalStore` vuelve a leer `hoy()` al suscribirse: si la
 * medianoche cae entre el render y la suscripción, no se pierde el cambio.
 */
export function useHoy(): string {
  return useSyncExternalStore(suscribir, hoy);
}
