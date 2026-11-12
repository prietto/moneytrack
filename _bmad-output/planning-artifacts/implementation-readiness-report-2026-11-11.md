---
stepsCompleted: [step-01-document-discovery, step-02-prd-analysis, step-03-epic-coverage-validation, step-04-ux-alignment, step-05-epic-quality-review, step-06-final-assessment]
filesIncluded:
  - prds/prd-moneytrack_app-2026-10-14/prd.md
  - prds/prd-moneytrack_app-2026-10-14/addendum.md
  - architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md
  - epics.md
  - sprint-change-proposal-2026-11-11.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-11-11
**Project:** moneytrack_app

## PRD Analysis

Fuente: `prds/prd-moneytrack_app-2026-10-14/prd.md` (actualizado 2026-11-11, cambio de rumbo) + `addendum.md`. Cada FR lleva su estado según el PRD: **MVP** o **Congelada**.

### Functional Requirements

- **FR-1 [Congelada]: Pagos.** El usuario registra sus dos Pagos con día del mes y monto esperado. *Consecuencia:* si el día no existe en el mes, se usa el último día del mes.
- **FR-2 [Congelada]: Deudas y Meta.** El usuario registra cada Deuda (nombre, saldo, cuota, día de pago, tasa opcional) y marca una como Deuda objetivo con su fecha de Meta. *Consecuencias:* las cuotas se generan como Obligaciones mensuales; si una Deuda no tiene tasa, sus proyecciones se marcan "aproximado".
- **FR-3 [Congelada]: Obligaciones y Presupuestos esenciales.** El usuario registra Obligaciones mensuales y anuales (por Vehículo) y los montos de los Presupuestos esenciales (comida, mantenimiento de vehículos).
- **FR-4 [Congelada]: Fondo enduro, Colchón y saldo inicial.** El usuario fija el aporte mensual al fondo enduro, el Colchón (default 4.000.000) y el Saldo real inicial.
- **FR-5 [Congelada]: Vehículos.** El usuario registra sus Vehículos con un nombre (p. ej. "Moto azul", "Carro").
- **FR-6 [MVP]: Registro manual.** El usuario registra un Gasto con monto, categoría, fecha (default hoy) y, opcionalmente, comercio y nota. La Clase de gasto se copia en silencio de la categoría; el usuario no la elige. *Consecuencia:* con una categoría reciente, se completa en ≤ 3 toques tras escribir el monto. *Nota:* la Clase se sigue guardando para que el Dinero libre, al descongelarse, no requiera migrar datos.
- **FR-7 [MVP]: Registro por foto.** El usuario fotografía una factura o recibo; la IA extrae monto, comercio, fecha y detalle de ítems, y sugiere la categoría. *Consecuencias:* siempre hay una pantalla de confirmación editable; nada se guarda sin confirmar; si la extracción falla o no hay conexión, la foto queda guardada y el usuario completa a mano (o se reintenta al volver la conexión). La propuesta aparece en ≤ 10 s con conexión.
- **FR-8 [MVP]: Clasificación por defecto.** Mantenimiento y consumibles de Vehículo → Esencial (Presupuesto esencial de mantenimiento de vehículos); equipo y accesorios de enduro → Fondo protegido; el resto → Gusto. El usuario puede cambiarlo.
- **FR-9 [Congelada]: Adelanto de gasto previsto.** Un Gasto Esencial que excede su Presupuesto esencial del mes (p. ej. una llanta en oferta comprada antes de tiempo) se marca como adelanto y el exceso se descuenta del Presupuesto esencial del mes siguiente, no como Gusto.
- **FR-10 [Congelada]: Impacto al guardar.** Tras guardar, la app muestra el Dinero libre restante y, si aplica, el Impacto en días.
- **FR-11 [Congelada]: Confirmar Pago y Otros ingresos.** El usuario confirma cada Pago con el monto recibido y registra Otros ingresos. *Consecuencia:* mientras un Pago no se confirme, el Saldo calculado no lo incluye y el Saldo proyectado lo sigue tratando como esperado.
- **FR-12 [MVP]: Editar y borrar.** El usuario puede editar o borrar cualquier Gasto (incluidos sus ítems); todo se recalcula.
- **FR-31 [MVP]: Registro por nota de voz.** El usuario graba una nota de voz de hasta 60 s; la IA la interpreta y propone monto, comercio, fecha, ítems y categoría. *Consecuencias:* misma pantalla de confirmación editable que FR-7; nada se guarda sin confirmar; el audio se borra al confirmar o descartar; sin conexión, la nota queda en cola. La propuesta aparece en ≤ 15 s con conexión.
- **FR-32 [MVP]: Detalle de ítems.** Un Gasto puede tener una lista de ítems (descripción y monto opcional), extraída por la IA o escrita a mano. Los ítems son informativos: el monto del Gasto manda. *Consecuencia:* si los ítems con monto no suman el total, la app lo avisa sin bloquear el guardado.
- **FR-33 [MVP]: Inicio con el resumen del mes.** La pantalla principal muestra el total gastado en el mes en curso, el gasto por categoría (de mayor a menor) y los últimos Gastos. *Consecuencia:* se actualiza al guardar, editar o borrar un Gasto.
- **FR-34 [MVP]: Lista y detalle de Gastos.** El usuario ve la lista de Gastos del mes (más reciente primero) y, al tocar uno, su detalle: monto, fecha, comercio, categoría, origen (manual, foto o voz), nota e ítems.
- **FR-13 [Congelada]: Pantalla principal.** Muestra Dinero libre, Saldo calculado, Avance y Ritmo de la Meta, Fecha de la Meta proyectada (cuenta regresiva en días), Día de Libertad, saldo del fondo enduro y Obligaciones vencidas. *Consecuencia:* si el Dinero libre es negativo, se muestra en rojo con el día del faltante y el monto.
- **FR-14 [Congelada]: Cuadre.** El usuario ingresa su Saldo real; la app muestra la diferencia con el Saldo calculado y la registra, con su confirmación, como Gasto sin registrar u Otro ingreso. *Consecuencia:* la app pide un Cuadre al confirmar cada Pago; si no se hace, lo recuerda al día siguiente.
- **FR-15 [Congelada]: Historial de Cuadres.** La app guarda cada Cuadre con su diferencia en monto y porcentaje. Valida SM-2.
- **FR-16 [Congelada]: Proyecciones.** La app calcula la Fecha de la Meta proyectada y el Día de Libertad, y los recalcula con cada cambio.
- **FR-17 [Congelada]: Abono.** El usuario registra un Abono a cualquier Deuda; baja el saldo de la Deuda y el Saldo calculado. La app nunca abona por su cuenta.
- **FR-18 [Congelada]: Reserva de Meta.** En cada Periodo la app reserva el Ritmo de la Meta como Aporte programado; los Abonos a la Deuda objetivo consumen esa reserva de Meta. Reservar no es abonar.
- **FR-19 [Congelada]: Ritmo y aviso.** Al confirmar un Pago o hacer un Cuadre, la app muestra el Ritmo de la Meta del Periodo, lo ya abonado y "al día" o "atrasado X". *Consecuencia:* si el Ritmo de la Meta no cabe sin bajar del Colchón, lo dice explícitamente.
- **FR-20 [Congelada]: Meta cumplida o vencida.** Al llegar la Deuda objetivo a cero, la app lo celebra y pide elegir la siguiente Deuda objetivo y su fecha; mientras no se elija, el Semáforo muestra color sin Impacto en días. Si pasa la fecha sin cumplirse, la Meta queda "vencida" y la app pide una nueva fecha.
- **FR-21 [Congelada]: Consulta.** El usuario escribe un precio y, opcionalmente, elige un Fondo protegido. La consulta no registra Gasto. *Consecuencia:* con cualquier color, "Lo compré" la convierte en Gasto con un toque.
- **FR-22 [Congelada]: Reglas del Semáforo.** Sea R la parte del precio que no cubre el saldo del Fondo protegido elegido.
- **FR-23 [Congelada]: Respuesta.** El veredicto muestra color, Dinero libre resultante e Impacto en días en una frase simple. *Consecuencia:* desde abrir la app hasta ver el veredicto, ≤ 5 s.
- **FR-24 [Congelada]: Registro de veredictos.** La app guarda cada consulta (fecha, monto, color, si se compró). Permite observar SM-C2.
- **FR-25 [Congelada]: Agendar.** El usuario agenda una Sesión de pagos por Periodo (default: el día siguiente a cada Pago, hora configurable) y recibe una notificación.
- **FR-26 [Congelada]: Lista y "ya pagamos".** La Sesión de pagos lista las Obligaciones pendientes hasta el próximo Pago; marcar "ya pagamos" registra el Gasto con su monto (editable). Si es una cuota, baja el saldo de la Deuda; si es anual, libera su reserva anual. *Consecuencia:* una Obligación vencida sin marcar sigue visible como vencida en la pantalla principal.
- **FR-27 [Congelada]: Vencimientos anuales.** La app avisa 30 y 7 días antes del vencimiento de cada Obligación anual de Vehículo.

