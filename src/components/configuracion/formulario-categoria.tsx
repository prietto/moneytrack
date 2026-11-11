import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { borrarCategoria } from '@/data/commands/borrar-categoria';
import { guardarCategoria } from '@/data/commands/guardar-categoria';
import { erroresCategoria } from '@/domain/entrada';
import type { ClaseGasto } from '@/domain/hechos';
import { ejecutar } from '@/hooks/use-comando';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { nombresClase } from '@/textos/clases';
import { textosConfiguracion as t } from '@/textos/configuracion';

import { colores } from '../tema';
import { BotonBorrar } from './boton-borrar';
import { Campo } from './campo';
import { Formulario } from './formulario';
import { NoEncontrado } from './no-encontrado';
import { Opciones } from './opciones';
import { useGuardadoDiferido } from './use-guardado-diferido';

type Errores = ReturnType<typeof erroresCategoria>;
type SiNo = 'si' | 'no';

type Campos = {
  nombre: string;
  claseDefault: ClaseGasto;
  presupuestoId: string | null;
  fondoId: string | null;
  pideVehiculo: SiNo;
};

/**
 * Alta (`id = null`) o edición de una categoría (FR8). Los enlaces dependen
 * de la clase: Esencial → un Presupuesto o ninguno; Fondo protegido → un
 * Fondo; Gusto → ninguno. Al cambiar de clase se limpian los que no van. Las
 * de sistema no se abren aquí. Lo usan Ajustes y el asistente de H1.8.
 */
export function FormularioCategoria({
  id,
  onGuardado,
  onBorrado,
}: {
  id: string | null;
  onGuardado: () => void;
  onBorrado: () => void;
}) {
  const { categorias, presupuestos, fondos } = useConfiguracion();
  // La categoría al abrir: si luego desaparece (p. ej. al borrarla), el formulario no cambia.
  const [existente] = useState(() => (id === null ? null : (categorias.find((c) => c.id === id) ?? null)));
  const [campos, setCampos] = useState<Campos>(() => ({
    nombre: existente?.nombre ?? '',
    claseDefault: existente?.claseDefault ?? 'esencial',
    presupuestoId: existente?.presupuestoId ?? null,
    fondoId: existente?.fondoId ?? null,
    pideVehiculo: existente?.requiereVehiculo ? 'si' : 'no',
  }));
  const [errores, setErrores] = useState<Errores>({});
  const [fallo, setFallo] = useState(false);
  const [falloAlBorrar, setFalloAlBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const { guardando, ocupado, diferir } = useGuardadoDiferido();

  if (id !== null && (existente === null || existente.esSistema)) return <NoEncontrado />;

  const cambiar = (cambios: Partial<Campos>) => setCampos((c) => ({ ...c, ...cambios }));

  function cambiarClase(claseDefault: ClaseGasto) {
    setCampos((c) => ({
      ...c,
      claseDefault,
      presupuestoId: claseDefault === 'esencial' ? c.presupuestoId : null,
      fondoId: claseDefault === 'fondo' ? (c.fondoId ?? fondos[0]?.id ?? null) : null,
    }));
  }

  function guardar() {
    if (ocupado()) return;
    const datos = {
      nombre: campos.nombre,
      claseDefault: campos.claseDefault,
      presupuestoId: campos.presupuestoId,
      fondoId: campos.fondoId,
      requiereVehiculo: campos.pideVehiculo === 'si',
    };
    const nuevos = erroresCategoria(datos, categorias, id, presupuestos, fondos);
    setErrores(nuevos);
    setFallo(false);
    setFalloAlBorrar(false);
    if (Object.keys(nuevos).length > 0) return;

    diferir(() => {
      const resultado = ejecutar(guardarCategoria({ id, ...datos }));
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
      const resultado = ejecutar(borrarCategoria(id));
      setBorrando(false);
      if (resultado.ok) onBorrado();
      else setFalloAlBorrar(true);
    });
  }

  const clases: ClaseGasto[] =
    fondos.length > 0 || campos.claseDefault === 'fondo' ? ['esencial', 'fondo', 'gusto'] : ['esencial', 'gusto'];
  const errorNombre = errores.nombre;

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
      <Campo
        etiqueta={t.nombre}
        valor={campos.nombre}
        onCambio={(nombre) => cambiar({ nombre })}
        placeholder={t.placeholderCategoria}
        error={
          errorNombre &&
          (errorNombre === 'nombreRepetido' ? t.erroresNombreCategoria.nombreRepetido : t.errores[errorNombre])
        }
        editable={!guardando}
      />
      <Opciones<ClaseGasto>
        etiqueta={t.clase}
        opciones={clases.map((clase) => ({ valor: clase, texto: nombresClase[clase] }))}
        seleccionada={campos.claseDefault}
        onCambio={cambiarClase}
        error={errores.claseDefault && t.errores[errores.claseDefault]}
        deshabilitado={guardando}
      />
      {campos.claseDefault === 'esencial' && (
        <Opciones<string | null>
          etiqueta={t.presupuesto}
          opciones={[
            { valor: null, texto: t.sinPresupuesto },
            ...presupuestos.map((p) => ({ valor: p.id, texto: p.nombre })),
          ]}
          seleccionada={campos.presupuestoId}
          onCambio={(presupuestoId) => cambiar({ presupuestoId })}
          ayuda={campos.presupuestoId === null ? t.ayudaSinPresupuesto : undefined}
          error={errores.presupuestoId && t.errores[errores.presupuestoId]}
          deshabilitado={guardando}
        />
      )}
      {campos.claseDefault === 'fondo' && (
        <Opciones<string | null>
          etiqueta={t.fondo}
          opciones={fondos.map((f) => ({ valor: f.id, texto: f.nombre }))}
          seleccionada={campos.fondoId}
          onCambio={(fondoId) => cambiar({ fondoId })}
          error={errores.fondoId && t.errores[errores.fondoId]}
          deshabilitado={guardando}
        />
      )}
      <Opciones<SiNo>
        etiqueta={t.pideVehiculo}
        opciones={[
          { valor: 'si', texto: t.si },
          { valor: 'no', texto: t.no },
        ]}
        seleccionada={campos.pideVehiculo}
        onCambio={(pideVehiculo) => cambiar({ pideVehiculo })}
        deshabilitado={guardando}
      />
    </Formulario>
  );
}

const estilos = StyleSheet.create({
  aviso: { fontSize: 15, color: colores.peligro },
});
