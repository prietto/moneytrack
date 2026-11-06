import { fireEvent, render, screen } from '@testing-library/react-native';

import { textosAcceso } from '@/textos/acceso';

import { PantallaBloqueo } from './pantalla-bloqueo';

describe('PantallaBloqueo', () => {
  it('sin error muestra el mensaje de bloqueado y el botón desbloquea', async () => {
    const onDesbloquear = jest.fn();
    await render(<PantallaBloqueo estado="bloqueado" onDesbloquear={onDesbloquear} />);

    expect(screen.getByText(textosAcceso.titulo)).toBeTruthy();
    expect(screen.getByText(textosAcceso.bloqueado)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: textosAcceso.reintentar }));
    expect(onDesbloquear).toHaveBeenCalledTimes(1);
  });

  it.each(['cancelado', 'sinBloqueo', 'bloqueoTemporal', 'fallo'] as const)(
    'con el error %s muestra su mensaje',
    async (error) => {
      await render(<PantallaBloqueo estado="bloqueado" error={error} onDesbloquear={jest.fn()} />);
      expect(screen.getByText(textosAcceso.errores[error])).toBeTruthy();
      expect(screen.queryByText(textosAcceso.bloqueado)).toBeNull();
    },
  );

  it('mientras verifica muestra el indicador y deshabilita el botón', async () => {
    const onDesbloquear = jest.fn();
    await render(<PantallaBloqueo estado="verificando" onDesbloquear={onDesbloquear} />);

    expect(screen.getByLabelText(textosAcceso.verificando)).toBeTruthy();
    const boton = screen.getByRole('button', { name: textosAcceso.reintentar });
    expect(boton).toBeDisabled();
    await fireEvent.press(boton);
    expect(onDesbloquear).not.toHaveBeenCalled();
  });

  it('como capa ocupa toda la pantalla y es modal para VoiceOver', async () => {
    await render(<PantallaBloqueo estado="bloqueado" onDesbloquear={jest.fn()} comoCapa />);
    const capa = screen.getByTestId('pantalla-bloqueo');
    expect(capa).toHaveStyle({ position: 'absolute', top: 0, bottom: 0 });
    expect(capa.props.accessibilityViewIsModal).toBe(true);
  });

  it('como pantalla completa no es modal', async () => {
    await render(<PantallaBloqueo estado="bloqueado" onDesbloquear={jest.fn()} />);
    expect(screen.getByTestId('pantalla-bloqueo').props.accessibilityViewIsModal).toBe(false);
  });
});
