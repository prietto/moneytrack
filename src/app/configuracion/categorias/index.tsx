import { router } from 'expo-router';

import { ListaCategorias } from '@/components/configuracion/lista-categorias';

// La ruta solo monta la lista: el asistente de H1.8 la reutiliza.
export default function Categorias() {
  return (
    <ListaCategorias
      onAgregar={() => router.push({ pathname: '/configuracion/categorias/[id]', params: { id: 'nueva' } })}
      onEditar={(id) => router.push({ pathname: '/configuracion/categorias/[id]', params: { id } })}
    />
  );
}
