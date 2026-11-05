---
title: "Reconciliación brief → PRD: MoneyTrack v1"
created: 2026-10-14
sources:
  - briefs/brief-moneytrack_app-2026-09-30/brief.md
  - briefs/brief-moneytrack_app-2026-09-30/addendum.md
  - briefs/brief-moneytrack_app-2026-09-30/.memlog.md
targets:
  - prds/prd-moneytrack_app-2026-10-14/prd.md
  - prds/prd-moneytrack_app-2026-10-14/addendum.md
  - prds/prd-moneytrack_app-2026-10-14/.memlog.md (decisiones posteriores; prevalecen)
---

# Reconciliación brief → PRD (MoneyTrack v1)

## Criterio

- Se comparó cada decisión, regla, requisito de alcance v1, criterio de éxito, riesgo y principio cualitativo del brief (y su addendum y memlog) contra el PRD y su addendum.
- **No se reportan como hueco:** lo movido a v1.1/después (voz, pantallazo, pronóstico, socio-personaje, aprendizaje de vehículo, garaje, SHOULD/COULD); lo cambiado por el memlog del PRD (quincenas → Pago 1 25 % / Pago 2 75 %; colchón X → 4.000.000; solo Android; tasas como dato de configuración; privacidad aceptada; fecha a inicios de noviembre; abonos solo manuales); ni el contexto de mercado/competencia.

## Resumen

| # | Hueco | Severidad | Dónde va |
|---|---|---|---|
| H-1 | Esenciales de vehículo (mantenimiento/consumibles) no se apartan en el cálculo | **Alta** | FR-3, §3 Dinero libre |
| H-2 | Voz del socio: "amable, pero no complaciente" y honestidad en los mensajes | **Alta** | §8 nuevo requisito transversal |
| H-3 | Regla "adelantar un gasto previsto no cuenta como gasto nuevo" | Media | §4.2 nuevo FR / FR-8 |
| H-4 | Regla de oro, segunda mitad: "lo que eliges lo decides tú" (la app informa, no bloquea) | Media | §5 y FR-18/FR-19 |
| H-5 | Lenguaje simple en toda la app (no solo en el veredicto) | Media | §8 (junto a H-2) |
| H-6 | Riesgo #1 (hábito de registro) y principio "no depender de la fuerza de voluntad" | Media | §8 o nueva §9 Riesgos |
| H-7 | El producto debe seguir siendo útil tras liquidar la Deuda objetivo | Media | FR-17/§3 Impacto en días |
| H-8 | "Instantánea": sin objetivo de tiempo para el registro por foto | Baja | FR-7, §8 |
| H-9 | Asignación de Vehículo: "al principio pregunta" | Baja | FR-6/FR-7 |
| H-10 | Señal de fracaso explícita | Baja | §7 |
| H-11 | Día de Libertad "en cuenta regresiva" | Baja | FR-11 |
| H-12 | Orden entre deudas (bola de nieve vs. avalancha) sin cierre | Baja | §9 Preguntas abiertas |

---

## Detalle

### H-1 · Esenciales de vehículo no se apartan en el Dinero libre — **Alta**

**Fuente (brief, La solución):** "Primero se apartan los esenciales (arriendo, comida, servicios, cuotas de deuda **y mantenimiento de los vehículos**), las metas de ahorro y los fondos protegidos (como el fondo enduro)."
**Fuente (brief, Problema):** "los consumibles de varias motos y un carro son un frente de gasto permanente que nunca he sumado".
**Fuente (brief addendum):** "Esenciales del vehículo: mantenimiento y consumibles (aceite, pastillas de freno, llantas de uso, mantenimiento del carro)…"

**Estado en el PRD:** el Glosario clasifica estos gastos como Esencial y FR-8 los sugiere como Esencial, pero **FR-3 solo pide** Obligaciones mensuales, anuales (SOAT, tecnomecánica, impuesto) y "un presupuesto mensual de comida". No hay presupuesto de mantenimiento/consumibles de vehículos, así que el §3 Dinero libre no lo resta. Resultado: el Dinero libre sale inflado (el semáforo puede dar un 🟢 falso) y cada llanta o cambio de aceite baja el saldo sin haber estado apartada. Esto choca con SM-C2 y con "nunca da un falso sí". Es justo la categoría que el memlog del brief señala como "la más grande y menos visible".

