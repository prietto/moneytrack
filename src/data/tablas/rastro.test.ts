/** @jest-environment node */
import { eq } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { ContextoComando } from '../contexto';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { vigentes } from '../queries/vigentes';
import { columnasComunes, rastro } from '../schema';
import { borrarConRastro, editarConRastro, registrarRastro } from './rastro';

// Tabla solo de prueba: no va en schema.ts ni en ninguna migración.
const pruebaRastro = sqliteTable('prueba_rastro', { ...columnasComunes, nombre: text('nombre').notNull() });

const CREADA = '2026-11-01T10:00:00.000Z';
const AHORA = '2026-11-05T15:00:00.000Z';

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  base.sqlite.exec(
    'CREATE TABLE prueba_rastro (id text primary key not null, created_at text not null, updated_at text not null, deleted_at text, nombre text not null)',
  );
  base.db
    .insert(pruebaRastro)
    .values([
      { id: 'a', createdAt: CREADA, updatedAt: CREADA, nombre: 'Arriendo' },
      { id: 'b', createdAt: CREADA, updatedAt: CREADA, nombre: 'Luz' },
      { id: 'borrada', createdAt: CREADA, updatedAt: CREADA, deletedAt: CREADA, nombre: 'Vieja' },
    ])
    .run();
  let n = 0;
  const ctx: ContextoComando = { db: base.db, ahora: AHORA, nuevoId: () => `rastro-${++n}` };
  return { ...base, ctx };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

describe('registrarRastro', () => {
  it('inserta la fila de rastro con las marcas del contexto y las filas en JSON', () => {
    const { db, ctx } = preparar();
    db.transaction((tx) =>
      registrarRastro(tx, ctx, {
        entidad: 'gastos',
        entidadId: 'g-1',
        operacion: 'borrar',
        antes: { id: 'g-1', monto: 1000 },
        despues: null,
      }),
    );
    expect(db.select().from(rastro).all()).toEqual([
      {
        id: 'rastro-1',
        createdAt: AHORA,
        updatedAt: AHORA,
        deletedAt: null,
        entidad: 'gastos',
        entidadId: 'g-1',
        operacion: 'borrar',
        antes: '{"id":"g-1","monto":1000}',
        despues: null,
        fecha: AHORA,
      },
    ]);
  });
});

describe('editarConRastro', () => {
  it('edita la fila, actualiza updatedAt y registra antes y después completos', () => {
    const { db, ctx } = preparar();
    const nueva = db.transaction((tx) => editarConRastro(tx, ctx, pruebaRastro, 'a', { nombre: 'Arriendo casa' }));

    const antes = { id: 'a', createdAt: CREADA, updatedAt: CREADA, deletedAt: null, nombre: 'Arriendo' };
    const despues = { ...antes, updatedAt: AHORA, nombre: 'Arriendo casa' };
    expect(nueva).toEqual(despues);
    expect(db.select().from(pruebaRastro).where(eq(pruebaRastro.id, 'a')).get()).toEqual(despues);

    const filas = db.select().from(rastro).all();
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ entidad: 'prueba_rastro', entidadId: 'a', operacion: 'editar', fecha: AHORA });
    expect(JSON.parse(filas[0].antes)).toEqual(antes);
    expect(JSON.parse(filas[0].despues ?? 'null')).toEqual(despues);
  });

  it('sin cambios reales no escribe: ni update, ni updatedAt, ni rastro', () => {
    const { db, ctx } = preparar();
    const fila = db.transaction((tx) => editarConRastro(tx, ctx, pruebaRastro, 'a', { nombre: 'Arriendo' }));

    const intacta = { id: 'a', createdAt: CREADA, updatedAt: CREADA, deletedAt: null, nombre: 'Arriendo' };
    expect(fila).toEqual(intacta);
    expect(db.select().from(pruebaRastro).where(eq(pruebaRastro.id, 'a')).get()).toEqual(intacta);
    expect(db.select().from(rastro).all()).toHaveLength(0);
  });

  it('sin cambios, igual lanza filaNoEncontrada si la fila no está vigente', () => {
    const { db, ctx } = preparar();
    expect(() => db.transaction((tx) => editarConRastro(tx, ctx, pruebaRastro, 'borrada', { nombre: 'Vieja' }))).toThrow(
      'filaNoEncontrada',
    );
  });

  it('no toca las demás filas', () => {
    const { db, ctx } = preparar();
    db.transaction((tx) => editarConRastro(tx, ctx, pruebaRastro, 'a', { nombre: 'X' }));
    expect(db.select().from(pruebaRastro).where(eq(pruebaRastro.id, 'b')).get()?.nombre).toBe('Luz');
  });

  it.each(['no-existe', 'borrada'])('con la fila %p lanza filaNoEncontrada y no registra nada', (id) => {
    const { db, ctx } = preparar();
    expect(() => db.transaction((tx) => editarConRastro(tx, ctx, pruebaRastro, id, { nombre: 'X' }))).toThrow(
      'filaNoEncontrada',
    );
    expect(db.select().from(rastro).all()).toHaveLength(0);
    expect(db.select().from(pruebaRastro).where(eq(pruebaRastro.id, 'borrada')).get()?.nombre).toBe('Vieja');
  });

  it('atomicidad: si la transacción lanza después de editar, no queda ni el cambio ni el rastro', () => {
    const { db, ctx } = preparar();
    expect(() =>
      db.transaction((tx) => {
        editarConRastro(tx, ctx, pruebaRastro, 'a', { nombre: 'Arriendo casa' });
        throw new Error('falla después');
      }),
    ).toThrow('falla después');

    expect(db.select().from(pruebaRastro).where(eq(pruebaRastro.id, 'a')).get()).toMatchObject({
      nombre: 'Arriendo',
      updatedAt: CREADA,
    });
    expect(db.select().from(rastro).all()).toHaveLength(0);
  });
});

