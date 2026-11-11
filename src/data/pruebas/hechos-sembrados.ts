import { type Hechos, hechosVacios } from '@/domain/hechos';

import { IDS_SIEMBRA as ids } from '../siembra';

/**
 * Solo para pruebas: los Hechos de una base recién migrada. Desde la
 * migración 0004 no está vacía: tiene los Presupuestos y el Fondo sin montos
 * y las 11 categorías iniciales. El Estado no cambia: lo sembrado no tiene montos.
 */
export const hechosSembrados: Hechos = {
  ...hechosVacios,
  presupuestos: [
    { id: ids.presupuestoComida, nombre: 'Comida', montoMensual: null },
    { id: ids.presupuestoMantenimiento, nombre: 'Mantenimiento de vehículos', montoMensual: null },
  ],
  fondos: [{ id: ids.fondoEnduro, nombre: 'Fondo enduro', aporteMensual: null, saldoInicial: null }],
  categorias: [
    ['categoriaMercado', 'Mercado y comida', 'esencial', ids.presupuestoComida, null, false, false],
    [
      'categoriaMantenimiento',
      'Mantenimiento de vehículo',
      'esencial',
      ids.presupuestoMantenimiento,
      null,
      true,
      false,
    ],
    ['categoriaCombustible', 'Combustible', 'esencial', ids.presupuestoMantenimiento, null, true, false],
    ['categoriaEquipoEnduro', 'Equipo de enduro', 'fondo', null, ids.fondoEnduro, false, false],
    ['categoriaSalud', 'Salud', 'esencial', null, null, false, false],
    ['categoriaComidaAfuera', 'Comida afuera', 'gusto', null, null, false, false],
    ['categoriaSalidas', 'Salidas', 'gusto', null, null, false, false],
    ['categoriaComprasPersonales', 'Compras personales', 'gusto', null, null, false, false],
    ['categoriaOtros', 'Otros', 'gusto', null, null, false, false],
    ['categoriaPagoObligacion', 'Pago de Obligación', 'esencial', null, null, false, true],
    ['categoriaSinRegistrar', 'Sin registrar', 'gusto', null, null, false, true],
  ].map(([clave, nombre, claseDefault, presupuestoId, fondoId, requiereVehiculo, esSistema]) => ({
    id: ids[clave as keyof typeof ids],
    nombre: nombre as string,
    claseDefault: claseDefault as Hechos['categorias'][number]['claseDefault'],
    presupuestoId: presupuestoId as string | null,
    fondoId: fondoId as string | null,
    requiereVehiculo: requiereVehiculo as boolean,
    esSistema: esSistema as boolean,
  })),
};
