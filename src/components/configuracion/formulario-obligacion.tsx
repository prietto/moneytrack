import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { borrarObligacion } from '@/data/commands/borrar-obligacion';
import { guardarObligacion } from '@/data/commands/guardar-obligacion';
import { erroresObligacionAnual, erroresObligacionMensual, leerDia, leerMonto } from '@/domain/entrada';
import type { ObligacionDefinida } from '@/domain/hechos';
import { ejecutar } from '@/hooks/use-comando';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { useHoy } from '@/hooks/use-hoy';
import { textosConfiguracion as t } from '@/textos/configuracion';
import { formatearDinero } from '@/textos/dinero';

import { colores } from '../tema';
import { BotonBorrar } from './boton-borrar';
import { Campo } from './campo';
import { Formulario } from './formulario';
import { NoEncontrado } from './no-encontrado';
import { Opciones } from './opciones';
import { useGuardadoDiferido } from './use-guardado-diferido';

type Tipo = ObligacionDefinida['tipo'];
type Errores = ReturnType<typeof erroresObligacionMensual> & ReturnType<typeof erroresObligacionAnual>;

type Campos = {
  nombre: string;
  monto: string;
  dia: string;
  fechaVencimiento: string;
  vehiculoId: string | null;
  reservaMonto: string;
  reservaFecha: string;
};

function iniciales(o: ObligacionDefinida | null, hoy: string): Campos {
  const vacios: Campos = {
    nombre: o?.nombre ?? '',
    monto: o ? formatearDinero(o.monto) : '',
    dia: '',
    fechaVencimiento: '',
    vehiculoId: null,
    reservaMonto: '0',
    reservaFecha: hoy,
  };
  if (o?.tipo === 'mensual') return { ...vacios, dia: String(o.dia) };
  if (o?.tipo === 'anual') {
    return {
      ...vacios,
      fechaVencimiento: o.fechaVencimiento,
      vehiculoId: o.vehiculoId,
      reservaMonto: formatearDinero(o.reservaInicial.monto),
      reservaFecha: o.reservaInicial.fecha,
    };
  }
  return vacios;
}

/**
 * Alta (`id = null`) o edición de una Obligación mensual o anual (FR3). El
 * tipo se elige al crear y no se cambia al editar. Las fechas son texto
 * AAAA-MM-DD (no hay selector de fecha). Lo usan Ajustes y el asistente de H1.8.
 */
