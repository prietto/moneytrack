import { useState } from 'react';

import { guardarSaldoInicialYColchon } from '@/data/commands/guardar-saldo-y-colchon';
import { erroresSaldoYColchon, leerMonto } from '@/domain/entrada';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { ejecutar } from '@/hooks/use-comando';
import { useHoy } from '@/hooks/use-hoy';
import { textosConfiguracion as t } from '@/textos/configuracion';
import { formatearDinero } from '@/textos/dinero';

import { Campo } from './campo';
import { Formulario } from './formulario';
import { useGuardadoDiferido } from './use-guardado-diferido';

type Errores = ReturnType<typeof erroresSaldoYColchon>;

/**
 * Saldo real inicial con su fecha y Colchón (FR4). El Colchón llega
 * precargado con el guardado o con el de siembra (AD-9). La fecha es un campo
 * de texto AAAA-MM-DD: no hay selector de fecha instalado. Lo usan Ajustes y
 * el asistente de H1.8.
 */
export function FormularioSaldoYColchon({ onGuardado }: { onGuardado: () => void }) {
  const hoy = useHoy();
  const { saldoInicial, colchonSugerido } = useConfiguracion();
  const [monto, setMonto] = useState(() => (saldoInicial ? formatearDinero(saldoInicial.monto) : ''));
  const [fecha, setFecha] = useState(() => saldoInicial?.fecha ?? hoy);
  const [colchon, setColchon] = useState(() => formatearDinero(colchonSugerido));
  const [errores, setErrores] = useState<Errores>({});
  const { guardando, ocupado, diferir } = useGuardadoDiferido();
  const [fallo, setFallo] = useState(false);

  function guardar() {
    if (ocupado()) return;
    const datos = { monto: leerMonto(monto), fecha: fecha.trim(), colchon: leerMonto(colchon) };
    const nuevos = erroresSaldoYColchon(datos, hoy, saldoInicial?.fecha ?? null);
    setErrores(nuevos);
    setFallo(false);
    if (Object.keys(nuevos).length > 0) return;

    diferir(() => {
      const resultado = ejecutar(
        guardarSaldoInicialYColchon({ monto: datos.monto!, fecha: datos.fecha, colchon: datos.colchon!, hoy }),
      );
      if (resultado.ok) onGuardado();
      else setFallo(true);
    });
  }

  return (
    <Formulario guardando={guardando} fallo={fallo} onGuardar={guardar}>
      <Campo
        etiqueta={t.saldo}
        valor={monto}
        onCambio={setMonto}
        placeholder={t.placeholderMonto}
        ayuda={t.ayudaSaldo}
        teclado="number-pad"
        error={errores.monto && t.errores[errores.monto]}
        editable={!guardando}
      />
      <Campo
        etiqueta={t.fecha}
        valor={fecha}
        onCambio={setFecha}
        placeholder={t.placeholderFecha}
        ayuda={t.ayudaFecha}
        teclado="numbers-and-punctuation"
        error={errores.fecha && t.errores[errores.fecha]}
        editable={!guardando}
      />
      <Campo
        etiqueta={t.colchon}
        valor={colchon}
        onCambio={setColchon}
        placeholder={t.placeholderMonto}
        ayuda={t.ayudaColchon}
        teclado="number-pad"
        error={errores.colchon && t.errores[errores.colchon]}
        editable={!guardando}
      />
    </Formulario>
  );
}
