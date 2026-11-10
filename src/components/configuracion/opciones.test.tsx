import { fireEvent, render, screen } from '@testing-library/react-native';

import { Opciones } from './opciones';

const opciones = [
  { valor: null, texto: 'Ninguno' },
  { valor: 'a', texto: 'Uno' },
  { valor: 'b', texto: 'Dos' },
];

describe('Opciones', () => {
  it('muestra un radio por opción, con la seleccionada marcada (también null)', async () => {
    await render(
      <Opciones<string | null> etiqueta="Elige" opciones={opciones} seleccionada={null} onCambio={jest.fn()} />,
    );
    expect(screen.getByText('Elige')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Ninguno' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Uno' })).not.toBeChecked();
  });

  it('al tocar una opción llama onCambio con su valor', async () => {
    const onCambio = jest.fn();
    await render(<Opciones<string | null> etiqueta="Elige" opciones={opciones} seleccionada="a" onCambio={onCambio} />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Dos' }));
    expect(onCambio).toHaveBeenCalledWith('b');
    await fireEvent.press(screen.getByRole('radio', { name: 'Ninguno' }));
    expect(onCambio).toHaveBeenLastCalledWith(null);
  });

  it('deshabilitado: no cambia y lo anuncia', async () => {
    const onCambio = jest.fn();
    await render(
      <Opciones<string | null>
        etiqueta="Elige"
        opciones={opciones}
        seleccionada="a"
        onCambio={onCambio}
        deshabilitado
      />,
    );
    expect(screen.getByRole('radio', { name: 'Dos' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('radio', { name: 'Dos' }));
    expect(onCambio).not.toHaveBeenCalled();
  });

  it('muestra la ayuda y el error', async () => {
    await render(
      <Opciones
        etiqueta="Elige"
        opciones={[{ valor: 'a', texto: 'Uno' }]}
        seleccionada="a"
        onCambio={jest.fn()}
        ayuda="Ayuda"
        error="Mal"
      />,
    );
    expect(screen.getByText('Ayuda')).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent('Mal');
  });
});
