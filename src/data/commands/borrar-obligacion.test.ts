/** @jest-environment node */
import { ejecutarComando } from '../ejecutar-comando';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { obligaciones, rastro } from '../schema';
import { borrarObligacion } from './borrar-obligacion';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../db', () => ({ obtenerDb: jest.fn() }));

const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  base.db
    .insert(obligaciones)
    .values({ id: 'o1', createdAt: AHORA, updatedAt: AHORA, tipo: 'mensual', nombre: 'Arriendo', monto: 1, dia: 1 })
    .run();
  const ejecutarEn = (comando: Parameters<typeof ejecutarComando>[0]) =>
    ejecutarComando(comando, { db: base.db, ahora: DESPUES, nuevoId: () => 'r1' });
  return { ...base, ejecutarEn };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

describe('borrarObligacion', () => {
  it('usa la operación obligaciones.borrar', () => {
    expect(borrarObligacion('o1').operacion).toBe('obligaciones.borrar');
  });

  it('hace borrado lógico con rastro borrar', () => {
    const { db, ejecutarEn } = preparar();
    expect(ejecutarEn(borrarObligacion('o1')).ok).toBe(true);
    expect(db.select().from(obligaciones).get()).toMatchObject({ id: 'o1', deletedAt: DESPUES, updatedAt: DESPUES });
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ entidad: 'obligaciones', entidadId: 'o1', operacion: 'borrar', despues: null }),
    ]);
  });

  it('borrar una que no está vigente devuelve fallo sin rastro', () => {
    const { db, ejecutarEn } = preparar();
    expect(ejecutarEn(borrarObligacion('nada')).ok).toBe(false);
    expect(db.select().from(rastro).all()).toEqual([]);
  });
});
