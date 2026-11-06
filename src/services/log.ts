import { File, Paths } from 'expo-file-system';

/**
 * Registro local de diagnóstico (AD-23). Buffer rotativo de las últimas 500
 * entradas, persistido en un archivo del dispositivo.
 *
 * Cada entrada lleva solo ids, operación y error: nunca montos, comercios,
 * fotos ni secretos. Por eso el API no tiene un campo libre (`datos`,
 * `mensaje`, `extra`), y el mensaje del error se sanea antes de guardarlo.
 */

export type NivelLog = 'info' | 'aviso' | 'error';

export type ErrorSaneado = { nombre: string; mensaje: string; pila?: string };

export type EntradaLog = {
  fecha: string;
  nivel: NivelLog;
  /** Forma `capa.accion`, p. ej. 'migraciones.aplicar'. */
  operacion: string;
  ids?: Record<string, string>;
  error?: ErrorSaneado;
};

export type DetalleLog = { ids?: Record<string, string>; error?: unknown };

export type AlmacenLog = { leer(): string | null; escribir(contenido: string): void };

export type Log = {
  info(operacion: string, detalle?: DetalleLog): void;
  aviso(operacion: string, detalle?: DetalleLog): void;
  error(operacion: string, detalle?: DetalleLog): void;
  /** Copia de las entradas, de la más antigua a la más reciente (H7.1). */
  entradas(): EntradaLog[];
};

const MAX_MENSAJE = 300;
const MAX_NOMBRE = 60;
const MAX_LINEAS_PILA = 10;
// Defensa extra por si un mensaje trae un monto: 1.350.000, 1,350,000,
// 1 350 000 (espacio, NBSP o NNBSP, como lo agrupa Intl) o 25000.
const CIFRAS = /\d{1,3}(?:[., \u00A0\u202F]\d{3})+|\d{4,}/g;
// Los errores de consulta de Drizzle terminan en "params: <valores>", con
// montos y comercios en claro: se corta desde ahí hasta el final.
const PARAMETROS = /params:[\s\S]*$/;
// Una consulta con valores escritos en el SQL (sql.raw) los trae entre comillas.
const CONSULTA_FALLIDA = 'Failed query:';
const LITERALES_SQL = /'(?:[^']|'')*'/g;
// Líneas de la pila que son ubicaciones de código: "at f (archivo:1:2)",
// "at archivo:1:2" o "at f (native)".
const LINEA_DE_CODIGO = /^\s*at\s.*(?::\d+:\d+\)?|\(native\))$/;

function sanearTexto(texto: string): string {
  const sinParametros = texto.replace(PARAMETROS, 'params: [omitidos]');
  const sinLiterales = sinParametros.includes(CONSULTA_FALLIDA)
    ? sinParametros.replace(LITERALES_SQL, "'[texto]'")
    : sinParametros;
  return sinLiterales.replace(CIFRAS, '[n]');
}

/**
 * Solo las ubicaciones de código de la pila. El mensaje saneado ya va en
 * `mensaje`: el comienzo de la pila, que lo repite, se quita entero (puede
 * tener varias líneas, y alguna parecer una ubicación).
 */
function sanearPila(error: Error): string | undefined {
  if (typeof error.stack !== 'string') return undefined;
  const cabecera = error.message ? `${error.name}: ${error.message}` : error.name;
  const resto = error.stack.startsWith(cabecera) ? error.stack.slice(cabecera.length) : error.stack;
  const ubicaciones = resto
    .split('\n')
    .filter((linea) => LINEA_DE_CODIGO.test(linea))
    .slice(0, MAX_LINEAS_PILA)
    .map((linea) => linea.slice(0, MAX_MENSAJE));
  return ubicaciones.length > 0 ? ubicaciones.join('\n') : undefined;
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string';
}

/**
 * Entrada leída del archivo, reconstruida solo con las claves conocidas: un
 * archivo viejo o editado a mano no cuela campos extra (p. ej. un monto).
 * Devuelve null si le falta lo básico.
 */
function normalizarEntrada(valor: unknown): EntradaLog | null {
  if (typeof valor !== 'object' || valor === null) return null;
  const { fecha, nivel, operacion, ids, error } = valor as Record<string, unknown>;
  if (!esTexto(fecha) || !esTexto(operacion)) return null;
  if (nivel !== 'info' && nivel !== 'aviso' && nivel !== 'error') return null;

  const entrada: EntradaLog = { fecha, nivel, operacion };
  if (typeof ids === 'object' && ids !== null && Object.values(ids).every(esTexto)) {
    entrada.ids = { ...(ids as Record<string, string>) };
  }
  if (typeof error === 'object' && error !== null) {
    const { nombre, mensaje, pila } = error as Record<string, unknown>;
    if (esTexto(nombre) && esTexto(mensaje)) {
      entrada.error = { nombre, mensaje };
      if (esTexto(pila)) entrada.error.pila = pila;
    }
  }
  return entrada;
}

