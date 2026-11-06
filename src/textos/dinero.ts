/**
 * Formatea un monto en pesos colombianos: sin decimales y con punto como
 * separador de miles (1350000 → "1.350.000"). Sin símbolo $: lo pone el texto
 * que lo use, si lo necesita (NFR6, AD-7).
 *
 * No usa Intl ni toLocaleString: el ICU de Hermes en Android y el de Node en
 * Jest pueden diferir.
 *
 * Precondición (AD-7): el monto es un entero de pesos. Cualquier otra cosa es
 * un error de programación y lanza RangeError; nunca se redondea en silencio.
 */
export function formatearDinero(monto: number): string {
  if (!Number.isSafeInteger(monto)) {
    // Sin el valor en el mensaje: el log no guarda montos (AD-23).
    throw new RangeError('formatearDinero espera un entero de pesos');
  }
  const cifras = Math.abs(monto)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  // monto < 0 es falso para -0, así que -0 → "0".
  return monto < 0 ? `-${cifras}` : cifras;
}
