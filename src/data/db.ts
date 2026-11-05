import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// enableChangeListener es necesario para useLiveQuery (H1.3).
const expoDb = openDatabaseSync('moneytrack.db', { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });
export type BaseDeDatos = typeof db;
