import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../drizzle/migrations';
import { db } from './db';

/**
 * Aplica las migraciones de drizzle/ al abrir la app. Vive en data/ para que
 * las pantallas no importen drizzle-orm (AD-3).
 */
export function useMigraciones(): { exito: boolean; error?: Error } {
  const { success, error } = useMigrations(db, migrations);
  return { exito: success, error };
}
