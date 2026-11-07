// `Tabs` desde 'expo-router' está deprecado en expo-router 57: el mismo layout vive en 'expo-router/js-tabs'.
import { Tabs } from 'expo-router/js-tabs';

import { colores } from '@/components/tema';
import { textosNavegacion } from '@/textos/navegacion';

/**
 * Pestañas de la app autenticada. Solo texto, sin íconos: no hay librería de
 * íconos instalada y agregarla es una dependencia nueva.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
        tabBarStyle: { backgroundColor: colores.fondo, borderTopColor: colores.borde },
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 15, fontWeight: '600' },
        tabBarItemStyle: { justifyContent: 'center' },
        headerStyle: { backgroundColor: colores.fondo },
        headerTintColor: colores.texto,
        sceneStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: textosNavegacion.inicio }} />
      <Tabs.Screen name="movimientos" options={{ title: textosNavegacion.movimientos }} />
      <Tabs.Screen name="ajustes" options={{ title: textosNavegacion.ajustes }} />
    </Tabs>
  );
}
