import {
  ANTIGUEDAD_MAXIMA_SALDO_DIAS,
  type DatosObligacionAnual,
  erroresObligacionAnual,
  erroresObligacionMensual,
  erroresPago,
  erroresSaldoYColchon,
  erroresVehiculo,
  LEJANIA_MAXIMA_VENCIMIENTO_DIAS,
  leerDia,
  leerMonto,
  mismoNombre,
  NOMBRE_MAXIMO,
  normalizarNombre,
  validarObligacionAnual,
  validarObligacionMensual,
  validarPago,
  validarSaldoYColchon,
  validarVehiculo,
} from './entrada';

const HOY = '2026-11-05';

describe('leerMonto', () => {
  it.each([
    ['2.000.000', 2_000_000],
    ['2000000', 2_000_000],
    [' 2 000 000 ', 2_000_000],
    ['0', 0],
    ['999', 999],
    ['1.000', 1000],
    ['007', 7],
    ['9007199254740991', Number.MAX_SAFE_INTEGER],
    ['9.007.199.254.740.991', Number.MAX_SAFE_INTEGER],
  ])('%p → %p', (texto, esperado) => {
    expect(leerMonto(texto)).toBe(esperado);
  });

  it.each(['', '   ', 'abc', '12a', '1,5', '1.5', '2.00.000', '2..000', '.000', '1.000.', '-5', '+5', '1e6', '9007199254740992'])(
    '%p → null',
    (texto) => {
      expect(leerMonto(texto)).toBeNull();
    },
  );
});

describe('leerDia', () => {
  it.each([
    ['1', 1],
    ['10', 10],
    [' 31 ', 31],
    ['05', 5],
  ])('%p → %p', (texto, esperado) => {
    expect(leerDia(texto)).toBe(esperado);
  });

  it.each(['', '0', '32', '1,5', '1.5', '-1', 'x', '100'])('%p → null', (texto) => {
    expect(leerDia(texto)).toBeNull();
  });
});

describe('validarPago', () => {
  it('acepta un Pago válido', () => {
    expect(validarPago({ dia: 10, montoEsperado: 2_000_000 })).toEqual({
      ok: true,
      valor: { dia: 10, montoEsperado: 2_000_000 },
    });
  });

  it.each([
    [{ dia: 1, montoEsperado: 1 }],
    [{ dia: 31, montoEsperado: Number.MAX_SAFE_INTEGER }],
  ])('acepta los bordes %p', (datos) => {
    expect(validarPago(datos).ok).toBe(true);
  });

  it.each([
    [{ dia: 0, montoEsperado: 1 }, 'diaInvalido'],
    [{ dia: 32, montoEsperado: 1 }, 'diaInvalido'],
    [{ dia: 1.5, montoEsperado: 1 }, 'diaInvalido'],
    [{ dia: null, montoEsperado: 1 }, 'diaInvalido'],
    [{ dia: 10, montoEsperado: 0 }, 'montoInvalido'],
    [{ dia: 10, montoEsperado: -5 }, 'montoInvalido'],
    [{ dia: 10, montoEsperado: 1.5 }, 'montoInvalido'],
    [{ dia: 10, montoEsperado: Number.MAX_SAFE_INTEGER + 1 }, 'montoInvalido'],
    [{ dia: 10, montoEsperado: null }, 'montoInvalido'],
    [{ dia: 0, montoEsperado: 0 }, 'diaInvalido'],
  ])('%p → %p', (datos, error) => {
    expect(validarPago(datos)).toEqual({ ok: false, error });
  });

  it('erroresPago marca cada campo con su error', () => {
    expect(erroresPago({ dia: 0, montoEsperado: 0 })).toEqual({ dia: 'diaInvalido', montoEsperado: 'montoInvalido' });
    expect(erroresPago({ dia: 10, montoEsperado: 1 })).toEqual({});
  });
});

