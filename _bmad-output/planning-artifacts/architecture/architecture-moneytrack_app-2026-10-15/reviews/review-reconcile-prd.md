---
title: "Revisión: reconciliación spine ↔ PRD + addendum"
spine: ../ARCHITECTURE-SPINE.md
inputs:
  - ../../../prds/prd-moneytrack_app-2026-10-14/prd.md
  - ../../../prds/prd-moneytrack_app-2026-10-14/addendum.md
created: 2026-10-19
---

# Revisión de reconciliación — Spine MoneyTrack v1 vs PRD

## Veredicto

El spine cubre bien la forma (núcleo puro, solo hechos, comandos transaccionales, voz centralizada, enteros, fechas, respaldo) y **no contradice el PRD** salvo el cambio intencional de §8 (respaldo en Drive). Pero varias reglas de cálculo que el Glosario deja **ambiguas** quedan sin invariante, y AD-2 (nada derivado se guarda) las vuelve más delicadas porque obliga a que todo sea re-derivable desde hechos. Ahí dos constructores pueden divergir y romper el caso fijo del addendum o, peor, redondear a favor del usuario. Seis hallazgos merecen una regla en el spine; el resto es detalle de historia.

Criterio: solo se señala lo que (a) dos constructores implementarían distinto, o (b) el spine contradice o pierde en silencio. No se señala lo que el Glosario resuelve sin ambigüedad ("`domain/` calcula según el Glosario").

---

## Hallazgos

### H-1 — Ritmo de la Meta y reserva de Meta: no está fijado *cuándo* se evalúan ni *qué* son "cuotas programadas" con tasa · **ALTA**

**PRD:** §3 Ritmo = (saldo actual de la Deuda objetivo − cuotas programadas hasta la fecha de la Meta) ÷ Periodos restantes; reserva de Meta = Ritmo del Periodo aún no abonado; FR-18 "los Abonos a la Deuda objetivo consumen esa reserva"; FR-19 "lo ya abonado" y "al día / atrasado X"; addendum: Periodos restantes "contando el actual".

**Problema:**
1. **Circularidad dentro del Periodo.** Si el Ritmo se calcula con el saldo *actual*, un Abono de 500.000 baja el saldo y el Ritmo del mismo Periodo cae (≈ 416.667), así que "ya abonado 500.000 de 416.667" y la reserva de Meta cambia sola. Un constructor congela el Ritmo al inicio del Periodo; otro lo recalcula en vivo. Con AD-2 no se puede "guardar" el Ritmo del Periodo, así que debe estar definido como derivable.
2. **"Cuotas programadas" con tasa.** Con tasa (AD-6) la cuota solo baja el saldo por su capital. Restar la cuota completa subestima el Ritmo → redondeo a favor, contra PRD §8 Honestidad. El addendum solo cubre el caso sin tasa.
3. **Límites del Periodo.** ¿Empieza en la fecha *esperada* del Pago (FR-1) o en la fecha en que se *confirmó* (FR-11)? Cambia qué Abonos cuentan para "este Periodo" y cuándo se acredita el Aporte programado de Meta (y el del fondo enduro y el prorrateo anual, ligados a la fecha del Pago 2).
4. **Aportes de Meta futuros en el Horizonte** (fila 10-nov y 30-nov del addendum): ¿qué Ritmo se usa para Periodos futuros? El addendum usa el mismo 500.000.

**Regla propuesta (AD nuevo o ampliación de AD-1):**
> **AD-18 — Ritmo de la Meta por Periodo.** Un Periodo va de la fecha *esperada* de un Pago (FR-1, con ajuste de fin de mes) al día anterior a la fecha esperada del siguiente; confirmar un Pago no mueve los límites. El Ritmo de la Meta de un Periodo se evalúa con el saldo de la Deuda objetivo **al inicio de ese Periodo** (antes de sus Abonos) y no cambia durante el Periodo. "Cuotas programadas hasta la fecha de la Meta" = **capital** que amortizarán esas cuotas según AD-6 (sin tasa, la cuota completa). Periodos restantes cuenta el actual. reserva de Meta = max(0, Ritmo del Periodo − Abonos a la Deuda objetivo con fecha en el Periodo). Los Aportes programados de Meta de Periodos futuros dentro del Horizonte usan el Ritmo del Periodo actual. Abonos a otras Deudas no consumen la reserva de Meta. Resultado redondeado hacia arriba (AD-7).

Agregar a las pruebas fijas: Abono de 500.000 el 4-nov en el estado del addendum → reserva de Meta 0, Ritmo del Periodo sigue en 500.000, "al día".

