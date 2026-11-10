import { StyleSheet, Text, View } from 'react-native';

import { textosConfiguracion as t } from '@/textos/configuracion';

import { colores } from '../tema';

/** Lo que muestra un formulario de edición cuando el `id` ya no existe. */
export function NoEncontrado() {
  return (
    <View style={estilos.raiz}>
      <Text accessibilityRole="alert" style={estilos.texto}>
        {t.noEncontrado}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, padding: 16, backgroundColor: colores.fondo },
  texto: { fontSize: 16, color: colores.texto },
});
