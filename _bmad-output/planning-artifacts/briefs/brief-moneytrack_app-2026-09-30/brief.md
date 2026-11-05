---
title: "Product Brief: MoneyTrack"
status: final
created: 2026-09-30
updated: 2026-10-14
---

# Product Brief: MoneyTrack

## Resumen ejecutivo

MoneyTrack es una app móvil personal que funciona como mi socio financiero: registra mis gastos casi sin esfuerzo (foto de la factura o un par de toques) y me dice, con honestidad y en segundos, cuántos días de libertad gano o pierdo con cada decisión.

Nace de un problema simple: gano bien, pero no sé cuánto me queda libre. La meta inmediata es liquidar una deuda de unos 6 millones antes de que termine enero de 2027 sin vaciar mis ahorros; la de largo plazo, quedar libre de deudas y empezar a invertir. La construyo yo mismo, en unas cuatro semanas para una primera versión usable, sin anuncios ni suscripciones.

## El problema

Gano bien —unos 8 millones al mes— y aun así **no sé cuánto me queda libre**. Unos 2 millones se van en cuotas de deudas bancarias; el resto lo voy restando de cabeza a medida que pago y compro, sin ningún registro.

Esa cuenta mental falla justo donde más duele: el enduro, con su equipo, y los consumibles de varias motos y un carro son un frente de gasto permanente que nunca he sumado, y a eso se agregan salidas y comidas afuera. Ninguna compra parece grave en el momento, pero sumadas son **compras impulsivas** —tras la quincena, de noche desde el celular, con amigos— que se comen el margen que debería estar pagando deudas más rápido y, después, haciendo crecer la cuenta para invertir.

El costo: el dinero libre se diluye sin que sepa en qué, las deudas tardan más de lo necesario, decido a ciegas si puedo darme un gusto y la deuda pesa cada noche sin datos para ver si mejoro. Lo que no se mide no se puede mejorar, y hoy no mido nada.

## La solución

Todo sale de un solo cálculo: **el dinero libre proyectado en el tiempo.** Primero se apartan los esenciales (arriendo, comida, servicios, cuotas de deuda y mantenimiento de los vehículos), las metas de ahorro y los fondos protegidos (como el fondo enduro). Lo que queda es lo que puedo gastar en gustos sin poner nada en riesgo.

Funciona en tres momentos:

- **Antes de comprar — el veredicto.** Pregunto "¿puedo comprar esto?" —con un pantallazo de la publicación, una nota de voz o escribiendo el precio— y recibo un semáforo con su impacto: *"Puedes, pero atrasa tu Día de Libertad 12 días."* Si la compra cabe en un fondo protegido, no atrasa nada; solo frena lo que se sale de él.
- **Después de comprar — el registro.** Foto de la factura o nota de voz: la app entiende el concepto, el monto y a qué vehículo pertenece —al principio pregunta, luego aprende— y me muestra cómo se movió la fecha.
- **Los días de pago — la sesión de pagos.** La app agenda un momento para pagar juntas todas las obligaciones (deudas, servicios, SOAT, tecnomecánica, impuestos) y voy confirmando "ya pagamos".

De un vistazo: el **Día de Libertad** en cuenta regresiva, el **pronóstico del fin de mes** y la **salud del socio**, un personaje que se ve sano cuando voy bien y enfermo cuando me acerco a números rojos.

## Qué lo hace diferente

Siendo honesto: casi ninguna pieza es nueva. El registro por foto y voz con IA ya existe gratis en Colombia (Bili, AI Money), igual que el dinero libre para gastar (PocketGuard, solo EE. UU.), la fecha libre de deudas (Undebt.it) y las alertas vehiculares (R5); el panorama completo está en el addendum. **El registro inteligente, por sí solo, no diferencia.** Lo que no encontré en ninguna parte es la combinación, en particular:

- **Cada decisión traducida a tiempo de libertad.** Las demás apps muestran en qué gasté; MoneyTrack me dice *cuántos días me cuesta* lo que voy a hacer.
- **Fondos protegidos para lo que me apasiona.** El socio no me culpa por el enduro; solo frena cuando me salgo de su presupuesto.
- **Hecha para mi vida en Colombia.** Quincenas, varios vehículos con sus gastos e impuestos, y una sesión de pagos en lugar de veinte recordatorios.

