/**
 * Valores de siembra (AD-9). Son la única constante de valor personal
 * permitida en el código: precargan los formularios, pero no se escriben en
 * la base hasta que Priettos los confirma (así el asistente de H1.8 no ve un
 * paso como completo sin que lo haya visto).
 *
 * H1.6 amplía este archivo con la siembra de categorías, presupuestos y fondo.
 */
export const SIEMBRA = { colchon: 4_000_000 } as const;
