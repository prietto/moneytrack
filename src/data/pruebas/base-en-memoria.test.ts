/** @jest-environment node */
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import migracionesDeLaApp from '../../../drizzle/migrations';
import { rastro } from '../schema';
import { crearBaseDePrueba } from './base-en-memoria';

const carpetaMigraciones = path.resolve(__dirname, '../../../drizzle');
const journal = JSON.parse(readFileSync(path.join(carpetaMigraciones, 'meta/_journal.json'), 'utf8')) as {
  entries: { idx: number; tag: string }[];
};

// Cada prueba registra aquí sus bases para cerrarlas aunque falle una aserción.
const abiertas: (() => void)[] = [];
function abrirBase() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  return base;
}

afterEach(() => {
  abiertas.splice(0).forEach((cerrar) => cerrar());
});

describe('crearBaseDePrueba', () => {
  it('aplica todas las migraciones de drizzle/', () => {
    const { sqlite } = abrirBase();
    const { total } = sqlite.prepare('SELECT count(*) AS total FROM __drizzle_migrations').get() as {
      total: number;
    };
    expect(journal.entries.length).toBeGreaterThan(0);
    expect(total).toBe(journal.entries.length);
  });

  it('permite escribir y leer una fila de rastro', () => {
    const { db } = abrirBase();
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
  });

  it('cada base es independiente', () => {
    const a = abrirBase();
    const b = abrirBase();
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
  });
});

// La app migra con drizzle/migrations.js (SQL incrustado por babel-plugin-inline-import)
// y las pruebas migran desde la carpeta: este bloque evita que se desincronicen.
describe('drizzle/migrations.js (lo que usa la app)', () => {
  it('trae el mismo journal que drizzle/meta/_journal.json', () => {
    expect(migracionesDeLaApp.journal).toEqual(journal);
  });

  it('trae exactamente una migración por entrada del journal, con el mismo SQL', () => {
    const esperadas = Object.fromEntries(
      journal.entries.map(({ idx, tag }) => [
        `m${String(idx).padStart(4, '0')}`,
        readFileSync(path.join(carpetaMigraciones, `${tag}.sql`), 'utf8'),
      ]),
    );
    expect(migracionesDeLaApp.migrations).toEqual(esperadas);
  });
});
