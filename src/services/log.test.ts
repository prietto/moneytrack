/** @jest-environment node */
import { crearLog, type EntradaLog } from './log';

const FECHA = '2026-11-05T12:00:00.000Z';

function almacenEnMemoria(inicial: string | null = null) {
  let contenido = inicial;
  return {
    leer: jest.fn(() => contenido),
    escribir: jest.fn((nuevo: string) => {
      contenido = nuevo;
    }),
    contenido: () => contenido,
  };
}

function entradaPrevia(operacion: string): EntradaLog {
  return { fecha: FECHA, nivel: 'info', operacion };
}

describe('crearLog', () => {
  it('registra los tres niveles con fecha, operación e ids', () => {
    const log = crearLog({ almacen: almacenEnMemoria(), ahora: () => FECHA });
    log.info('app.iniciar');
    log.aviso('biometria.cancelado', { ids: { intento: 'a1' } });
    log.error('migraciones.aplicar', { error: new TypeError('falló') });

    const entradas = log.entradas();
    expect(entradas.map((e) => [e.nivel, e.operacion])).toEqual([
      ['info', 'app.iniciar'],
      ['aviso', 'biometria.cancelado'],
      ['error', 'migraciones.aplicar'],
    ]);
    expect(entradas[0]).toEqual({ fecha: FECHA, nivel: 'info', operacion: 'app.iniciar' });
    expect(entradas[1].ids).toEqual({ intento: 'a1' });
    expect(entradas[2].error).toMatchObject({ nombre: 'TypeError', mensaje: 'falló' });
  });

  it('con 501 entradas conserva las 500 más recientes, de la más antigua a la más reciente', () => {
    const log = crearLog({ almacen: almacenEnMemoria(), ahora: () => FECHA });
    for (let i = 0; i < 501; i++) log.info(`prueba.e${i}`);

    const entradas = log.entradas();
    expect(entradas).toHaveLength(500);
    expect(entradas[0].operacion).toBe('prueba.e1');
    expect(entradas[499].operacion).toBe('prueba.e500');
  });

  it('respeta una capacidad distinta', () => {
    const log = crearLog({ almacen: almacenEnMemoria(), ahora: () => FECHA, capacidad: 2 });
    log.info('prueba.a');
    log.info('prueba.b');
    log.info('prueba.c');
    expect(log.entradas().map((e) => e.operacion)).toEqual(['prueba.b', 'prueba.c']);
  });

  it('entradas() devuelve una copia', () => {
    const log = crearLog({ almacen: almacenEnMemoria(), ahora: () => FECHA });
    log.info('prueba.a');
    const copia = log.entradas();
    copia.pop();
    expect(log.entradas()).toHaveLength(1);
  });

  it('persiste tras cada entrada', () => {
    const almacen = almacenEnMemoria();
    const log = crearLog({ almacen, ahora: () => FECHA });
    log.info('prueba.a');
    expect(almacen.escribir).toHaveBeenCalledTimes(1);
    log.aviso('prueba.b');
    expect(almacen.escribir).toHaveBeenCalledTimes(2);
    expect(JSON.parse(almacen.contenido()!)).toEqual(log.entradas());
  });

  it('carga de forma perezosa lo que ya había en el almacén', () => {
    const almacen = almacenEnMemoria(JSON.stringify([entradaPrevia('prueba.vieja')]));
    const log = crearLog({ almacen, ahora: () => FECHA });
    expect(almacen.leer).not.toHaveBeenCalled();

    log.info('prueba.nueva');
    expect(almacen.leer).toHaveBeenCalledTimes(1);
    expect(log.entradas().map((e) => e.operacion)).toEqual(['prueba.vieja', 'prueba.nueva']);
    log.info('prueba.otra');
    expect(almacen.leer).toHaveBeenCalledTimes(1);
  });

  it('al cargar se queda con las últimas `capacidad` entradas', () => {
    const previas = ['prueba.a', 'prueba.b', 'prueba.c'].map(entradaPrevia);
    const log = crearLog({ almacen: almacenEnMemoria(JSON.stringify(previas)), ahora: () => FECHA, capacidad: 2 });
    expect(log.entradas().map((e) => e.operacion)).toEqual(['prueba.b', 'prueba.c']);
  });

  it('sin archivo empieza vacío', () => {
    const log = crearLog({ almacen: almacenEnMemoria(null), ahora: () => FECHA });
    expect(log.entradas()).toEqual([]);
  });

  it.each([[''], ['  \n']])('con un archivo vacío (%j) empieza vacío y sin aviso', (contenido) => {
    const log = crearLog({ almacen: almacenEnMemoria(contenido), ahora: () => FECHA });
    expect(log.entradas()).toEqual([]);
  });

  it('al cargar se queda solo con las claves conocidas y descarta ids o error con mala forma', () => {
    const contenido = JSON.stringify([
      { ...entradaPrevia('prueba.extra'), monto: 950, ids: { gasto: 'g1' }, error: { nombre: 'E', mensaje: 'm' } },
      { ...entradaPrevia('prueba.mala'), ids: { gasto: 5 }, error: 'texto con 1.350.000' },
    ]);
    const log = crearLog({ almacen: almacenEnMemoria(contenido), ahora: () => FECHA });
    expect(log.entradas()).toEqual([
      { ...entradaPrevia('prueba.extra'), ids: { gasto: 'g1' }, error: { nombre: 'E', mensaje: 'm' } },
      entradaPrevia('prueba.mala'),
    ]);
  });

  it('al cargar descarta las entradas que no tienen forma de entrada y deja un aviso', () => {
    const contenido = JSON.stringify([null, 5, { operacion: 'sin.fecha' }, entradaPrevia('prueba.buena')]);
    const log = crearLog({ almacen: almacenEnMemoria(contenido), ahora: () => FECHA });
    expect(log.entradas().map((e) => e.operacion)).toEqual(['prueba.buena', 'log.archivoIlegible']);
  });

  it.each([['{no es json'], [JSON.stringify({ no: 'es un array' })]])(
    'con un archivo ilegible (%s) empieza vacío y deja un aviso',
    (contenido) => {
      const log = crearLog({ almacen: almacenEnMemoria(contenido), ahora: () => FECHA });
      expect(log.entradas()).toEqual([{ fecha: FECHA, nivel: 'aviso', operacion: 'log.archivoIlegible' }]);
    },
  );

  it('nunca lanza, aunque el almacén falle al leer o al escribir', () => {
    const log = crearLog({
      almacen: {
        leer: () => {
          throw new Error('sin permiso');
        },
        escribir: () => {
          throw new Error('disco lleno');
        },
      },
      ahora: () => FECHA,
    });
    expect(() => log.error('prueba.algo', { error: new Error('x') })).not.toThrow();
    expect(log.entradas().map((e) => e.operacion)).toContain('prueba.algo');
  });

  describe('saneo del error', () => {
    function registrar(error: unknown) {
      const log = crearLog({ almacen: almacenEnMemoria(), ahora: () => FECHA });
      log.error('prueba.saneo', { error });
      return log.entradas()[0].error!;
    }

    it('tapa las cifras del mensaje, y la pila no repite el mensaje', () => {
      const error = new Error('no cupo el gasto de 1.350.000 ni 25000 en 2026');
      error.stack = `Error: ${error.message}\n    at algo (archivo.js:10:5)`;
      const saneado = registrar(error);
      expect(saneado.mensaje).toBe('no cupo el gasto de [n] ni [n] en [n]');
      expect(saneado.pila).toBe('    at algo (archivo.js:10:5)');
      expect(JSON.stringify(saneado)).not.toContain('1.350.000');
    });

    it('deja intactas las ubicaciones de código de la pila', () => {
      const error = new Error('x');
      error.stack = 'Error: x\n    at f (address at index.android.bundle:1:234567)\n    at g (native)';
      expect(registrar(error).pila).toBe('    at f (address at index.android.bundle:1:234567)\n    at g (native)');
    });

    it('si la pila no empieza con el mensaje, igual deja solo las ubicaciones', () => {
      const error = new Error('x');
      error.stack = 'Otra cabecera con 1.350.000\n    at f (a.js:1:2)';
      expect(registrar(error).pila).toBe('    at f (a.js:1:2)');
    });

    it('sin ubicaciones de código no guarda pila', () => {
      const error = new Error('x');
      error.stack = 'Error: x';
      expect(registrar(error).pila).toBeUndefined();
    });

    it('trunca el mensaje a 300 caracteres', () => {
      expect(registrar(new Error('a'.repeat(1000))).mensaje).toHaveLength(300);
    });

    it('deja solo las primeras 10 líneas de la pila', () => {
      const error = new Error('x');
      error.stack = Array.from({ length: 30 }, (_, i) => `    at f${i} (a.js:1:2)`).join('\n');
      expect(registrar(error).pila!.split('\n')).toHaveLength(10);
    });

    it('tapa las cifras agrupadas con espacio, NBSP o NNBSP', () => {
      expect(registrar(new Error('monto 1 350 000, 1\u00A0350\u00A0000 y 1\u202F350\u202F000')).mensaje).toBe(
        'monto [n], [n] y [n]',
      );
    });

    it('omite los params de un error de consulta de Drizzle, en el mensaje y en la pila', () => {
      const error = new Error('Failed query: insert into "gastos" values (?, ?)\nparams: 950,Tienda Éxito');
      error.stack = `Error: ${error.message}\n    at f (index.android.bundle:1:234)`;
      const saneado = registrar(error);
      expect(saneado.mensaje).toBe('Failed query: insert into "gastos" values (?, ?)\nparams: [omitidos]');
      expect(saneado.pila).toBe('    at f (index.android.bundle:1:234)');
      expect(JSON.stringify(saneado)).not.toMatch(/950|Tienda/);
    });

    it('un valor con salto de línea y "at " no corta antes el saneo de params', () => {
      const error = new Error('Failed query: insert into "gastos" values (?)\nparams: Pagado\n at Tienda Éxito:1:2');
      error.stack = `Error: ${error.message}\n    at f (a.js:1:2)`;
      const saneado = registrar(error);
      expect(saneado.mensaje).toBe('Failed query: insert into "gastos" values (?)\nparams: [omitidos]');
      expect(saneado.pila).toBe('    at f (a.js:1:2)');
      expect(JSON.stringify(saneado)).not.toContain('Tienda');
    });

    it('tapa los literales de texto de una consulta fallida', () => {
      const error = new Error("Failed query: select * from gastos where comercio = 'Tienda O''Brien'");
      expect(registrar(error).mensaje).toBe("Failed query: select * from gastos where comercio = '[texto]'");
    });

    it('fuera de una consulta fallida no toca el texto entre comillas', () => {
      expect(registrar(new Error("no existe la tabla 'gastos'")).mensaje).toBe("no existe la tabla 'gastos'");
    });

    it('las líneas del mensaje con forma de ubicación no pasan a la pila', () => {
      const error = new Error('saldo\n  at Calle 1350000:1:2');
      error.stack = `Error: ${error.message}\n    at f (native)\n    at g (a.js:1:2)`;
      expect(registrar(error).pila).toBe('    at f (native)\n    at g (a.js:1:2)');
    });

    it('un mensaje largo de varias líneas no desplaza las ubicaciones', () => {
      const error = new Error(Array.from({ length: 20 }, (_, i) => `línea ${i}`).join('\n'));
      error.stack = `Error: ${error.message}\n    at f (a.js:1:2)`;
      expect(registrar(error).pila).toBe('    at f (a.js:1:2)');
    });

    it('trunca también las líneas de ubicación de la pila', () => {
      const error = new Error('x');
      error.stack = `Error: x\n    at f (${'a'.repeat(1000)}.js:1:2)`;
      expect(registrar(error).pila).toHaveLength(300);
    });

    it('sanea y trunca el nombre del error, y sin nombre usa NoEsError', () => {
      const conCifras = new Error('x');
      conCifras.name = `Saldo1350000${'a'.repeat(100)}`;
      const nombre = registrar(conCifras).nombre;
      expect(nombre).not.toContain('1350000');
      expect(nombre).toHaveLength(60);

      const sinNombre = new Error('x');
      sinNombre.name = '';
      expect(registrar(sinNombre).nombre).toBe('NoEsError');
    });

    it('no serializa un valor que no es Error', () => {
      expect(registrar({ monto: 1350000, comercio: 'Tienda' })).toEqual({ nombre: 'NoEsError', mensaje: 'object' });
      expect(registrar('texto con 1.350.000')).toEqual({ nombre: 'NoEsError', mensaje: 'string' });
    });
  });
});

