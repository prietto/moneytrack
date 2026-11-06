/** @jest-environment node */
import { fallo, ok, type Resultado } from './resultado';

describe('Resultado', () => {
  it('ok() construye un resultado exitoso con su valor', () => {
    expect(ok(42)).toEqual({ ok: true, valor: 42 });
  });

  it('ok() sin valor sirve para Resultado<void>', () => {
    const r: Resultado<void> = ok(undefined);
    expect(r).toEqual({ ok: true, valor: undefined });
  });

  it('fallo() construye un resultado fallido con su código', () => {
    expect(fallo('cancelado')).toEqual({ ok: false, error: 'cancelado' });
  });

  it('se estrecha por la propiedad ok', () => {
    const resultados: Resultado<number, 'cancelado' | 'sinBloqueo'>[] = [ok(7), fallo('sinBloqueo')];
    const vistos = resultados.map((r) => (r.ok ? `valor:${r.valor}` : `error:${r.error}`));
    expect(vistos).toEqual(['valor:7', 'error:sinBloqueo']);
  });
});
