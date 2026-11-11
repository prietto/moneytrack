import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import Inicio from '@/app/(tabs)/index';
import { colores } from '@/components/tema';
import type { Estado, OcurrenciaObligacion, OcurrenciaPago } from '@/domain/estado';
import { useEstado } from '@/hooks/use-estado';
import { textosInicio } from '@/textos/inicio';

// Las pruebas de pantallas viven fuera de src/app/ porque Expo Router trata
// cada archivo de esa carpeta como una ruta.
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/hooks/use-estado', () => ({ useEstado: jest.fn() }));

const useEstadoMock = jest.mocked(useEstado);
const HOY = '2026-11-03';

function calculado(cambios: Partial<Extract<Estado, { tipo: 'calculado' }>> = {}): Estado {
  return {
    tipo: 'calculado',
    hoy: HOY,
    saldoCalculado: 10_000_000,
    saldoProyectado: [{ fecha: HOY, saldo: 10_000_000 }],
    minimo: { fecha: HOY, saldo: 10_000_000 },
    dineroLibre: 6_000_000,
    pagosEsperados: [],
    pagosAtrasados: [],
    obligacionesPendientes: [],
    obligacionesVencidas: [],
    presupuestosPendientes: [],
    fondos: [],
    reservas: { anual: 0, fondo: 0, total: 0 },
    reservasAnuales: [],
    aportesProgramados: [],
    ...cambios,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('pantalla principal', () => {
  describe('sin configurar', () => {
    it('con los tres faltantes muestra sus textos y ninguna cifra', async () => {
      useEstadoMock.mockReturnValue({ tipo: 'sinConfigurar', hoy: HOY, faltan: ['pagos', 'saldoInicial', 'colchon'] });
      await render(<Inicio />);

      expect(screen.getByText(textosInicio.vacio.titulo)).toBeTruthy();
      for (const texto of Object.values(textosInicio.vacio.faltan)) {
        expect(screen.getByText(new RegExp(texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeTruthy();
      }
      expect(screen.queryByText(/\d\.\d{3}/)).toBeNull();
      expect(screen.queryByText(textosInicio.dineroLibre)).toBeNull();
    });

    it('un botón para los Pagos y uno solo para saldo y Colchón', async () => {
      useEstadoMock.mockReturnValue({ tipo: 'sinConfigurar', hoy: HOY, faltan: ['pagos', 'saldoInicial', 'colchon'] });
      await render(<Inicio />);

      expect(screen.getAllByRole('button')).toHaveLength(2);
      await fireEvent.press(screen.getByRole('button', { name: textosInicio.vacio.irAPagos }));
      expect(router.push).toHaveBeenCalledWith('/configuracion/pagos');
      await fireEvent.press(screen.getByRole('button', { name: textosInicio.vacio.irASaldoYColchon }));
      expect(router.push).toHaveBeenCalledWith('/configuracion/saldo-y-colchon');
    });

    it('si solo falta el Colchón, solo ofrece saldo y Colchón', async () => {
      useEstadoMock.mockReturnValue({ tipo: 'sinConfigurar', hoy: HOY, faltan: ['colchon'] });
      await render(<Inicio />);
      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.getByRole('button', { name: textosInicio.vacio.irASaldoYColchon })).toBeTruthy();
    });
  });

  describe('calculado', () => {
    it('positivo: Dinero libre, su explicación y el Saldo calculado', async () => {
      useEstadoMock.mockReturnValue(calculado());
      await render(<Inicio />);

      expect(screen.getByText(textosInicio.dineroLibre)).toBeTruthy();
      expect(screen.getByText('6.000.000')).toBeTruthy();
      expect(screen.getByText(textosInicio.explicacionDineroLibre)).toBeTruthy();
      expect(screen.getByText(textosInicio.saldoCalculado)).toBeTruthy();
      expect(screen.getByText('10.000.000')).toBeTruthy();
      expect(screen.getByTestId('dinero-libre')).not.toHaveStyle({ color: colores.peligro });
      expect(screen.queryByText(/Ojo:/)).toBeNull();
    });

    it('negativo: la cifra en rojo y además un texto con el día y el monto que faltan', async () => {
      useEstadoMock.mockReturnValue(
        calculado({ saldoCalculado: 1_000_000, minimo: { fecha: HOY, saldo: 1_000_000 }, dineroLibre: -3_000_000 }),
      );
      await render(<Inicio />);

      expect(screen.getByText('-3.000.000')).toBeTruthy();
      expect(screen.getByTestId('dinero-libre')).toHaveStyle({ color: colores.peligro });
      expect(screen.getByText(textosInicio.faltante('3.000.000', '3 de nov.'))).toBeTruthy();
    });

    it('con un Pago atrasado muestra su línea', async () => {
      const atrasado: OcurrenciaPago = {
        pagoId: 'p1',
        numero: 1,
        clave: '2026-11',
        fecha: '2026-11-10',
        fechaProyectada: '2026-11-12',
        monto: 2_000_000,
        pagoAtrasado: true,
      };
      useEstadoMock.mockReturnValue(
        calculado({ hoy: '2026-11-12', pagosEsperados: [atrasado], pagosAtrasados: [atrasado] }),
      );
      await render(<Inicio />);
      expect(screen.getByText(textosInicio.pagoAtrasado(1, '10 de nov.'))).toBeTruthy();
    });

    it('con Obligaciones vencidas: el título y una línea por vencida, con nombre, monto y fecha', async () => {
      const vencida = (nombre: string, monto: number, fecha: string): OcurrenciaObligacion => ({
        obligacionId: nombre,
        tipo: 'mensual',
        nombre,
        clave: fecha.slice(0, 7),
        fecha,
        fechaProyectada: '2026-11-12',
        monto,
        vencida: true,
        vehiculoId: null,
        reservaLiberada: 0,
      });
      const vencidas = [vencida('Arriendo', 1_500_000, '2026-11-08'), vencida('Agua', 80_000, '2025-12-30')];
      useEstadoMock.mockReturnValue(
        calculado({ hoy: '2026-11-12', obligacionesPendientes: vencidas, obligacionesVencidas: vencidas }),
      );
      await render(<Inicio />);
      expect(screen.getByRole('header', { name: textosInicio.obligacionesVencidas })).toBeTruthy();
      expect(screen.getByText(textosInicio.obligacionVencida('Arriendo', '1.500.000', '8 de nov.'))).toBeTruthy();
      // De otro año: con el año.
      expect(screen.getByText(textosInicio.obligacionVencida('Agua', '80.000', '30 de dic. de 2025'))).toBeTruthy();
    });

    it('con Fondos configurados: una línea con el saldo de cada uno', async () => {
      useEstadoMock.mockReturnValue(
        calculado({
          fondos: [
            { fondoId: 'f1', nombre: 'Fondo enduro', saldo: 350_000 },
            { fondoId: 'f2', nombre: 'Fondo viajes', saldo: 0 },
          ],
        }),
      );
      await render(<Inicio />);
      expect(screen.getByText(textosInicio.saldoFondo('Fondo enduro', '350.000'))).toBeTruthy();
      expect(screen.getByText('Fondo enduro: 350.000')).toBeTruthy();
      expect(screen.getByText('Fondo viajes: 0')).toBeTruthy();
    });

    it('sin Fondos configurados no muestra ninguna línea de fondo', async () => {
      useEstadoMock.mockReturnValue(calculado());
      await render(<Inicio />);
      expect(screen.queryByText(/Fondo/)).toBeNull();
    });

    it('sin Obligaciones vencidas no hay título', async () => {
      useEstadoMock.mockReturnValue(calculado());
      await render(<Inicio />);
      expect(screen.queryByText(textosInicio.obligacionesVencidas)).toBeNull();
    });

    it('los accesos rápidos no aparecen (ninguno disponible en H1.4)', async () => {
      useEstadoMock.mockReturnValue(calculado());
      await render(<Inicio />);
      for (const texto of Object.values(textosInicio.accesos)) expect(screen.queryByText(texto)).toBeNull();
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
  });
});
