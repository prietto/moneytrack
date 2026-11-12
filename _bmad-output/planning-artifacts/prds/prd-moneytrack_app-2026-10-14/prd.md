---
title: "PRD: MoneyTrack v1"
status: final
created: 2026-10-14
updated: 2026-11-11
change_proposal: _bmad-output/planning-artifacts/sprint-change-proposal-2026-11-11.md
source_brief: _bmad-output/planning-artifacts/briefs/brief-moneytrack_app-2026-09-30/brief.md
---

# PRD: MoneyTrack v1

## 0. Propósito del documento

Define qué debe hacer la v1 de MoneyTrack para que la arquitectura, las épicas y las historias se construyan sin adivinar. Parte del [product brief](../../briefs/brief-moneytrack_app-2026-09-30/brief.md) (el porqué, la competencia y la visión no se repiten aquí). Los términos del §3 Glosario se usan exactamente así en todo el documento y en los artefactos que se deriven. Las decisiones técnicas y los ejemplos numéricos viven en [addendum.md](addendum.md). Lo inferido sin confirmar va marcado `[SUPUESTO]` e indexado en el §11.

> **Cambio de rumbo (2026-11-11).** Tras probar H1.1–H1.6 en el celular, la app resultó demasiado compleja para un MVP. El MVP se reenfoca en **registrar gastos con IA (foto, voz o a mano) y ver el resumen del mes**. Lo marcado **Congelado** sigue diseñado y se retoma después sin rehacerlo; lo ya construido de esas funciones (H1.4–H1.6) queda oculto, no borrado. Detalle en el [Sprint Change Proposal](../../sprint-change-proposal-2026-11-11.md).

## 1. Visión

MoneyTrack es una app Android personal para **registrar los Gastos sin esfuerzo y saber en qué se va la plata del mes**. Una foto de la factura, una nota de voz o unos toques bastan: la IA propone monto, comercio, fecha, detalle de ítems y categoría, y el usuario solo confirma o corrige.

**MVP:** captura inteligente de Gastos (foto, voz, a mano) y un Inicio con el total del mes, el gasto por categoría y los últimos Gastos.

**Después del MVP (congelado):** la app evoluciona hacia el socio financiero original: el **Dinero libre** proyectado (aparta lo Esencial, las Reservas y el Colchón), la **Meta** de liquidar la Deuda objetivo, el Semáforo y la Sesión de pagos.

## 2. Usuario

### 2.1 Trabajos por hacer

- **Funcional (MVP):** registrar un gasto en segundos —foto, voz o a mano— sin teclear todo.
- **Funcional (MVP):** ver de un vistazo cuánto llevo gastado este mes y en qué.
- **Funcional (después del MVP):** saber en todo momento cuánto tengo libre de verdad, sin hacer cuentas de cabeza.
- **Funcional (después del MVP):** decidir una compra en segundos sabiendo cuántos días le cuesta a mi Meta.
- **Funcional (después del MVP):** no olvidar Obligaciones ni vencimientos de mis Vehículos (varias motos y un carro).
- **Emocional:** dormir tranquilo viendo que las Deudas bajan; disfrutar el enduro sin culpa dentro de su fondo.

Usuario único: el autor. No hay otros usuarios en la v1 (ver §5).

### 2.2 Recorridos clave

**MVP**

- **UJ-1. Priettos registra el mercado con una foto.** Al salir del supermercado abre la app, toca la cámara y fotografía la factura. La app propone: 182.400 · Supermercado X · hoy · Mercado, con el detalle de ítems (arroz 4.200, leche 3.900…). Él confirma con un toque y el Gasto aparece en Inicio. **Borde:** si la IA lee mal el monto o la categoría, lo corrige en la misma pantalla antes de guardar; si los ítems no suman el total, la app lo avisa sin bloquear.
- **UJ-5. Priettos dicta un gasto.** Sale de almorzar, toca el micrófono y dice "almuerzo en El Corral, treinta y cinco mil". La app propone: 35.000 · El Corral · hoy · Comida afuera. Él confirma. **Borde:** si no entiende el monto, lo deja vacío para que lo escriba; el audio se borra al confirmar o descartar.
- **UJ-6. Priettos revisa cómo va el mes.** Abre la app y en Inicio ve el total gastado del mes, el gasto por categoría y los últimos Gastos; toca uno para ver su detalle con ítems.

