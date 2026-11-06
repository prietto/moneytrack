/**
 * Divisiones enteras con redondeo en contra del usuario (AD-7).
 *
 * No se usa `Math.ceil(a / b)`: con enteros grandes la división en coma
 * flotante puede dar `x.0000000000000004` y subir un peso de más. Se parte de
 * `q = Math.trunc(a / b)`, se calcula el resto exacto `r = a - q * b` y se
 * ajusta `q` hasta que `0 <= r < b`; así `q` es el piso exacto.
 */

/** Piso exacto y resto en [0, divisor). Supone enteros y divisor > 0. */
function pisoYResto(dividendo: number, divisor: number): [number, number] {
  let q = Math.trunc(dividendo / divisor);
  let r = dividendo - q * divisor;
  // La división en coma flotante puede desviarse en una unidad: se corrige.
  while (r < 0) {
    q -= 1;
    r += divisor;
  }
  while (r >= divisor) {
    q += 1;
    r -= divisor;
  }
  // `+ 0` convierte un -0 (p. ej. con dividendo -0) en 0.
  return [q + 0, r];
}

/** Enteros seguros: fuera de ±2^53 el resto `a - q * b` ya no es exacto. */
function argumentosValidos(dividendo: number, divisor: number): boolean {
  return Number.isSafeInteger(dividendo) && Number.isSafeInteger(divisor) && divisor > 0;
}

/**
 * División redondeada hacia arriba (techo), para lo que se reserva o se debe.
 *
 * `dividendo` debe ser entero y `divisor` un entero > 0. domain/ no lanza: si
 * no se cumple, devuelve 0 (así ningún cálculo divide por cero).
 */
export function dividirHaciaArriba(dividendo: number, divisor: number): number {
  if (!argumentosValidos(dividendo, divisor)) return 0;
  const [q, r] = pisoYResto(dividendo, divisor);
  return r > 0 ? q + 1 : q;
}

/**
 * División redondeada hacia abajo (piso), para lo disponible.
 *
 * `dividendo` debe ser entero y `divisor` un entero > 0. domain/ no lanza: si
 * no se cumple, devuelve 0 (así ningún cálculo divide por cero).
 */
export function dividirHaciaAbajo(dividendo: number, divisor: number): number {
  if (!argumentosValidos(dividendo, divisor)) return 0;
  return pisoYResto(dividendo, divisor)[0];
}
