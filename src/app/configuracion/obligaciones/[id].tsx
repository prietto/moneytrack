import { router, Stack, useLocalSearchParams } from 'expo-router';

import { FormularioObligacion } from '@/components/configuracion/formulario-obligacion';
import { textosNavegacion } from '@/textos/navegacion';

// `id = 'nuevo'` es el alta; cualquier otro es el UUID de la Obligación a editar.
export default function EditarObligacion() {
  const { id: param } = useLocalSearchParams<{ id: string }>();
  const id = param === 'nuevo' ? null : param;
  return (
    <>
      <Stack.Screen
        options={{ title: id === null ? textosNavegacion.nuevaObligacion : textosNavegacion.editarObligacion }}
      />
      <FormularioObligacion id={id} onGuardado={() => router.back()} onBorrado={() => router.back()} />
    </>
  );
}