**Después del MVP (congelados)**

- **UJ-2. Priettos duda con unas botas a las 11 p. m.** Abre la app, toca "¿Puedo?", escribe 600.000 y elige el fondo enduro. Recibe 🟡: "350.000 salen de tu fondo enduro; los 250.000 restantes le cuestan 8 días a tu Meta." Decide esperar al Pago de fin de mes; si las hubiera comprado igual, "Lo compré" estaba ahí.
- **UJ-3. Priettos hace su Sesión de pagos el día 11.** La app le avisa a la hora agendada. Ve la lista de Obligaciones hasta el próximo Pago (cuota bancaria, servicios, arriendo), paga en sus portales y marca cada una "ya pagamos".
- **UJ-4. Priettos cuadra al llegar el Pago de fin de mes.** Confirma el Pago recibido y la app le pide su Saldo real. Lo escribe; la app calcula 180.000 de diferencia y él los registra como Gasto sin registrar. Ve: "Meta: vas 2,1 de 6 millones; para llegar al 31 de enero necesitas abonar 475.000 este Periodo (ya reservados)". Decide abonar y la Fecha de la Meta proyectada se adelanta.

## 3. Glosario

**Dinero que entra y sale**
- **Pago** — Ingreso de salario. La v1 maneja dos por mes, configurables en día y monto esperado: **Pago 1** (~25 %, hacia el día 10) y **Pago 2** (~75 %, fin de mes). Cada Pago se **confirma** con el monto realmente recibido.
- **Otro ingreso** — Entrada de dinero que no es un Pago (venta, reembolso, ingreso no registrado detectado en un Cuadre).
- **Periodo** — Tramo entre dos Pagos consecutivos.
- **Gasto** — Salida de dinero registrada: monto, fecha, categoría, Clase de gasto, origen (manual, foto o voz) y, opcionalmente, comercio, nota, ítems, foto y Vehículo (este último congelado en el MVP).
- **Ítem** — Línea del detalle de un Gasto: descripción y monto opcional. Informativo; el monto del Gasto manda.
- **Clase de gasto** — Una de: **Esencial**, **Fondo protegido** o **Gusto**. Solo el Gusto (y lo que excede un Fondo protegido) tiene Impacto en días, salvo el Gasto sin registrar.
- **Gusto** — Gasto elegido, no necesario (salidas, comida afuera, compras por impulso). Se paga con Dinero libre.
- **Esencial** — Gasto necesario. Es una Obligación (arriendo, servicios, cuotas, SOAT…) o consume un Presupuesto esencial.
- **Presupuesto esencial** — Monto mensual para esenciales variables. La v1 tiene dos: **comida** y **mantenimiento de vehículos** (aceite, pastillas, llantas de uso, repuestos). Los Gastos Esenciales de esa categoría lo consumen.
- **Obligación** — Esencial con monto y fecha de vencimiento, mensual (arriendo, servicios, cuota de Deuda) o anual (SOAT, tecnomecánica, impuesto por Vehículo). Aparece en la Sesión de pagos.
- **Fondo protegido** — Bolsa mensual para una pasión. La v1 tiene una: **fondo enduro** (equipo de protección y accesorios). Un Gasto dentro del saldo del fondo no tiene Impacto en días; el excedente se trata como Gusto.
- **Gasto sin registrar** — Gasto de Clase Gusto y categoría "Sin registrar" creado desde un Cuadre. No muestra Impacto en días ni toca Fondos protegidos.