**Derivadas en epics.md de PRD §8 (no numeradas en el PRD):**
- **FR28 [MVP]:** Exportación manual de todos los datos a un archivo (`MoneyTrackExport`).
- **FR29 [Congelada]:** Respaldo automático opcional en Google Drive.
- **FR30 [Congelada]:** Restaurar desde un archivo o desde Drive.

Total FRs: 34 (9 en el MVP, 25 congeladas).

### Non-Functional Requirements

- **NFR-1 Voz del socio (usabilidad):** todo texto honesto, amable y no complaciente; lenguaje simple, sin jerga.
- **NFR-2 Honestidad del cálculo:** ningún redondeo a favor; datos faltantes → "aproximado".
- **NFR-3 Sin conexión (fiabilidad):** todo funciona sin internet excepto la extracción por foto y por voz, que se encolan; el registro a mano siempre funciona.
- **NFR-4 Privacidad (seguridad):** datos locales; solo salen la foto o el audio hacia un proveedor de IA que no entrena con datos; el audio se borra al confirmar o descartar; acceso con bloqueo del teléfono o biometría.
- **NFR-5 Respaldo:** en el MVP, solo exportación manual; Drive y restaurar congelados.
- **NFR-6 Moneda y formato:** COP sin decimales, punto como separador de miles.
- **NFR-7 Rendimiento de captura:** propuesta por foto ≤ 10 s (FR-7) y por voz ≤ 15 s (FR-31) con conexión; registro manual ≤ 3 toques tras el monto (FR-6).
- **NFR-8 Rendimiento de la decisión (congelada):** veredicto del Semáforo ≤ 5 s (FR-23).

