# Trabajo diferido

## Deferred from: code review of 1-1-proyecto-base-desde-la-plantilla-expo-sdk-57.md (2026-11-05)

- ~~`src/data/db.ts:7`: `openDatabaseSync` corre al importar el módulo, así que una excepción al abrir la base tumba la app antes de montar `RootLayout`. Un fallo de migración (`src/app/_layout.tsx:10`) no se registra, no se puede reintentar y no hay ErrorBoundary. Le toca a H1.2 (diagnóstico y error amable, AD-23).~~ **Resuelto en H1.2:** `obtenerDb()` perezosa, `useMigraciones()` con `reintentar`, registro con `log.error('migraciones.aplicar')` en el layout y `ErrorBoundary` raíz.
- `src/data/schema.ts:26`: `operacion` de `rastro` solo está restringida en TypeScript. Drizzle no genera `CHECK`, así que SQL crudo o una restauración podrían guardar valores inválidos. Validar en los comandos o con Zod (H1.3 y H7.2).
- `drizzle/meta/_journal.json`: el migrador de drizzle aplica según el `when` de cada entrada. Si una migración nueva tiene un `when` menor o igual al último aplicado (reloj desfasado, fusión de ramas), se omite en silencio en los dispositivos que ya migraron.

## Deferred from: code review of 1-2-acceso-protegido-diagnostico-y-error-amable.md (2026-11-05)

- `src/hooks/use-acceso.ts` (manejador de AppState: `background` / `inactive`): la cubierta se pinta al recibir `background` en JS. La miniatura de "recientes" de Android y el snapshot de iOS en `inactive` pueden mostrar datos. La historia lo dejó fuera de alcance (sin FLAG_SECURE ni dependencias nuevas).
- `src/app/_layout.tsx` (`tapado && <PantallaBloqueo comoCapa />`): la capa de bloqueo es un `View` absoluto sobre el `Stack`. No tapa ventanas nativas (`presentation: 'modal'`/`formSheet`, `Modal`, `Alert`). Ninguna pantalla las usa todavía; revisarlo cuando aparezca la primera.
- `src/services/log.ts` (`instalarRegistroDeErroresGlobales`): `instalarRegistroDeErroresGlobales` solo ve los errores síncronos. Los rechazos de promesas no controlados no se registran (en Hermes hace falta el rastreador de rechazos). Hoy los servicios devuelven `Resultado<T>`.
- `src/services/log.ts` (`persistir` y `almacenEnArchivo`): cada entrada reescribe el archivo completo de forma síncrona y no atómica (~1,5 MB con el buffer lleno, según la nota del dev). Un kill a mitad de escritura deja el archivo ilegible y se pierde el historial. Considerar escribir a un temporal y renombrar, o agrupar escrituras.
- `eslint.config.js`: huecos de la regla de AD-17 (`{String('x')}`, claves con comillas, botones de `Alert.alert`, `tabBarLabel`, `aria-label`…) y falsos positivos (`Property[key.name=title]` en cualquier objeto, plantillas sin texto estático). Pureza de `domain/`: no prohíbe `process`, timers, `eval` ni `require`. AD-3: el patrón `(^|/)data/(schema|db)$` no atrapa `@/data/db.ts` ni `@/data/db/index`. Pre-existente de H1.1.
- `src/app/_layout.tsx` (`contenido` de error y de carga, estilo `centro`): las pantallas de error de migración y de carga no fijan colores, y la app usa `userInterfaceStyle: 'automatic'`; en modo oscuro el texto puede no leerse. Lo resuelve el tema de H1.4.

## Deferred from: code review of 1-2-acceso-protegido-diagnostico-y-error-amable.md, segunda pasada (2026-11-05)

