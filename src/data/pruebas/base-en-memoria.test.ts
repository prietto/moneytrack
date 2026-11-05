/** @jest-environment node */
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { rastro } from '../schema';
import { crearBaseDePrueba } from './base-en-memoria';

const journal = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../../drizzle/meta/_journal.json'), 'utf8'),
) as { entries: unknown[] };

describe('crearBaseDePrueba', () => {
  it('aplica todas las migraciones de drizzle/', () => {
    const { sqlite, cerrar } = crearBaseDePrueba();
    const { total } = sqlite.prepare('SELECT count(*) AS total FROM __drizzle_migrations').get() as {
      total: number;
    };
    expect(journal.entries.length).toBeGreaterThan(0);
    expect(total).toBe(journal.entries.length);
    cerrar();
  });

  it('permite escribir y leer una fila de rastro', () => {
    const { db, cerrar } = crearBaseDePrueba();
    const fila = {
      id: '1b4e28ba-2fa1-4d2b-883f-0016d3cca427',
      createdAt: '2026-11-04T12:00:00.000Z',
      updatedAt: '2026-11-04T12:00:00.000Z',
      entidad: 'gastos',
      entidadId: '9c5b94b1-35ad-49bb-b118-8e8fc24abf80',
      operacion: 'borrar' as const,
      antes: JSON.stringify({ monto: 1000 }),
      despues: null,
      fecha: '2026-11-04T12:00:00.000Z',
    };

    db.insert(rastro).values(fila).run();
    const leida = db.select().from(rastro).where(eq(rastro.id, fila.id)).get();

    expect(leida).toEqual({ ...fila, deletedAt: null });
    cerrar();
  });

  it('cada base es independiente', () => {
    const a = crearBaseDePrueba();
    const b = crearBaseDePrueba();
    a.db
      .insert(rastro)
      .values({
        id: 'x',
        createdAt: 'c',
        updatedAt: 'u',
        entidad: 'e',
        entidadId: 'i',
        operacion: 'editar',
        antes: '{}',
        despues: '{}',
        fecha: 'f',
      })
      .run();
    expect(b.db.select().from(rastro).all()).toHaveLength(0);
    a.cerrar();
    b.cerrar();
  });
});
