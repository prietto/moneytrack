/**
 * Tema mínimo: colores explícitos en todas las pantallas. Con fondo y texto
 * fijados, el texto se lee aunque el teléfono esté en modo oscuro
 * (`userInterfaceStyle: 'automatic'` no se cambia: obligaría a reconstruir).
 *
 * Contraste sobre `fondo` (WCAG AA ≥ 4.5:1): texto 17:1, textoSuave 6.6:1,
 * primario 6.2:1, peligro 6.5:1.
 */
export const colores = {
  fondo: '#FFFFFF',
  superficie: '#F3F5F4',
  texto: '#1A1A1A',
  textoSuave: '#555F5A',
  borde: '#C9D0CC',
  primario: '#1F6F4A',
  textoSobrePrimario: '#FFFFFF',
  peligro: '#B3261E',
} as const;