**Saldos**
- **Saldo calculado** — Saldo real inicial + Pagos confirmados + Otros ingresos − Gastos − Abonos.
- **Saldo real** — Saldo de la única cuenta bancaria, ingresado por el usuario.
- **Cuadre** — Comparación entre Saldo real y Saldo calculado; la diferencia se registra como Gasto sin registrar (si falta dinero) u Otro ingreso (si sobra).
- **Colchón** — Capital mínimo que no se toca: 4.000.000 COP (configurable).
- **Reserva** — Dinero que está en la cuenta pero ya tiene dueño. Tres tipos: saldo del **fondo enduro**; **reserva anual** (prorrateo acumulado de cada Obligación anual aún no pagada); **reserva de Meta** (Ritmo de la Meta del Periodo aún no abonado).
- **Aporte programado** — Movimiento futuro hacia una Reserva: el aporte mensual al fondo enduro y el prorrateo mensual de Obligaciones anuales (ambos en la fecha del Pago 2), y el Ritmo de la Meta (en la fecha de cada Pago).
- **Horizonte** — Los próximos 31 días desde hoy. Incluye siempre al menos un Pago 1 y un Pago 2.
- **Saldo proyectado (día d)** — Saldo calculado − Reservas actuales + Pagos esperados hasta d − Obligaciones pendientes con vencimiento hasta d − Presupuesto esencial pendiente hasta d − Aportes programados hasta d. El Presupuesto esencial pendiente de un mes es lo no consumido de ese mes y se descuenta completo el primer día del mes (o hoy, para el mes en curso).
- **Dinero libre** — **El Saldo proyectado más bajo dentro del Horizonte, menos el Colchón.** Es lo que se puede gastar hoy en Gustos sin que, ningún día del Horizonte, falte para una Obligación, un Presupuesto esencial, una Reserva o el Colchón. Puede ser negativo.

**Deudas y Meta**
- **Deuda** — Crédito con saldo, cuota mensual, día de pago y tasa (opcional). Pagar la cuota baja el saldo (por el capital, si hay tasa).
- **Abono** — Pago extra a una Deuda, siempre decidido por el usuario. Un Abono a la Deuda objetivo consume primero la reserva de Meta.
- **Meta** — Liquidar la **Deuda objetivo** antes de una fecha (v1: 31-ene-2027). Una sola Meta activa.
- **Avance de la Meta** — Saldo inicial de la Deuda objetivo − su saldo actual.
- **Ritmo de la Meta** — Abono extra necesario por Periodo: (saldo de la Deuda objetivo al inicio del Periodo − capital de las cuotas programadas hasta la fecha de la Meta) ÷ Periodos restantes. Mínimo 0. Se calcula una vez por Periodo y no cambia dentro de él; los Abonos del Periodo consumen la reserva de Meta.
- **Fecha de la Meta proyectada** — Fecha en que la Deuda objetivo llega a cero con sus cuotas y los Abonos ya hechos.
- **Día de Libertad** — Fecha en que todas las Deudas llegan a cero con sus cuotas y los Abonos ya hechos. No asume Abonos futuros ni bola de nieve.
- **Impacto en días** — Días que se adelantaría la Fecha de la Meta proyectada si el monto se abonara hoy a la Deuda objetivo. Cálculo lineal: monto ÷ cuota mensual de la Deuda objetivo × 30, **redondeado hacia arriba**.

**Otros**
- **Semáforo** — Veredicto de una consulta de compra: 🟢 / 🟡 / 🔴 (reglas en FR-22).
- **Sesión de pagos** — Momento agendado para pagar juntas las Obligaciones del Periodo.
- **Vehículo** — Moto o carro del usuario, con nombre.

## 4. Funciones

### 4.1 Configuración inicial — **Congelada**

> Congelada en el MVP. Lo construido (pagos, saldo inicial, Colchón, Vehículos, Obligaciones, Presupuestos esenciales y fondo enduro) queda oculto. En el MVP solo se mantienen las categorías (§4.2, FR-6).

