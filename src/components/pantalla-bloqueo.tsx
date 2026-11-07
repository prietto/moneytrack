import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { Acceso } from '@/hooks/use-acceso';
import { textosAcceso } from '@/textos/acceso';

import { Boton } from './boton';
import { colores } from './tema';

/**
 * Pantalla de bloqueo (AD-15, UX-DR1): fondo opaco y ningún dato. Como capa,
 * cubre el Stack entero para conservar la navegación al re-bloquear.
 */
export function PantallaBloqueo({
  estado,
  error,
  onDesbloquear,
  comoCapa = false,
}: {
  estado: Acceso['estado'];
  error?: Acceso['error'];
  onDesbloquear: () => void;
  comoCapa?: boolean;
}) {
  const verificando = estado === 'verificando';
  const mensaje = error ? textosAcceso.errores[error] : textosAcceso.bloqueado;

  return (
    <View
      testID="pantalla-bloqueo"
      style={[estilos.contenedor, comoCapa && StyleSheet.absoluteFill]}
      // iOS: VoiceOver ignora lo que hay detrás de la capa.
      accessibilityViewIsModal={comoCapa}
    >
      <Text accessibilityRole="header" style={estilos.titulo}>
        {textosAcceso.titulo}
      </Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>
      {verificando && <ActivityIndicator accessibilityLabel={textosAcceso.verificando} />}
      <Boton texto={textosAcceso.reintentar} onPress={onDesbloquear} deshabilitado={verificando} />
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
    backgroundColor: colores.fondo,
  },
  titulo: { fontSize: 24, fontWeight: '600', color: colores.texto },
  mensaje: { fontSize: 16, textAlign: 'center', color: colores.texto },
});
