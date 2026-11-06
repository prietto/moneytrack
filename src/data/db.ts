import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

function abrir() {
  // enableChangeListener es necesario para useLiveQuery (H1.3).
  const expoDb = openDatabaseSync('moneytrack.db', { enableChangeListener: true });
  return drizzle(expoDb, { schema });
}

let instancia: ReturnType<typeof abrir> | null = null;

/**
 * Abre la base en la primera llamada y la reutiliza después. No se abre al
 * importar el módulo: así un fallo al abrir no tumba la app antes de montar
 * el layout, y useMigraciones() lo muestra con opción de reintentar (AD-23).
 */
export function obtenerDb() {
  instancia ??= abrir();
  return instancia;
}

export type BaseDeDatos = ReturnType<typeof obtenerDb>;
