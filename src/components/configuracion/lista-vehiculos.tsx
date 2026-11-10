import { ScrollView, StyleSheet, Text } from 'react-native';

import { useConfiguracion } from '@/hooks/use-configuracion';
import { textosConfiguracion as t } from '@/textos/configuracion';

import { Boton } from '../boton';
import { colores } from '../tema';
import { Fila } from './fila';

/** Los Vehículos vigentes (FR5), con su estado vacío y el acceso al alta. */
export function ListaVehiculos({ onAgregar, onEditar }: { onAgregar: () => void; onEditar: (id: string) => void }) {
  const { vehiculos } = useConfiguracion();
  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenido}>
      {vehiculos.length === 0 && <Text style={estilos.vacio}>{t.listas.vacioVehiculos}</Text>}
      {vehiculos.map((v) => (
        <Fila key={v.id} titulo={v.nombre} onPress={() => onEditar(v.id)} />
      ))}
      <Boton texto={t.listas.agregarVehiculo} onPress={onAgregar} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 16, gap: 12 },
  vacio: { fontSize: 16, color: colores.textoSuave },
});
