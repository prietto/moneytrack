# Sprint Change Proposal — moneytrack_app

- **Fecha:** 2026-11-11
- **Autor:** Priettos (con el agente Dev, workflow `bmad-correct-course`, modo incremental)
- **Historia que lo detonó:** 1.6 (presupuestos esenciales, fondo enduro y categorías iniciales), ya en `done`
- **Tipo de cambio:** giro estratégico del MVP (Option 3 — MVP Review)
- **Alcance:** Major (PRD, épicas, arquitectura y sprint-status)

---

## 1. Resumen del problema

Después de terminar las historias 1.1 a 1.6, Priettos probó la app en su celular y la encontró **demasiado compleja de entender y de usar**. Para configurar el cálculo de Dinero libre hay que cargar pagos, saldo inicial, colchón, vehículos, obligaciones mensuales y anuales, presupuestos esenciales y fondo enduro, y todo eso antes de registrar el primer gasto.

Lo que de verdad necesita en el MVP es **ir sumando sus gastos de forma inteligente**:

- tomar una foto de la factura y que la app la registre sola (comercio, fecha, total y detalle de ítems);
- dictar una nota de voz y que la IA la convierta en un gasto;
- registrar a mano cuando haga falta;
- en los tres casos, que la IA sugiera la categoría y él solo confirme o corrija;
- ver el total del mes, el gasto por categoría y la lista de gastos.

Los presupuestos, el fondo enduro, las obligaciones, los vehículos y la proyección de Dinero libre son un **plus** que se retoma después.

**Evidencia:** la prueba en el dispositivo después de H1.6 y las palabras del propio usuario: "me está pareciendo demasiado complejo entender y usar la aplicación… para un MVP más que todo necesito ir sumando mis gastos de manera inteligente… el tema de fondos para enduro, para comida y todo eso en realidad es más un plus, siento que nos estamos desviando".

## 2. Análisis de impacto

### 2.1 Épicas

| Épica | Antes | Después |
|---|---|---|
| 1 · Base y configuración | 1.1–1.6 hechas; faltaban 1.7, 1.8 y 1.9 | Se cierra con la nueva **1.10 Simplificar la app para el MVP** y con **1.9 APK**. Se congelan 1.7 y 1.8 |
| 2 · Movimientos | Gasto manual, adelanto, pagos, "ya pagamos", editar y cuadre | **"Registrar y ver mis gastos"**: 2.1 a mano, 2.2 Inicio con resumen, 2.3 lista y detalle, 2.4 editar y borrar. Se congelan adelanto, pagos, "ya pagamos" y cuadre |
| 3 · Deudas y meta | Plan completo | **Congelada** |
| 4 · Facturas con IA | Clave, foto y cola | **"Registrar gastos con IA"**: 4.1 clave y extractor (foto y voz), 4.2 foto con ítems, 4.3 nota de voz (nueva), 4.4 cola sin conexión |
| 5 · Semáforo "¿Puedo?" | Plan completo | **Congelada** |
| 6 · Notificaciones | Plan completo | **Congelada** |
| 7 · Datos | Exportar, restaurar y Drive | **7.1 Exportar** entra al MVP; se congelan 7.2 y 7.3 |

### 2.2 Historias

- **Ya hechas (1.1 a 1.6):** el código se queda. Lo de H1.4 a H1.6 (pagos, colchón, vehículos, obligaciones, presupuestos y fondo) **se oculta sin borrarse** en la 1.10 y se reactiva cuando se descongele.
- **Nuevas:** 1.10, 2.2 (Inicio con resumen), 2.3 (lista y detalle) y 4.3 (nota de voz).
- **Redefinidas:** 2.1 (con `nota` y tabla `gasto_items`), 4.1 (contrato `PropuestaGasto` y `extraerNotaDeVoz`) y 4.2 (con ítems).
- **Renumeradas:** la antigua 2.5 pasa a ser 2.4 y la antigua 4.3 pasa a ser 4.4.

### 2.3 Conflictos con los artefactos

- **PRD:** la visión, los recorridos, §6 (alcance del MVP), los FR, §8 (requisitos no funcionales) y las métricas cambian (ver §4.1).
- **Arquitectura:** cambian AD-1, AD-11, AD-19 y AD-22, la tabla de stack y el capability map, y se agrega una sección "Congelado en el MVP" (ver §4.3).
- **UX (dentro de epics.md):** se reescriben UX-DR3, DR5 y DR14; se congelan DR2, DR6–DR9, DR11 y DR12.
- **Sprint-status:** se agrega el estado `frozen` y cambian las claves (ver §4.4).

### 2.4 Impacto técnico

