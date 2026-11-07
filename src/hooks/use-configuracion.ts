import { SIEMBRA } from '@/data/siembra';
import { useHechos } from '@/data/use-hechos';
import type { PagoDefinido, SaldoInicial } from '@/domain/hechos';

export type Configuracion = {
  pago1: PagoDefinido | null;
  pago2: PagoDefinido | null;
  saldoInicial: SaldoInicial | null;
  colchon: number | null;
  /** El Colchón guardado o, si no hay, el de siembra (AD-9): precarga el formulario. */
  colchonSugerido: number;
};

/**
 * La configuración actual para precargar los formularios. Sale de
 * `useHechos()`: no hace una lectura propia.
 */
export function useConfiguracion(): Configuracion {
  const { pagos, saldoInicial, colchon } = useHechos();
  return {
    pago1: pagos.find((p) => p.numero === 1) ?? null,
    pago2: pagos.find((p) => p.numero === 2) ?? null,
    saldoInicial,
    colchon,
    colchonSugerido: colchon ?? SIEMBRA.colchon,
  };
}
