import { router, Stack, useLocalSearchParams } from 'expo-router';

import { FormularioCategoria } from '@/components/configuracion/formulario-categoria';
import { textosNavegacion } from '@/textos/navegacion';

// `id = 'nueva'` es el alta; cualquier otro es el UUID de la categoría a editar.
export default function EditarCategoria() {
  const { id: param } = useLocalSearchParams<{ id: string }>();
  const id = param === 'nueva' ? null : param;
  return (
    <>
      <Stack.Screen
        options={{ title: id === null ? textosNavegacion.nuevaCategoria : textosNavegacion.editarCategoria }}
      />
      <FormularioCategoria id={id} onGuardado={() => router.back()} onBorrado={() => router.back()} />
    </>
  );
}