Además, el PRD no dice cómo un Gasto Esencial **consume** su presupuesto (comida, mantenimiento) en lugar de restar dos veces: una al apartar y otra al registrar.

**Propuesta:**
- FR-3: añadir "presupuesto mensual de mantenimiento y consumibles por Vehículo (o global)" junto al de comida.
- §3 Dinero libre: incluir "presupuestos de Esenciales pendientes del mes (comida, mantenimiento de Vehículos)" en lo que se resta.
- Nueva consecuencia en FR-6/FR-9: "un Gasto Esencial con presupuesto consume primero ese presupuesto; solo el excedente reduce el Dinero libre". También va a §4.2 o al addendum con un ejemplo numérico.

### H-2 · Voz del socio: "amable, pero no complaciente" — **Alta**

**Fuente (brief addendum, Principios del socio):** "Honestidad total. / Amable, pero no complaciente. / … / Instantáneo y claro."
**Fuente (brief, Qué lo hace diferente):** "El socio no me culpa por el enduro; solo frena cuando me salgo de su presupuesto."
**Fuente (brief memlog):** "no culpar la pasión (evita abandono) sin dejar de proteger el Día de Libertad".
**Fuente (brief, Visión):** "el socio está de mi lado, no del de quien me quiere vender algo".

**Estado en el PRD:** la honestidad aparece solo como **honestidad del cálculo** (§8: redondeo, "aproximado") y como contra-métrica SM-C2. **No hay ninguna regla sobre el tono de los mensajes.** La estructura de FRs dejó fuera la mitad cualitativa del principio: el veredicto rojo debe decirse claro, sin suavizarlo, y sin culpa, sermón ni regaño. Sin esta regla, cada texto (semáforo, cuadre con diferencia, meta "atrasado", Dinero libre negativo) se redactará a criterio del desarrollador.

**Propuesta:** nuevo requisito transversal en el §8, **"Voz del socio"**:
- Honesto: nunca suaviza un 🔴 ni oculta un "atrasado"; dice la cifra.
- Amable: sin culpa, sin juicios morales, sin signos de alarma gratuitos; dentro del Fondo protegido no hay advertencia.
- No complaciente: no felicita por gastar ni maquilla un mal resultado.
- Se habla en primera persona del plural cuando aplica ("ya pagamos"), como un socio.
- Añadir 2–3 ejemplos de mensajes buenos y malos (p. ej., para FR-11 negativo, FR-12 diferencia y FR-17 atrasado) en el addendum o como entrada para el UX.

### H-3 · "Adelantar un gasto previsto no cuenta como gasto nuevo" — Media

**Fuente (brief addendum, Reglas de clasificación):** "**Adelantar un gasto previsto** (p. ej., una llanta en oferta que igual se iba a necesitar) no cuenta como gasto nuevo."

**Estado en el PRD:** no aparece. FR-3 prorratea las anuales "hasta su vencimiento", pero no dice qué pasa si se pagan antes (p. ej., SOAT o una llanta comprada antes de tiempo). Sin la regla, un adelanto se cuenta doble: como Gasto y como reserva que sigue pendiente. Además, si se clasificara como Gusto, movería el Día de Libertad.

**Propuesta:** nuevo FR en el §4.2 (o consecuencia de FR-22/FR-3): "un Gasto puede marcarse como adelanto de una Obligación o presupuesto Esencial previsto; consume esa reserva, no mueve el Día de Libertad ni cuenta como Gusto". Depende de H-1 para el caso de los consumibles.

### H-4 · Regla de oro incompleta: "lo que eliges lo decides tú" — Media

**Fuente (brief addendum):** "'Lo que debes lo paga la app; lo que eliges lo decides tú.'"

