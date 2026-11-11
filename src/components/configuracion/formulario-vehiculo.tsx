import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { borrarVehiculo } from '@/data/commands/borrar-vehiculo';
import { guardarVehiculo } from '@/data/commands/guardar-vehiculo';
import { erroresVehiculo } from '@/domain/entrada';
import { ejecutar } from '@/hooks/use-comando';
import { useConfiguracion } from '@/hooks/use-configuracion';
import { textosConfiguracion as t } from '@/textos/configuracion';

import { colores } from '../tema';
import { BotonBorrar } from './boton-borrar';
import { Campo } from './campo';
import { Formulario } from './formulario';
import { NoEncontrado } from './no-encontrado';
import { useGuardadoDiferido } from './use-guardado-diferido';

type Aviso = 'falloAlBorrar' | 'vehiculoEnUso' | null;

/**
 * Alta (`id = null`) o edición de un Vehículo (FR5). Lo usan Ajustes y el
 * asistente de H1.8. Un Vehículo usado por una Obligación vigente no se
 * borra: se avisa antes de llamar al comando (que lo repite como defensa).
 */
export function FormularioVehiculo({
  id,
  onGuardado,
  onBorrado,
}: {
  id: string | null;
  onGuardado: () => void;
  onBorrado: () => void;
}) {
  const { vehiculos, obligaciones } = useConfiguracion();
  // El Vehículo al abrir: si luego desaparece (p. ej. al borrarlo), el formulario no cambia.
  const [existente] = useState(() => (id === null ? null : (vehiculos.find((v) => v.id === id) ?? null)));
  const [nombre, setNombre] = useState(existente?.nombre ?? '');
  const [errores, setErrores] = useState<ReturnType<typeof erroresVehiculo>>({});
  const [fallo, setFallo] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [borrando, setBorrando] = useState(false);
  const { guardando, ocupado, diferir } = useGuardadoDiferido();

  if (id !== null && existente === null) return <NoEncontrado />;

  function guardar() {
    if (ocupado()) return;
    const nuevos = erroresVehiculo({ nombre }, vehiculos, id);
    setErrores(nuevos);
    setFallo(false);
    setAviso(null);
    if (Object.keys(nuevos).length > 0) return;
    diferir(() => {
      const resultado = ejecutar(guardarVehiculo({ id, nombre }));
      if (resultado.ok) onGuardado();
      else setFallo(true);
    });
  }

  function borrar(): boolean | void {
    if (ocupado() || id === null) return;
    setFallo(false);
    if (obligaciones.some((o) => o.tipo === 'anual' && o.vehiculoId === id)) {
      setAviso('vehiculoEnUso');
      // Cierra la confirmación: este borrado no puede seguir.
      return false;
    }
    setAviso(null);
    setBorrando(true);
    diferir(() => {
      const resultado = ejecutar(borrarVehiculo(id));
      setBorrando(false);
      if (resultado.ok) onBorrado();
      else setAviso('falloAlBorrar');
    });
  }

  return (
    <Formulario
      guardando={guardando}
      fallo={fallo}
      onGuardar={guardar}
      pie={
        existente && (
          <>
            {aviso !== null && (
              <Text accessibilityRole="alert" style={estilos.aviso}>
                {t[aviso]}
              </Text>
            )}
            <BotonBorrar nombre={existente.nombre} onBorrar={borrar} borrando={borrando} deshabilitado={guardando} />
          </>
        )
      }
    >
      <Campo
        etiqueta={t.nombre}
        valor={nombre}
        onCambio={setNombre}
        placeholder={t.placeholderVehiculo}
        error={errores.nombre && t.errores[errores.nombre]}
        editable={!guardando}
      />
    </Formulario>
  );
}

const estilos = StyleSheet.create({
  aviso: { fontSize: 15, color: colores.peligro },
});