describe('validarSaldoYColchon', () => {
  it('acepta datos válidos', () => {
    expect(validarSaldoYColchon({ monto: 10_000_000, fecha: '2026-11-03', colchon: 4_000_000 }, HOY)).toEqual({
      ok: true,
      valor: { monto: 10_000_000, fecha: '2026-11-03', colchon: 4_000_000 },
    });
  });

  it.each([
    [{ monto: 0, fecha: HOY, colchon: 0 }],
    [{ monto: Number.MAX_SAFE_INTEGER, fecha: HOY, colchon: Number.MAX_SAFE_INTEGER }],
  ])('acepta los bordes (saldo y Colchón 0, fecha igual a hoy, máximo seguro) %p', (datos) => {
    expect(validarSaldoYColchon(datos, HOY).ok).toBe(true);
  });

  it.each([
    [{ monto: -1, fecha: HOY, colchon: 0 }, 'montoInvalido'],
    [{ monto: 1.5, fecha: HOY, colchon: 0 }, 'montoInvalido'],
    [{ monto: null, fecha: HOY, colchon: 0 }, 'montoInvalido'],
    [{ monto: Number.MAX_SAFE_INTEGER + 1, fecha: HOY, colchon: 0 }, 'montoInvalido'],
    [{ monto: 1, fecha: '', colchon: 0 }, 'fechaInvalida'],
    [{ monto: 1, fecha: '2026-02-30', colchon: 0 }, 'fechaInvalida'],
    [{ monto: 1, fecha: '05/11/2026', colchon: 0 }, 'fechaInvalida'],
    [{ monto: 1, fecha: '2026-11-06', colchon: 0 }, 'fechaFutura'],
    [{ monto: 1, fecha: '2026-09-03', colchon: 0 }, 'fechaAntigua'],
    [{ monto: 1, fecha: '2016-11-05', colchon: 0 }, 'fechaAntigua'],
    [{ monto: 1, fecha: HOY, colchon: -1 }, 'colchonInvalido'],
    [{ monto: 1, fecha: HOY, colchon: null }, 'colchonInvalido'],
    [{ monto: 1, fecha: HOY, colchon: 0.5 }, 'colchonInvalido'],
  ])('%p → %p', (datos, error) => {
    expect(validarSaldoYColchon(datos, HOY)).toEqual({ ok: false, error });
  });

  it('erroresSaldoYColchon marca cada campo con su error', () => {
    expect(erroresSaldoYColchon({ monto: null, fecha: '2026-11-06', colchon: null }, HOY)).toEqual({
      monto: 'montoInvalido',
      fecha: 'fechaFutura',
      colchon: 'colchonInvalido',
    });
  });

  it('acepta una fecha nueva de hasta ANTIGUEDAD_MAXIMA_SALDO_DIAS días atrás, inclusive', () => {
    expect(ANTIGUEDAD_MAXIMA_SALDO_DIAS).toBe(62);
    expect(validarSaldoYColchon({ monto: 1, fecha: '2026-09-04', colchon: 0 }, HOY).ok).toBe(true);
  });

  it('acepta la fecha guardada aunque ya sea antigua (editar solo el Colchón)', () => {
    expect(validarSaldoYColchon({ monto: 1, fecha: '2026-01-15', colchon: 0 }, HOY, '2026-01-15').ok).toBe(true);
    expect(validarSaldoYColchon({ monto: 1, fecha: '2026-01-14', colchon: 0 }, HOY, '2026-01-15')).toEqual({
      ok: false,
      error: 'fechaAntigua',
    });
  });
});

describe('nombres', () => {
  it('normalizarNombre quita extremos y colapsa espacios internos', () => {
    expect(normalizarNombre('  Moto   azul \t')).toBe('Moto azul');
    expect(normalizarNombre('   ')).toBe('');
  });

  it('mismoNombre ignora mayúsculas y espacios', () => {
    expect(mismoNombre('  Moto  azul ', 'moto azul')).toBe(true);
    expect(mismoNombre('Moto azul', 'Moto roja')).toBe(false);
  });
});