**Estado en el PRD:** el §5 solo reinterpreta la primera mitad ("te cita y te recuerda; pagas tú"). La segunda mitad, que la decisión de un Gusto es siempre del usuario, solo queda implícita en FR-15 ("nunca abona por su cuenta"). No se dice que el semáforo **informa y no bloquea**: ¿"Lo compré" está disponible tras un 🔴? ¿Hay fricción o confirmación extra?

**Propuesta:** citar la regla de oro completa en el §1 o el §5 y añadir a FR-18: "'Lo compré' está disponible con cualquier color; la app no bloquea ni pide justificación; registra y muestra el impacto". Esto es coherente con "amable, no complaciente" (H-2).

### H-5 · Lenguaje simple en toda la app — Media

**Fuente (brief, Resumen y Solución):** "me dice, con honestidad y en segundos, cuántos días de libertad gano o pierdo"; veredicto modelo: *"Puedes, pero atrasa tu Día de Libertad 12 días."*
**Fuente (brief addendum):** "Instantáneo y claro."

**Estado en el PRD:** solo FR-20 exige "una frase simple" en el veredicto. Las demás pantallas (Dinero libre negativo, Cuadre, Ritmo de la Meta, "aproximado") no tienen esa regla, y el modelo usa términos internos como "amortización" o "Saldo calculado".

**Propuesta:** dentro de "Voz del socio" (§8): "Todo mensaje al usuario se expresa en una frase corta en pesos o en días, sin jerga financiera; los términos del Glosario son internos salvo Dinero libre, Día de Libertad, Fondo y Colchón."

### H-6 · Riesgo de hábito y "no depender de la fuerza de voluntad" — Media

**Fuente (brief, Riesgos):** "**El hábito de registrar es el riesgo número uno.** … si dejo de registrar, el socio queda ciego. Mitigaciones: registro por foto en segundos, cuadre quincenal que delata lo no registrado y veredictos que valga la pena consultar."
**Fuente (brief memlog):** "usuario responde que es cuestión de iniciativa personal; facilitador lo marca como respuesta delgada… (**diseño debe no depender de la fuerza de voluntad**)".

**Estado en el PRD:** las mitigaciones existen por separado (FR-6 ≤ 3 toques, FR-12 recordatorio de Cuadre, SM-3 como señal de abandono), pero el PRD **no tiene sección de riesgos** y no fija el principio de diseño. Tampoco dice qué pasa si SM-3 se incumple (p. ej., Periodos sin Cuadre ni registros: ¿la app lo dice?). El riesgo de plazo solo vive en una `[NOTA PARA PM]`.

**Propuesta:** añadir una sección "Riesgos" (antes de Preguntas abiertas) con R-1 hábito (mitigaciones → FR-6, FR-7, FR-12, SM-3), R-2 plazo de 3 semanas (→ §6.1) y R-3 precisión de la foto (→ FR-7). Añadir al §8 el principio "ninguna función depende de que el usuario se acuerde: lo que importa se lo pide la app". Opcional: consecuencia en FR-12 si se salta un Cuadre completo (la pantalla principal muestra "sin cuadrar desde…").

### H-7 · Utilidad después de la libertad — Media

**Fuente (brief memlog):** "Meta en secuencia: fase 1 salir de deudas… → fase 2 crecer saldo e invertir; **el producto debe seguir siendo útil tras la libertad**."
**Fuente (brief, Visión):** "MoneyTrack me acompañará más allá del Día de Libertad".

**Estado en el PRD:** inversiones y fase 2 están fuera, y eso es correcto. Pero el modelo v1 depende de una única Deuda objetivo: el §3 define el Impacto en días contra ella y FR-19 lo usa en el semáforo. No se define qué pasa cuando la Deuda objetivo llega a cero (la meta es que ocurra a fines de enero): ¿se elige otra Deuda objetivo? ¿Contra qué se calcula el Impacto en días si no quedan Deudas?

**Propuesta:** consecuencia en FR-17 o FR-2: "al liquidar la Deuda objetivo, la app lo celebra y pide marcar otra Deuda como objetivo; sin Deudas, el Impacto en días se omite y el semáforo usa solo la cobertura (Esenciales, Fondos, Colchón)". Basta con que la v1 no quede rota; la fase 2 sigue fuera.