**Por qué construirla y no combinar apps existentes:** soy desarrollador y puedo hacerla yo mismo; no quiero pagar suscripciones ni aceptar publicidad: en una app que existe para que gaste menos, un anuncio es un conflicto de interés. La monetización solo se discutiría si algún día se abre a otras personas.

## Para quién es

Para mí: un profesional en Colombia con buen ingreso, deudas bancarias, varios vehículos, una pasión costosa (enduro) y ningún control sobre a dónde se va la plata. La v1 no se diseña para nadie más.

## Criterios de éxito

Punto de partida (30 sep 2026): no sé cuánto me queda libre, no registro nada y pago ~2 millones al mes en cuotas.

| Tipo | Criterio | Cuándo |
|---|---|---|
| **Resultado** | Liquidar la deuda de ~6 millones **sin que mi capital baje de [X — por definir]**: la plata debe salir de gastos recuperados, no de vaciar los ahorros. | Fin de enero de 2027 |
| **La app funciona** | Al cierre de cada mes, el capital que calcula la app y mi saldo real difieren en **menos del 5 %**. | Mensual, desde noviembre de 2026 |
| **Señal temprana** | Cada quincena veo si voy al día con la meta; si voy atrasado, todavía hay tiempo de corregir. | Quincenal |

**Señal de fracaso:** llegar a fin de enero sin haber liquidado la deuda, o haberlo hecho solo vaciando el colchón.

## Alcance

**v1 — primera versión en mi celular (~fin de octubre de 2026, 4 semanas)**
1. **Configuración inicial:** ingresos y quincenas, deudas (con su tasa), esenciales, fondo enduro y vehículos.
2. **Registro:** manual rápido y por foto de factura con IA, asignando el vehículo cuando aplica.
3. **Dinero libre + cuadre quincenal:** ingreso mi saldo real del banco y la app me muestra la diferencia con lo calculado ("te faltan 180 mil sin registrar").
4. **Meta de los 6 millones** con avance quincenal y **Día de Libertad** básico.
5. **Veredicto con semáforo** escribiendo el precio, con su impacto en días de libertad.
6. **Sesión de pagos:** un momento agendado para pagar todas las obligaciones y confirmar "ya pagamos".

**v1.1 — semanas siguientes:** nota de voz, consulta por pantallazo, pronóstico de fin de mes, el socio-personaje con su salud, aprendizaje automático de qué gasto va a qué vehículo y garaje completo (costo por mes y por km).

**Fuera de alcance (y por qué)**
- **Conexión bancaria y pagos reales desde la app:** por integración, regulación y seguridad; además, las APIs de finanzas abiertas en Colombia no estarán listas antes de 2027–2028. La v1 usa el cuadre manual y "ya pagamos".
- **Inversiones:** son la fase 2, cuando las deudas estén bajo control.
- **Otros usuarios, monetización y anuncios:** la v1 es personal y sin anuncios.

## Riesgos y preguntas abiertas

- **El hábito de registrar es el riesgo número uno.** Nunca he llevado mis finanzas; sin conexión bancaria, si dejo de registrar, el socio queda ciego. Mitigaciones: registro por foto en segundos, cuadre quincenal que delata lo no registrado y veredictos que valga la pena consultar.
- **Precisión de la foto:** ¿qué hago cuando la IA lee mal un monto o un comercio? Debe haber una confirmación rápida antes de guardar.
- **Privacidad:** las fotos de facturas y los datos financieros saldrían a una API de IA en la nube. Hay que decidir qué se envía, qué se guarda y dónde.
- **Colchón mínimo (X):** cuánto capital no debe tocarse para pagar la deuda. Por definir.
- **Prioridad entre deudas:** confirmar la tasa de cada una para decidir el orden (bola de nieve vs. avalancha).
- **Plataforma concreta:** Android, iOS o ambas, y la tecnología, se deciden en arquitectura.

## Visión

Si funciona, MoneyTrack me acompañará más allá del Día de Libertad: la misma línea de tiempo pasará de proyectar deudas a proyectar ahorro e inversión. Con el tiempo podría buscarme el mismo producto más barato, conectarse al banco cuando Colombia tenga finanzas abiertas y abrirse a otras personas en mi situación, sin perder el principio de que el socio está de mi lado, no del de quien me quiere vender algo.