**Descripción:** al primer uso, un asistente corto carga lo mínimo para calcular; todo es editable después.

- **FR-1: Pagos.** El usuario registra sus dos Pagos con día del mes y monto esperado. *Consecuencia:* si el día no existe en el mes, se usa el último día del mes.
- **FR-2: Deudas y Meta.** El usuario registra cada Deuda (nombre, saldo, cuota, día de pago, tasa opcional) y marca una como Deuda objetivo con su fecha de Meta. *Consecuencias:* las cuotas se generan como Obligaciones mensuales; si una Deuda no tiene tasa, sus proyecciones se marcan "aproximado".
- **FR-3: Obligaciones y Presupuestos esenciales.** El usuario registra Obligaciones mensuales y anuales (por Vehículo) y los montos de los Presupuestos esenciales (comida, mantenimiento de vehículos).
- **FR-4: Fondo enduro, Colchón y saldo inicial.** El usuario fija el aporte mensual al fondo enduro, el Colchón (default 4.000.000) y el Saldo real inicial.
- **FR-5: Vehículos.** El usuario registra sus Vehículos con un nombre (p. ej. "Moto azul", "Carro").

### 4.2 Registro de movimientos

**Descripción:** registrar debe costar segundos; es el corazón del MVP. Realiza UJ-1, UJ-5 y UJ-6.

- **FR-6: Registro manual.** El usuario registra un Gasto con monto, categoría, fecha (default hoy) y, opcionalmente, comercio y nota. La Clase de gasto se copia en silencio de la categoría; el usuario no la elige. *Consecuencia:* con una categoría reciente, se completa en ≤ 3 toques tras escribir el monto. *Nota:* la Clase se sigue guardando para que el Dinero libre, al descongelarse, no requiera migrar datos.
- **FR-7: Registro por foto.** El usuario fotografía una factura o recibo; la IA extrae monto, comercio, fecha y detalle de ítems, y sugiere la categoría. *Consecuencias:* siempre hay una pantalla de confirmación editable; nada se guarda sin confirmar; si la extracción falla o no hay conexión, la foto queda guardada y el usuario completa a mano (o se reintenta al volver la conexión). La propuesta aparece en ≤ 10 s con conexión.
- **FR-8: Clasificación por defecto.** Mantenimiento y consumibles de Vehículo → Esencial (Presupuesto esencial de mantenimiento de vehículos); equipo y accesorios de enduro → Fondo protegido; el resto → Gusto. En el MVP se aplica en silencio desde la categoría (FR-6) y las categorías nuevas son Gusto; que el usuario la cambie queda congelado.
- **FR-9: Adelanto de gasto previsto.** **[Congelada]** Un Gasto Esencial que excede su Presupuesto esencial del mes (p. ej. una llanta en oferta comprada antes de tiempo) se marca como adelanto y el exceso se descuenta del Presupuesto esencial del mes siguiente, no como Gusto.
- **FR-10: Impacto al guardar.** **[Congelada]** Tras guardar, la app muestra el Dinero libre restante y, si aplica, el Impacto en días.
- **FR-11: Confirmar Pago y Otros ingresos.** **[Congelada]** El usuario confirma cada Pago con el monto recibido y registra Otros ingresos. *Consecuencia:* mientras un Pago no se confirme, el Saldo calculado no lo incluye y el Saldo proyectado lo sigue tratando como esperado.
- **FR-12: Editar y borrar.** El usuario puede editar o borrar cualquier Gasto (incluidos sus ítems); todo se recalcula.
- **FR-31: Registro por nota de voz.** El usuario graba una nota de voz de hasta 60 s; la IA la interpreta y propone monto, comercio, fecha, ítems y categoría. *Consecuencias:* misma pantalla de confirmación editable que FR-7; nada se guarda sin confirmar; el audio se borra al confirmar o descartar; sin conexión, la nota queda en cola. La propuesta aparece en ≤ 15 s con conexión.
- **FR-32: Detalle de ítems.** Un Gasto puede tener una lista de ítems (descripción y monto opcional), extraída por la IA o escrita a mano. Los ítems son informativos: el monto del Gasto manda. *Consecuencia:* si los ítems con monto no suman el total, la app lo avisa sin bloquear el guardado.
- **FR-33: Inicio con el resumen del mes.** La pantalla principal muestra el total gastado en el mes en curso, el gasto por categoría (de mayor a menor) y los últimos Gastos. *Consecuencia:* se actualiza al guardar, editar o borrar un Gasto.
> FR-28 a FR-30 (exportar, respaldo en Drive y restaurar) se derivan de §8 y están numeradas en el documento de épicas.

