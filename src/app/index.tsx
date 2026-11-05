import { StyleSheet, Text, View } from 'react-native';

import { textosApp } from '@/textos/app';

// Marcador de posición: H1.4 lo reemplaza por la pantalla principal.
export default function Inicio() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>{textosApp.nombreApp}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 24, fontWeight: '600' },
});
