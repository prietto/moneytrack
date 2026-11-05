import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useMigraciones } from '@/data/migraciones';
import { textosApp } from '@/textos/app';

export default function RootLayout() {
  const { exito, error } = useMigraciones();

  if (error) {
    // El registro técnico del error llega con services/log (H1.2).
    return (
      <View style={estilos.centro}>
        <Text style={estilos.mensaje}>{textosApp.errorMigracion}</Text>
      </View>
    );
  }

  if (!exito) {
    return (
      <View style={estilos.centro} accessibilityLabel={textosApp.preparandoDatos}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack />;
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mensaje: { fontSize: 16, textAlign: 'center' },
});