- **Sin backend.** La IA usa Gemini (`gemini-3.8-flash`) con la clave del usuario guardada en `expo-secure-store`, tal como ya decía AD-12. El proxy sigue diferido. Esto corrige la nota inicial de este workflow, que mencionaba un backend intermediario.
- **Dependencia nueva:** un módulo de grabación de audio de Expo SDK 57. El módulo exacto se verifica con la documentación al crear la historia 4.3.
- **Datos:** una tabla nueva `gasto_items`, la columna `gastos.nota`, el valor `voz` en `origen` y `capturas.tipo` (`foto` o `voz`).
- **Requiere internet** para la foto y la voz. Sin conexión, las capturas quedan en cola (4.4) y el registro a mano siempre funciona.

## 3. Enfoque recomendado

**Opción elegida: Option 3 — MVP Review** (reducir y redefinir el alcance del MVP).

| Opción | Viable | Por qué |
|---|---|---|
| 1 · Ajuste directo | No | Agregar la voz y el resumen sin sacar la configuración mantiene la complejidad que motivó el cambio |
| 2 · Rollback | No | Borrar H1.4 a H1.6 desperdicia trabajo probado; ocultarlo cuesta menos y permite retomarlo |
| 3 · MVP Review | **Sí** | Pone el valor principal (captura inteligente) primero, reutiliza la base de la épica 1 y congela lo demás sin perderlo |

- **Esfuerzo:** medio. Son 11 historias en el MVP y casi todas ya estaban diseñadas.
- **Riesgo:** bajo. No se borra código; la IA ya tenía su decisión de arquitectura; el único riesgo nuevo es la grabación de audio.
- **Cronograma:** el valor llega antes. La primera captura con IA ocurre en la historia 6 del orden (4.2), en vez de esperar a la épica 4 completa.

**Orden del MVP:** 1.10 → 2.1 → 2.2 → 1.9 → 2.3 → 2.4 → 4.1 → 4.2 → 4.3 → 4.4 → 7.1 *(ajustado tras el readiness check del 2026-11-11: editar y borrar antes de la IA)*

## 4. Cambios detallados (aprobados uno por uno)

### 4.1 PRD — `prds/prd-moneytrack_app-2026-10-14/prd.md`

**Propuesta 1 · visión, recorridos y alcance**

- **Visión.** Antes: Dinero libre proyectado a la próxima fecha de pago. Ahora: **registrar gastos sin esfuerzo con IA (foto, voz o a mano) y ver en qué se va la plata del mes**. Dinero libre queda como la evolución que viene después del MVP.
- **Recorridos.**
  - UJ-1 se reescribe: foto de la factura → propuesta con ítems y categoría → confirmar.
  - UJ-5 (nuevo): nota de voz → propuesta → confirmar.
  - UJ-6 (nuevo): abrir Inicio y ver el total del mes, el gasto por categoría y los últimos gastos.
  - UJ-2 a UJ-4 pasan a "después del MVP".
- **§6.1 MVP:** registro manual, por foto y por voz, con categoría sugerida; detalle de ítems; editar y borrar; resumen del mes; categorías; acceso protegido; APK; exportación.
- **§6.2 Congelado:** las capacidades 4.1 y 4.3 a 4.6, el respaldo en Drive y restaurar. Lo construido en H1.4 a H1.6 queda oculto.

**Propuesta 2 · requisitos y métricas**

- **FR-6** se simplifica: la clase de la categoría se copia en silencio al gasto. Se agrega una nota que explica por qué.
- **FR-7:** se agregan los ítems y la categoría sugerida; se quita el vehículo.
- **Nuevas:**
  - FR-31: nota de voz de hasta 60 s; el audio se borra al confirmar o descartar.
  - FR-32: ítems; si la suma no cuadra con el total, la app avisa sin bloquear.
  - FR-33: Inicio con el resumen del mes.
  - FR-34: lista y detalle de gastos.
- **Congeladas:** FR-9 a FR-11.
- **§8 (requisitos no funcionales):** el comportamiento sin conexión aplica a la foto y a la voz; la privacidad cubre fotos y audios; el respaldo se limita a la exportación manual.
- **Métricas:**
  - SM-4: registrar un gasto toma 15 s o menos.
  - SM-5: el 80 % o más de los montos extraídos por la IA no necesitan corrección.
  - SM-6: registrar gastos al menos 5 días por semana.
  - SM-1 a SM-3 pasan a "después del MVP"; se mantiene SM-C1.

### 4.2 Épicas — `epics.md`

**Propuesta 3**

- **Épica 1:**
  - Nueva **1.10 Simplificar la app para el MVP**: ocultar las pantallas de configuración (pagos, colchón, vehículos, obligaciones, presupuestos y fondo); Ajustes queda solo con Categorías, Clave de IA y Exportar; Inicio sin Dinero libre.
  - 1.9 entra al MVP; 1.7 y 1.8 se congelan.
- **Épica 2 "Registrar y ver mis gastos":**
  - 2.1 a mano: tablas `gastos` (con `nota`) y `gasto_items`.
  - 2.2 nueva: Inicio con el resumen; función pura `resumenGastos(gastos, mes)`.
  - 2.3 nueva: lista y detalle.
  - 2.4 (antes 2.5): editar y borrar con rastro visible.
  - Se congelan las antiguas 2.2, 2.3, 2.4 y 2.6.
