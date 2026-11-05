---
title: "Addendum: MoneyTrack"
created: 2026-09-30
updated: 2026-10-14
---

# Addendum — MoneyTrack

Material de apoyo para el PRD y la arquitectura que no cabe en el brief.

## Principios del socio (del brainstorming)

- Honestidad total.
- Amable, pero no complaciente.
- "Lo que debes lo paga la app; lo que eliges lo decides tú."
- Cero anuncios.
- Instantáneo y claro.

## Reglas de clasificación acordadas

- **Esenciales del vehículo:** mantenimiento y consumibles (aceite, pastillas de freno, llantas de uso, mantenimiento del carro), SOAT, tecnomecánica e impuesto vehicular.
- **Fondo enduro (protegido):** equipo de protección (botas, pechera, uniforme) y accesorios.
  - Se aparta cada mes, como una meta.
  - Un gasto dentro del fondo **no** mueve el Día de Libertad; solo lo atrasa lo que se sale del fondo.
- **Adelantar un gasto previsto** (p. ej., una llanta en oferta que igual se iba a necesitar) no cuenta como gasto nuevo.
- **Asignación por vehículo:** hay varias motos y un carro; cada gasto de vehículo se asocia a uno concreto. Al principio la app pregunta a cuál; luego aprende.

## Dos momentos del veredicto

- **Antes de comprar:** consulta por pantallazo, nota de voz o precio escrito (v1: solo precio escrito) → semáforo + impacto en días.
  - Objetivo: menos de 5 segundos; si tarda más, pierde contra el botón "Comprar".
  - Momentos de impulso identificados: tras la quincena, de noche en apps (Mercado Libre, Temu, Rappi) y con amigos.
- **Después de comprar:** foto o voz → registro + impacto aplicado.

## Panorama competitivo

> Investigación web del 30 sep 2026. Cifras sin verificar en fuente primaria.

| Pieza | Quién ya lo hace | Nota |
|---|---|---|
| Registro IA por foto/voz | Bili, AI Money (WhatsApp, Colombia); Finvot (lee notificaciones bancarias) | Gratis o freemium; menos fricción que abrir una app |
| Dinero libre para gastar | PocketGuard ("Leftover") | Solo EE. UU. (Plaid) |
| Fecha libre de deudas | Undebt.it, Debt Payoff Planner | Ingreso manual; sin gasto diario ni puntaje |
| Vencimientos vehiculares | R5, Flota Inteligente | Consulta por placa |
| Mascota financiera | Accompanied, Bread | Nicho anglosajón |
| Presupuesto bancario | Nequi (bolsillos, metas), Bancolombia "Día a Día" | Solo ve su propio dinero |

Ningún producto encontrado reúne la combinación completa: dinero libre tras esenciales + fondos protegidos + semáforo en días de libertad + vehículos colombianos + sin anuncios ni banco.

## Notas técnicas y regulatorias

- **Costo de IA multimodal:** una foto de recibo (~1–2k tokens de entrada + ~300 de salida) cuesta del orden de US$0,0003–0,003 con modelos tipo Flash/Flash-Lite. Los precios cambian; verificar al elegir proveedor.
- **Factura electrónica DIAN:** el Documento Equivalente Electrónico POS trae CUFE y un QR de consulta; posible entrada estructurada. Sin verificar si el QR incluye el monto. Las compras en tiendas informales y en efectivo siguen sin factura.
- **Ventaja local posible:** el QR/CUFE de la DIAN y los pantallazos de Nequi/Daviplata como entradas de primera clase.
- **Finanzas abiertas:** son obligatorias por el Decreto 368 de 2026, pero el cronograma de estandarización y el directorio de participantes se extienden a 2027–2028.
- **Datos personales:** la Ley 1581 de 2012 aplica si hay otros usuarios; para uso personal, el riesgo es bajo. Si se envían recibos a APIs fuera de Colombia, considerar la Circular SIC 003/2025 (transferencias internacionales).

## Hoja de ruta estacionada (del brainstorming del 29 sep 2026)

- **SHOULD:** fecha del sí y costo real en cuotas con tarjeta de crédito; recalcular la ruta tras un impulso; bola de nieve y celebraciones; simulador de gasto hormiga; libreta de deudas personales; validación posterior a la compra.
- **COULD:** gustos ganados por disciplina; fondo de oportunidades; síntomas y medicinas del socio; nivel de exigencia (relajado / equilibrado / sargento); comparador cocinar vs. comer fuera; tablero de ingresos extra; impuestos y renta; negociación de compras.
- **Visión:** búsqueda del mismo producto más barato; inversiones; conexión bancaria; apertura a otros usuarios.
