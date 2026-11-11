import { router } from 'expo-router';

import { FormularioPresupuestosYFondos } from '@/components/configuracion/formulario-presupuestos-y-fondos';

// La ruta solo monta el formulario: el asistente de H1.8 lo reutiliza.
export default function ConfigurarPresupuestosYFondos() {
  return <FormularioPresupuestosYFondos onGuardado={() => router.back()} />;
}
