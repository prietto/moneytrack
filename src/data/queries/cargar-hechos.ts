import { asc } from 'drizzle-orm';

import {
  CLASES_GASTO,
  type Categoria,
  type ClaseGasto,
  type FondoProtegido,
  type Hechos,
  type NumeroPago,
  type ObligacionDefinida,
  type PagoDefinido,
  type PresupuestoEsencial,
  type Vehiculo,
} from '@/domain/hechos';

import type { BaseSincrona } from '../contexto';
import { ajustes, categorias, fondos, obligaciones, pagos, presupuestos, vehiculos } from '../schema';
import { vigentes } from './vigentes';

function esNumeroPago(numero: number): numero is NumeroPago {
  return numero === 1 || numero === 2;
}

function esClaseGasto(clase: string): clase is ClaseGasto {
  return (CLASES_GASTO as readonly string[]).includes(clase);
}

type FilaObligacion = typeof obligaciones.$inferSelect;
type FilaFondo = typeof fondos.$inferSelect;
type FilaCategoria = typeof categorias.$inferSelect;

/** Un fondo a medio configurar (alguna de sus tres columnas en null) cuenta como sin configurar: los dos en null. */
function aFondo(fila: FilaFondo): FondoProtegido {
  const { id, nombre, aporteMensual, saldoInicialMonto, saldoInicialFecha } = fila;
  if (aporteMensual === null || saldoInicialMonto === null || saldoInicialFecha === null) {
    return { id, nombre, aporteMensual: null, saldoInicial: null };
  }
  return { id, nombre, aporteMensual, saldoInicial: { monto: saldoInicialMonto, fecha: saldoInicialFecha } };
}

/**
 * Las reglas de una fila, o `null` si su clase es desconocida (defensa: sin
 * `CHECK` en SQL, se descarta en vez de lanzar). Los enlaces quedan
 * coherentes con la clase, como exige `erroresCategoria`: el Presupuesto solo
 * en Esencial y el Fondo solo en Fondo protegido, y siempre vigentes. Una de
 * Fondo protegido sin Fondo vigente pasa a Gusto, para seguir visible y
 * editable sin entregar un estado imposible.
 */
function aCategoria(fila: FilaCategoria, idsPresupuestos: Set<string>, idsFondos: Set<string>): Categoria | null {
  const { id, nombre, claseDefault, presupuestoId, fondoId, requiereVehiculo, esSistema } = fila;
  if (!esClaseGasto(claseDefault)) return null;
  const presupuestoVigente = presupuestoId !== null && idsPresupuestos.has(presupuestoId) ? presupuestoId : null;
  const fondoVigente = fondoId !== null && idsFondos.has(fondoId) ? fondoId : null;
  const clase: ClaseGasto = claseDefault === 'fondo' && fondoVigente === null ? 'gusto' : claseDefault;
  return {
    id,
    nombre,
    claseDefault: clase,
    presupuestoId: clase === 'esencial' ? presupuestoVigente : null,
    fondoId: clase === 'fondo' ? fondoVigente : null,
    requiereVehiculo,
    esSistema,
  };
}

/**
 * La definición de una fila, o `null` si le falta algo de su tipo (defensa
 * para que el tipo sea honesto, y para las cuotas de Deuda de H1.7, sin
 * monto propio). Un `vehiculoId` que no es de un Vehículo vigente pasa a null.
 */
function aObligacion(fila: FilaObligacion, idsVehiculos: Set<string>): ObligacionDefinida | null {
  const { id, nombre, monto } = fila;
  if (monto === null) return null;
  if (fila.tipo === 'mensual') {
    return fila.dia === null ? null : { id, tipo: 'mensual', nombre, monto, dia: fila.dia };
  }
  if (fila.tipo !== 'anual') return null;
  const { fechaVencimiento, reservaInicialMonto, reservaInicialFecha, vehiculoId } = fila;
  if (fechaVencimiento === null || reservaInicialMonto === null || reservaInicialFecha === null) return null;
  return {
    id,
    tipo: 'anual',
    nombre,
    monto,
    fechaVencimiento,
    vehiculoId: vehiculoId !== null && idsVehiculos.has(vehiculoId) ? vehiculoId : null,
    reservaInicial: { monto: reservaInicialMonto, fecha: reservaInicialFecha },
  };
}

