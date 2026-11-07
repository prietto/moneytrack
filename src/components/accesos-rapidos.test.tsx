import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { AccesosRapidos, accesos } from './accesos-rapidos';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('AccesosRapidos', () => {
  it('en H1.4 ninguno está disponible', () => {
    expect(accesos.every((a) => !a.disponible)).toBe(true);
  });

  it('sin disponibles no renderiza nada', async () => {
    const { toJSON } = await render(<AccesosRapidos />);
    expect(toJSON()).toBeNull();
  });

  it('muestra solo los disponibles y navega a su ruta', async () => {
    await render(
      <AccesosRapidos
        lista={[
          { clave: 'registro', texto: 'Registro', ruta: '/configuracion/pagos', disponible: true },
          { clave: 'camara', texto: 'Cámara', ruta: null, disponible: false },
        ]}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Registro' }));
    expect(router.push).toHaveBeenCalledWith('/configuracion/pagos');
  });
});
