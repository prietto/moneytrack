import { useEffect, useRef, useState } from 'react';

/**
 * Guardado diferido un tick de los formularios de configuración. `ejecutar`
 * es síncrono: se difiere para que se vea "Guardando…" y el botón
 * deshabilitado antes de escribir.
 *
 * - El candado es una ref, no el estado: dos toques en el mismo frame ven el
 *   mismo `guardando` viejo, pero no la misma ref (sin doble envío).
 * - Si el formulario se desmonta antes del tick, el guardado se cancela: no
 *   se escribe nada ni se navega de más.
 */
export function useGuardadoDiferido() {
  const [guardando, setGuardando] = useState(false);
  const enCurso = useRef(false);
  const pendiente = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pendiente.current !== null) clearTimeout(pendiente.current);
    },
    [],
  );

  return {
    guardando,
    /** `true` mientras hay un guardado en curso: el formulario no debe validar ni guardar. */
    ocupado: () => enCurso.current,
    /** Corre `accion` en el próximo tick, salvo que ya haya uno en curso o el formulario se desmonte. */
    diferir(accion: () => void) {
      if (enCurso.current) return;
      enCurso.current = true;
      setGuardando(true);
      pendiente.current = setTimeout(() => {
        pendiente.current = null;
        enCurso.current = false;
        setGuardando(false);
        accion();
      }, 0);
    },
  };
}