export function FormularioObligacion({
  id,
  onGuardado,
  onBorrado,
}: {
  id: string | null;
  onGuardado: () => void;
  onBorrado: () => void;
}) {
  const hoy = useHoy();
  const { obligaciones, vehiculos } = useConfiguracion();
  // La Obligación al abrir: si luego desaparece (p. ej. al borrarla), el formulario no cambia.
  const [existente] = useState(() => (id === null ? null : (obligaciones.find((o) => o.id === id) ?? null)));
  const [tipo, setTipo] = useState<Tipo>(existente?.tipo ?? 'mensual');
  const [campos, setCampos] = useState(() => iniciales(existente, hoy));
  const [errores, setErrores] = useState<Errores>({});
  const [fallo, setFallo] = useState(false);
  const [falloAlBorrar, setFalloAlBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const { guardando, ocupado, diferir } = useGuardadoDiferido();

  if (id !== null && existente === null) return <NoEncontrado />;

  const cambiar = (cambios: Partial<Campos>) => setCampos((c) => ({ ...c, ...cambios }));

  function guardar() {
    if (ocupado()) return;
    const monto = leerMonto(campos.monto);
    let nuevos: Errores;
    let entrada: Parameters<typeof guardarObligacion>[0];
    if (tipo === 'mensual') {
      const dia = leerDia(campos.dia);
      nuevos = erroresObligacionMensual({ nombre: campos.nombre, monto, dia });
      entrada = { id, tipo, nombre: campos.nombre, monto: monto!, dia: dia! };
    } else {
      const datos = {
        nombre: campos.nombre,
        monto,
        fechaVencimiento: campos.fechaVencimiento.trim(),
        vehiculoId: campos.vehiculoId,
        reservaMonto: leerMonto(campos.reservaMonto),
        reservaFecha: campos.reservaFecha.trim(),
      };
      const guardada =
        existente?.tipo === 'anual'
          ? { fechaVencimiento: existente.fechaVencimiento, reservaFecha: existente.reservaInicial.fecha }
          : null;
      nuevos = erroresObligacionAnual(datos, hoy, guardada, vehiculos);
      entrada = {
        id,
        tipo,
        nombre: datos.nombre,
        monto: monto!,
        fechaVencimiento: datos.fechaVencimiento,
        vehiculoId: datos.vehiculoId,
        reservaInicial: { monto: datos.reservaMonto!, fecha: datos.reservaFecha },
      };
    }
    setErrores(nuevos);
    setFallo(false);
    setFalloAlBorrar(false);
    if (Object.keys(nuevos).length > 0) return;

    diferir(() => {
      const resultado = ejecutar(guardarObligacion(entrada, hoy));
      // Con fallo, lo escrito se conserva; el registro ya lo hizo ejecutar.
      if (resultado.ok) onGuardado();
      else setFallo(true);
    });
  }

  function borrar() {
    if (ocupado() || id === null) return;
    setFallo(false);
    setFalloAlBorrar(false);
    setBorrando(true);
    diferir(() => {
      const resultado = ejecutar(borrarObligacion(id));
      setBorrando(false);
      if (resultado.ok) onBorrado();
      else setFalloAlBorrar(true);
    });
  }

  const editable = !guardando;
  const errorFecha = errores.fechaVencimiento;
  const errorReservaFecha = errores.reservaFecha;

  return (
    <Formulario
      guardando={guardando}
      fallo={fallo}
      onGuardar={guardar}
      pie={
        existente && (
          <>
            {falloAlBorrar && (
              <Text accessibilityRole="alert" style={estilos.aviso}>
                {t.falloAlBorrar}
              </Text>
            )}
            <BotonBorrar nombre={existente.nombre} onBorrar={borrar} borrando={borrando} deshabilitado={guardando} />
          </>
        )
      }
    >
      <Opciones<Tipo>
        etiqueta={t.tipo}
        opciones={[
          { valor: 'mensual', texto: t.tipos.mensual },
          { valor: 'anual', texto: t.tipos.anual },
        ]}
        seleccionada={tipo}
        onCambio={setTipo}
        ayuda={existente ? t.ayudaTipoFijo : undefined}
        deshabilitado={existente !== null || guardando}
      />
      <Campo
        etiqueta={t.nombre}
        valor={campos.nombre}
        onCambio={(nombre) => cambiar({ nombre })}
        placeholder={t.placeholderObligacion}
        error={errores.nombre && t.errores[errores.nombre]}
        editable={editable}
      />
      <Campo
        etiqueta={t.monto}
        valor={campos.monto}
        onCambio={(monto) => cambiar({ monto })}
        placeholder={t.placeholderMonto}
        teclado="number-pad"
        error={errores.monto && t.errores[errores.monto]}
        editable={editable}
      />
      {tipo === 'mensual' ? (
        <Campo
          etiqueta={t.dia}
          valor={campos.dia}
          onCambio={(dia) => cambiar({ dia })}
          placeholder={t.placeholderDia}
          ayuda={t.ayudaPagos}
          teclado="number-pad"
          error={errores.dia && t.errores[errores.dia]}
          editable={editable}
        />
      ) : (
        <>
          <Campo
            etiqueta={t.fechaVencimiento}
            valor={campos.fechaVencimiento}
            onCambio={(fechaVencimiento) => cambiar({ fechaVencimiento })}
            placeholder={t.placeholderFecha}
            ayuda={t.ayudaFechaVencimiento}
            teclado="numbers-and-punctuation"
            error={
              errorFecha && (errorFecha === 'fechaAntigua' ? t.erroresVencimiento.fechaAntigua : t.errores[errorFecha])
            }
            editable={editable}
          />
          <Opciones<string | null>
            etiqueta={t.vehiculo}
            opciones={[
              { valor: null, texto: t.sinVehiculo },
              ...vehiculos.map((v) => ({ valor: v.id, texto: v.nombre })),
            ]}
            seleccionada={campos.vehiculoId}
            onCambio={(vehiculoId) => cambiar({ vehiculoId })}
            error={errores.vehiculoId && t.errores[errores.vehiculoId]}
            deshabilitado={guardando}
          />
          <Campo
            etiqueta={t.reserva}
            valor={campos.reservaMonto}
            onCambio={(reservaMonto) => cambiar({ reservaMonto })}
            placeholder={t.placeholderMonto}
            ayuda={t.ayudaReserva}
            teclado="number-pad"
            error={errores.reservaMonto && t.errores[errores.reservaMonto]}
            editable={editable}
          />
          <Campo
            etiqueta={t.fechaReserva}
            valor={campos.reservaFecha}
            onCambio={(reservaFecha) => cambiar({ reservaFecha })}
            placeholder={t.placeholderFecha}
            ayuda={t.ayudaFechaReserva}
            teclado="numbers-and-punctuation"
            error={
              errorReservaFecha &&
              (errorReservaFecha === 'fechaAntigua' ? t.erroresFechaReserva.fechaAntigua : t.errores[errorReservaFecha])
            }
            editable={editable}
          />
        </>
      )}
    </Formulario>
  );
}

const estilos = StyleSheet.create({
  aviso: { fontSize: 15, color: colores.peligro },
});
