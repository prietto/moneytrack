import { router } from 'expo-router';

import { FormularioPagos } from '@/components/configuracion/formulario-pagos';

// La ruta solo monta el formulario: el asistente de H1.8 lo reutiliza.
export default function ConfigurarPagos() {
  return <FormularioPagos onGuardado={() => router.back()} />;
}
