import { useMemo, useSyncExternalStore } from 'react';

import type { Hechos } from '@/domain/hechos';

import { suscribirCambios, versionCambios } from './cambios';
import { obtenerDb } from './db';
import { cargarHechos } from './queries/cargar-hechos';

/** Hechos de la base de la app. Para el recálculo post-comando (`hooks/use-comando`). */
export function cargarHechosActuales(): Hechos {
  return cargarHechos(obtenerDb());
}

/** `version`: la de la señal de cambios con la que se cargó. */
type Carga = ({ ok: true; hechos: Hechos } | { ok: false; error: unknown }) & { version: number };

function cargar(version: number): Carga {
  try {
    return { ok: true, hechos: cargarHechosActuales(), version };
  } catch (error) {
    return { ok: false, error, version };
  }
}

/**
 * Hechos reactivos (AD-18). Vive en data/, como `useMigraciones`, porque
 * necesita la base; `hooks/use-estado` lo combina con `useHoy`.
 *
 * No usa `useLiveQuery` de drizzle: escucha una sola tabla, y los Hechos
 * juntan varias. Recarga con la señal explícita que emite `ejecutarComando`
 * tras cada commit (toda escritura pasa por un comando).
 *
 * Supone la base ya migrada: las pantallas se montan después de
 * `migraciones.exito` (layout raíz).
 *
 * La versión de la señal se lee con `useSyncExternalStore`: React la vuelve
 * a leer al suscribirse, así que un commit entre el render y la suscripción
 * no se pierde. Los hechos se recargan solo cuando cambia la versión.
 *
 * Si la carga falla (inicial o en una recarga), el error se guarda
 * y se lanza durante el render, para que lo capture el ErrorBoundary raíz,
 * que lo registra (`app.errorBoundary`). data/ no puede llamar a log.
 */
export function useHechos(): Hechos {
  const version = useSyncExternalStore(suscribirCambios, versionCambios);
  const carga = useMemo(() => cargar(version), [version]);

  if (!carga.ok) throw carga.error;
  return carga.hechos;
}