### H-8 · "Instantánea": sin objetivo para el registro por foto — Baja

**Fuente (brief):** "registra mis gastos casi sin esfuerzo (foto de la factura o un par de toques)"; Riesgos: "registro por foto **en segundos**".

**Estado en el PRD:** hay objetivos para el registro manual (≤ 3 toques, FR-6) y el veredicto (≤ 5 s, FR-20), pero no para la foto (desde la captura hasta la pantalla de confirmación).

**Propuesta:** consecuencia en FR-7: "con conexión, la propuesta extraída aparece en ≤ N s (p. ej., 8 s); si se pasa, se ofrece completar a mano sin perder la foto". También es una restricción para elegir proveedor en el addendum.

### H-9 · Vehículo: "al principio pregunta" — Baja

**Fuente (brief addendum):** "cada gasto de vehículo se asocia a uno concreto. **Al principio la app pregunta a cuál**; luego aprende." (El aprendizaje está en v1.1; la pregunta no.)

**Estado en el PRD:** en FR-6 el Vehículo es opcional y en FR-7 solo se "sugiere". Nada obliga a asociarlo cuando el Gasto es de vehículo, aunque el Glosario dice "Los Gastos de Vehículo se asocian a uno".

**Propuesta:** consecuencia en FR-6/FR-7: "si la categoría es de Vehículo y hay más de uno, la app pide elegirlo antes de guardar". Esto conserva los datos que necesitará el garaje de la v1.1.

### H-10 · Señal de fracaso explícita — Baja

**Fuente (brief, Criterios de éxito):** "**Señal de fracaso:** llegar a fin de enero sin haber liquidado la deuda, o haberlo hecho solo vaciando el colchón."

**Estado en el PRD:** SM-1 la implica, pero no la nombra.

**Propuesta:** una línea bajo SM-1 en el §7: "Fracaso = Deuda objetivo > 0 al 31-ene-2027, o liquidada con algún Cuadre bajo el Colchón."

### H-11 · Día de Libertad "en cuenta regresiva" — Baja

**Fuente (brief):** "De un vistazo: el **Día de Libertad en cuenta regresiva**". Descripción del §4.4 del PRD: "se vuelve una cuenta regresiva visible".

**Estado en el PRD:** FR-11 muestra "Día de Libertad" sin decir el formato (fecha o días restantes).

**Propuesta:** en FR-11, "Día de Libertad como fecha y días restantes".

### H-12 · Orden entre deudas — Baja

**Fuente (brief, Riesgos):** "**Prioridad entre deudas:** confirmar la tasa de cada una para decidir el orden (bola de nieve vs. avalancha)."

**Estado en el PRD:** la Pregunta abierta 1 trata las tasas como dato de configuración, lo cual coincide con el memlog del PRD. Pero la pregunta de fondo, a qué Deuda conviene abonar, no queda ni resuelta ni diferida: la bola de nieve está en el SHOULD del brief y la Deuda objetivo se elige a mano.

**Propuesta:** en el §9, "Orden de abono entre Deudas: lo decide el usuario al marcar la Deuda objetivo; la recomendación bola de nieve/avalancha queda en 'Después' (SHOULD)". Así queda cerrada de forma explícita.

---

## Verificado como cubierto (sin hueco)

- Cero anuncios (§5) · honestidad del cálculo y "aproximado" (§8) · semáforo no complaciente (SM-C2).
- Fondo protegido que no mueve el Día de Libertad (§3, FR-19) · clasificación por defecto (FR-8).
- Veredicto < 5 s y momentos de impulso (FR-20, UJ-2) · confirmación antes de guardar la foto (FR-7).
- Cuadre con "te faltan X sin registrar" (FR-12, UJ-4) · criterio < 5 % (SM-2) · seguimiento por Periodo (FR-17, SM-3).
- Colchón resuelto (4.000.000) · sesión de pagos y "ya pagamos" (FR-21/22) · vencimientos vehiculares (FR-23).
- Fuera de alcance: banco, pagos reales, inversiones, otros usuarios (§5, §6.2).
- Privacidad: qué sale (solo la foto) y proveedor sin entrenamiento (§8, addendum).