Total NFRs: 8 (7 aplican al MVP).

### Additional Requirements

- **Plataforma:** solo Android; datos locales (addendum).
- **IA sin backend:** clave del usuario en almacenamiento seguro; proxy diferido (addendum, AD-11/AD-12).
- **Fuera del producto (§5):** no mueve dinero, no bloquea compras, no se conecta al banco, sin cuentas ni iOS/web.
- **Métricas del MVP:** SM-4 (≤ 15 s por foto o voz), SM-5 (≥ 80 % de montos sin corrección), SM-6 (registro ≥ 5 días por semana); contra-métrica SM-C1.
- **Casos de aceptación del addendum** (Dinero libre = 1.350.000 y tabla del Semáforo): aplican solo a funciones congeladas.

### PRD Completeness Assessment

El PRD está completo y es coherente con el nuevo alcance: cada FR del MVP tiene consecuencias verificables, y lo congelado está marcado explícitamente. Observaciones:

1. **Addendum desactualizado:** la viñeta "Extracción por foto" todavía describe la salida JSON con "Clase de gasto sugerida" y "Vehículo sugerido", y no menciona la voz ni los ítems. Contradice AD-11 actualizado y FR-7/FR-31.
2. **Numeración con hueco:** el PRD salta de FR-27 a FR-31; FR28–FR30 solo existen en epics.md (derivadas de §8). Es trazable, pero conviene una nota en el PRD.
3. **SM-5 sin forma de medición definida:** "≥ 80 % de montos sin corrección" requiere comparar la propuesta con lo guardado; ninguna FR dice que se registre esa comparación.
4. **FR-8 (clasificación por defecto)** sigue en el MVP aunque la Clase es invisible: es correcto (la Clase se guarda), pero sus reglas mencionan Presupuestos y Fondos congelados.

