import { StyleSheet, Text, View } from 'react-native';

import { textosError } from '@/textos/errores';

import { Boton } from './boton';

/**
 * Error amable (UX-DR13): voz del socio, sin detalles técnicos. Nunca recibe
 * el error, así que no puede mostrar su mensaje ni su pila.
 */
export function ErrorAmable({ onReintentar }: { onReintentar: () => void }) {
  return (
    <View style={estilos.contenedor}>
      <Text accessibilityRole="header" style={estilos.titulo}>
        {textosError.titulo}
      </Text>
      <Text style={estilos.mensaje}>{textosError.mensaje}</Text>
      <Boton texto={textosError.reintentar} onPress={onReintentar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  titulo: { fontSize: 20, fontWeight: '600', textAlign: 'center', color: '#1A1A1A' },
  mensaje: { fontSize: 16, textAlign: 'center', color: '#1A1A1A' },
});
