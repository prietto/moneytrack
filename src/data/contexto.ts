import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { BaseSQLiteDatabase, SQLiteTransaction } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

/**
 * Base sincrónica con el esquema de la app. La aceptan tanto la base de
 * expo-sqlite (app) como la de better-sqlite3 (pruebas).
 */
export type BaseSincrona = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export type Transaccion = SQLiteTransaction<'sync', unknown, typeof schema, ExtractTablesWithRelations<typeof schema>>;

/**
 * Lo que recibe cada comando. Los comandos no llaman `new Date()` ni
 * `randomUUID()` por su cuenta: así las pruebas son deterministas y todas las
 * filas de una misma transacción comparten la marca.
 */
export type ContextoComando = {
  db: BaseSincrona;
  /** ISO 8601 UTC. */
  ahora: string;
  nuevoId: () => string;
};

/**
 * Una escritura (AD-3). `aplicar` es sincrónico y abre su propia
 * transacción con `db.transaction((tx) => …)`; dentro no hay `await`.
 */
export type Comando<T> = {
  /** Forma `capa.accion` del log, p. ej. 'pagos.configurar'. */
  operacion: string;
  aplicar: (ctx: ContextoComando) => T;
};