## Epic Coverage Validation

Fuente: `epics.md`, sección "FR Coverage Map" (actualizada 2026-11-11), contrastada con las historias del cuerpo.

### Coverage Matrix — FR del MVP

| FR | Requisito (PRD) | Cobertura en épicas | Estado |
| --- | --- | --- | --- |
| FR-6 | Registro manual, clase copiada en silencio | Épica 2 · 2.1 | ✓ Cubierto |
| FR-7 | Registro por foto con ítems y categoría sugerida | Épica 4 · 4.1, 4.2, 4.4 | ✓ Cubierto |
| FR-8 | Clasificación por defecto | Épica 2 · 2.1 (copia silenciosa) | ✓ Cubierto (ver nota 2) |
| FR-12 | Editar y borrar Gastos | Épica 2 · 2.4 | ✓ Cubierto |
| FR-31 | Registro por nota de voz | Épica 4 · 4.1, 4.3, 4.4 | ✓ Cubierto |
| FR-32 | Detalle de ítems | Épica 2 · 2.1, 2.3, 2.4 + Épica 4 · 4.1–4.3 | ✓ Cubierto |
| FR-33 | Inicio con resumen del mes | Épica 2 · 2.2 (+ 1.10 retira Dinero libre) | ✓ Cubierto |
| FR-34 | Lista y detalle de Gastos | Épica 2 · 2.3 | ✓ Cubierto |
| FR28 | Exportación manual | Épica 7 · 7.1 | ✓ Cubierto |

### Coverage Matrix — FR congeladas

| FR | Cobertura | Estado |
| --- | --- | --- |
| FR-1, FR-3, FR-4, FR-5 | Épica 1 · 1.4–1.6 (hechas, ocultas por 1.10) | ✓ Cubierto · congelado |
| FR-2 | Épica 1 · 1.7 | ✓ Cubierto · congelado |
| FR-9, FR-10, FR-11, FR-14, FR-15, FR-26 | Épica 2 · C2.1–C2.6; Épica 3 · 3.3; Épica 6 · 6.2 | ✓ Cubierto · congelado |
| FR-13, FR-16–FR-20 | Épica 1 (parte base, hecha) + Épica 3 | ✓ Cubierto · congelado |
| FR-21–FR-24 | Épica 5 | ✓ Cubierto · congelado |
| FR-25, FR-27 | Épica 6 | ✓ Cubierto · congelado |
| FR29, FR30 | Épica 7 · 7.2, 7.3 | ✓ Cubierto · congelado |

### Missing Requirements

**Ningún FR sin cobertura.** No hay FR en las épicas que no exista en el PRD (FR28–FR30 derivan de PRD §8).

Diferencias de redacción entre PRD y epics.md (no son huecos, pero conviene alinearlas):

1. **FR-33:** epics.md agrega "accesos directos a foto, voz y registro a mano" y "navegación entre meses" (UX-DR3); el PRD no los menciona. Razonable; falta reflejarlo en el PRD o aceptarlo como detalle de UX.
2. **FR-8 vs FR-6:** FR-8 conserva "El usuario puede cambiarlo", pero FR-6 dice que la Clase se copia en silencio y el usuario no la elige. Contradicción menor dentro del propio PRD.
3. **FR-6:** epics.md incluye "ítems" en el registro manual; el PRD lo cubre vía FR-32. Coherente.

### Coverage Statistics

- Total PRD FRs: 34 (31 numeradas en el PRD + FR28–FR30 derivadas de §8)
- FRs del MVP: 9 · cubiertas: 9 (100 %)
- FRs congeladas: 25 · con historia asignada: 25 (100 %)
- Cobertura total: 100 %

## UX Alignment Assessment

### UX Document Status

**No hay un documento de UX aparte** (sin `*ux*.md`). La app tiene interfaz, así que la UX está implícita. La especificación vive en `epics.md` como **UX-DR1 a UX-DR14**, derivados del PRD y del spine. Para un MVP personal de un solo usuario, esto basta como contrato, siempre que esos requisitos sean coherentes entre sí.