describe('validarVehiculo', () => {
  const existentes = [
    { id: 'v1', nombre: 'Moto azul' },
    { id: 'v2', nombre: 'Carro' },
  ];
  const cuarenta = 'a'.repeat(NOMBRE_MAXIMO);

  it('acepta un nombre nuevo y lo devuelve normalizado', () => {
    expect(validarVehiculo({ nombre: '  Moto   roja ' }, existentes, null)).toEqual({
      ok: true,
      valor: { nombre: 'Moto roja' },
    });
  });

  it.each([
    [cuarenta, null],
    [`  ${cuarenta}  `, null],
    ['Moto azul', 'v1'],
    ['MOTO AZUL', 'v1'],
  ])('acepta %p (idPropio %p)', (nombre, idPropio) => {
    expect(validarVehiculo({ nombre }, existentes, idPropio).ok).toBe(true);
  });

  it.each([
    ['', null, 'nombreVacio'],
    ['   ', null, 'nombreVacio'],
    [`${cuarenta}a`, null, 'nombreLargo'],
    ['  Moto  azul ', null, 'nombreRepetido'],
    ['carro', 'v1', 'nombreRepetido'],
  ])('%p (idPropio %p) → %p', (nombre, idPropio, error) => {
    expect(validarVehiculo({ nombre }, existentes, idPropio)).toEqual({ ok: false, error });
    expect(erroresVehiculo({ nombre }, existentes, idPropio)).toEqual({ nombre: error });
  });

  it('un Vehículo borrado no cuenta: solo se comparan los existentes que se pasan', () => {
    expect(validarVehiculo({ nombre: 'Moto azul' }, [], null).ok).toBe(true);
  });
});

describe('validarObligacionMensual', () => {
  it('acepta datos válidos y normaliza el nombre', () => {
    expect(validarObligacionMensual({ nombre: ' Arriendo ', monto: 1_500_000, dia: 1 })).toEqual({
      ok: true,
      valor: { nombre: 'Arriendo', monto: 1_500_000, dia: 1 },
    });
  });

  it.each([
    [{ nombre: 'a'.repeat(40), monto: 1, dia: 31 }],
    [{ nombre: 'x', monto: Number.MAX_SAFE_INTEGER, dia: 1 }],
  ])('acepta los bordes %p', (datos) => {
    expect(validarObligacionMensual(datos).ok).toBe(true);
  });

  it.each([
    [{ nombre: '', monto: 1, dia: 1 }, 'nombreVacio'],
    [{ nombre: 'a'.repeat(41), monto: 1, dia: 1 }, 'nombreLargo'],
    [{ nombre: 'x', monto: 0, dia: 1 }, 'montoInvalido'],
    [{ nombre: 'x', monto: -1, dia: 1 }, 'montoInvalido'],
    [{ nombre: 'x', monto: 1.5, dia: 1 }, 'montoInvalido'],
    [{ nombre: 'x', monto: null, dia: 1 }, 'montoInvalido'],
    [{ nombre: 'x', monto: 1, dia: 0 }, 'diaInvalido'],
    [{ nombre: 'x', monto: 1, dia: 32 }, 'diaInvalido'],
    [{ nombre: 'x', monto: 1, dia: null }, 'diaInvalido'],
  ])('%p → %p', (datos, error) => {
    expect(validarObligacionMensual(datos)).toEqual({ ok: false, error });
  });

  it('erroresObligacionMensual marca cada campo con su error', () => {
    expect(erroresObligacionMensual({ nombre: ' ', monto: 0, dia: 0 })).toEqual({
      nombre: 'nombreVacio',
      monto: 'montoInvalido',
      dia: 'diaInvalido',
    });
  });
});

