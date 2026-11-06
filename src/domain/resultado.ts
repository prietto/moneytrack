/**
 * Resultado de una operación que puede fallar (AD-23). Los servicios devuelven
 * un Resultado en vez de lanzar hacia src/app/.
 *
 * El error es un código (unión de literales por servicio, p. ej.
 * 'cancelado' | 'sinBloqueo'), nunca un Error con texto libre: así no viajan
 * datos ni detalles técnicos hacia las pantallas.
 */
export type Resultado<T, E = string> = { ok: true; valor: T } | { ok: false; error: E };

export function ok<T>(valor: T): { ok: true; valor: T } {
  return { ok: true, valor };
}

export function fallo<E>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}
