import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { textosConfiguracion } from '@/textos/configuracion';

import { Boton } from '../boton';
import { colores } from '../tema';

/**
 * Marco común de los formularios de configuración: scroll, teclado, fallo y
 * Guardar. `pie` va debajo de Guardar (p. ej. el botón de borrar).
 */
export function Formulario({
  children,
  guardando,
  fallo,
  onGuardar,
  pie,
}: {
  children: ReactNode;
  guardando: boolean;
  fallo: boolean;
  onGuardar: () => void;
  pie?: ReactNode;
}) {
  return (
    <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={estilos.raiz} contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        {children}
        {fallo && (
          <Text accessibilityRole="alert" style={estilos.fallo}>
            {textosConfiguracion.falloAlGuardar}
          </Text>
        )}
        <View style={estilos.acciones}>
          <Boton
            texto={guardando ? textosConfiguracion.guardando : textosConfiguracion.guardar}
            onPress={onGuardar}
            deshabilitado={guardando}
          />
        </View>
        {pie}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 16, gap: 20 },
  fallo: { fontSize: 15, color: colores.peligro },
  acciones: { alignItems: 'stretch' },
});
