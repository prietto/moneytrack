// Textos del error amable (UX-DR13, AD-17): honesto, sin jerga, sin culpa y
// sin detalles técnicos. Es verdad que lo guardado sigue a salvo: las
// escrituras son transaccionales (AD-3).
export const textosError = {
  titulo: 'Algo falló de mi lado.',
  mensaje: 'Lo que ya guardaste sigue a salvo. Toca Reintentar; si vuelve a pasar, cierra la app y ábrela de nuevo.',
  reintentar: 'Reintentar',
} as const;