### Alignment Issues

1. **UX-DR4 contradice FR-6 (medio).** UX-DR4 dice "La clase y los enlaces se precargan desde la categoría **y se pueden cambiar**", pero FR-6 y AD-19 dicen que en el MVP se copian en silencio y el usuario no los ve ni los cambia. Si la historia 2.1 sigue UX-DR4, vuelve a aparecer en el formulario la complejidad que este cambio quería quitar. → Reescribir UX-DR4 para el MVP.
2. **UX-DR10 menciona el Cuadre (bajo).** El aviso "Gasto con fecha anterior al último Cuadre" depende del Cuadre, que está congelado. En el MVP nunca se dispara, pero conviene marcar esa mitad como congelada para que la historia 2.4 no intente construirla.
3. **UX-DR3 agrega detalles que no están en el PRD (bajo).** UX-DR3 incluye la navegación entre meses y los accesos a foto, voz y registro a mano; FR-33 no los menciona. La arquitectura los soporta (`resumenGastos(gastos, mes)` recibe el mes). Basta con aceptarlos como detalle de UX.
4. **FR-8 dice que el usuario puede cambiar la clasificación**, en contradicción con FR-6 (ya se anotó en la cobertura). Es el mismo problema que el punto 1, pero del lado del PRD.

### UX ↔ Architecture

- Inicio con resumen → `domain/resumenGastos` (nota del MVP en AD-1). ✓
- Confirmación de captura con ítems y la bandeja "Por confirmar" → AD-11, AD-19 y AD-22. ✓
- Bloqueo de acceso (UX-DR1) → AD-15, ya implementado. ✓
- Error amable (UX-DR13) → AD-23, ya implementado. ✓
- El capability map nombra `services/audio`, pero esa carpeta no aparece en el árbol de "Structural Seed" (`services/` lista reloj, extractor, notificaciones, respaldo, biometria y log). Es un hueco menor de documentación.

### Warnings

- ⚠️ **Ningún UX-DR cubre la interacción de grabación de voz**: el indicador de grabación, el límite de 60 s visible, cancelar, y el permiso de micrófono negado. Hoy solo lo cubren los criterios de la historia 4.3. Es aceptable si la 4.3 lo detalla bien (se revisa en el paso 5).
- ⚠️ **No hay requisitos de accesibilidad explícitos**, aunque el código ya usa `accessibilityLabel`. Es un riesgo bajo para un solo usuario.

## Epic Quality Review

El alcance son las **11 historias del MVP**: 1.10, 2.1, 2.2, 1.9, 4.1, 4.2, 4.3, 2.3, 2.4, 4.4 y 7.1. Las congeladas solo se revisaron para confirmar que ninguna historia del MVP dependa de ellas.

### Estructura de las épicas

| Épica | Valor para el usuario | Independencia | Observación |
| --- | --- | --- | --- |
| 1 · Base (1.9, 1.10) | ✓ app limpia e instalada | ✓ | 🟡 El título "Configurar mis finanzas y ver mi Dinero libre real" ya no describe lo que entrega en el MVP |
| 2 · Registrar y ver mis gastos | ✓ sirve sola, sin IA | ✓ solo usa la épica 1 | — |
| 4 · Registrar gastos con IA | ✓ | ✓ usa `registrarGasto` de la épica 2 (dependencia hacia atrás) | — |
| 7 · Exportar (7.1) | ✓ | ✓ | — |

No hay épicas técnicas sin valor para el usuario. No hay dependencias circulares entre épicas. Las referencias de 2.2 a 4.2 y 4.3 ("cuando su función exista") son condicionales y no bloquean.

### 🔴 Critical Violations

Ninguna.

### 🟠 Major Issues

1. **La 1.10 no simplifica el editor de Categorías.**
   - Ajustes queda solo con "Categorías", pero el formulario de H1.6 (`formulario-categoria.tsx` y `lista-categorias.tsx`) sigue pidiendo **Clase, Presupuesto, Fondo y "pide Vehículo"**, y la lista muestra resúmenes como "Esencial · Comida · pide Vehículo".
   - Esa es justo la complejidad que FR-6 quiere esconder: la Clase se copia en silencio.
   - **Remedio:** agregar a la 1.10 un criterio para que, en el MVP, el editor de Categorías muestre solo el nombre (y la lista, solo nombres). Las categorías nuevas tomarían `claseDefault = gusto` sin enlaces. **Esta decisión es tuya.**
