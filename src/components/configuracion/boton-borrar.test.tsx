import { fireEvent, render, screen } from '@testing-library/react-native';

import { textosConfiguracion as t } from '@/textos/configuracion';

import { BotonBorrar } from './boton-borrar';

describe('BotonBorrar', () => {
  it('el primer toque pide confirmación en línea y no borra', async () => {
    const onBorrar = jest.fn();
    await render(<BotonBorrar nombre="Moto azul" onBorrar={onBorrar} />);
    expect(screen.queryByText(t.confirmarBorrar('Moto azul'))).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    expect(onBorrar).not.toHaveBeenCalled();
    expect(screen.getByText('¿Seguro que quieres borrar «Moto azul»?')).toBeTruthy();
    expect(screen.getByRole('button', { name: t.siBorrar })).toBeTruthy();
    expect(screen.getByRole('button', { name: t.cancelar })).toBeTruthy();
  });

  it('"Sí, borrar" borra', async () => {
    const onBorrar = jest.fn();
    await render(<BotonBorrar nombre="X" onBorrar={onBorrar} />);
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    await fireEvent.press(screen.getByRole('button', { name: t.siBorrar }));
    expect(onBorrar).toHaveBeenCalledTimes(1);
  });

  it('"Cancelar" vuelve al botón inicial sin borrar', async () => {
    const onBorrar = jest.fn();
    await render(<BotonBorrar nombre="X" onBorrar={onBorrar} />);
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    await fireEvent.press(screen.getByRole('button', { name: t.cancelar }));
    expect(onBorrar).not.toHaveBeenCalled();
    expect(screen.queryByText(t.confirmarBorrar('X'))).toBeNull();
    expect(screen.getByRole('button', { name: t.borrar })).toBeTruthy();
  });

  it('si onBorrar devuelve false, cierra la confirmación', async () => {
    const onBorrar = jest.fn(() => false);
    await render(<BotonBorrar nombre="X" onBorrar={onBorrar} />);
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    await fireEvent.press(screen.getByRole('button', { name: t.siBorrar }));
    expect(onBorrar).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(t.confirmarBorrar('X'))).toBeNull();
    expect(screen.queryByRole('button', { name: t.siBorrar })).toBeNull();
    expect(screen.getByRole('button', { name: t.borrar })).toBeTruthy();
  });

  it('mientras borra muestra "Borrando…" deshabilitado', async () => {
    const { rerender } = await render(<BotonBorrar nombre="X" onBorrar={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: t.borrar }));
    await rerender(<BotonBorrar nombre="X" onBorrar={jest.fn()} borrando />);
    expect(screen.getByRole('button', { name: t.borrando })).toBeDisabled();
  });

  it('deshabilitado no abre la confirmación', async () => {
    await render(<BotonBorrar nombre="X" onBorrar={jest.fn()} deshabilitado />);
    expect(screen.getByRole('button', { name: t.borrar })).toBeDisabled();
  });
});
