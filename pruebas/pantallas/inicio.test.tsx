import { render, screen } from '@testing-library/react-native';

import Inicio from '@/app/index';
import { textosApp } from '@/textos/app';

// Las pruebas de pantallas viven fuera de src/app/ porque Expo Router trata
// cada archivo de esa carpeta como una ruta.
describe('pantalla de inicio', () => {
  it('muestra el nombre de la app desde textos/', async () => {
    await render(<Inicio />);
    expect(screen.getByText(textosApp.nombreApp)).toBeTruthy();
  });
});