2. **La 4.2 no tiene camino de error hasta que llegue la 4.4 (dependencia hacia adelante).**
   - La 4.2 solo describe el éxito. El timeout, la falta de conexión y la respuesta inválida (que la 4.1 ya devuelve como `{ok:false}`) no tienen comportamiento definido en la interfaz hasta la 4.4, que va 3 historias después (4.3, 2.3 y 2.4 en medio).
   - En ese tramo, una foto que falla deja la captura `pendiente` sin salida visible.
   - **Remedio:** agregar a la 4.2 (y a la 4.3) un criterio mínimo: "si la extracción falla o vence el tiempo, la app lo dice con la Voz del socio y ofrece completar a mano con lo capturado". La 4.4 queda para reintentos, la bandeja y la detección de conexión.
3. **No se pueden corregir errores durante mucho tiempo con datos reales.**
   - Desde la 1.9 (puesto 4) la app se usa a diario con datos reales, pero editar y borrar (2.4) llega en el puesto 9.
   - En medio entran las capturas con IA (4.2 y 4.3), que es cuando más errores aparecen.
   - **Remedio:** subir 2.3 y 2.4 antes de la 4.1, con el orden `1.10 → 2.1 → 2.2 → 1.9 → 2.3 → 2.4 → 4.1 → 4.2 → 4.3 → 4.4 → 7.1`, o al menos antes de la 4.2.

### 🟡 Minor Concerns

1. **UX-DR4 está desactualizado:** dice que la clase "se puede cambiar". La historia 2.1 ya es correcta (copia en silencio), pero la 2.1 cita UX-DR4 como requisito y eso crea ambigüedad.
2. **FR-8 en el PRD:** dice "El usuario puede cambiarlo" y contradice FR-6.
3. **La 2.2 no dice cuántos son "los últimos gastos"** (¿5? ¿10?), ni si al tocar uno se abre el detalle (UJ-6 lo pide; la lista y el detalle llegan en la 2.3). Hay que fijarlo al crear la historia.
4. **El primer criterio de la 4.3 es una tarea, no un criterio verificable** ("When se crea esta historia… se elige el módulo"). Conviene pasarlo a Tasks y dejar como criterio: "la grabación usa un módulo de audio de SDK 57 instalado con `npx expo install`".
5. **A la 4.3 le faltan detalles de interacción:** indicador de grabación, tiempo restante, cancelar antes de enviar y qué pasa con una nota vacía o sin monto (la propuesta llega con `monto = null`, y la confirmación debe exigir el monto).
6. **La 7.1 menciona "instantáneas (Cuadres y consultas del Semáforo)"**, tablas que no existen en el MVP. Debería decir "todas las tablas existentes".
7. **La 2.1 crea `gastos` con columnas de funciones congeladas** (`vehiculoId?`, `obligacionPagadaId?`, `presupuestoId?`, `fondoId?`). Es intencional (AD-19, sin migración al descongelar) y aceptable, pero la historia debería decirlo para que el Dev no las quite.
8. **`addendum.md` sigue describiendo la salida de la IA con Clase y Vehículo sugeridos.** Se arrastra del paso 2.
9. **SM-5 sí se puede medir:** `capturas.propuesta` guarda lo que propuso la IA y `gastoId` enlaza con lo guardado. Conviene anotarlo en la 4.2 o en el PRD.

### Tamaño, criterios de aceptación y datos

- **Tamaño:** todas las historias del MVP caben en una iteración. La más grande es la 4.1, que trae dos extractores, el esquema y la clave, pero es cohesiva.
- **Criterios Given/When/Then:** todas los usan, con casos de error en 4.1 y 4.4 y estados vacíos en 2.2 y 2.3.
- **Creación de tablas cuando se necesitan:** `gastos` y `gasto_items` en la 2.1, y `capturas` en la 4.2. ✓
- **Plantilla inicial:** la 1.1 ya está hecha. ✓
- **Trazabilidad:** cada historia cita sus FR, NFR, UX-DR y AD. ✓

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK (menor). Listo para arrancar con la 1.10 una vez resuelto el punto 1.**