describe('validarObligacionAnual', () => {
  const vehiculos = [{ id: 'v1' }];
  const base: DatosObligacionAnual = {
    nombre: ' SOAT ',
    monto: 1_800_000,
    fechaVencimiento: '2027-03-15',
    vehiculoId: 'v1',
    reservaMonto: 400_000,
    reservaFecha: HOY,
  };
  const con = (cambios: Partial<DatosObligacionAnual>): DatosObligacionAnual => ({ ...base, ...cambios });

  it('acepta datos válidos y arma la reserva inicial', () => {
    expect(validarObligacionAnual(base, HOY, null, vehiculos)).toEqual({
      ok: true,
      valor: {
        nombre: 'SOAT',
        monto: 1_800_000,
        fechaVencimiento: '2027-03-15',
        vehiculoId: 'v1',
        reservaInicial: { monto: 400_000, fecha: HOY },
      },
    });
  });

  it('los límites de fecha son 62 días atrás y 366 adelante', () => {
    expect(ANTIGUEDAD_MAXIMA_SALDO_DIAS).toBe(62);
    expect(LEJANIA_MAXIMA_VENCIMIENTO_DIAS).toBe(366);
  });

  it.each([
    ['sin Vehículo', con({ vehiculoId: null })],
    ['reserva 0', con({ reservaMonto: 0 })],
    ['reserva igual al monto', con({ reservaMonto: 1_800_000 })],
    ['vencimiento en hoy − 62', con({ fechaVencimiento: '2026-09-04' })],
    ['vencimiento en hoy + 366', con({ fechaVencimiento: '2027-11-06' })],
    ['reserva en hoy − 62', con({ reservaFecha: '2026-09-04' })],
    ['nombre de 40', con({ nombre: 'a'.repeat(40) })],
  ])('acepta %s', (_, datos) => {
    expect(validarObligacionAnual(datos, HOY, null, vehiculos).ok).toBe(true);
  });

  it.each([
    [con({ nombre: '' }), 'nombreVacio'],
    [con({ nombre: 'a'.repeat(41) }), 'nombreLargo'],
    [con({ monto: 0 }), 'montoInvalido'],
    [con({ monto: null }), 'montoInvalido'],
    [con({ fechaVencimiento: '2027-02-30' }), 'fechaInvalida'],
    [con({ fechaVencimiento: '' }), 'fechaInvalida'],
    [con({ fechaVencimiento: '2026-09-03' }), 'fechaAntigua'],
    [con({ fechaVencimiento: '2027-11-07' }), 'fechaLejana'],
    [con({ vehiculoId: 'borrado' }), 'vehiculoInvalido'],
    [con({ reservaMonto: -1 }), 'reservaInvalida'],
    [con({ reservaMonto: null }), 'reservaInvalida'],
    [con({ reservaMonto: 1.5 }), 'reservaInvalida'],
    [con({ reservaMonto: 1_800_001 }), 'reservaMayorQueMonto'],
    [con({ reservaFecha: 'x' }), 'fechaInvalida'],
    [con({ reservaFecha: '2026-11-06' }), 'fechaFutura'],
    [con({ reservaFecha: '2026-09-03' }), 'fechaAntigua'],
  ])('%p → %p', (datos, error) => {
    expect(validarObligacionAnual(datos, HOY, null, vehiculos)).toEqual({ ok: false, error });
  });

  it('erroresObligacionAnual marca cada campo con su error', () => {
    const datos = con({
      nombre: '',
      monto: null,
      fechaVencimiento: 'x',
      vehiculoId: 'no',
      reservaMonto: -1,
      reservaFecha: '2026-12-01',
    });
    expect(erroresObligacionAnual(datos, HOY, null, vehiculos)).toEqual({
      nombre: 'nombreVacio',
      monto: 'montoInvalido',
      fechaVencimiento: 'fechaInvalida',
      vehiculoId: 'vehiculoInvalido',
      reservaMonto: 'reservaInvalida',
      reservaFecha: 'fechaFutura',
    });
  });

  it('con monto inválido no compara la reserva contra el monto', () => {
    expect(erroresObligacionAnual(con({ monto: 0, reservaMonto: 5 }), HOY, null, vehiculos)).toEqual({
      monto: 'montoInvalido',
    });
  });

  it('acepta las fechas guardadas aunque ya sean antiguas (editar solo el monto)', () => {
    const guardada = { fechaVencimiento: '2026-03-15', reservaFecha: '2026-01-10' };
    const datos = con({ fechaVencimiento: '2026-03-15', reservaFecha: '2026-01-10', monto: 2_000_000 });
    expect(validarObligacionAnual(datos, HOY, guardada, vehiculos).ok).toBe(true);
    const nuevas = con({ fechaVencimiento: '2026-03-14', reservaFecha: '2026-01-09' });
    expect(erroresObligacionAnual(nuevas, HOY, guardada, vehiculos)).toEqual({
      fechaVencimiento: 'fechaAntigua',
      reservaFecha: 'fechaAntigua',
    });
  });
});