---

### H-2 — FR-20 Meta cumplida / vencida no tiene modelo · **ALTA**

**PRD:** FR-20 (celebrar, pedir siguiente Deuda objetivo y fecha; mientras no se elija, Semáforo con color y sin Impacto en días; Meta "vencida" pide nueva fecha); §3 "una sola Meta activa"; Avance = saldo inicial de la Deuda objetivo − saldo actual.

**Problema:** AD-3 menciona FR-20 en *Binds*, pero ninguna regla dice:
- si el estado (activa / cumplida / vencida) se guarda o se deriva (AD-2 sugiere derivar, pero un constructor pondrá una columna `estado`);
- qué devuelven `impactoEnDias` y `evaluarCompra` sin Meta activa (¿🟢 siempre que R ≤ Dinero libre? ¿hay reserva de Meta para la franja 🟡?);
- qué pasa con el Ritmo cuando la fecha ya pasó (Periodos restantes = 0 → división por cero; la convención "domain es total" no dice el valor);
- cuál es el "saldo inicial" para el Avance de una **segunda** Meta (¿saldo original de la Deuda o saldo el día en que se eligió como objetivo?);
- si las Metas pasadas se conservan (historia de la celebración).

**Regla propuesta:**
> **AD-19 — Ciclo de la Meta.** La Meta es configuración: `{ deudaId, fechaObjetivo, fechaInicio }`; elegir una nueva crea otra fila y la anterior queda como historia (nunca se edita en sitio). El estado se deriva: *cumplida* si el saldo de su Deuda ≤ 0; *vencida* si `hoy > fechaObjetivo` y saldo > 0; si no, *activa*. `Estado.meta` es `null` cuando no hay Meta activa: entonces Ritmo, reserva de Meta y Aportes de Meta = 0, `impactoEnDias` devuelve `null`, y `evaluarCompra` da 🟢 si R ≤ Dinero libre y 🔴 si no (sin franja 🟡 ni frase de días). Meta vencida: Ritmo = saldo restante completo (un Periodo), la pantalla pide nueva fecha. Avance = saldo de la Deuda objetivo en `fechaInicio` − saldo actual.

---

### H-3 — Desbordes de bolsas (FR-9 adelanto y excedente del Fondo protegido) sin regla de derivación · **MEDIA-ALTA**

**PRD:** FR-9: Gasto Esencial que excede su Presupuesto esencial del mes "se marca como adelanto" y el exceso se descuenta del mes siguiente, no como Gusto. §3 Fondo protegido: el excedente se trata como Gusto (con Impacto en días). FR-21/UJ-2: "Lo compré" con fondo enduro parte 350.000 / 250.000.

**Problema:** el spine solo cita FR-9 en *Binds* de AD-3. Quedan abiertas dos lecturas incompatibles con AD-2 y AD-4:
- (a) guardar `esAdelanto` / `montoExcedente` en el Gasto al registrarlo; o
- (b) derivarlo en `calcularEstado` recorriendo los Gastos de la bolsa.

Con (a), editar o borrar un Gasto anterior (FR-12, AD-4 "recalcula como si siempre hubiera sido así") deja el adelanto o el excedente desincronizados — exactamente lo que AD-2 prohíbe. Con (b) hace falta un **orden determinista** (¿cuál de dos Gastos del mismo día es el que desborda?). Falta además: ¿el adelanto se encadena si excede también el mes siguiente? ¿El Gasto del Semáforo con fondo es un Gasto o dos?

**Regla propuesta (ampliar AD-2):**
> El consumo de Presupuestos esenciales y Fondos protegidos se **deriva**; ningún Gasto guarda "adelanto" ni "excedente". `domain/` asigna cada Gasto a su bolsa en orden `(fecha, createdAt)`; la parte que excede el saldo de la bolsa es: en Presupuesto esencial, adelanto que reduce el Presupuesto del mes siguiente (y, si lo agota, el siguiente, en cadena); en Fondo protegido, Gusto con Impacto en días. Un Gasto es una sola fila aunque se reparta. `Estado` expone por Gasto la parte cubierta y la desbordada, para FR-10 y los textos.

---

### H-4 — Bordes de calendario: Pagos y Obligaciones atrasados, clave de cierre y límites del Horizonte · **MEDIA**

**PRD:** §3 Horizonte = próximos 31 días, "incluye siempre al menos un Pago 1 y un Pago 2"; addendum: 3-nov → 4-dic; FR-11 Pago no confirmado sigue "esperado"; addendum: no se ajusta por fines de semana; FR-26 vencida sin marcar sigue visible.

