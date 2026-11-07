import { router } from 'expo-router';

import { FormularioSaldoYColchon } from '@/components/configuracion/formulario-saldo-y-colchon';

// La ruta solo monta el formulario: el asistente de H1.8 lo reutiliza.
export default function ConfigurarSaldoYColchon() {
  return <FormularioSaldoYColchon onGuardado={() => router.back()} />;
}
