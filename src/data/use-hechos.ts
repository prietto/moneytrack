import { useMemo, useSyncExternalStore } from 'react';

import type { Hechos } from '@/domain/hechos';

import { suscribirCambios, versionCambios } from './cambios';
import { obtenerDb } from './db';
import { cargarHechos } from './queries/cargar-hechos';

/**
 * Caché de módulo: los hechos leídos para una versión de la señal de cambios.
 * Todos los `useHechos` y `cargarHechosActuales()` de la misma versión
 * comparten una sola lectura y el mismo objeto (sin N+1 cargas ni re-render
 * por identidad nueva). Solo guarda cargas exitosas.
 */
let cache: { version: number; hechos: Hechos } | null = null;

/**
 * Hechos de `version`, de la caché o recién leídos. La versión se fija antes
 * de leer: si un commit ocurre durante la lectura, la versión sube y la
 * próxima llamada vuelve a leer. Un error se lanza y no se guarda.
 */
function hechosDeVersion(version: number): Hechos {
  if (cache?.version === version) return cache.hechos;
  const hechos = cargarHechos(obtenerDb());
  cache = { version, hechos };
  return hechos;
}

/** Hechos de la base de la app. Para el recálculo post-comando (`hooks/use-comando`). */
export function cargarHechosActuales(): Hechos {
  return hechosDeVersion(versionCambios());
}

type Carga = { ok: true; hechos: Hechos } | { ok: false; error: unknown };

function cargar(version: number): Carga {
  try {
    return { ok: true, hechos: hechosDeVersion(version) };
  } catch (error) {
    return { ok: false, error };
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
 * no se pierde. Los hechos salen de la caché de módulo de esa versión.
 *
 * Si la carga falla (inicial o en una recarga), el error se lanza durante el
 * render, para que lo capture el ErrorBoundary raíz, que lo registra
 * (`app.errorBoundary`). data/ no puede llamar a log.
 */
export function useHechos(): Hechos {
  const version = useSyncExternalStore(suscribirCambios, versionCambios);
  const carga = useMemo(() => cargar(version), [version]);

  if (!carga.ok) throw carga.error;
  return carga.hechos;
}