/**
 * El único cargador de Hechos (AD-18): la única función que lee tablas para
 * el cálculo. Es sincrónico (drivers sync) y devuelve un objeto y arreglos
 * nuevos en cada carga (nunca los de `hechosVacios`).
 *
 * Reglas para las historias que agreguen lecturas:
 * - Solo filas vigentes: toda lectura filtra con `.where(vigentes(tabla))`
 *   (`./vigentes`), que excluye las filas con `deletedAt`.
 * - Nunca lee instantáneas ni historial: `rastro`, `cuadres` ni
 *   `consultas_semaforo`. No son hechos del cálculo.
 *
 * Tablas que lee cada historia:
 * - H1.4: `pagos` y `ajustes` (saldo inicial y Colchón: configuración con fecha, AD-2).
 * - H1.5: `vehiculos` y `obligaciones` (solo definiciones; las ocurrencias y la
 *   reserva anual las calcula domain/, AD-2, AD-5).
 * - H1.6: `presupuestos`, `fondos` y `categorias` (sembradas sin montos; un
 *   fondo a medio configurar cuenta como sin configurar y un enlace huérfano
 *   pasa a null).
 * - H1.7: Deudas y Meta.
 * - Épica 2: Gastos e ingresos (movimientos).
 */
export function cargarHechos(db: BaseSincrona): Hechos {
  const pagosDefinidos: PagoDefinido[] = [];
  for (const fila of db.select().from(pagos).where(vigentes(pagos)).orderBy(asc(pagos.numero)).all()) {
    // Defensa para que el tipo sea honesto: un número fuera de 1|2 se descarta.
    if (!esNumeroPago(fila.numero)) continue;
    pagosDefinidos.push({ id: fila.id, numero: fila.numero, dia: fila.dia, montoEsperado: fila.montoEsperado });
  }

  // Una sola fila vigente; si hubiera más, la más antigua (igual que el comando que la escribe).
  const fila = db
    .select()
    .from(ajustes)
    .where(vigentes(ajustes))
    .orderBy(asc(ajustes.createdAt), asc(ajustes.id))
    .limit(1)
    .get();

  const saldoInicial =
    fila?.saldoInicialMonto != null && fila.saldoInicialFecha != null
      ? { monto: fila.saldoInicialMonto, fecha: fila.saldoInicialFecha }
      : null;

  const vehiculosVigentes: Vehiculo[] = db
    .select()
    .from(vehiculos)
    .where(vigentes(vehiculos))
    .orderBy(asc(vehiculos.createdAt), asc(vehiculos.id))
    .all()
    .map(({ id, nombre }) => ({ id, nombre }));
  const idsVehiculos = new Set(vehiculosVigentes.map((v) => v.id));

  const obligacionesDefinidas: ObligacionDefinida[] = [];
  for (const filaObligacion of db
    .select()
    .from(obligaciones)
    .where(vigentes(obligaciones))
    .orderBy(asc(obligaciones.createdAt), asc(obligaciones.id))
    .all()) {
    const obligacion = aObligacion(filaObligacion, idsVehiculos);
    if (obligacion) obligacionesDefinidas.push(obligacion);
  }

  const presupuestosVigentes: PresupuestoEsencial[] = db
    .select()
    .from(presupuestos)
    .where(vigentes(presupuestos))
    .orderBy(asc(presupuestos.createdAt), asc(presupuestos.id))
    .all()
    .map(({ id, nombre, montoMensual }) => ({ id, nombre, montoMensual }));
  const idsPresupuestos = new Set(presupuestosVigentes.map((p) => p.id));

  const fondosVigentes: FondoProtegido[] = db
    .select()
    .from(fondos)
    .where(vigentes(fondos))
    .orderBy(asc(fondos.createdAt), asc(fondos.id))
    .all()
    .map(aFondo);
  const idsFondos = new Set(fondosVigentes.map((f) => f.id));

  const categoriasVigentes: Categoria[] = [];
  for (const filaCategoria of db
    .select()
    .from(categorias)
    .where(vigentes(categorias))
    .orderBy(asc(categorias.createdAt), asc(categorias.id))
    .all()) {
    const categoria = aCategoria(filaCategoria, idsPresupuestos, idsFondos);
    if (categoria) categoriasVigentes.push(categoria);
  }

  return {
    saldoInicial,
    colchon: fila?.colchon ?? null,
    pagos: pagosDefinidos,
    vehiculos: vehiculosVigentes,
    obligaciones: obligacionesDefinidas,
    presupuestos: presupuestosVigentes,
    fondos: fondosVigentes,
    categorias: categoriasVigentes,
  };
}
