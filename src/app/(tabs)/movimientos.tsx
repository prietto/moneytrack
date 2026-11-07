import { StyleSheet, Text, View } from 'react-native';

import { colores } from '@/components/tema';
import { textosMovimientos } from '@/textos/movimientos';

// Estado vacío honesto: la lista de movimientos llega en H2.5.
export default function Movimientos() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.mensaje}>{textosMovimientos.vacio}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colores.fondo },
  mensaje: { fontSize: 16, textAlign: 'center', color: colores.textoSuave },
});