**Problema:** AD-5 fija la clave `YYYY-MM` / `YYYY` y el ajuste de fin de mes, pero no:
1. **Límites del Horizonte:** `[hoy, hoy+31]` inclusivo (lo que da el addendum: 32 días) vs `[hoy, hoy+30]`. Cambia el mínimo y el Dinero libre. El addendum fija el ejemplo, pero no la regla.
2. **Pago esperado con fecha pasada y sin confirmar:** ¿entra al Saldo proyectado hoy (FR-11 literal), o se excluye por honestidad? Un constructor lo suma hoy (Dinero libre inflado si el Pago se retrasa); otro lo ignora.
3. **Qué clave cierra una confirmación tardía:** el Pago 2 de octubre confirmado el 1-nov, o el arriendo de octubre pagado el 2-nov. Si la clave sale de la fecha de confirmación (`2026-11`), se cierra la ocurrencia equivocada: duplicado + pendiente fantasma (lo que AD-5 quiere prevenir).
4. **Fines de semana:** no se ajustan (addendum) — no está en el spine; bajo riesgo, pero conviene una línea.

**Regla propuesta (ampliar AD-5):**
> Horizonte = días `hoy … hoy+31`, ambos inclusive. Las fechas esperadas nunca se ajustan por fin de semana o festivo. Un hecho de cierre (Pago confirmado, "ya pagamos") se asigna por defecto a la **ocurrencia abierta más antigua** de esa definición (no a la del mes de la fecha del hecho); la pantalla muestra la ocurrencia y permite cambiarla. Un Pago esperado vencido y sin confirmar entra al Saldo proyectado el día de hoy y `Estado` lo marca `pagoAtrasado` para que la pantalla lo diga; una Obligación vencida sin marcar se descuenta hoy y aparece en "vencidas".

(Si el usuario prefiere honestidad estricta, la variante es excluir el Pago atrasado; lo importante es que sea **una** regla.)

---

### H-5 — `aproximado`: una sola bandera global vs por cifra · **MEDIA**

**PRD:** §8 "si falta un dato (p. ej. tasa), el resultado se marca 'aproximado'"; FR-2 "sus proyecciones se marcan 'aproximado'".

**Problema:** AD-1 dice que `Estado` devuelve "la bandera `aproximado`" (singular); AD-6 y la convención "Datos faltantes" dicen que *cada resultado* que depende de esa Deuda lo lleva. Un constructor pondrá `estado.aproximado: boolean` y marcará todo (incluido el Dinero libre, que no depende de la tasa); otro marcará por cifra. Además no se dice qué cifras dependen: Fecha de la Meta proyectada y Ritmo (si la Deuda objetivo no tiene tasa), Día de Libertad (si *alguna* Deuda no tiene tasa), saldo de cada Deuda sin tasa.

**Regla propuesta (corregir AD-1):**
> Las cifras que pueden ser aproximadas se devuelven como `{ valor, aproximado }`: saldo de cada Deuda, Avance, Ritmo, Fecha de la Meta proyectada (dependen de la Deuda objetivo) y Día de Libertad (cualquier Deuda). El Dinero libre, el Saldo calculado y el Impacto en días (modelo lineal, PRD) nunca son aproximados. No existe una bandera global.

---

### H-6 — NFR de tiempos y la cola de fotos no tienen soporte arquitectónico · **MEDIA**

**PRD:** FR-23 ≤ 5 s desde abrir la app hasta el veredicto; FR-7 propuesta ≤ 10 s con conexión, sin conexión la foto queda adjunta y se reintenta; FR-6 ≤ 3 toques; §8 sin conexión todo funciona.

**Problema:**
1. **≤ 5 s** se juega en el arranque en frío: migraciones (`useMigrations`), desbloqueo biométrico (AD-15) y `calcularEstado` recalculando desde *todos* los hechos (AD-2) en cada cambio. Ninguna regla fija un presupuesto ni prohíbe trabajo extra en el arranque (p. ej. el respaldo o la reprogramación de notificaciones bloqueando la primera pantalla).
2. **≤ 10 s**: AD-11 no fija tiempo límite. Sin timeout, una red lenta deja al usuario esperando más de 10 s sin caer al modo manual.
3. **Cola:** el diagrama ER solo tiene `GASTO ||--o| FOTO`. Una foto pendiente **sin Gasto** (el usuario se fue sin completar) no tiene dónde vivir; un constructor creará un "Gasto borrador" (viola AD-11 "nada se guarda sin confirmar" y contaminaría `calcularEstado`), otro una tabla aparte. Tampoco se dice qué pasa cuando la extracción tardía termina.