- **FR-34: Lista y detalle de Gastos.** El usuario ve la lista de Gastos del mes (más reciente primero) y, al tocar uno, su detalle: monto, fecha, comercio, categoría, origen (manual, foto o voz), nota e ítems.

### 4.3 Dinero libre y Cuadre — **Congelada**

**Descripción:** la pantalla principal responde "¿cómo voy?" de un vistazo; el Cuadre mantiene la app honesta. Realiza UJ-4.

- **FR-13: Pantalla principal.** Muestra Dinero libre, Saldo calculado, Avance y Ritmo de la Meta, Fecha de la Meta proyectada (cuenta regresiva en días), Día de Libertad, saldo del fondo enduro y Obligaciones vencidas. *Consecuencia:* si el Dinero libre es negativo, se muestra en rojo con el día del faltante y el monto.
- **FR-14: Cuadre.** El usuario ingresa su Saldo real; la app muestra la diferencia con el Saldo calculado y la registra, con su confirmación, como Gasto sin registrar u Otro ingreso. *Consecuencia:* la app pide un Cuadre al confirmar cada Pago; si no se hace, lo recuerda al día siguiente.
- **FR-15: Historial de Cuadres.** La app guarda cada Cuadre con su diferencia en monto y porcentaje. Valida SM-2.

### 4.4 Meta y Día de Libertad — **Congelada**

**Descripción:** la Deuda objetivo se vuelve una cuenta regresiva visible. Realiza UJ-4.

- **FR-16: Proyecciones.** La app calcula la Fecha de la Meta proyectada y el Día de Libertad, y los recalcula con cada cambio.
- **FR-17: Abono.** El usuario registra un Abono a cualquier Deuda; baja el saldo de la Deuda y el Saldo calculado. La app nunca abona por su cuenta.
- **FR-18: Reserva de Meta.** En cada Periodo la app reserva el Ritmo de la Meta como Aporte programado; los Abonos a la Deuda objetivo consumen esa reserva de Meta. Reservar no es abonar.
- **FR-19: Ritmo y aviso.** Al confirmar un Pago o hacer un Cuadre, la app muestra el Ritmo de la Meta del Periodo, lo ya abonado y "al día" o "atrasado X". *Consecuencia:* si el Ritmo de la Meta no cabe sin bajar del Colchón, lo dice explícitamente.
- **FR-20: Meta cumplida o vencida.** Al llegar la Deuda objetivo a cero, la app lo celebra y pide elegir la siguiente Deuda objetivo y su fecha; mientras no se elija, el Semáforo muestra color sin Impacto en días. Si pasa la fecha sin cumplirse, la Meta queda "vencida" y la app pide una nueva fecha.

### 4.5 Semáforo de compra — **Congelada**

**Descripción:** el veredicto antes de comprar, en menos de 5 segundos. Informa; nunca bloquea. Realiza UJ-2.

