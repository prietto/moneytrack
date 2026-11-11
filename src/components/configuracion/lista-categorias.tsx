import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Categoria, ClaseGasto } from '@/domain/hechos';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { nombresClase } from '@/textos/clases';
import { textosConfiguracion as t } from '@/textos/configuracion';

import { Boton } from '../boton';
import { colores } from '../tema';
import { Fila } from './fila';

const GRUPOS: { clase: ClaseGasto; titulo: string }[] = [
  { clase: 'esencial', titulo: t.listas.esenciales },
  { clase: 'fondo', titulo: t.listas.fondosProtegidos },
  { clase: 'gusto', titulo: t.listas.gustos },
];

/**
 * Las categorías vigentes (FR8), agrupadas por clase, y al final las de
 * sistema ("De la app") sin acción de editar: la app las usa y no se cambian.
 */
export function ListaCategorias({ onAgregar, onEditar }: { onAgregar: () => void; onEditar: (id: string) => void }) {
  const { categorias, presupuestos, fondos } = useConfiguracion();

  const resumen = (c: Categoria) => {
    const enlace =
      presupuestos.find((p) => p.id === c.presupuestoId)?.nombre ??
      fondos.find((f) => f.id === c.fondoId)?.nombre ??
      null;
    return t.listas.resumenCategoria(nombresClase[c.claseDefault], enlace, c.requiereVehiculo);
  };

  const propias = categorias.filter((c) => !c.esSistema);
  const deSistema = categorias.filter((c) => c.esSistema);
  const grupos = GRUPOS.map((g) => ({ ...g, filas: propias.filter((c) => c.claseDefault === g.clase) })).filter(
    (g) => g.filas.length > 0,
  );

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenido}>
      {grupos.length === 0 && <Text style={estilos.vacio}>{t.listas.vacioCategorias}</Text>}
      {grupos.map((g) => (
        <View key={g.clase} style={estilos.grupo}>
          <Text accessibilityRole="header" style={estilos.titulo}>
            {g.titulo}
          </Text>
          {g.filas.map((c) => (
            <Fila key={c.id} titulo={c.nombre} resumen={resumen(c)} onPress={() => onEditar(c.id)} />
          ))}
        </View>
      ))}
      <Boton texto={t.listas.agregarCategoria} onPress={onAgregar} />
      {deSistema.length > 0 && (
        <View style={estilos.grupo}>
          <Text accessibilityRole="header" style={estilos.titulo}>
            {t.listas.deLaApp}
          </Text>
          <Text style={estilos.ayuda}>{t.listas.ayudaDeLaApp}</Text>
          {deSistema.map((c) => (
            <View
              key={c.id}
              accessible
              accessibilityLabel={t.listas.etiquetaDeLaApp(c.nombre, resumen(c))}
              style={estilos.fija}
            >
              <Text style={estilos.nombre}>{c.nombre}</Text>
              <Text style={estilos.resumen}>{resumen(c)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 16, gap: 20 },
  grupo: { gap: 12 },
  titulo: { fontSize: 18, fontWeight: '600', color: colores.texto },
  vacio: { fontSize: 16, color: colores.textoSuave },
  ayuda: { fontSize: 14, color: colores.textoSuave },
  fija: {
    minHeight: 56,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    gap: 4,
  },
  nombre: { fontSize: 17, fontWeight: '600', color: colores.texto },
  resumen: { fontSize: 15, color: colores.textoSuave },
});