- La cobertura de requisitos es completa: 100 % de las FR del MVP tiene historia.
- La arquitectura soporta todo el MVP.
- No hay violaciones críticas.
- Hay 3 problemas mayores. Ninguno obliga a rehacer la planificación: se corrigen con ajustes puntuales en `epics.md` y, en un caso, en el orden del sprint.

### Critical Issues Requiring Immediate Action

1. **Antes de crear la 1.10: decidir cómo queda el editor de Categorías.** Si sigue mostrando Clase, Presupuesto, Fondo y "pide Vehículo", la app no se simplifica de verdad. Recomendación: solo nombre en el MVP, con categorías nuevas `gusto` sin enlaces.
2. **Antes de crear la 4.2 y la 4.3:** agregar un camino mínimo de error (avisar y completar a mano), para no depender de la 4.4.
3. **Reordenar el MVP** para poder editar y borrar antes de usar la IA con datos reales: `1.10 → 2.1 → 2.2 → 1.9 → 2.3 → 2.4 → 4.1 → 4.2 → 4.3 → 4.4 → 7.1`.

### Recommended Next Steps

1. Ajustar `epics.md`:
   - criterio de Categorías simplificadas en la 1.10;
   - camino de error en la 4.2 y la 4.3;
   - reescribir UX-DR4 y la mitad de UX-DR10 que depende del Cuadre;
   - aclaraciones menores en la 2.1 (columnas congeladas), la 2.2 (cuántos "últimos" y tocar → detalle), la 4.3 (criterio-tarea, cancelar, `monto = null`) y la 7.1 (tablas existentes);
   - título de la épica 1.
2. Ajustar el PRD: FR-8 alineado con la copia en silencio, la viñeta de extracción del `addendum.md` y una nota sobre FR28–FR30 y la medición de SM-5.
3. Actualizar el orden en `sprint-status.yaml`, `epics.md`, el PRD §6.1 y el spine, si se acepta el reordenamiento.
4. Correr `bmad-create-story 1.10`.

### Final Note

La evaluación encontró **20 observaciones en 4 categorías**:

| Categoría | Observaciones |
| --- | --- |
| PRD | 4 |
| Cobertura | 3 diferencias de redacción |
| UX | 4 desalineaciones + 2 advertencias |
| Calidad de las épicas | 3 mayores + 4 menores no repetidas |

No hay problemas críticos. Los 3 mayores se resuelven en menos de una hora de edición de artefactos. Puedes corregirlos ahora o seguir como está y resolverlos al crear cada historia. La única corrección que conviene hacer **antes** de la 1.10 es la de Categorías.

---
*Evaluado el 2026-11-11 por el agente PM (bmad-check-implementation-readiness), tras el Sprint Change Proposal del mismo día.*

## Resolución (2026-11-11)

Priettos aprobó aplicar todas las recomendaciones **[a]**:

- **Mayores:**
  - 1.10 con Categorías solo por nombre (las nuevas se crean como `gusto` sin enlaces).
  - Camino de error y `monto = null` en 4.2 y 4.3.
  - Nuevo orden del MVP `1.10 → 2.1 → 2.2 → 1.9 → 2.3 → 2.4 → 4.1 → 4.2 → 4.3 → 4.4 → 7.1`, actualizado en epics, PRD §6.1, spine, sprint-status y sprint-change-proposal.
- **Menores:**
  - UX-DR4 y FR-8 alineados con la copia silenciosa; mitad Cuadre de UX-DR10 congelada.
  - 2.1 con nota sobre las columnas congeladas.
  - 2.2 con 5 últimos gastos y acceso al detalle.
  - 4.3 con cancelar, indicador e instrucción de módulo como nota.
  - 7.1 con "tablas existentes".
  - Épica 1 renombrada.
  - Addendum actualizado; nota FR28–FR30 y medición de SM-5 en el PRD.
  - `services/audio` en el Structural Seed.

**Estado final: READY** para `bmad-create-story 1.10`.