- **FR-21: Consulta.** El usuario escribe un precio y, opcionalmente, elige un Fondo protegido. La consulta no registra Gasto. *Consecuencia:* con cualquier color, "Lo compré" la convierte en Gasto con un toque.
- **FR-22: Reglas del Semáforo.** Sea R la parte del precio que no cubre el saldo del Fondo protegido elegido.
  - 🟢 si R ≤ Dinero libre y el Impacto en días de R es menor que el umbral (default 7, configurable).
  - 🟡 si R ≤ Dinero libre y el Impacto en días ≥ umbral; o si R > Dinero libre pero cabe sumando la reserva de Meta del Periodo ("se come tu reserva de Meta").
  - 🔴 si R no cabe ni con la reserva de Meta: dejaría sin cubrir una Obligación, un Presupuesto esencial, la reserva anual o el Colchón.
- **FR-23: Respuesta.** El veredicto muestra color, Dinero libre resultante e Impacto en días en una frase simple. *Consecuencia:* desde abrir la app hasta ver el veredicto, ≤ 5 s.
- **FR-24: Registro de veredictos.** La app guarda cada consulta (fecha, monto, color, si se compró). Permite observar SM-C2.

### 4.6 Sesión de pagos — **Congelada**

**Descripción:** en lugar de recordatorios sueltos, una cita para pagar todo. Realiza UJ-3.

- **FR-25: Agendar.** El usuario agenda una Sesión de pagos por Periodo (default: el día siguiente a cada Pago, hora configurable) y recibe una notificación.
- **FR-26: Lista y "ya pagamos".** La Sesión de pagos lista las Obligaciones pendientes hasta el próximo Pago; marcar "ya pagamos" registra el Gasto con su monto (editable). Si es una cuota, baja el saldo de la Deuda; si es anual, libera su reserva anual. *Consecuencia:* una Obligación vencida sin marcar sigue visible como vencida en la pantalla principal.
- **FR-27: Vencimientos anuales.** La app avisa 30 y 7 días antes del vencimiento de cada Obligación anual de Vehículo.

## 5. Fuera del producto (explícito)

- **Regla de oro:** lo que debes, la app te lo cita y te lo recuerda; lo que eliges, lo decides tú. La app no mueve dinero (no paga, no transfiere, no compra) y no bloquea ninguna compra.
- No se conecta al banco ni lee SMS o correos bancarios.
- No da asesoría de inversión.
- No tiene anuncios, cuentas de usuario, varios usuarios ni versión iOS o web.

## 6. Alcance de la v1

### 6.1 Dentro del MVP (cambio de rumbo 2026-11-11)

- Registro de Gastos a mano, por foto y por nota de voz, con categoría sugerida por la IA y confirmación obligatoria (FR-6, FR-7, FR-8, FR-31).
- Detalle de ítems (FR-32).
- Editar y borrar Gastos (FR-12).
- Inicio con el resumen del mes, lista y detalle de Gastos (FR-33, FR-34).
- Categorías editables.
- Acceso protegido con el bloqueo del teléfono o biometría.
- APK release instalado en el celular.
- Exportación manual de los datos a un archivo.

Orden de construcción: simplificar la app → registro a mano → Inicio con resumen → APK → lista y detalle → editar y borrar → IA (clave y extractor, foto, voz) → cola sin conexión → exportar.

### 6.2 Congelado (diseñado, se retoma después del MVP)

- Funciones 4.1 (configuración inicial, salvo categorías), 4.3 (Dinero libre y Cuadre), 4.4 (Meta y Día de Libertad), 4.5 (Semáforo) y 4.6 (Sesión de pagos).
- FR-9 a FR-11.
- Respaldo automático en Google Drive y restaurar desde un archivo.
- Lo ya construido en H1.4–H1.6 queda oculto en la app, no borrado.

### 6.3 Fuera de la v1

- **v1.1:** consulta por pantallazo, pronóstico de fin de mes, socio-personaje con salud, aprendizaje automático de Vehículo, garaje completo (costo por mes y por km).
- **Después:** bola de nieve automática, hoja de ruta SHOULD/COULD del brief, búsqueda de precios más baratos, inversiones, conexión bancaria (finanzas abiertas en Colombia no antes de 2027–2028).

## 7. Métricas de éxito

