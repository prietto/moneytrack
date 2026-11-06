import { type ErrorBoundaryProps, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/boton';
import { ErrorAmable } from '@/components/error-amable';
import { PantallaBloqueo } from '@/components/pantalla-bloqueo';
import { useMigraciones } from '@/data/migraciones';
import { useAcceso } from '@/hooks/use-acceso';
import { instalarRegistroDeErroresGlobales, log } from '@/services/log';
import { textosAcceso } from '@/textos/acceso';
import { textosApp } from '@/textos/app';

// Errores fuera del render (eventos, timers), que el boundary no captura.
instalarRegistroDeErroresGlobales();

/**
 * Boundary raíz (UX-DR13, AD-23). Expo Router lo pone alrededor del propio
 * RootLayout, así que captura también sus errores de render: no puede
 * depender de nada que el layout provea.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    log.error('app.errorBoundary', { error });
  }, [error]);

  return <ErrorAmable onReintentar={() => void retry()} />;
}

export default function RootLayout() {
  const acceso = useAcceso(textosAcceso.dialogo);
  // Las migraciones corren en paralelo al diálogo: no muestran datos.
  const migraciones = useMigraciones();

  useEffect(() => {
    if (migraciones.error) log.error('migraciones.aplicar', { error: migraciones.error });
  }, [migraciones.error]);

  // Al re-bloquear se cubre en lugar de desmontar: se conserva la navegación.
  // Antes del primer desbloqueo no hay nada que cubrir: solo la pantalla de bloqueo.
  const tapado = acceso.haDesbloqueado && (acceso.estado !== 'desbloqueado' || acceso.cubierto);

  useEffect(() => {
    if (!tapado) return;
    // El teclado es otra ventana: la capa no lo cubre, y seguiría escribiendo
    // en el campo de debajo.
    Keyboard.dismiss();
    // El botón atrás de Android no debe llegar a lo que hay debajo.
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => suscripcion.remove();
  }, [tapado]);

  // AD-15: ninguna pantalla con datos antes del primer desbloqueo.
  if (!acceso.haDesbloqueado) {
    return <PantallaBloqueo estado={acceso.estado} error={acceso.error} onDesbloquear={acceso.desbloquear} />;
  }

  let contenido;
  if (migraciones.error) {
    contenido = (
      <View style={estilos.centro}>
        <Text style={estilos.mensaje}>{textosApp.errorMigracion}</Text>
        <Boton texto={textosApp.reintentar} onPress={migraciones.reintentar} />
      </View>
    );
  } else if (!migraciones.exito) {
    contenido = (
      <View style={estilos.centro} accessibilityLabel={textosApp.preparandoDatos}>
        <ActivityIndicator />
      </View>
    );
  } else {
    contenido = <Stack />;
  }

  // La capa tapa cualquier contenido, también el error o la carga de las migraciones.
  return (
    <View style={estilos.raiz}>
      {/* Tapado, el lector de pantalla tampoco debe leer lo que hay debajo. */}
      {/* importantForAccessibility es de Android (TalkBack); accessibilityElementsHidden, de iOS (VoiceOver). */}
      <View
        style={estilos.raiz}
        importantForAccessibility={tapado ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={tapado}
      >
        {contenido}
      </View>
      {tapado && (
        <PantallaBloqueo estado={acceso.estado} error={acceso.error} onDesbloquear={acceso.desbloquear} comoCapa />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  mensaje: { fontSize: 16, textAlign: 'center' },
});