**Regla propuesta (ampliar AD-11 + convención de rendimiento):**
> `extraerFactura` aborta a los 10 s y devuelve `error: 'timeout'`, que la pantalla trata igual que "sin conexión": completar a mano con la foto adjunta. Las fotos sin Gasto viven en la tabla `fotos_pendientes` (`uri`, `estado: pendiente | propuesta | descartada`, `propuesta` JSON), con su propio módulo de comandos; `calcularEstado` nunca las lee. Al completarse una extracción tardía, la propuesta aparece en "Facturas por confirmar" y solo `registrarGasto` crea el Gasto.
> **Rendimiento:** `calcularEstado` sobre 12 meses de datos sintéticos corre en < 200 ms (prueba de `domain/`). Al abrir, nada distinto de migraciones + desbloqueo + `calcularEstado` bloquea la primera pantalla; respaldo y `reprogramar` corren después. "¿Puedo?" está a un toque desde la pantalla principal.

---

## Hallazgos menores (detalle de historia, pero dejar una línea)

- **L-1 — Desvío intencional de PRD §8 (respaldo en Drive):** bien manejado por AD-12, AD-14, *Deferred* (cifrado) y el orden de construcción (Drive es lo primero que pasa a v1.1). Pero el PRD sigue diciendo "los datos viven en el celular; solo la foto sale" y "exportación manual" (memlog: "ofrecer actualizar el PRD al cerrar", sin registrar que se hizo). **Fix:** actualizar PRD §8 Privacidad/Respaldo y §11, o agregar al spine una sección "Desvíos aceptados del PRD" con: "PRD §8 Privacidad y Respaldo: además de la foto, la instantánea `MoneyTrackExport` sale a Drive `appDataFolder` del propio usuario, opcional y desactivada por defecto". Si no, `check-implementation-readiness` lo marcará como contradicción. Además: tras restaurar (AD-14) hay que llamar a `notificaciones.reprogramar` y tolerar Gastos cuya foto ya no existe (las fotos no van en el respaldo).
- **L-2 — Gasto sin registrar:** AD-9 hace configurables las categorías, así que el usuario podría borrar o renombrar "Sin registrar" y romper la semántica del §3 (Gusto, sin Impacto en días, no toca fondos). **Fix:** "las categorías de sistema (`sin-registrar`) se siembran con `tipo = 'sistema'`, no se borran; `domain/` reconoce el Gasto sin registrar por su vínculo con el Cuadre (`cuadreId`), no por el nombre de la categoría."
- **L-3 — Salida estructurada de `evaluarCompra`:** FR-22/FR-23 y UJ-2 exigen frases como "350.000 salen de tu fondo enduro; los 250.000 restantes le cuestan 8 días" y, en 🔴, *qué* quedaría sin cubrir. Para que AD-17 no recalcule en `textos/`, fijar que `evaluarCompra` devuelve `{ color, cubiertoPorFondo, r, impactoDias | null, usaReservaMeta, dineroLibreResultante, faltaPara?: 'obligacion' | 'presupuesto' | 'reservaAnual' | 'colchon' }`.
- **L-4 — "Ya pagamos" con monto editado (FR-26):** decir si la amortización de AD-6 usa el monto pagado o la cuota configurada (propuesta: el monto pagado; el excedente sobre la cuota no es Abono salvo que el usuario lo registre como tal).
- **L-5 — Reintento "al volver la conexión" (AD-11 sin tareas en segundo plano):** solo funciona con la app abierta. Compatible con el PRD, pero conviene decirlo: "se escucha el cambio de red solo con la app en primer plano".
- **L-6 — Sesión de pagos reagendada para un Periodo concreto (FR-25):** AD-9 solo contempla la hora como configuración; si el usuario mueve la Sesión de un Periodo, eso es un hecho con clave de Periodo (AD-5).

## Verificado sin hallazgo

Voz del socio (AD-17), redondeo nunca a favor (AD-7), COP y formato (AD-7), ajuste de día inexistente (AD-5), amortización (AD-6, PRD §10.3), proveedor de IA y clave (AD-11/AD-12, PRD §10.2 y la tensión del addendum), confirmación obligatoria de la foto (AD-11), notificaciones FR-14/25/27 (AD-13), regla de oro "no mueve dinero / no bloquea" (no hay ninguna AD que la contradiga), instantáneas de Cuadre y Semáforo (AD-2, FR-15, FR-24), casos fijos del addendum como pruebas (convención Pruebas), acceso con biometría (AD-15), orden de construcción (§6.1).
