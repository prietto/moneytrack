import { avisarCambio, suscribirCambios, versionCambios } from './cambios';

describe('señal de cambios', () => {
  it('avisa a todos los suscriptores y deja de avisar al cancelar', () => {
    const a = jest.fn();
    const b = jest.fn();
    const cancelarA = suscribirCambios(a);
    const cancelarB = suscribirCambios(b);

    avisarCambio();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    cancelarA();
    avisarCambio();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    cancelarB();
  });

  it('la misma función suscrita dos veces son dos suscripciones independientes', () => {
    const cb = jest.fn();
    const cancelar1 = suscribirCambios(cb);
    const cancelar2 = suscribirCambios(cb);
    cancelar1();
    avisarCambio();
    expect(cb).toHaveBeenCalledTimes(1);
    cancelar2();
  });

  it('un oyente que lanza no impide avisar a los demás, y su error va al manejador global como no fatal', () => {
    const manejador = jest.fn();
    const espia = jest.spyOn(ErrorUtils, 'getGlobalHandler').mockReturnValue(manejador);
    try {
      const error = new Error('oyente roto');
      const cancelarRoto = suscribirCambios(() => {
        throw error;
      });
      const otro = jest.fn();
      const cancelarOtro = suscribirCambios(otro);

      expect(() => avisarCambio()).not.toThrow();
      expect(otro).toHaveBeenCalledTimes(1);
      expect(manejador).toHaveBeenCalledWith(error, false);

      cancelarRoto();
      cancelarOtro();
    } finally {
      espia.mockRestore();
    }
  });

  it('cada aviso sube la versión', () => {
    const antes = versionCambios();
    avisarCambio();
    expect(versionCambios()).toBe(antes + 1);
  });

  it('un suscriptor que se cancela durante el aviso no impide avisar a los demás', () => {
    const otro = jest.fn();
    const cancelar = suscribirCambios(() => cancelar());
    const cancelarOtro = suscribirCambios(otro);
    avisarCambio();
    expect(otro).toHaveBeenCalledTimes(1);
    cancelarOtro();
  });
});