- `src/services/log.ts` (`cargar`): si `almacen.leer()` lanza por un fallo transitorio (E/S, UTF-8 inválido), el buffer arranca vacío y la siguiente escritura reemplaza hasta 500 entradas del historial. Considerar reintentar la lectura en la siguiente llamada o copiar el archivo a `moneytrack-log.ilegible.json` antes de sobrescribir.
- `src/hooks/use-acceso.ts` (`'background'`): las actividades que abre la propia app (`expo-image-picker`, hojas de compartir, selectores de documentos) mandan `background`. Cubren la pantalla en cada foto y re-bloquean si tardan más de 5 min. Hace falta suspender el bloqueo durante esos flujos (como `autenticandoRef` con el PIN). Le toca a la historia de fotos.
- `src/app/_layout.tsx` (`BackHandler`): los manejadores de `hardwareBackPress` son LIFO. Una pantalla que registre el suyo mientras el layout está tapado corre antes y puede navegar bajo la capa. Ninguna pantalla registra uno todavía.
- `package.json:34`: `@types/node` `^26.6.6`, pero en local corre Node 20.19. Los tipos pueden aceptar APIs que no existen en el runtime de Jest. Fijarlo a la mayor de Node en uso. Viene de H1.1.
- `src/services/biometria.ts` (`requiereAutenticacion`): mide con el reloj de pared. El guardia `ahora < desde` solo atrapa un atraso mayor que el tiempo transcurrido: con 60 min fuera y el reloj atrasado 58 min, no pide la huella. Cerrarlo requiere un reloj monótono que cuente el sueño profundo (`elapsedRealtime`, vía un módulo nativo local); `performance.now()` no lo cuenta en Android. Motivo para diferir: exige tener el teléfono desbloqueado y cambiar la hora a mano.

## Deferred from: code review of 1-3-nucleo-de-calculo-reloj-hechos-y-estado-reactivo.md (2026-11-05)

- `src/domain/calcular-estado.ts:18`: no tiene en cuenta `saldoInicial.fecha`. Con un saldo inicial de fecha futura, o un reloj que retrocede, muestra el Saldo calculado y el Dinero libre de días anteriores al punto de partida. Se resuelve junto con los movimientos de AD-2 en H1.4.
- `src/data/use-hechos.ts:42` y `src/hooks/use-comando.ts:28`: cada consumidor de `useHechos` hace su propia carga síncrona en cada commit, y `correrTrasComando` hace otra más (N+1 lecturas). Además `cargarHechos` siempre devuelve un objeto nuevo y re-renderiza a todos. Considerar un store compartido (`useSyncExternalStore`) cuando H1.4 sume tablas y consumidores.
- `src/hooks/use-comando.ts:28`: `correrTrasComando` no tiene guarda de reentrada. Un post-comando que llame a `ejecutar` recurre sin límite. Le toca a la Épica 6, cuando se conecte `notificaciones.reprogramar`.
- `src/data/contexto.ts:30`: `Comando.aplicar` recibe `ctx.db` completo. Una pantalla puede definir un comando en línea que escriba sin rastro y sin pasar por `data/commands`, y el lint no lo ve. Decidirlo en H1.4, cuando exista `data/commands`; por ejemplo, que `ejecutar` acepte solo comandos fabricados allí.
- `src/data/tablas/rastro.ts:73`: `editarConRastro` con `cambios` vacío (o sin cambios reales) actualiza `updatedAt` y escribe un rastro "editar" que solo es ruido. Revisarlo con los primeros comandos de edición.

## Deferred from: code review of 1-4-configurar-pagos-saldo-inicial-y-colchon-y-ver-el-primer-dinero-libre (2026-11-06)

- `src/domain/calcular-estado.ts:16` y `src/app/(tabs)/ajustes.tsx:38`: un saldo con fecha futura (reloj que retrocede) sale como faltante en Inicio y como configurado en Ajustes, sin explicar por qué.
- `src/app/(tabs)/ajustes.tsx:38`: con saldo y sin Colchón, el resumen dice "Sin configurar". Hoy no se alcanza porque el comando guarda ambos.
- `src/data/use-hechos.ts:22`: la caché se indexa solo por versión. Una llamada con versión vieja desaloja la nueva (lecturas de más), y las escrituras sin `avisarCambio` (restauración de H7, otra instancia de `obtenerDb`) dejan hechos viejos.
- `drizzle/0001_giant_thanos.sql`: sin restricción de fila única en `ajustes` ni `CHECK` de `numero IN (1,2)` / `dia BETWEEN 1 AND 31` en `pagos`. `cargarHechos` descarta las filas inválidas en silencio.
- `src/components/configuracion/formulario-pagos.tsx:68` y `formulario-saldo-y-colchon.tsx:25`: los formularios toman la configuración una sola vez y no se resincronizan. Revisarlo en el asistente de H1.8.
- `src/components/configuracion/formulario.tsx:22`: en Android, `KeyboardAvoidingView` va sin `behavior` y con edge-to-edge; verificar en dispositivo que el teclado no tape Guardar.
- `src/app/(tabs)/ajustes.tsx:16` e `index.tsx`: `router.push` sin guard ante doble toque apila el formulario dos veces.

