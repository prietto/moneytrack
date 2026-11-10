import { router } from 'expo-router';

import { ListaObligaciones } from '@/components/configuracion/lista-obligaciones';

// La ruta solo monta la lista: el asistente de H1.8 la reutiliza.
export default function Obligaciones() {
  return (
    <ListaObligaciones
      onAgregar={() => router.push({ pathname: '/configuracion/obligaciones/[id]', params: { id: 'nuevo' } })}
      onEditar={(id) => router.push({ pathname: '/configuracion/obligaciones/[id]', params: { id } })}
    />
  );
}