describe('instalarRegistroDeErroresGlobales', () => {
  function cargarAislado() {
    let modulo!: typeof import('./log');
    jest.isolateModules(() => {
      modulo = jest.requireActual<typeof import('./log')>('./log');
    });
    return modulo;
  }

  function utilidadesFalsas() {
    const anterior = jest.fn();
    let actual: (error: unknown, esFatal?: boolean) => void = anterior;
    return {
      anterior,
      utilidades: {
        getGlobalHandler: () => actual,
        setGlobalHandler: jest.fn((fn: typeof actual) => {
          actual = fn;
        }),
      },
      disparar: (error: unknown, esFatal?: boolean) => actual(error, esFatal),
    };
  }

  it('registra el error y encadena al manejador anterior', () => {
    const { instalarRegistroDeErroresGlobales, crearLog: crear } = cargarAislado();
    const registro = crear({ almacen: almacenEnMemoria(), ahora: () => FECHA });
    const { anterior, utilidades, disparar } = utilidadesFalsas();

    instalarRegistroDeErroresGlobales({ registro, utilidades });
    const error = new Error('boom');
    disparar(error, true);
    disparar(new Error('otro'), false);

    expect(registro.entradas().map((e) => [e.nivel, e.operacion])).toEqual([
      ['error', 'app.errorFatal'],
      ['error', 'app.errorNoControlado'],
    ]);
    expect(anterior).toHaveBeenCalledWith(error, true);
    expect(anterior).toHaveBeenCalledTimes(2);
  });

  it('es idempotente', () => {
    const { instalarRegistroDeErroresGlobales, crearLog: crear } = cargarAislado();
    const registro = crear({ almacen: almacenEnMemoria(), ahora: () => FECHA });
    const { anterior, utilidades, disparar } = utilidadesFalsas();

    instalarRegistroDeErroresGlobales({ registro, utilidades });
    instalarRegistroDeErroresGlobales({ registro, utilidades });
    disparar(new Error('boom'), false);

    expect(utilidades.setGlobalHandler).toHaveBeenCalledTimes(1);
    expect(registro.entradas()).toHaveLength(1);
    expect(anterior).toHaveBeenCalledTimes(1);
  });
});
