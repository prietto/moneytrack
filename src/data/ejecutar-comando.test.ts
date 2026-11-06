/** @jest-environment node */
import { randomUUID } from 'expo-crypto';

import { suscribirCambios } from './cambios';
import type { Comando, ContextoComando } from './contexto';
import { ejecutarComando } from './ejecutar-comando';
import { crearBaseDePrueba } from './pruebas/base-en-memoria';
import { rastro } from './schema';

// jest-expo no mockea el módulo nativo ExpoCrypto.
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID()),
}));
// No se abre expo-sqlite: si se usara obtenerDb() sin inyectar, la prueba lo notaría.
jest.mock('./db', () => ({
  obtenerDb: jest.fn(() => {
    throw new Error('obtenerDb no debería llamarse en estas pruebas');
  }),
}));

const AHORA = '2026-11-05T15:00:00.000Z';

const abiertas: (() => void)[] = [];
function abrirBase() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  return base;
}

let avisos: jest.Mock;
let cancelar: () => void;

beforeEach(() => {
  avisos = jest.fn();
  cancelar = suscribirCambios(avisos);
});

afterEach(() => {
  cancelar();
  abiertas.splice(0).forEach((c) => c());
});

function filaDeRastro(ctx: ContextoComando) {
  return {
    id: ctx.nuevoId(),
    createdAt: ctx.ahora,
    updatedAt: ctx.ahora,
    entidad: 'prueba',
    entidadId: 'e-1',
    operacion: 'editar' as const,
    antes: '{}',
    despues: '{}',
    fecha: ctx.ahora,
  };
}

const insertar: Comando<string> = {
  operacion: 'prueba.insertar',
  aplicar: (ctx) =>
    ctx.db.transaction((tx) => {
      const fila = filaDeRastro(ctx);
      tx.insert(rastro).values(fila).run();
      return fila.id;
    }),
};

describe('ejecutarComando', () => {
  it('con éxito devuelve ok, la fila queda y avisa una vez', () => {
    const { db } = abrirBase();
    const resultado = ejecutarComando(insertar, { db, ahora: AHORA, nuevoId: () => 'id-fijo' });

    expect(resultado).toEqual({ ok: true, valor: 'id-fijo' });
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ id: 'id-fijo', createdAt: AHORA, fecha: AHORA }),
    ]);
    expect(avisos).toHaveBeenCalledTimes(1);
  });

  it('si el comando lanza dentro de la transacción: fallo con la causa, rollback y sin aviso', () => {
    const { db } = abrirBase();
    const causa = new Error('falló a mitad');
    const comando: Comando<void> = {
      operacion: 'prueba.fallar',
      aplicar: (ctx) =>
        ctx.db.transaction((tx) => {
          tx.insert(rastro).values(filaDeRastro(ctx)).run();
          throw causa;
        }),
    };

    const resultado = ejecutarComando(comando, { db, ahora: AHORA, nuevoId: () => 'id-fijo' });

    expect(resultado).toEqual({ ok: false, error: { codigo: 'fallo', causa } });
    expect(db.select().from(rastro).all()).toHaveLength(0);
    expect(avisos).not.toHaveBeenCalled();
  });

  it('sin nuevoId inyectado usa randomUUID de expo-crypto', () => {
    const { db } = abrirBase();
    const resultado = ejecutarComando(insertar, { db, ahora: AHORA });

    expect(randomUUID).toHaveBeenCalled();
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.valor).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('sin ahora inyectado usa la hora actual en ISO UTC', () => {
    const { db } = abrirBase();
    let recibido = '';
    ejecutarComando({ operacion: 'prueba.ahora', aplicar: (ctx) => (recibido = ctx.ahora) }, { db });
    expect(recibido).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('si no se puede obtener la base, devuelve fallo sin lanzar ni avisar', () => {
    const resultado = ejecutarComando(insertar);
    expect(resultado).toEqual({ ok: false, error: { codigo: 'fallo', causa: expect.any(Error) } });
    expect(avisos).not.toHaveBeenCalled();
  });

  it('si aplicar devuelve una promesa, devuelve fallo sin avisar', async () => {
    const { db } = abrirBase();
    const comando: Comando<Promise<void>> = {
      operacion: 'prueba.asincrona',
      aplicar: async () => {
        throw new Error('rechazo');
      },
    };
    const resultado = ejecutarComando(comando, { db, ahora: AHORA });

    expect(resultado).toEqual({ ok: false, error: { codigo: 'fallo', causa: new Error('comandoAsincrono') } });
    expect(avisos).not.toHaveBeenCalled();
    // El rechazo queda controlado: si no, Jest reportaría un rechazo sin manejar.
    await Promise.resolve();
  });
});
