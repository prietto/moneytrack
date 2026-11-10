/** @jest-environment node */
import { ejecutarComando } from '../ejecutar-comando';
import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { obligaciones, rastro, vehiculos } from '../schema';
import { borrarVehiculo } from './borrar-vehiculo';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../db', () => ({ obtenerDb: jest.fn() }));

const AHORA = '2026-11-05T15:00:00.000Z';
const DESPUES = '2026-11-06T15:00:00.000Z';
const marcas = { createdAt: AHORA, updatedAt: AHORA };

const abiertas: (() => void)[] = [];

function preparar() {
  const base = crearBaseDePrueba();
  abiertas.push(base.cerrar);
  base.db
    .insert(vehiculos)
    .values({ id: 'v1', ...marcas, nombre: 'Moto azul' })
    .run();
  let n = 0;
  const ejecutarEn = (comando: Parameters<typeof ejecutarComando>[0]) =>
    ejecutarComando(comando, { db: base.db, ahora: DESPUES, nuevoId: () => `id-${++n}` });
  const soat = (deletedAt: string | null) =>
    base.db
      .insert(obligaciones)
      .values({
        id: 'o1',
        ...marcas,
        deletedAt,
        tipo: 'anual',
        nombre: 'SOAT',
        monto: 1_200_000,
        fechaVencimiento: '2027-03-15',
        vehiculoId: 'v1',
        reservaInicialMonto: 0,
        reservaInicialFecha: '2026-11-05',
      })
      .run();
  return { ...base, ejecutarEn, soat };
}

afterEach(() => {
  abiertas.splice(0).forEach((c) => c());
});

describe('borrarVehiculo', () => {
  it('usa la operación vehiculos.borrar', () => {
    expect(borrarVehiculo('v1').operacion).toBe('vehiculos.borrar');
  });

  it('hace borrado lógico con rastro borrar', () => {
    const { db, ejecutarEn } = preparar();
    expect(ejecutarEn(borrarVehiculo('v1')).ok).toBe(true);
    expect(db.select().from(vehiculos).get()).toMatchObject({ id: 'v1', deletedAt: DESPUES });
    expect(db.select().from(rastro).all()).toEqual([
      expect.objectContaining({ entidad: 'vehiculos', entidadId: 'v1', operacion: 'borrar', despues: null }),
    ]);
  });

  it('un Vehículo en uso por una Obligación vigente no se borra: fallo, sin borrado ni rastro', () => {
    const { db, ejecutarEn, soat } = preparar();
    soat(null);
    expect(ejecutarEn(borrarVehiculo('v1'))).toEqual({
      ok: false,
      error: { codigo: 'fallo', causa: new Error('vehiculoEnUso') },
    });
    expect(db.select().from(vehiculos).get()?.deletedAt).toBeNull();
    expect(db.select().from(rastro).all()).toEqual([]);
  });

  it('un Vehículo que solo usa una Obligación borrada sí se borra', () => {
    const { db, ejecutarEn, soat } = preparar();
    soat(AHORA);
    expect(ejecutarEn(borrarVehiculo('v1')).ok).toBe(true);
    expect(db.select().from(vehiculos).get()?.deletedAt).toBe(DESPUES);
  });

  it('borrar un Vehículo ya borrado devuelve fallo', () => {
    const { ejecutarEn } = preparar();
    ejecutarEn(borrarVehiculo('v1'));
    expect(ejecutarEn(borrarVehiculo('v1')).ok).toBe(false);
  });
});
