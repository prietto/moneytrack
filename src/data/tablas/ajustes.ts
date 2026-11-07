import { asc } from 'drizzle-orm';

import type { ContextoComando, Transaccion } from '../contexto';
import { vigentes } from '../queries/vigentes';
import { ajustes } from '../schema';
import { editarConRastro } from './rastro';

/**
 * Módulo dueño de `ajustes` (AD-3, AD-9): la configuración general, en una
 * sola fila vigente. Recibe la transacción del comando y nunca abre una propia.
 */

export type FilaAjustes = typeof ajustes.$inferSelect;
export type DatosAjustes = Partial<Omit<FilaAjustes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

/**
 * Filas vigentes, de la más antigua a la más nueva (`createdAt`). Debería
 * haber a lo sumo una; si hubiera más, quien escribe usa la primera.
 */
export function leerAjustesVigentes(tx: Transaccion): FilaAjustes[] {
  return tx.select().from(ajustes).where(vigentes(ajustes)).orderBy(asc(ajustes.createdAt), asc(ajustes.id)).all();
}

/** Inserta la fila de ajustes con `id` UUID y las marcas del contexto (AD-10). */
export function insertarAjustes(tx: Transaccion, ctx: ContextoComando, datos: DatosAjustes): FilaAjustes {
  const fila: FilaAjustes = {
    id: ctx.nuevoId(),
    createdAt: ctx.ahora,
    updatedAt: ctx.ahora,
    deletedAt: null,
    saldoInicialMonto: null,
    saldoInicialFecha: null,
    colchon: null,
    ...datos,
  };
  tx.insert(ajustes).values(fila).run();
  return fila;
}

/** Edita la fila de ajustes con rastro (solo si algo cambió). */
export function editarAjustes(tx: Transaccion, ctx: ContextoComando, id: string, cambios: DatosAjustes): FilaAjustes {
  return editarConRastro(tx, ctx, ajustes, id, cambios);
}
