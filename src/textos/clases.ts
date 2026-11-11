import type { ClaseGasto } from '@/domain/hechos';

// Nombres de las clases de gasto (Glosario, AD-17). Los reutiliza el registro de Gastos (H2.1).
export const nombresClase = {
  esencial: 'Esencial',
  fondo: 'Fondo protegido',
  gusto: 'Gusto',
} as const satisfies Record<ClaseGasto, string>;
