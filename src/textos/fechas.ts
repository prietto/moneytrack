const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];

/**
 * Fecha corta en español: `'2026-11-08'` → `'8 de nov.'`. Si el año no es el
 * de `hoy`, lo agrega: `'10 de ene. de 2027'`. Sin Intl (Hermes y Node pueden
 * diferir). Una fecha mal formada se devuelve tal cual.
 */
export function formatearFechaCorta(fecha: string, hoy?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  const mes = m ? MESES[Number(m[2]) - 1] : undefined;
  if (!m || !mes) return fecha;
  const corta = `${Number(m[3])} de ${mes}`;
  return hoy !== undefined && hoy.slice(0, 4) !== m[1] ? `${corta} de ${m[1]}` : corta;
}
