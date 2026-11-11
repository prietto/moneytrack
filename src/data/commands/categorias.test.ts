/** @jest-environment node */
import { eq } from 'drizzle-orm';

import { ejecutarComando } from '../ejecutar-comando';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { categorias, rastro } from '../schema';
import { IDS_SIEMBRA } from '../siembra';
import { borrarCategoria } from './borrar-categoria';
import { type EntradaCategoria, guardarCategoria } from './guardar-categoria';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../db', () => ({ obtenerDb: jest.fn() }));

const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const farmacia: EntradaCategoria = {
  id: null,
  nombre: '  Farmacia ',
  claseDefault: 'esencial',
  presupuestoId: null,
  fondoId: null,
  requiereVehiculo: false,
};

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  const nodeCrypto = jest.requireActual<typeof import('node:crypto')>('node:crypto');
  const ejecutarEn = (comando: Parameters<typeof ejecutarComando>[0], ahora = AHORA) =>
    ejecutarComando(comando, { db: base.db, ahora, nuevoId: () => nodeCrypto.randomUUID() });
  const alta = (entrada: EntradaCategoria): string => {
    const r = ejecutarEn(guardarCategoria(entrada));
    if (!r.ok) throw new Error('alta falló');
    return r.valor as string;
  };
  const fila = (id: string) => base.db.select().from(categorias).where(eq(categorias.id, id)).get();
  const rastros = () => base.db.select().from(rastro).all();
  return { ...base, ejecutarEn, alta, fila, rastros };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

const fallo = (causa: string) => ({ ok: false, error: { codigo: 'fallo', causa: new Error(causa) } });

describe('guardarCategoria', () => {
  it('usa la operación categorias.guardar', () => {
    expect(guardarCategoria(farmacia).operacion).toBe('categorias.guardar');
  });

  it('el alta guarda con UUID, nombre normalizado, esSistema false y sin rastro', () => {
    const { alta, fila, rastros } = preparar();
    const id = alta(farmacia);
    expect(id).toMatch(UUID);
    expect(fila(id)).toEqual({
      id,
      createdAt: AHORA,
      updatedAt: AHORA,
      deletedAt: null,
      nombre: 'Farmacia',
      claseDefault: 'esencial',
      presupuestoId: null,
      fondoId: null,
      requiereVehiculo: false,
      esSistema: false,
    });
    expect(rastros()).toEqual([]);
  });

  it('la edición conserva el id y deja rastro', () => {
    const { alta, ejecutarEn, fila, rastros } = preparar();
    const id = alta(farmacia);
    const editada: EntradaCategoria = {
      ...farmacia,
      id,
      nombre: 'Taller',
      presupuestoId: IDS_SIEMBRA.presupuestoMantenimiento,
      requiereVehiculo: true,
    };
    expect(ejecutarEn(guardarCategoria(editada), DESPUES)).toEqual({ ok: true, valor: id });
    expect(fila(id)).toMatchObject({
      nombre: 'Taller',
      presupuestoId: IDS_SIEMBRA.presupuestoMantenimiento,
      requiereVehiculo: true,
      updatedAt: DESPUES,
    });
    expect(rastros()).toEqual([expect.objectContaining({ entidad: 'categorias', entidadId: id, operacion: 'editar' })]);
  });

  it('un nombre repetido con una de sistema → fallo', () => {
    const { ejecutarEn } = preparar();
    expect(ejecutarEn(guardarCategoria({ ...farmacia, nombre: 'sin registrar' }))).toEqual(fallo('datosInvalidos'));
  });

  it('editar una de sistema → fallo y sin rastro', () => {
    const { ejecutarEn, fila, rastros } = preparar();
    const id = IDS_SIEMBRA.categoriaSinRegistrar;
    const antes = fila(id);
    expect(ejecutarEn(guardarCategoria({ ...farmacia, id, nombre: 'Otra', claseDefault: 'gusto' }))).toEqual(
      fallo('categoriaDeSistema'),
    );
    expect(fila(id)).toEqual(antes);
    expect(rastros()).toEqual([]);
  });

  it('editar un id inexistente o borrado → fallo', () => {
    const { alta, ejecutarEn } = preparar();
    expect(ejecutarEn(guardarCategoria({ ...farmacia, id: 'nada' }))).toEqual(fallo('filaNoEncontrada'));
    const id = alta(farmacia);
    ejecutarEn(borrarCategoria(id));
    expect(ejecutarEn(guardarCategoria({ ...farmacia, id }))).toEqual(fallo('filaNoEncontrada'));
  });

  it.each<[string, Partial<EntradaCategoria>]>([
    ['Fondo protegido sin fondo', { claseDefault: 'fondo' }],
    ['Gusto con Presupuesto', { claseDefault: 'gusto', presupuestoId: IDS_SIEMBRA.presupuestoComida }],
    ['Esencial con un Presupuesto inexistente', { presupuestoId: 'nada' }],
  ])('%s → fallo', (_caso, cambios) => {
    const { ejecutarEn, db } = preparar();
    const antes = db.select().from(categorias).all();
    expect(ejecutarEn(guardarCategoria({ ...farmacia, ...cambios }))).toEqual(fallo('datosInvalidos'));
    expect(db.select().from(categorias).all()).toEqual(antes);
  });

  it('acepta un Fondo protegido con el Fondo enduro', () => {
    const { alta, fila } = preparar();
    const id = alta({
      ...farmacia,
      nombre: 'Llantas de enduro',
      claseDefault: 'fondo',
      fondoId: IDS_SIEMBRA.fondoEnduro,
    });
    expect(fila(id)).toMatchObject({ claseDefault: 'fondo', fondoId: IDS_SIEMBRA.fondoEnduro, presupuestoId: null });
  });
});

describe('borrarCategoria', () => {
  it('usa la operación categorias.borrar', () => {
    expect(borrarCategoria('x').operacion).toBe('categorias.borrar');
  });

  it('borrado lógico con rastro', () => {
    const { alta, ejecutarEn, fila, rastros } = preparar();
    const id = alta(farmacia);
    expect(ejecutarEn(borrarCategoria(id), DESPUES)).toEqual({ ok: true, valor: undefined });
    expect(fila(id)).toMatchObject({ deletedAt: DESPUES });
    expect(rastros()).toEqual([
      expect.objectContaining({ entidad: 'categorias', entidadId: id, operacion: 'borrar', despues: null }),
    ]);
  });

  it.each([IDS_SIEMBRA.categoriaSinRegistrar, IDS_SIEMBRA.categoriaPagoObligacion])(
    'una de sistema (%s) no se borra',
    (id) => {
      const { ejecutarEn, fila, rastros } = preparar();
      expect(ejecutarEn(borrarCategoria(id))).toEqual(fallo('categoriaDeSistema'));
      expect(fila(id)?.deletedAt).toBeNull();
      expect(rastros()).toEqual([]);
    },
  );

  it('un id inexistente → fallo', () => {
    const { ejecutarEn } = preparar();
    expect(ejecutarEn(borrarCategoria('nada'))).toEqual(fallo('filaNoEncontrada'));
  });
});
