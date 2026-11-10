import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccesosRapidos } from '@/components/accesos-rapidos';
import { Boton } from '@/components/boton';
import { colores } from '@/components/tema';
import type { Estado } from '@/domain/estado';
import { useEstado } from '@/hooks/use-estado';
import { formatearDinero } from '@/textos/dinero';
import { formatearFechaCorta } from '@/textos/fechas';
import { textosInicio as t } from '@/textos/inicio';

/** Sin configuración suficiente: qué falta y cómo llegar. Ninguna cifra (nada inventado). */
function EstadoVacio({ faltan }: { faltan: Extract<Estado, { tipo: 'sinConfigurar' }>['faltan'] }) {
  const faltaSaldoOColchon = faltan.includes('saldoInicial') || faltan.includes('colchon');
  return (
    <View style={estilos.bloque}>
      <Text accessibilityRole="header" style={estilos.tituloVacio}>
        {t.vacio.titulo}
      </Text>
      <Text style={estilos.texto}>{t.vacio.mensaje}</Text>
      {faltan.map((f) => (
        <Text key={f} style={estilos.texto}>
          {t.vacio.vineta(t.vacio.faltan[f])}
        </Text>
      ))}
      <View style={estilos.botones}>
        {faltan.includes('pagos') && (
          <Boton texto={t.vacio.irAPagos} onPress={() => router.push('/configuracion/pagos')} />
        )}
        {faltaSaldoOColchon && (
          <Boton texto={t.vacio.irASaldoYColchon} onPress={() => router.push('/configuracion/saldo-y-colchon')} />
        )}
      </View>
    </View>
  );
}

/**
 * Pantalla principal (FR13, UX-DR3). No calcula nada (AD-1): solo elige qué
 * mostrar del Estado. Meta y fondo llegan en H1.6–H1.7 y la Épica 3, debajo
 * de lo que hay.
 */
export default function Inicio() {
  const estado = useEstado();

  if (estado.tipo === 'sinConfigurar') {
    return (
      <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenido}>
        <EstadoVacio faltan={estado.faltan} />
      </ScrollView>
    );
  }

  const negativo = estado.dineroLibre < 0;
  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenido}>
      <View style={estilos.bloque}>
        <Text style={estilos.etiqueta}>{t.dineroLibre}</Text>
        <Text testID="dinero-libre" style={[estilos.dineroLibre, negativo && estilos.peligro]}>
          {formatearDinero(estado.dineroLibre)}
        </Text>
        {/* NFR6: el negativo no se dice solo con color. */}
        {negativo && (
          <Text style={[estilos.texto, estilos.peligro]}>
            {t.faltante(formatearDinero(-estado.dineroLibre), formatearFechaCorta(estado.minimo.fecha, estado.hoy))}
          </Text>
        )}
        <Text style={estilos.ayuda}>{t.explicacionDineroLibre}</Text>
      </View>

      <View style={estilos.bloque}>
        <Text style={estilos.etiqueta}>{t.saldoCalculado}</Text>
        <Text style={estilos.saldo}>{formatearDinero(estado.saldoCalculado)}</Text>
      </View>

      {/* Sin vencidas no se muestra nada, ni el título. */}
      {estado.obligacionesVencidas.length > 0 && (
        <View style={estilos.bloque}>
          <Text accessibilityRole="header" style={estilos.etiqueta}>
            {t.obligacionesVencidas}
          </Text>
          {estado.obligacionesVencidas.map((o) => (
            <Text key={`${o.obligacionId}-${o.clave}`} style={[estilos.texto, estilos.peligro]}>
              {t.obligacionVencida(o.nombre, formatearDinero(o.monto), formatearFechaCorta(o.fecha, estado.hoy))}
            </Text>
          ))}
        </View>
      )}

      {estado.pagosAtrasados.map((p) => (
        <Text key={`${p.pagoId}-${p.clave}`} style={estilos.texto}>
          {t.pagoAtrasado(p.numero, formatearFechaCorta(p.fecha, estado.hoy))}
        </Text>
      ))}

      <AccesosRapidos />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: colores.fondo },
  contenido: { padding: 20, gap: 24 },
  bloque: { gap: 8 },
  botones: { gap: 12, marginTop: 8 },
  tituloVacio: { fontSize: 22, fontWeight: '600', color: colores.texto },
  etiqueta: { fontSize: 15, fontWeight: '600', color: colores.textoSuave },
  dineroLibre: { fontSize: 44, fontWeight: '700', color: colores.texto },
  saldo: { fontSize: 24, fontWeight: '600', color: colores.texto },
  texto: { fontSize: 16, color: colores.texto },
  ayuda: { fontSize: 14, color: colores.textoSuave },
  peligro: { color: colores.peligro },
});
