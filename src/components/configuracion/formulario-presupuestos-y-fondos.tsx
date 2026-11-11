import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { guardarPresupuestosYFondos } from '@/data/commands/guardar-presupuestos-y-fondos';
import { esPresupuestoDeVehiculos } from '@/domain/categorias';
import { erroresFondo, erroresPresupuesto, leerMonto } from '@/domain/entrada';
import { saldoFondoEn } from '@/domain/fondos';
import { ejecutar } from '@/hooks/use-comando';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { useHoy } from '@/hooks/use-hoy';
import { textosConfiguracion as t } from '@/textos/configuracion';
import { formatearDinero } from '@/textos/dinero';

import { colores } from '../tema';
import { Campo } from './campo';
import { Formulario } from './formulario';
import { useGuardadoDiferido } from './use-guardado-diferido';

type CamposFondo = { aporte: string; saldo: string; fecha: string };
type ErroresFondo = ReturnType<typeof erroresFondo>;

/**
 * Montos de los Presupuestos esenciales y, por cada Fondo protegido, el
 * aporte mensual y el saldo inicial con fecha (FR3, FR4), en una sola
 * pantalla y un solo guardado. El Presupuesto al que apunta una categoría que
 * pide Vehículo muestra la ayuda del combustible. Lo usan Ajustes y el
 * asistente de H1.8.
 *
 * Un fondo configurado se precarga con su saldo calculado en `hoy` y la fecha
 * `hoy`: si se cambia algo, se guarda ese nuevo punto de partida (AD-2) y nada
 * se recalcula hacia atrás. Sin cambios, se conserva el punto guardado.
 */
