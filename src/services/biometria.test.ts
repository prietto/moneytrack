/** @jest-environment node */
import * as LocalAuthentication from 'expo-local-authentication';

import { autenticar, requiereAutenticacion, UMBRAL_REAUTENTICACION_MS } from './biometria';
import { log } from './log';

jest.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));
jest.mock('./log', () => ({ log: { info: jest.fn(), aviso: jest.fn(), error: jest.fn() } }));

const nivel = jest.mocked(LocalAuthentication.getEnrolledLevelAsync);
const autenticarNativo = jest.mocked(LocalAuthentication.authenticateAsync);
const mensajes = { promptMessage: 'Confirma', cancelLabel: 'Cancelar' };

beforeEach(() => {
  jest.clearAllMocks();
  nivel.mockResolvedValue(LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG);
});

describe('autenticar', () => {
  it('con éxito devuelve ok', async () => {
    autenticarNativo.mockResolvedValue({ success: true });
    await expect(autenticar(mensajes)).resolves.toEqual({ ok: true, valor: undefined });
  });

  it('acepta el bloqueo del teléfono como alternativa (disableDeviceFallback: false)', async () => {
    autenticarNativo.mockResolvedValue({ success: true });
    await autenticar(mensajes);
    expect(autenticarNativo).toHaveBeenCalledWith({
      promptMessage: 'Confirma',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
  });

  it('sin ningún bloqueo configurado no abre el diálogo', async () => {
    nivel.mockResolvedValue(LocalAuthentication.SecurityLevel.NONE);
    await expect(autenticar(mensajes)).resolves.toEqual({ ok: false, error: 'sinBloqueo' });
    expect(autenticarNativo).not.toHaveBeenCalled();
    expect(log.aviso).toHaveBeenCalledWith('biometria.sinBloqueo');
  });

  it('acepta un PIN o patrón sin biometría (SecurityLevel.SECRET)', async () => {
    nivel.mockResolvedValue(LocalAuthentication.SecurityLevel.SECRET);
    autenticarNativo.mockResolvedValue({ success: true });
    await expect(autenticar(mensajes)).resolves.toEqual({ ok: true, valor: undefined });
  });

  it.each([
    ['user_cancel', 'cancelado'],
    ['system_cancel', 'cancelado'],
    ['app_cancel', 'cancelado'],
    ['user_fallback', 'cancelado'],
    ['not_enrolled', 'sinBloqueo'],
    ['passcode_not_set', 'sinBloqueo'],
    ['not_available', 'sinBloqueo'],
    ['lockout', 'bloqueoTemporal'],
    ['authentication_failed', 'fallo'],
    ['timeout', 'fallo'],
    ['unknown', 'fallo'],
    ['unable_to_process', 'fallo'],
    ['no_space', 'fallo'],
    ['invalid_context', 'fallo'],
  ] as const)('%s → %s, registrado como aviso', async (codigo, esperado) => {
    autenticarNativo.mockResolvedValue({ success: false, error: codigo });
    await expect(autenticar(mensajes)).resolves.toEqual({ ok: false, error: esperado });
    expect(log.aviso).toHaveBeenCalledWith(`biometria.${esperado}`);
    expect(log.error).not.toHaveBeenCalled();
  });

  it('si el módulo nativo lanza, no propaga: devuelve fallo y lo registra', async () => {
    const error = new Error('módulo nativo roto');
    autenticarNativo.mockRejectedValue(error);
    await expect(autenticar(mensajes)).resolves.toEqual({ ok: false, error: 'fallo' });
    expect(log.error).toHaveBeenCalledWith('biometria.autenticar', { error });
  });

  it('si getEnrolledLevelAsync lanza, tampoco propaga', async () => {
    nivel.mockRejectedValue(new Error('x'));
    await expect(autenticar(mensajes)).resolves.toEqual({ ok: false, error: 'fallo' });
    expect(log.error).toHaveBeenCalledTimes(1);
  });
});

describe('requiereAutenticacion', () => {
  const desde = 1_000_000;

  it('el umbral es de 5 minutos', () => {
    expect(UMBRAL_REAUTENTICACION_MS).toBe(5 * 60 * 1000);
  });

  it('sin marca de segundo plano no pide', () => {
    expect(requiereAutenticacion(null, desde)).toBe(false);
  });

  it('a los 4:59 no pide', () => {
    expect(requiereAutenticacion(desde, desde + 4 * 60_000 + 59_000)).toBe(false);
  });

  it('a los 5:00 exactos no pide', () => {
    expect(requiereAutenticacion(desde, desde + 5 * 60_000)).toBe(false);
  });

  it('a los 5:00 + 1 ms pide', () => {
    expect(requiereAutenticacion(desde, desde + 5 * 60_000 + 1)).toBe(true);
  });

  it('si el reloj quedó antes de la marca (lo atrasaron), pide', () => {
    expect(requiereAutenticacion(desde, desde - 1)).toBe(true);
  });
});
