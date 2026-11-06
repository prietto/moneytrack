import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { useCallback, useEffect, useState } from 'react';

import migrations from '../../drizzle/migrations';
import { obtenerDb } from './db';

export type EstadoMigraciones = { exito: boolean; error?: Error; reintentar: () => void };

/**
 * Abre la base y aplica las migraciones de drizzle/ al abrir la app. Vive en
 * data/ para que las pantallas no importen drizzle-orm (AD-3).
 *
 * No usa useMigrations de drizzle porque no permite reintentar. migrate() es
 * transaccional (BEGIN/COMMIT/ROLLBACK), así que reintentar es seguro.
 *
 * No registra el error: data/ no importa services/. Lo registra el layout.
 */
export function useMigraciones(): EstadoMigraciones {
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<Error>();
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        // Dentro del try: un fallo al abrir la base también cae aquí.
        await migrate(obtenerDb(), migrations);
        if (vigente) setExito(true);
      } catch (e) {
        // Un valor que no es Error no se copia al mensaje: podría traer datos.
        if (vigente) setError(e instanceof Error ? e : new Error(`migrate lanzó un valor ${typeof e}`));
      }
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  const reintentar = useCallback(() => {
    setError(undefined);
    setIntento((n) => n + 1);
  }, []);

  return { exito, error, reintentar };
}