**Primarias (MVP)**
- **SM-4:** Registrar un Gasto —desde abrir la app hasta guardar— toma ≤ 15 s por foto o por voz. Valida FR-7, FR-31.
- **SM-5:** ≥ 80 % de los montos propuestos por la IA se guardan sin corrección. Se mide comparando `capturas.propuesta` con el Gasto enlazado por `gastoId`. Valida FR-7, FR-31.
- **SM-6:** Gastos registrados al menos 5 días por semana. Señal temprana de abandono. Valida FR-6, FR-7, FR-31.

**Después del MVP (congeladas)**
- **SM-1:** Deuda objetivo en cero al 31-ene-2027 **sin que el Saldo real baje del Colchón** en ningún Cuadre. Fracaso: no liquidarla, o liquidarla vaciando el Colchón. Valida FR-16 a FR-20.
- **SM-2:** Diferencia del Cuadre de fin de mes < 5 % del Saldo real, desde noviembre de 2026. Valida FR-6, FR-7, FR-14.

- **SM-3:** Al menos un Cuadre por Periodo (dos al mes). Señal temprana de abandono. Valida FR-14.

**Contra-métricas (no optimizar)**
- **SM-C1:** Cantidad de Gastos registrados o tiempo en la app. Más uso no es mejor; registrar más rápido sí. Contrapesa SM-6.
- **SM-C2 (congelada):** Proporción de veredictos 🟢 del Semáforo (FR-24). Un Semáforo complaciente rompe la honestidad. Contrapesa FR-22.

## 8. Requisitos transversales

- **Voz del socio:** todo texto de la app es honesto, amable y no complaciente. Nunca suaviza un 🔴 ni maquilla una cifra; nunca culpa ni sermonea ("puedes, pero te cuesta 8 días", no "no deberías"); celebra los avances. Lenguaje simple, sin jerga financiera; una mirada basta.
- **Honestidad del cálculo:** ningún redondeo a favor; si falta un dato (p. ej. tasa), el resultado se marca "aproximado".
- **Sin conexión:** todo funciona sin internet excepto la extracción por foto y por voz, que se encolan; el registro a mano siempre funciona.
- **Privacidad:** los datos viven en el celular. Salen solo la foto o el audio, al proveedor de IA para extracción (con un proveedor que no entrene con los datos). El audio se borra del celular al confirmar o descartar. Acceso con el bloqueo del teléfono o biometría.
- **Respaldo:** en el MVP, solo exportación manual de los datos a un archivo. El respaldo automático en Google Drive y restaurar están congelados.
- **Moneda y formato:** COP sin decimales, separador de miles con punto.

## 9. Riesgos

- **El hábito de registrar.** Sin banco conectado, si dejo de registrar, el socio queda ciego. Mitigación de diseño, no de fuerza de voluntad: registro por foto en segundos (FR-7), Cuadre que delata lo no registrado (FR-14) y SM-3 como alarma temprana.
- **Complejidad que espanta el uso.** La v1 original pedía mucha configuración antes del primer Gasto. Mitigación: MVP reducido a capturar y ver (§6.1); lo demás congelado.
- **Grabación de audio en Expo SDK 57.** Mitigación: verificar el módulo con la documentación versionada al crear la historia de voz.
- **Lectura errónea de la foto o la voz.** Mitigación: confirmación obligatoria antes de guardar (FR-7, FR-31) y SM-5 para medirla.

## 10. Preguntas abiertas

Ninguna abierta. La lista inicial de categorías quedó definida en H1.6.

Resueltas en la [arquitectura](../../architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md): proveedor de IA = Gemini Flash con la clave del usuario, sin backend (AD-11, AD-12); amortización = sistema francés con tasa E.A. o M.V. (AD-6).

## 11. Índice de supuestos

Sin supuestos abiertos. Los tres de la versión anterior (fecha de Aportes programados, acceso con bloqueo/biometría, respaldo) quedaron confirmados o ajustados en la [arquitectura](../../architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md) (AD-15, AD-20, AD-14).