export function FormularioPresupuestosYFondos({ onGuardado }: { onGuardado: () => void }) {
  const hoy = useHoy();
  const configuracion = useConfiguracion();
  // Las filas al abrir: si luego cambian, el formulario no se reacomoda.
  const [{ presupuestos, fondos, categorias, pago2 }] = useState(() => configuracion);
  // El saldo y la fecha con que se precarga cada fondo configurado.
  const [anclas] = useState<Record<string, { saldo: number; fecha: string }>>(() =>
    Object.fromEntries(
      fondos.flatMap((f) => {
        const saldo = saldoFondoEn(f, pago2?.dia ?? null, hoy);
        return saldo === null ? [] : [[f.id, { saldo, fecha: hoy }]];
      }),
    ),
  );
  const [montos, setMontos] = useState<Record<string, string>>(() =>
    Object.fromEntries(presupuestos.map((p) => [p.id, p.montoMensual === null ? '' : formatearDinero(p.montoMensual)])),
  );
  const [camposFondos, setCamposFondos] = useState<Record<string, CamposFondo>>(() =>
    Object.fromEntries(
      fondos.map((f) => [
        f.id,
        {
          aporte: f.aporteMensual === null ? '' : formatearDinero(f.aporteMensual),
          saldo: formatearDinero(anclas[f.id]?.saldo ?? 0),
          fecha: anclas[f.id]?.fecha ?? hoy,
        },
      ]),
    ),
  );
  const [erroresMontos, setErroresMontos] = useState<Record<string, 'montoInvalido'>>({});
  const [erroresFondos, setErroresFondos] = useState<Record<string, ErroresFondo>>({});
  const [fallo, setFallo] = useState(false);
  const { guardando, ocupado, diferir } = useGuardadoDiferido();

  const cambiarFondo = (id: string, cambios: Partial<CamposFondo>) =>
    setCamposFondos((c) => ({ ...c, [id]: { ...c[id], ...cambios } }));

  function guardar() {
    if (ocupado()) return;
    const nuevosMontos: Record<string, 'montoInvalido'> = {};
    const entradaPresupuestos = presupuestos.map((p) => {
      const montoMensual = leerMonto(montos[p.id]);
      const error = erroresPresupuesto({ montoMensual }).montoMensual;
      if (error) nuevosMontos[p.id] = error;
      return { id: p.id, montoMensual: montoMensual! };
    });
    const nuevosFondos: Record<string, ErroresFondo> = {};
    const entradaFondos = fondos.map((f) => {
      const campos = camposFondos[f.id];
      const datos = {
        aporteMensual: leerMonto(campos.aporte),
        saldoMonto: leerMonto(campos.saldo),
        saldoFecha: campos.fecha.trim(),
      };
      const errores = erroresFondo(datos, hoy, f.saldoInicial?.fecha ?? null);
      if (Object.keys(errores).length > 0) nuevosFondos[f.id] = errores;
      const ancla = anclas[f.id];
      const sinCambios =
        f.saldoInicial !== null &&
        ancla !== undefined &&
        datos.aporteMensual === f.aporteMensual &&
        datos.saldoMonto === ancla.saldo &&
        datos.saldoFecha === ancla.fecha;
      return {
        id: f.id,
        aporteMensual: datos.aporteMensual!,
        saldoInicial: sinCambios ? f.saldoInicial! : { monto: datos.saldoMonto!, fecha: datos.saldoFecha },
      };
    });
    setErroresMontos(nuevosMontos);
    setErroresFondos(nuevosFondos);
    setFallo(false);
    if (Object.keys(nuevosMontos).length > 0 || Object.keys(nuevosFondos).length > 0) return;

    diferir(() => {
      const resultado = ejecutar(
        guardarPresupuestosYFondos({ presupuestos: entradaPresupuestos, fondos: entradaFondos }, hoy),
      );
      // Con fallo, lo escrito se conserva; el registro ya lo hizo ejecutar.
      if (resultado.ok) onGuardado();
      else setFallo(true);
    });
  }

  const editable = !guardando;

  return (
    <Formulario guardando={guardando} fallo={fallo} onGuardar={guardar}>
      {presupuestos.map((p) => {
        const error = erroresMontos[p.id];
        return (
          <Campo
            key={p.id}
            etiqueta={p.nombre}
            valor={montos[p.id]}
            onCambio={(texto) => setMontos((m) => ({ ...m, [p.id]: texto }))}
            placeholder={t.placeholderMonto}
            ayuda={esPresupuestoDeVehiculos(p.id, categorias) ? t.ayudaPresupuestoVehiculos : t.ayudaPresupuesto}
            teclado="number-pad"
            error={error && t.errores[error]}
            editable={editable}
          />
        );
      })}
      {fondos.map((f) => {
        const campos = camposFondos[f.id];
        const errores = erroresFondos[f.id] ?? {};
        const errorFecha = errores.saldoFecha;
        return (
          <View key={f.id} style={estilos.fondo}>
            <Text accessibilityRole="header" style={estilos.titulo}>
              {f.nombre}
            </Text>
            <Campo
              etiqueta={t.aporteFondo}
              valor={campos.aporte}
              onCambio={(aporte) => cambiarFondo(f.id, { aporte })}
              placeholder={t.placeholderMonto}
              ayuda={t.ayudaAporteFondo}
              teclado="number-pad"
              error={errores.aporte && t.errores[errores.aporte]}
              editable={editable}
            />
            <Campo
              etiqueta={t.saldoFondo}
              valor={campos.saldo}
              onCambio={(saldo) => cambiarFondo(f.id, { saldo })}
              placeholder={t.placeholderMonto}
              ayuda={t.ayudaSaldoFondo}
              teclado="number-pad"
              error={errores.saldoMonto && t.errores[errores.saldoMonto]}
              editable={editable}
            />
            <Campo
              etiqueta={t.fechaSaldoFondo}
              valor={campos.fecha}
              onCambio={(fecha) => cambiarFondo(f.id, { fecha })}
              placeholder={t.placeholderFecha}
              ayuda={t.ayudaFechaSaldoFondo}
              teclado="numbers-and-punctuation"
              error={
                errorFecha &&
                (errorFecha === 'fechaAntigua' ? t.erroresFechaReserva.fechaAntigua : t.errores[errorFecha])
              }
              editable={editable}
            />
          </View>
        );
      })}
    </Formulario>
  );
}

const estilos = StyleSheet.create({
  fondo: { gap: 20 },
  titulo: { fontSize: 18, fontWeight: '600', color: colores.texto },
});