- **Épica 4 "Registrar gastos con IA":**
  - 4.1: el contrato nuevo, más `extraerNotaDeVoz`.
  - 4.2: foto con ítems.
  - 4.3 nueva: nota de voz.
  - 4.4 (antes 4.3): cola sin conexión, fallos y capturas por confirmar.
- **Épica 7:** 7.1 entra al MVP; 7.2 y 7.3 se congelan.
- **Épicas 3, 5 y 6:** congeladas.
- **UX:**
  - Se reescriben UX-DR3 (Inicio con resumen), DR5 (captura con propuesta e ítems) y DR14.
  - Se congelan DR2, DR6–DR9, DR11 y DR12.
- Se agrega una tabla de equivalencias de numeración vieja → nueva.

### 4.3 Arquitectura — `architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md`

**Propuesta 4**

- **AD-11:**
  - Tipo `PropuestaGasto { monto: entero | null, comercio | null, fecha | null, categoriaId | null, items: { descripcion, monto | null }[] }`.
  - Funciones `extraerFactura(fotoUri, categorias)` y `extraerNotaDeVoz(audioUri, categorias, hoy)`.
  - Gemini recibe la imagen o el audio directamente.
  - Timeout de 10 s para la foto y de 15 s para la voz.
  - Un `categoriaId` desconocido se convierte en `null`.
- **AD-19:**
  - `origen` incluye `voz`.
  - Tabla `gasto_items { id, gastoId, descripcion, monto?, orden }`, guardada en la misma transacción que el gasto.
  - Los ítems son informativos.
  - Se agrega `nota?` al gasto.
- **AD-22:** `capturas { id, tipo: foto | voz, uri, estado, propuesta?, gastoId? }`. El audio se borra al confirmar o descartar.
- **AD-1:** nota de que, en el MVP, Inicio usa `resumenGastos` en lugar de calcular el estado.
- **Stack:** el módulo de audio de SDK 57 se verifica con la documentación en la historia 4.3.
- **Capability map:** fila nueva para la nota de voz.
- **Sección nueva "Congelado en el MVP":** AD-5, AD-6, AD-13, AD-20, AD-21 y la parte de respaldo de AD-14.

### 4.4 Sprint-status — `implementation-artifacts/sprint-status.yaml`

**Propuesta 5**

- **Estado nuevo `frozen`**, que significa "diseñada, fuera del MVP, retomable sin rehacer". Se documenta en las definiciones de estado y `create-story` salta estas historias.
- **Épica 1:**
  - Se agrega `1-10-simplificar-la-app-para-el-mvp: backlog`.
  - 1-9 queda en `backlog`.
  - 1-7 y 1-8 pasan a `frozen`.
- **Épica 2:**
  - `2-1-registrar-un-gasto-a-mano`, `2-2-inicio-con-el-resumen-del-mes`, `2-3-lista-y-detalle-de-gastos` y `2-4-editar-y-borrar-gastos-con-rastro-visible` quedan en `backlog`.
  - El adelanto, los pagos, "ya pagamos" y el cuadre pasan a `frozen` con sus claves originales.
- **Épica 4:**
  - `4-1-clave-de-ia-y-extractor`, `4-2-fotografiar-una-factura-y-confirmar-la-propuesta`, `4-3-nota-de-voz-y-confirmar-la-propuesta` y `4-4-capturas-sin-conexion-fallos-y-por-confirmar` quedan en `backlog`.
- **Épica 7:** 7-1 queda en `backlog`; 7-2 y 7-3 pasan a `frozen`.
- **Épicas 3, 5 y 6:** la épica y sus historias pasan a `frozen`.
- Se agrega un comentario con el orden del MVP.

## 5. Handoff de implementación

**Clasificación: Major.** El replanteamiento es de fondo y toca el PRD y la arquitectura.

| Rol | Responsabilidad |
|---|---|
| PM / Arquitecto (ejecutado en este workflow) | Aplicar las propuestas 1 a 4 en `prd.md`, `ARCHITECTURE-SPINE.md` y `epics.md` |
| PO / Dev | Aplicar la propuesta 5 en `sprint-status.yaml` y respetar el orden del MVP |
| Dev | `bmad-create-story` de **1.10** y luego `dev-story`, siguiendo el orden del MVP |

**Criterios de éxito:**

- Al terminar la 1.10, la app abre en un Inicio sin Dinero libre y Ajustes muestra solo Categorías, Clave de IA y Exportar. Todo pasa `npm run verificar` y lo ocultado sigue en el código.
- Al terminar la 4.3, un gasto se registra por foto o por voz en 15 s o menos (SM-4), con la categoría sugerida.
- Ningún artefacto contradice el nuevo alcance (verificable con `bmad-check-implementation-readiness`).
