import { type KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';

import { colores } from '../tema';

/** Campo de formulario con etiqueta, ayuda opcional y su error debajo. */
export function Campo({
  etiqueta,
  accesible,
  valor,
  onCambio,
  placeholder,
  ayuda,
  error,
  teclado = 'default',
  editable = true,
}: {
  etiqueta: string;
  /** accessibilityLabel: más específico que la etiqueta cuando hace falta (p. ej. "del Pago 1"). */
  accesible?: string;
  valor: string;
  onCambio: (texto: string) => void;
  placeholder?: string;
  ayuda?: string;
  error?: string;
  teclado?: KeyboardTypeOptions;
  editable?: boolean;
}) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        accessibilityLabel={accesible ?? etiqueta}
        accessibilityHint={error ?? ayuda}
        value={valor}
        onChangeText={onCambio}
        placeholder={placeholder}
        placeholderTextColor={colores.textoSuave}
        keyboardType={teclado}
        editable={editable}
        style={[estilos.entrada, error !== undefined && estilos.entradaConError]}
      />
      {ayuda !== undefined && <Text style={estilos.ayuda}>{ayuda}</Text>}
      {error !== undefined && (
        <Text accessibilityRole="alert" style={estilos.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  campo: { gap: 6 },
  etiqueta: { fontSize: 15, fontWeight: '600', color: colores.texto },
  entrada: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    fontSize: 17,
    color: colores.texto,
    backgroundColor: colores.fondo,
  },
  entradaConError: { borderColor: colores.peligro },
  ayuda: { fontSize: 14, color: colores.textoSuave },
  error: { fontSize: 14, color: colores.peligro },
});
