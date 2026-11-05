---
title: "MoneyTrack — Intención del producto (brainstorming)"
date: 2026-09-29
source: _bmad-output/brainstorming/brainstorm-moneytrack-finanzas-decisiones-2026-09-29/.memlog.md
status: final
---

# MoneyTrack — Intención

## Visión en una frase
Un socio financiero personal que registra todos mis gastos sin fricción y me dice, con honestidad y en segundos, si puedo darme un gusto y cuándo seré libre de deudas.

## Problema y por qué
- Uso personal: organizar mis finanzas, decidir compras con criterio y tener proyecciones fáciles y rápidas.
- La deuda bancaria duele de verdad ("me carcome cada noche"). La app debe dar tranquilidad, no solo números.
- No sé qué métrica mirar. Quiero saber de un vistazo si vamos bien o vamos a números rojos.
- Es tedioso recordar vencimientos de varios vehículos y pagar obligaciones dispersas en muchos portales.
- Contexto Colombia: arriendo, quincenas, SOAT, tecnomecánica, impuesto vehicular, declaración de renta.

## El alma del producto
**Registro de todos los gastos + aviso de la fecha de libertad de deudas.**
- Bucle central: registro (entrada) → Día de Libertad (salida). Cada movimiento muestra su impacto en la fecha ("este domicilio: +1 día", "este abono: −9 días").
- Sin datos el socio queda ciego: el registro sin fricción (foto + voz) es la base de todo lo demás.

## Concepto clave: "el socio"
"Nos" = la app y yo (no son finanzas compartidas con otra persona). La app es un cómplice en las decisiones.
- Su salud se ve como la de un personaje: feliz y sano cuando las finanzas van bien, enfermo y con colores de alerta cuando van mal.

**Principios**
- **Honestidad total:** nunca maquilla la realidad ni da falsos positivos.
- **Amable, no complaciente:** celebra y no culpa, pero mantiene una presión sana hacia el Día de Libertad.
- **Regla de oro:** lo que debes lo paga la app; lo que eliges lo decides tú. La app nunca compra nada por mí.
- **Cero anuncios.** **Instantánea** (veredicto en segundos). **Clara** (lenguaje simple, basta un vistazo).
- Alertas oportunas ante cada movimiento relevante.

## Modelo mental
- **Un solo motor, varias caras:** semáforo, pronóstico del clima, salud del socio y Día de Libertad son vistas del mismo cálculo: el *dinero libre proyectado en el tiempo*. Esto simplifica la v1.
- **El tiempo como columna vertebral:** MoneyTrack es una línea de tiempo del dinero, no un libro contable. Quincenas, vencimientos, la fecha del sí y el Día de Libertad viven en la misma línea.
- **Jerarquía de gasto:** esenciales (arriendo, comida, deudas bancarias, servicios, vencimientos previstos) + metas de ahorro ("facturas a mí mismo") se apartan **antes** de calcular el dinero libre para gustos.
- Un impulso no siempre es malo: comprar en oferta algo que igual se iba a necesitar (p. ej., una llanta de moto) es adelantar un gasto previsto, no un gasto nuevo.

## Alcance (MoSCoW final)
> El registro por foto y por nota de voz los agregó el usuario a MUST v1 al final de la sesión, y prevalecen sobre las listas anteriores.

**MUST (v1)**
- **Registro inteligente por foto:** de una factura, recibo o comprobante deduce el monto, el comercio, la categoría y el activo o meta (p. ej., una moto). Es la pieza central.
- **Registro por nota de voz:** "llanta 180 mil moto azul" → gasto registrado.
- **Registro rápido manual:** anotar un gasto en unos 3 segundos.
- **Esenciales + metas apartados primero** antes del dinero libre.
- **Veredicto de compra con semáforo:** verde, amarillo o rojo, según si los esenciales del mes y las metas siguen cubiertos después de la compra.
- **Pronóstico del clima de fin de mes:** "soleado: cierras con +20.000" / "tormenta: el 24 te quedas corto 50.000". Se recalcula a diario.
- **Día de Libertad + puntaje 0–100 %:** cuenta regresiva a la fecha sin deudas, que se actualiza en vivo.
- **Recordatorios de vencimientos con "ya pagué":** obligaciones y documentos de vehículos.
- **Socio con salud básica + honestidad.**

**SHOULD**
- Plan B ante un "no": la **fecha del sí** ("en 23 días, tras tu quincena") y el **costo real en cuotas con TC** (precio final con intereses e impacto en los meses futuros).
- Recalcular la ruta tras un impulso: reacomoda el mes y protege las metas.
- Bola de nieve (la cuota liberada pasa a la siguiente deuda o a una meta grande) y celebraciones de cada adelanto del Día de Libertad.
- Simulador de gasto hormiga ("¿y si dejo Temu/AliExpress?").
- **Garaje financiero:** ficha por moto con sus gastos, calendario de vencimientos (SOAT, tecnomecánica, impuesto) y costo por mes/km.
- Libreta de deudas personales (a quién le debo y si ya le pagué).
- Validación posterior a la compra (¿fue una compra inteligente?, ¿cuánto ahorré?).

**COULD**
- Gustos ganados por disciplina, fondo de oportunidades para ofertas, síntomas y medicinas del socio, nivel de exigencia (relajado / equilibrado / sargento), comparador de cocinar vs. comer fuera, tablero de ingresos extra + inventario de cosas vendibles + diagnóstico de "dosis" de ingreso faltante, impuestos y renta, negociación de la compra.

## Fuera de alcance v1 y por qué
- **Pagos reales desde la app / piloto automático de obligaciones** y **conexión bancaria automática.** Quedan para la fase 2 por la integración bancaria, la regulación y la seguridad. La v1 usa recordatorios + "ya pagué". El usuario aprobó posponerlos.

## Preguntas abiertas para el brief
- Entrada de datos además de foto y voz: ¿manual solamente, o también SMS o correos bancarios? ¿Cómo se cargan las deudas y los ingresos iniciales?
- Seguridad y privacidad de los datos financieros (y de las fotos y audios).
- Plataforma: ¿móvil, web o ambas?
- Procesamiento de foto y voz: ¿en el dispositivo o en la nube? ¿Qué precisión se espera y cómo se corrige un error?
- Modelo de cálculo del Día de Libertad: tasas, cuotas y prioridad entre varias deudas.
