import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ObligacionDefinida } from '@/domain/hechos';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { textosConfiguracion as t } from '@/textos/configuracion';
import { formatearDinero } from '@/textos/dinero';
import { formatearFechaCorta } from '@/textos/fechas';

import { Boton } from '../boton';
import { colores } from '../tema';
import { Fila } from './fila';

/**
 * Las Obligaciones vigentes (FR3), agrupadas en Mensuales y Anuales. La fecha
 * de una anual va sin año: se repite cada año en ese día.
 */
export function ListaObligaciones({ onAgregar, onEditar }: { onAgregar: () => void; onEditar: (id: string) => void }) {
  const { obligaciones, vehiculos } = useConfiguracion();
  const nombreVehiculo = (id: string | null) => vehiculos.find((v) => v.id === id)?.nombre ?? null;

  const resumen = (o: ObligacionDefinida) =>
    o.tipo === 'mensual'
      ? t.listas.resumenMensual(o.dia, formatearDinero(o.monto))
      : t.listas.resumenAnual(
          formatearFechaCorta(o.fechaVencimiento),
          formatearDinero(o.monto),
          nombreVehiculo(o.vehiculoId),
        );

  const grupos = [
    { titulo: t.listas.mensuales, filas: obligaciones.filter((o) => o.tipo === 'mensual') },
    { titulo: t.listas.anuales, filas: obligaciones.filter((o) => o.tipo === 'anual') },
  ].filter((g) => g.filas.length > 0);

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenido}>
      {grupos.length === 0 && <Text style={estilos.vacio}>{t.listas.vacioObligaciones}</Text>}
      {grupos.map((g) => (
        <View key={g.titulo} style={estilos.grupo}>
          <Text accessibilityRole="header" style={estilos.titulo}>
            {g.titulo}
          </Text>
          {g.filas.map((o) => (
            <Fila key={o.id} titulo={o.nombre} resumen={resumen(o)} onPress={() => onEditar(o.id)} />
          ))}
        </View>
      ))}
      <Boton texto={t.listas.agregarObligacion} onPress={onAgregar} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 16, gap: 20 },
  grupo: { gap: 12 },
  titulo: { fontSize: 18, fontWeight: '600', color: colores.texto },
  vacio: { fontSize: 16, color: colores.textoSuave },
});
