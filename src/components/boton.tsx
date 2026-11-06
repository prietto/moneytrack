import { Pressable, StyleSheet, Text } from 'react-native';

/** Botón principal de las pantallas de sistema (bloqueo, errores). */
export function Boton({
  texto,
  onPress,
  deshabilitado = false,
}: {
  texto: string;
  onPress: () => void;
  deshabilitado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [estilos.boton, (pressed || deshabilitado) && estilos.atenuado]}
    >
      <Text style={estilos.texto}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#1F6F4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atenuado: { opacity: 0.5 },
  texto: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