describe('borrarConRastro', () => {
  it('borra lógicamente y registra el rastro con despues null', () => {
    const { db, ctx } = preparar();
    db.transaction((tx) => borrarConRastro(tx, ctx, pruebaRastro, 'b'));

    const fila = db.select().from(pruebaRastro).where(eq(pruebaRastro.id, 'b')).get();
    expect(fila).toMatchObject({ deletedAt: AHORA, updatedAt: AHORA, nombre: 'Luz' });

    const filas = db.select().from(rastro).all();
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ entidad: 'prueba_rastro', entidadId: 'b', operacion: 'borrar', despues: null });
    expect(JSON.parse(filas[0].antes)).toEqual({
      id: 'b',
      createdAt: CREADA,
      updatedAt: CREADA,
      deletedAt: null,
      nombre: 'Luz',
    });
  });

  it.each(['no-existe', 'borrada'])('con la fila %p lanza filaNoEncontrada y no registra nada', (id) => {
    const { db, ctx } = preparar();
    expect(() => db.transaction((tx) => borrarConRastro(tx, ctx, pruebaRastro, id))).toThrow('filaNoEncontrada');
    expect(db.select().from(rastro).all()).toHaveLength(0);
    expect(db.select().from(pruebaRastro).where(eq(pruebaRastro.id, 'borrada')).get()?.deletedAt).toBe(CREADA);
  });

  it('atomicidad: si la transacción lanza después de borrar, la fila sigue vigente y no hay rastro', () => {
    const { db, ctx } = preparar();
    expect(() =>
      db.transaction((tx) => {
        borrarConRastro(tx, ctx, pruebaRastro, 'b');
        throw new Error('falla después');
      }),
    ).toThrow('falla después');
    expect(db.select().from(pruebaRastro).where(eq(pruebaRastro.id, 'b')).get()?.deletedAt).toBeNull();
    expect(db.select().from(rastro).all()).toHaveLength(0);
  });
});

describe('vigentes', () => {
  it('excluye las filas borradas', () => {
    const { db, ctx } = preparar();
    db.transaction((tx) => borrarConRastro(tx, ctx, pruebaRastro, 'b'));
    const ids = db
      .select()
      .from(pruebaRastro)
      .where(vigentes(pruebaRastro))
      .all()
      .map((f) => f.id);
    expect(ids).toEqual(['a']);
  });
});
