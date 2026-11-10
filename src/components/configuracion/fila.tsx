import { Pressable, StyleSheet, Text } from 'react-native';

import { colores } from '../tema';

/** Una fila tocable de las listas de configuración: título y resumen. */
export function Fila({ titulo, resumen, onPress }: { titulo: string; resumen?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={resumen}
      onPress={onPress}
      style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}
    >
      <Text style={estilos.titulo}>{titulo}</Text>
      {resumen !== undefined && <Text style={estilos.resumen}>{resumen}</Text>}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: {
    minHeight: 56,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    gap: 4,
  },
  presionada: { opacity: 0.7 },
  titulo: { fontSize: 17, fontWeight: '600', color: colores.texto },
  resumen: { fontSize: 15, color: colores.textoSuave },
});
