import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores } from '../tema';

export type Opcion<T> = { valor: T; texto: string };

/**
 * Grupo de opciones de selección única (radio). Genérico para el tipo de
 * Obligación y el Vehículo (que admite `null`: "Sin vehículo"). Lo reutiliza
 * el asistente de H1.8.
 */
export function Opciones<T extends string | null>({
  etiqueta,
  opciones,
  seleccionada,
  onCambio,
  ayuda,
  error,
  deshabilitado = false,
}: {
  etiqueta: string;
  opciones: Opcion<T>[];
  seleccionada: T;
  onCambio: (valor: T) => void;
  ayuda?: string;
  error?: string;
  deshabilitado?: boolean;
}) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={etiqueta} style={estilos.opciones}>
        {opciones.map((o) => {
          const marcada = o.valor === seleccionada;
          return (
            <Pressable
              key={String(o.valor)}
              accessibilityRole="radio"
              accessibilityLabel={o.texto}
              accessibilityState={{ checked: marcada, disabled: deshabilitado }}
              disabled={deshabilitado}
              onPress={() => onCambio(o.valor)}
              style={[estilos.opcion, marcada && estilos.marcada, deshabilitado && estilos.atenuada]}
            >
              <Text style={[estilos.texto, marcada && estilos.textoMarcado]}>{o.texto}</Text>
            </Pressable>
          );
        })}
      </View>
      {ayuda !== undefined && <Text style={estilos.ayuda}>{ayuda}</Text>}
      {error !== undefined && (
        <Text accessibilityRole="alert" style={estilos.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 6 },
  etiqueta: { fontSize: 15, fontWeight: '600', color: colores.texto },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.fondo,
    justifyContent: 'center',
  },
  marcada: { borderColor: colores.primario, backgroundColor: colores.primario },
  atenuada: { opacity: 0.6 },
  texto: { fontSize: 16, color: colores.texto },
  textoMarcado: { color: colores.textoSobrePrimario, fontWeight: '600' },
  ayuda: { fontSize: 14, color: colores.textoSuave },
  error: { fontSize: 14, color: colores.peligro },
});