## Deferred from: code review of 1-5-registrar-vehiculos-y-obligaciones-mensuales-y-anuales (2026-11-10)

- `src/data/commands/borrar-vehiculo.ts:14` y `src/components/configuracion/formulario-vehiculo.tsx:63`: la pantalla busca el Vehículo en uso en los Hechos (que descartan filas incompletas y vuelven `null` los huérfanos) y el comando en las filas vigentes crudas. Una fila incompleta con `vehiculo_id` hace que el comando lance `vehiculoEnUso` y la pantalla muestre el genérico "No pude borrar", sin explicar por qué y sin forma de verla. Hoy no se alcanza (ninguna UI crea filas incompletas); revisarlo en H1.7 con las cuotas, o mapear el error del comando al aviso.
- `src/components/configuracion/fila.tsx:11` (y `src/app/(tabs)/ajustes.tsx:16`, de H1.4): el resumen (monto, día, Vehículo) va solo en `accessibilityHint`; con las pistas apagadas el lector de pantalla no lo dice, y dos Obligaciones con el mismo nombre suenan iguales. Considerar incluirlo en `accessibilityLabel`.
- `src/domain/entrada.ts:18` (`leerMonto`, de H1.4) y `src/domain/calcular-estado.ts:78`: cada monto acepta hasta `Number.MAX_SAFE_INTEGER`, pero la suma de varios (reservas, acumulado, Dinero libre) puede pasar de ese límite y `formatearDinero` lanza `RangeError`, que tumba Inicio. Poner un tope de monto realista o validar las sumas.

## Deferred from: H1.6 (2026-11-10)

- **Gasto Esencial sin Presupuesto (Salud).** La regla queda fijada en los datos (Salud con `clase_default = 'esencial'` y `presupuesto_id` nulo) y documentada en `src/domain/hechos.ts` (`Categoria`). Su cálculo llega con los Gastos en H2.1/H2.2: resta del Saldo calculado y del proyectado, no consume ninguna bolsa, no genera adelanto (FR-9) y no tiene Impacto en días. H2.1/H2.2 deben traer su prueba.
- **Consumo de Presupuestos y fondo por los Gastos (H2.1).** `src/domain/presupuestos.ts` descuenta el monto mensual completo; H2.1/H2.2 le restan lo consumido del mes y encadenan los adelantos (comentario en el bucle). `src/domain/fondos.ts` no resta Gastos; H2.1 los resta en orden `(fecha, createdAt)` (comentario al final de `resultadoFondo`).
- **Sin UI para crear, renombrar o borrar Presupuestos y Fondos.** El modelo admite N de cada uno (tablas y `Hechos`), pero `tablas/presupuestos.ts` y `tablas/fondos.ts` solo editan montos y las pantallas solo los fijan.

## Deferred from: code review of 1-6-presupuestos-esenciales-fondo-enduro-y-categorias-iniciales (2026-11-10)

- **Saldo del fondo con fecha futura.** Si el reloj del dispositivo se atrasa y la fecha del saldo inicial del fondo queda después de `hoy`, `resultadoFondo` (`src/domain/fondos.ts`) cuenta ese saldo como Reserva, y `erroresFondo` da `fechaFutura` aunque sea la fecha guardada, lo que bloquea guardar toda la pantalla de Presupuestos y Fondos. La reserva inicial de H1.5 sigue el mismo patrón.
- **Semántica de punto de partida en la reserva inicial anual (H1.5).** Al editar la reserva inicial de una Obligación anual se conserva la fecha guardada, así que el prorrateo se vuelve a aplicar desde ella. Es el mismo riesgo de doble conteo que el saldo del fondo de H1.6; hay que resolverlo con el mismo criterio que se decida allí.
