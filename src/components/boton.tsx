import { Pressable, StyleSheet, Text } from 'react-native';

import { colores } from './tema';

/** Botón principal: pantallas de sistema (bloqueo, errores), formularios y accesos. */
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
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atenuado: { opacity: 0.5 },
  texto: { color: colores.textoSobrePrimario, fontSize: 16, fontWeight: '600' },
});
