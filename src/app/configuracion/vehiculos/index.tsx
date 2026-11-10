import { router } from 'expo-router';

import { ListaVehiculos } from '@/components/configuracion/lista-vehiculos';

// La ruta solo monta la lista: el asistente de H1.8 la reutiliza.
export default function Vehiculos() {
  return (
    <ListaVehiculos
      onAgregar={() => router.push({ pathname: '/configuracion/vehiculos/[id]', params: { id: 'nuevo' } })}
      onEditar={(id) => router.push({ pathname: '/configuracion/vehiculos/[id]', params: { id } })}
    />
  );
}
