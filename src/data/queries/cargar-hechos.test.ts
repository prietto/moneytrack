/** @jest-environment node */
import { hechosVacios } from '@/domain/hechos';

import { crearBaseDePrueba } from '../pruebas/base-en-memoria';
import { cargarHechos } from './cargar-hechos';

describe('cargarHechos', () => {
  it('sin tablas de hechos todavía, devuelve hechosVacios', () => {
    const { db, cerrar } = crearBaseDePrueba();
    try {
      expect(cargarHechos(db)).toEqual(hechosVacios);
    } finally {
      cerrar();
    }
  });

  it('devuelve un objeto nuevo en cada carga, no la constante compartida', () => {
    const { db, cerrar } = crearBaseDePrueba();
    try {
      expect(cargarHechos(db)).not.toBe(hechosVacios);
    } finally {
      cerrar();
    }
  });
});
