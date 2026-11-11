/** Orden de texto por código (no por idioma): estable y igual en todo dispositivo. */
export function compararTexto(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