function sanearError(error: unknown): ErrorSaneado {
  if (!(error instanceof Error)) {
    // No se serializa el valor: podría ser un objeto con montos.
    return { nombre: 'NoEsError', mensaje: typeof error };
  }
  const saneado: ErrorSaneado = {
    nombre: sanearTexto(String(error.name || 'NoEsError')).slice(0, MAX_NOMBRE),
    // Primero se sanea y luego se trunca, para no dejar medio monto.
    mensaje: sanearTexto(String(error.message)).slice(0, MAX_MENSAJE),
  };
  // Las ubicaciones de código se dejan intactas: línea y columna sirven.
  const pila = sanearPila(error);
  if (pila !== undefined) saneado.pila = pila;
  return saneado;
}

export function crearLog({
  almacen,
  ahora,
  capacidad = 500,
}: {
  almacen: AlmacenLog;
  /** ISO 8601 UTC (AD-8). */
  ahora: () => string;
  capacidad?: number;
}): Log {
  let buffer: EntradaLog[] | null = null;

  function agregar(entrada: EntradaLog): void {
    const actual = cargar();
    actual.push(entrada);
    if (actual.length > capacidad) actual.splice(0, actual.length - capacidad);
  }

  function cargar(): EntradaLog[] {
    if (buffer) return buffer;
    buffer = [];
    let ilegible = false;
    try {
      const contenido = almacen.leer();
      // Vacío equivale a no existir: un cierre entre create() y write() lo deja así.
      if (contenido !== null && contenido.trim() !== '') {
        const leido: unknown = JSON.parse(contenido);
        if (Array.isArray(leido)) {
          const validas = leido.map(normalizarEntrada).filter((e): e is EntradaLog => e !== null);
          // Si se descartó algo, queda el aviso para que se note.
          ilegible = validas.length !== leido.length;
          buffer = validas.slice(-capacidad);
        } else {
          ilegible = true;
        }
      }
    } catch {
      ilegible = true;
    }
    if (ilegible) agregar({ fecha: ahora(), nivel: 'aviso', operacion: 'log.archivoIlegible' });
    return buffer;
  }

  function persistir(): void {
    try {
      almacen.escribir(JSON.stringify(buffer));
    } catch {
      // El log nunca lanza. No hay a dónde registrar este fallo (console está
      // prohibido), así que se ignora en silencio.
    }
  }

  function registrar(nivel: NivelLog, operacion: string, detalle?: DetalleLog): void {
    try {
      const entrada: EntradaLog = { fecha: ahora(), nivel, operacion };
      if (detalle?.ids) entrada.ids = { ...detalle.ids };
      if (detalle && 'error' in detalle) entrada.error = sanearError(detalle.error);
      agregar(entrada);
      persistir();
    } catch {
      // El log nunca lanza.
    }
  }

  return {
    info: (operacion, detalle) => registrar('info', operacion, detalle),
    aviso: (operacion, detalle) => registrar('aviso', operacion, detalle),
    error: (operacion, detalle) => registrar('error', operacion, detalle),
    entradas: () => {
      try {
        return [...cargar()];
      } catch {
        return [];
      }
    },
  };
}

const NOMBRE_ARCHIVO = 'moneytrack-log.json';

// El File se crea dentro de las funciones, no al importar el módulo: así
// importar `log` en Jest no toca el módulo nativo, y un fallo al resolver la
// ruta no tumba la app antes de montar el layout. Paths.document y no
// Paths.cache: el sistema puede vaciar la caché.
const almacenEnArchivo: AlmacenLog = {
  leer() {
    const archivo = new File(Paths.document, NOMBRE_ARCHIVO);
    return archivo.exists ? archivo.textSync() : null;
  },
  escribir(contenido) {
    const archivo = new File(Paths.document, NOMBRE_ARCHIVO);
    if (!archivo.exists) archivo.create();
    archivo.write(contenido);
  },
};

export const log: Log = crearLog({ almacen: almacenEnArchivo, ahora: () => new Date().toISOString() });

type UtilidadesDeErrores = Pick<typeof ErrorUtils, 'getGlobalHandler' | 'setGlobalHandler'>;

let registroGlobalInstalado = false;

/**
 * Registra los errores no controlados fuera del render (manejadores de
 * eventos, timers), que el ErrorBoundary no captura. Envuelve el manejador
 * global sin reemplazarlo: en desarrollo sigue la pantalla roja. Idempotente.
 */
export function instalarRegistroDeErroresGlobales({
  registro = log,
  utilidades = ErrorUtils,
}: { registro?: Log; utilidades?: UtilidadesDeErrores } = {}): void {
  if (registroGlobalInstalado) return;
  registroGlobalInstalado = true;
  const anterior = utilidades.getGlobalHandler();
  utilidades.setGlobalHandler((error, esFatal) => {
    registro.error(esFatal ? 'app.errorFatal' : 'app.errorNoControlado', { error });
    anterior(error, esFatal);
  });
}
