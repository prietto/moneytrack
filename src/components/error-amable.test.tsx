import { fireEvent, render, screen } from '@testing-library/react-native';

import { textosError } from '@/textos/errores';

import { ErrorAmable } from './error-amable';

describe('ErrorAmable', () => {
  it('muestra el mensaje amable y el botón llama onReintentar', async () => {
    const onReintentar = jest.fn();
    await render(<ErrorAmable onReintentar={onReintentar} />);

    expect(screen.getByText(textosError.titulo)).toBeTruthy();
    expect(screen.getByText(textosError.mensaje)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: textosError.reintentar }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});
