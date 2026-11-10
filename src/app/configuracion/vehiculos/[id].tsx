import { router, Stack, useLocalSearchParams } from 'expo-router';

import { FormularioVehiculo } from '@/components/configuracion/formulario-vehiculo';
import { textosNavegacion } from '@/textos/navegacion';

// `id = 'nuevo'` es el alta; cualquier otro es el UUID del Vehículo a editar.
export default function EditarVehiculo() {
  const { id: param } = useLocalSearchParams<{ id: string }>();
  const id = param === 'nuevo' ? null : param;
  return (
    <>
      <Stack.Screen
        options={{ title: id === null ? textosNavegacion.nuevoVehiculo : textosNavegacion.editarVehiculo }}
      />
      <FormularioVehiculo id={id} onGuardado={() => router.back()} onBorrado={() => router.back()} />
    </>
  );
}
