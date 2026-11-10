import { type Href, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colores } from '@/components/tema';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { useHoy } from '@/hooks/use-hoy';
import { textosAjustes } from '@/textos/ajustes';
import { formatearDinero } from '@/textos/dinero';
import { formatearFechaCorta } from '@/textos/fechas';

function Entrada({ titulo, resumen, ruta }: { titulo: string; resumen: string; ruta: Href }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={resumen}
      onPress={() => router.push(ruta)}
      style={({ pressed }) => [estilos.entrada, pressed && estilos.presionada]}
    >
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.resumen}>{resumen}</Text>
    </Pressable>
  );
}

/**
 * Ajustes. Presupuestos, Deudas, umbral y exportar llegan en H1.6–H1.8 y H7:
 * sin entradas deshabilitadas mientras tanto.
 */
export default function Ajustes() {
  const { pago1, pago2, saldoInicial, colchon, vehiculos, obligaciones } = useConfiguracion();
  const hoy = useHoy();

  const lineasPagos = [pago1, pago2]
    .filter((p) => p !== null)
    .map((p) => textosAjustes.resumenPago(p.numero, p.dia, formatearDinero(p.montoEsperado)));
  const resumenPagos = lineasPagos.length > 0 ? lineasPagos.join('\n') : textosAjustes.sinConfigurar;

  let resumenSaldo: string = textosAjustes.sinConfigurar;
  if (saldoInicial && colchon !== null) {
    resumenSaldo = textosAjustes.resumenSaldoYColchon(
      formatearDinero(saldoInicial.monto),
      formatearFechaCorta(saldoInicial.fecha, hoy),
      formatearDinero(colchon),
    );
  } else if (colchon !== null) {
    resumenSaldo = textosAjustes.resumenColchon(formatearDinero(colchon));
  }

  const resumenVehiculos = textosAjustes.resumenVehiculos(vehiculos.map((v) => v.nombre));
  const resumenObligaciones = textosAjustes.resumenObligaciones(
    obligaciones.filter((o) => o.tipo === 'mensual').length,
    obligaciones.filter((o) => o.tipo === 'anual').length,
  );

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenido}>
      <Entrada titulo={textosAjustes.pagos} resumen={resumenPagos} ruta="/configuracion/pagos" />
      <Entrada titulo={textosAjustes.saldoYColchon} resumen={resumenSaldo} ruta="/configuracion/saldo-y-colchon" />
      <Entrada titulo={textosAjustes.vehiculos} resumen={resumenVehiculos} ruta="/configuracion/vehiculos" />
      <Entrada titulo={textosAjustes.obligaciones} resumen={resumenObligaciones} ruta="/configuracion/obligaciones" />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: colores.fondo },
  contenido: { padding: 16, gap: 12 },
  entrada: {
    minHeight: 64,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    gap: 4,
  },
  presionada: { opacity: 0.7 },
  titulo: { fontSize: 17, fontWeight: '600', color: colores.texto },
  resumen: { fontSize: 15, color: colores.textoSuave },
});
