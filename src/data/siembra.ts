/**
 * Siembra (AD-9).
 *
 * `SIEMBRA` guarda los valores de siembra: son la única constante de valor
 * personal permitida en el código. Precargan los formularios, pero no se
 * escriben en la base hasta que Priettos los confirma (así el asistente de
 * H1.8 no ve un paso como completo sin que lo haya visto). Hoy: el Colchón.
 *
 * Los Presupuestos esenciales, el Fondo protegido y las categorías iniciales
 * sí se escriben, en la migración `0004_sembrar-presupuestos-fondo-y-categorias`,
 * pero **sin montos**: las filas (estructura y reglas) existen desde el
 * principio y los montos quedan en null hasta que Priettos los fija.
 *
 * `IDS_SIEMBRA` son los ids fijos de esas filas (forma UUID v4, iguales en
 * toda instalación). Deben coincidir con la migración. Permiten encontrar
 * "Pago de Obligación" (H2.4) y "Sin registrar" (H2.6) sin buscar por nombre.
 */
export const SIEMBRA = { colchon: 4_000_000 } as const;

export const IDS_SIEMBRA = {
  presupuestoComida: '00000000-0000-4000-8000-000000000101',
  presupuestoMantenimiento: '00000000-0000-4000-8000-000000000102',
  fondoEnduro: '00000000-0000-4000-8000-000000000201',
  categoriaMercado: '00000000-0000-4000-8000-000000000301',
  categoriaMantenimiento: '00000000-0000-4000-8000-000000000302',
  categoriaCombustible: '00000000-0000-4000-8000-000000000303',
  categoriaEquipoEnduro: '00000000-0000-4000-8000-000000000304',
  categoriaSalud: '00000000-0000-4000-8000-000000000305',
  categoriaComidaAfuera: '00000000-0000-4000-8000-000000000306',
  categoriaSalidas: '00000000-0000-4000-8000-000000000307',
  categoriaComprasPersonales: '00000000-0000-4000-8000-000000000308',
  categoriaOtros: '00000000-0000-4000-8000-000000000309',
  categoriaPagoObligacion: '00000000-0000-4000-8000-000000000310',
  categoriaSinRegistrar: '00000000-0000-4000-8000-000000000311',
} as const;
