import { type Href, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { textosInicio } from '@/textos/inicio';

import { Boton } from './boton';

type Acceso = { clave: 'registro' | 'camara' | 'puedo'; texto: string; ruta: Href | null; disponible: boolean };

/**
 * Accesos rápidos de la pantalla principal. H2.1 (registro), H4.2 (cámara) y
 * H5.2 ("¿Puedo?") solo cambian `disponible` y su `ruta`. Los que aún no
 * existen no se muestran.
 */
export const accesos: readonly Acceso[] = [
  { clave: 'registro', texto: textosInicio.accesos.registro, ruta: null, disponible: false },
  { clave: 'camara', texto: textosInicio.accesos.camara, ruta: null, disponible: false },
  { clave: 'puedo', texto: textosInicio.accesos.puedo, ruta: null, disponible: false },
];

/** Sin accesos disponibles devuelve null: ni contenedor vacío ni espacio reservado. */
export function AccesosRapidos({ lista = accesos }: { lista?: readonly Acceso[] }) {
  const disponibles = lista.filter((a): a is Acceso & { ruta: Href } => a.disponible && a.ruta !== null);
  if (disponibles.length === 0) return null;
  return (
    <View style={estilos.fila}>
      {disponibles.map((a) => (
        <Boton key={a.clave} texto={a.texto} onPress={() => router.push(a.ruta)} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
