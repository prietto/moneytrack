---
title: "Addendum: PRD MoneyTrack v1"
created: 2026-10-14
updated: 2026-10-22
---

# Addendum — PRD MoneyTrack v1

Detalle para arquitectura y pruebas que no pertenece al PRD. Los términos son los del Glosario del PRD (§3).

## Decisiones y restricciones técnicas conocidas

- **Plataforma:** solo Android (celular del usuario). Datos locales en el dispositivo.
- **Extracción por foto:** LLM multimodal en la nube (Gemini, Claude u otro) con salida JSON estructurada (monto, comercio, fecha, categoría, Clase de gasto sugerida, Vehículo sugerido). Costo estimado en el brief: del orden de US$0,0003–0,003 por foto con modelos tipo Flash; verificar al elegir. Proveedor con política de no entrenamiento sobre datos de API.
- **Clave de API (resuelto en arquitectura, AD-11/AD-12):** sin backend; el usuario ingresa su clave, que vive en el almacenamiento seguro del celular. Un proxy queda diferido hasta que haya otros usuarios.
- **Cola sin conexión:** fotos pendientes de extracción se guardan y se reintentan al recuperar conexión (FR-7).
- **Notificaciones locales:** Sesión de pagos (FR-25), recordatorio de Cuadre (FR-14), vencimientos anuales (FR-27).
- **Calendario:** día inexistente en el mes → último día del mes (FR-1). Los Pagos no se ajustan por fines de semana: el usuario confirma el Pago real (FR-11).
- **Futuro, no v1:** QR/CUFE de la factura electrónica DIAN como entrada estructurada; pantallazos de Nequi/Daviplata.

## Caso de aceptación: Dinero libre (cifras inventadas)

**Estado al 3 de noviembre.** Saldo calculado 10.000.000. Colchón 4.000.000. Horizonte: 3-nov → 4-dic.
Deuda objetivo: saldo 6.000.000, cuota 1.000.000 el día 5. Cuotas programadas hasta el 31-ene (5-nov, 5-dic, 5-ene): 3.000.000. Periodos restantes, contando el actual: 6. **Ritmo de la Meta = (6.000.000 − 3.000.000) ÷ 6 = 500.000.**
Reservas actuales: fondo enduro 350.000 + reserva anual 400.000 + reserva de Meta 500.000 (Ritmo de la Meta del Periodo, aún no abonado) = **1.250.000**.
Presupuesto esencial pendiente de noviembre: comida 700.000 + mantenimiento 400.000 = 1.100.000.

| Día | Movimiento | Saldo proyectado |
|---|---|---|
| 3-nov | Inicio: 10.000.000 − 1.250.000 Reservas | 8.750.000 |
| 3-nov | − Presupuesto esencial pendiente de noviembre 1.100.000 | 7.650.000 |
| 5-nov | − Cuotas (Deuda objetivo 1.000.000 + otra Deuda 1.000.000) | 5.650.000 |
| 8-nov | − Servicios 300.000 | **5.350.000** ← mínimo |
| 10-nov | + Pago 1 2.000.000 − Aporte programado de Meta 500.000 | 6.850.000 |
| 30-nov | + Pago 2 6.000.000 − Aportes programados (fondo enduro 350.000 + prorrateo anual 150.000 + Meta 500.000) | 11.850.000 |
| 1-dic | − Presupuesto esencial de diciembre 1.200.000 − arriendo 1.500.000 | 9.150.000 |

**Dinero libre = 5.350.000 − 4.000.000 = 1.350.000.**

## Caso de aceptación: Semáforo (mismo estado, umbral 7 días, cuota de la Deuda objetivo 1.000.000)

| Consulta | R (fuera del Fondo protegido) | Impacto en días | Resultado |
|---|---|---|---|
| Comida afuera 120.000 | 120.000 | ⌈120.000 / 1.000.000 × 30⌉ = 4 | 🟢 |
| Botas 600.000, fondo enduro (saldo 350.000) | 250.000 | ⌈7,5⌉ = 8 | 🟡 (≥ 7 días) |
| Casco 1.500.000 | 1.500.000 | 45 | 🟡 (supera 1.350.000, cabe con reserva de Meta: 1.350.000 + 500.000 = 1.850.000) |
| Llantas nuevas de "gusto" 2.000.000 | 2.000.000 | 60 | 🔴 (supera 1.850.000: tocaría Obligaciones o Colchón) |

## Nota sobre Impacto en días

Es un modelo **lineal** (monto ÷ cuota mensual de la Deuda objetivo × 30, redondeado hacia arriba), estable y comparable con el umbral. La Fecha de la Meta proyectada y el Día de Libertad usan el **cronograma real** de cuotas, que es discreto: un Abono pequeño puede no mover la fecha de calendario hasta cruzar el monto de una cuota. Ambos números se muestran con su propio significado; no deben mezclarse.
