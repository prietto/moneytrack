import { useHechos } from '@/data/use-hechos';
import { calcularEstado } from '@/domain/calcular-estado';
import type { Estado } from '@/domain/estado';

import { useHoy } from './use-hoy';

/**
 * El Estado reactivo (AD-18): se recalcula cuando cambian los hechos (tras
 * un comando) o cuando cambia `hoy`. React Compiler memoiza el cálculo.
 */
export function useEstado(): Estado {
  return calcularEstado(useHechos(), useHoy());
}
