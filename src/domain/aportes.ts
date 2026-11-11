import { compararTexto } from './comparar';
import type { AporteProgramado } from './estado';

function idDe(a: AporteProgramado): string {
  return a.tipo === 'fondo' ? a.fondoId : a.obligacionId;
}

/** Orden de `Estado.aportesProgramados`: (fecha, tipo, id), con `id` = `fondoId` u `obligacionId`. */
export function compararAportes(a: AporteProgramado, b: AporteProgramado): number {
  return compararTexto(a.fecha, b.fecha) || compararTexto(a.tipo, b.tipo) || compararTexto(idDe(a), idDe(b));
}
