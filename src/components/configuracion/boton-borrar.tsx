import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { textosConfiguracion as t } from '@/textos/configuracion';

import { colores } from '../tema';

function BotonSecundario({
  texto,
  onPress,
  peligro = false,
  deshabilitado = false,
}: {
  texto: string;
  onPress: () => void;
  peligro?: boolean;
  deshabilitado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        peligro && estilos.bordePeligro,
        (pressed || deshabilitado) && estilos.atenuado,
      ]}
    >
      <Text style={[estilos.texto, peligro && estilos.peligro]}>{texto}</Text>
    </Pressable>
  );
}

/**
 * Borrado con confirmación en línea, en dos pasos: el primer toque muestra la
 * pregunta con "Sí, borrar" y "Cancelar". Sin `Alert` ni `Modal`: la capa de
 * bloqueo no tapa las ventanas nativas (diferido de H1.2).
 */
export function BotonBorrar({
  nombre,
  onBorrar,
  borrando = false,
  deshabilitado = false,
}: {
  nombre: string;
  onBorrar: () => void;
  borrando?: boolean;
  deshabilitado?: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <View style={estilos.bloque}>
        <BotonSecundario texto={t.borrar} peligro onPress={() => setConfirmando(true)} deshabilitado={deshabilitado} />
      </View>
    );
  }

  return (
    <View style={estilos.bloque}>
      <Text accessibilityRole="alert" style={estilos.pregunta}>
        {t.confirmarBorrar(nombre)}
      </Text>
      <BotonSecundario
        texto={borrando ? t.borrando : t.siBorrar}
        peligro
        onPress={onBorrar}
        deshabilitado={deshabilitado || borrando}
      />
      <BotonSecundario texto={t.cancelar} onPress={() => setConfirmando(false)} deshabilitado={borrando} />
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 12, marginTop: 8 },
  boton: {
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordePeligro: { borderColor: colores.peligro },
  atenuado: { opacity: 0.5 },
  texto: { fontSize: 16, fontWeight: '600', color: colores.texto },
  peligro: { color: colores.peligro },
  pregunta: { fontSize: 16, color: colores.texto },
});
