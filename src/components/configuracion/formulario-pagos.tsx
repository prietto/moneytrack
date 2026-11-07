import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { configurarPagos } from '@/data/commands/configurar-pagos';
import { erroresPago, leerDia, leerMonto } from '@/domain/entrada';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { ejecutar } from '@/hooks/use-comando';
import type { PagoDefinido } from '@/domain/hechos';
import { textosConfiguracion as t } from '@/textos/configuracion';
import { formatearDinero } from '@/textos/dinero';

import { colores } from '../tema';
import { Campo } from './campo';
import { Formulario } from './formulario';
import { useGuardadoDiferido } from './use-guardado-diferido';

type CamposPago = { dia: string; monto: string };
type ErroresPago = ReturnType<typeof erroresPago>;

function inicial(pago: PagoDefinido | null): CamposPago {
  return pago ? { dia: String(pago.dia), monto: formatearDinero(pago.montoEsperado) } : { dia: '', monto: '' };
}

function BloquePago({
  numero,
  campos,
  errores,
  onCambio,
  editable,
}: {
  numero: 1 | 2;
  campos: CamposPago;
  errores: ErroresPago;
  onCambio: (campos: CamposPago) => void;
  editable: boolean;
}) {
  return (
    <View style={estilos.bloque}>
      <Text accessibilityRole="header" style={estilos.titulo}>
        {t.pago(numero)}
      </Text>
      <Campo
        etiqueta={t.dia}
        accesible={t.diaPago(numero)}
        valor={campos.dia}
        onCambio={(dia) => onCambio({ ...campos, dia })}
        placeholder={t.placeholderDia}
        teclado="number-pad"
        error={errores.dia && t.errores[errores.dia]}
        editable={editable}
      />
      <Campo
        etiqueta={t.montoEsperado}
        accesible={t.montoPago(numero)}
        valor={campos.monto}
        onCambio={(monto) => onCambio({ ...campos, monto })}
        placeholder={t.placeholderMonto}
        teclado="number-pad"
        error={errores.montoEsperado && t.errores[errores.montoEsperado]}
        editable={editable}
      />
    </View>
  );
}

/** Configura el Pago 1 y el Pago 2 (FR1). Lo usan Ajustes y el asistente de H1.8. */
export function FormularioPagos({ onGuardado }: { onGuardado: () => void }) {
  const configuracion = useConfiguracion();
  const [pago1, setPago1] = useState(() => inicial(configuracion.pago1));
  const [pago2, setPago2] = useState(() => inicial(configuracion.pago2));
  const [errores, setErrores] = useState<{ pago1: ErroresPago; pago2: ErroresPago }>({ pago1: {}, pago2: {} });
  const { guardando, ocupado, diferir } = useGuardadoDiferido();
  const [fallo, setFallo] = useState(false);

  function guardar() {
    if (ocupado()) return;
    const datos1 = { dia: leerDia(pago1.dia), montoEsperado: leerMonto(pago1.monto) };
    const datos2 = { dia: leerDia(pago2.dia), montoEsperado: leerMonto(pago2.monto) };
    const nuevos = { pago1: erroresPago(datos1), pago2: erroresPago(datos2) };
    setErrores(nuevos);
    setFallo(false);
    if (Object.keys(nuevos.pago1).length > 0 || Object.keys(nuevos.pago2).length > 0) return;

    diferir(() => {
      const resultado = ejecutar(
        configurarPagos({
          pago1: { dia: datos1.dia!, montoEsperado: datos1.montoEsperado! },
          pago2: { dia: datos2.dia!, montoEsperado: datos2.montoEsperado! },
        }),
      );
      // Con fallo, lo escrito se conserva; el registro ya lo hizo ejecutar.
      if (resultado.ok) onGuardado();
      else setFallo(true);
    });
  }

  return (
    <Formulario guardando={guardando} fallo={fallo} onGuardar={guardar}>
      <Text style={estilos.ayuda}>{t.ayudaPagos}</Text>
      <BloquePago numero={1} campos={pago1} errores={errores.pago1} onCambio={setPago1} editable={!guardando} />
      <BloquePago numero={2} campos={pago2} errores={errores.pago2} onCambio={setPago2} editable={!guardando} />
    </Formulario>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 12 },
  titulo: { fontSize: 18, fontWeight: '600', color: colores.texto },
  ayuda: { fontSize: 14, color: colores.textoSuave },
});
