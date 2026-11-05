import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';

import * as schema from '../schema';

const carpetaMigraciones = path.resolve(__dirname, '../../../drizzle');

/**
 * Solo para pruebas (nunca se importa desde la app): abre una base better-sqlite3
 * en memoria con el mismo esquema y las mismas migraciones que la app.
 * Nunca se mockea expo-sqlite.
 */
export function crearBaseDePrueba() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: carpetaMigraciones });
  return { db, sqlite, cerrar: () => sqlite.close() };
}

export type BaseDePrueba = ReturnType<typeof crearBaseDePrueba>['db'];
