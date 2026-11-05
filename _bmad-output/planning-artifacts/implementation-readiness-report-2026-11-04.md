---
stepsCompleted: [step-01-document-discovery, step-02-prd-analysis, step-03-epic-coverage-validation, step-04-ux-alignment, step-05-epic-quality-review, step-06-final-assessment]
documentsIncluded:
  - prds/prd-moneytrack_app-2026-10-14/prd.md
  - prds/prd-moneytrack_app-2026-10-14/addendum.md
  - architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md
  - epics.md
  - briefs/brief-moneytrack_app-2026-09-30/brief.md (contexto)
---

# Informe de Evaluación de Preparación para la Implementación

**Fecha:** 2026-11-04
**Proyecto:** moneytrack_app

## Inventario de Documentos

| Tipo | Archivo | Tamaño | Modificado |
|---|---|---|---|
| PRD | `prds/prd-moneytrack_app-2026-10-14/prd.md` (+ `addendum.md`) | 19,7 KB (+3,9 KB) | 2026-10-22 |
| Arquitectura | `architecture/architecture-moneytrack_app-2026-10-15/ARCHITECTURE-SPINE.md` | 31,5 KB | 2026-10-22 |
| Épicas e Historias | `epics.md` | 75,9 KB | 2026-11-04 |
| UX | — **No encontrado** | — | — |
| Contexto | `briefs/brief-moneytrack_app-2026-09-30/brief.md` | — | 2026-09-30 |

- Sin duplicados (completo vs. fragmentado).
- ⚠️ No existe documento de UX; la alineación UX se evaluará de forma inferida.
- No existe `project-context.md`.

## Análisis del PRD

Fuente: `prd.md` (status: final, 2026-10-22) + `addendum.md`.

### Requisitos Funcionales

**4.1 Configuración inicial**
- **FR-1 Pagos:** el usuario registra sus dos Pagos con día del mes y monto esperado. Si el día no existe en el mes, se usa el último día del mes.
- **FR-2 Deudas y Meta:** el usuario registra cada Deuda (nombre, saldo, cuota, día de pago, tasa opcional) y marca una como Deuda objetivo con su fecha de Meta. Las cuotas se generan como Obligaciones mensuales; si una Deuda no tiene tasa, sus proyecciones se marcan "aproximado".
- **FR-3 Obligaciones y Presupuestos esenciales:** el usuario registra Obligaciones mensuales y anuales (por Vehículo) y los montos de los Presupuestos esenciales (comida, mantenimiento de vehículos).
- **FR-4 Fondo enduro, Colchón y saldo inicial:** el usuario fija el aporte mensual al fondo enduro, el Colchón (default 4.000.000) y el Saldo real inicial.
- **FR-5 Vehículos:** el usuario registra sus Vehículos con un nombre.

**4.2 Registro de movimientos**
- **FR-6 Registro manual:** Gasto con monto, categoría y Clase de gasto; Vehículo y Fondo protegido opcionales. Con categoría reciente, ≤ 3 toques tras escribir el monto.
- **FR-7 Registro por foto:** extrae monto, comercio, fecha y categoría; sugiere Clase de gasto y Vehículo. Siempre hay confirmación editable; nada se guarda sin confirmar; si una categoría de vehículo no trae Vehículo, lo pide; si la extracción falla o no hay conexión, la foto queda adjunta y se completa a mano o se reintenta al volver la conexión. Propuesta en ≤ 10 s con conexión.
- **FR-8 Clasificación por defecto:** mantenimiento/consumibles de Vehículo → Esencial (Presupuesto de mantenimiento); equipo/accesorios enduro → Fondo protegido; resto → Gusto. Editable.
- **FR-9 Adelanto de gasto previsto:** un Gasto Esencial que excede su Presupuesto esencial del mes se marca como adelanto y el exceso se descuenta del Presupuesto del mes siguiente, no como Gusto.
- **FR-10 Impacto al guardar:** tras guardar, se muestra el Dinero libre restante y, si aplica, el Impacto en días.
- **FR-11 Confirmar Pago y Otros ingresos:** confirmar cada Pago con monto recibido; registrar Otros ingresos. Un Pago no confirmado no entra al Saldo calculado y sigue como esperado en el Saldo proyectado.
- **FR-12 Editar y borrar:** cualquier movimiento; todo se recalcula.

**4.3 Dinero libre y Cuadre**
- **FR-13 Pantalla principal:** Dinero libre, Saldo calculado, Avance y Ritmo de la Meta, Fecha de la Meta proyectada (cuenta regresiva), Día de Libertad, saldo del fondo enduro, Obligaciones vencidas. Dinero libre negativo en rojo con día y monto del faltante.
- **FR-14 Cuadre:** el usuario ingresa Saldo real; se muestra la diferencia y se registra, con confirmación, como Gasto sin registrar u Otro ingreso. Se pide al confirmar cada Pago; si no se hace, se recuerda al día siguiente.
- **FR-15 Historial de Cuadres:** cada Cuadre se guarda con diferencia en monto y porcentaje.

**4.4 Meta y Día de Libertad**
- **FR-16 Proyecciones:** Fecha de la Meta proyectada y Día de Libertad, recalculados con cada cambio.
- **FR-17 Abono:** a cualquier Deuda; baja saldo de Deuda y Saldo calculado. La app nunca abona por su cuenta.
- **FR-18 Reserva de Meta:** cada Periodo se reserva el Ritmo de la Meta como Aporte programado; los Abonos a la Deuda objetivo la consumen. Reservar no es abonar.
- **FR-19 Ritmo y aviso:** al confirmar Pago o hacer Cuadre se muestra Ritmo del Periodo, lo abonado y "al día"/"atrasado X". Si el Ritmo no cabe sin bajar del Colchón, se dice explícitamente.
- **FR-20 Meta cumplida o vencida:** al llegar a cero se celebra y se pide la siguiente Deuda objetivo y fecha; mientras tanto el Semáforo muestra color sin Impacto en días. Si pasa la fecha sin cumplirse, Meta "vencida" y se pide nueva fecha.

**4.5 Semáforo de compra**
- **FR-21 Consulta:** precio + Fondo protegido opcional; no registra Gasto. "Lo compré" lo convierte en Gasto con un toque, con cualquier color.
- **FR-22 Reglas:** R = parte no cubierta por el Fondo protegido. 🟢 si R ≤ Dinero libre e Impacto < umbral (default 7, configurable). 🟡 si R ≤ Dinero libre e Impacto ≥ umbral, o si R > Dinero libre pero cabe con la reserva de Meta del Periodo. 🔴 si no cabe ni con la reserva de Meta.
- **FR-23 Respuesta:** color, Dinero libre resultante e Impacto en días en una frase. ≤ 5 s desde abrir la app hasta el veredicto.
- **FR-24 Registro de veredictos:** fecha, monto, color, si se compró.

**4.6 Sesión de pagos**
- **FR-25 Agendar:** una Sesión por Periodo (default: día siguiente a cada Pago, hora configurable) con notificación.
- **FR-26 Lista y "ya pagamos":** Obligaciones pendientes hasta el próximo Pago; "ya pagamos" registra el Gasto (monto editable). Cuota → baja saldo de Deuda; anual → libera su reserva anual. Obligación vencida sin marcar sigue visible en la pantalla principal.
- **FR-27 Vencimientos anuales:** aviso 30 y 7 días antes de cada Obligación anual de Vehículo.

**Total FRs: 27**

### Requisitos No Funcionales

- **NFR-1 Rendimiento (registro manual):** ≤ 3 toques tras escribir el monto con categoría reciente (FR-6).
- **NFR-2 Rendimiento (foto):** propuesta de extracción en ≤ 10 s con conexión (FR-7).
- **NFR-3 Rendimiento (Semáforo):** ≤ 5 s desde abrir la app hasta ver el veredicto (FR-23).
- **NFR-4 Voz del socio:** textos honestos, amables, no complacientes; nunca suavizan un 🔴 ni culpan; celebran avances; sin jerga financiera.
- **NFR-5 Honestidad del cálculo:** ningún redondeo a favor; datos faltantes → resultado "aproximado".
- **NFR-6 Sin conexión:** todo funciona offline excepto la extracción por foto, que se encola.
- **NFR-7 Privacidad:** datos locales; solo salen la foto (a un proveedor de IA que no entrene con datos) y, opcionalmente, el respaldo a la carpeta privada del Google Drive del usuario.
- **NFR-8 Seguridad de acceso:** acceso con bloqueo del teléfono o biometría.
- **NFR-9 Respaldo:** exportación manual a archivo + respaldo automático opcional en Google Drive (ambos v1). Restaurar reemplaza todos los datos.
- **NFR-10 Moneda y formato:** COP sin decimales, separador de miles con punto.
- **NFR-11 Plataforma:** solo Android; sin cuentas de usuario, iOS ni web (§5, addendum).
- **NFR-12 Seguridad de la clave de API:** clave de Gemini ingresada por el usuario, guardada en almacenamiento seguro; sin backend (addendum, AD-11/AD-12).

**Total NFRs: 12**

### Requisitos Adicionales y Restricciones

- **Regla de oro (§5):** la app no mueve dinero ni bloquea compras; no se conecta al banco ni lee SMS/correos; sin asesoría de inversión ni anuncios.
- **Definiciones de cálculo normativas (§3 Glosario):** Saldo calculado, Saldo proyectado, Horizonte (31 días, al menos un Pago 1 y un Pago 2), Dinero libre, Ritmo de la Meta (fijo por Periodo, mínimo 0), Impacto en días (lineal, redondeo hacia arriba), Fecha de la Meta proyectada, Día de Libertad (sin Abonos futuros), Gasto sin registrar (Gusto sin Impacto en días ni efecto en Fondos).
- **Casos de aceptación (addendum):** tabla de Dinero libre (resultado esperado 1.350.000) y tabla del Semáforo con 4 consultas; deben convertirse en pruebas.
- **Calendario:** los Pagos no se ajustan por fin de semana.
- **Notificaciones locales:** Sesión de pagos, recordatorio de Cuadre, vencimientos anuales.
- **Plazo:** v1 instalada a inicios de noviembre de 2026, ~3 semanas, con orden sugerido 4.1 → 4.2 manual → 4.3 → 4.4 → 4.2 foto → 4.5 → 4.6.
- **Pregunta abierta:** lista inicial de categorías de Gasto (a definir en la historia de Configuración).
- **Métricas:** SM-1, SM-2 y SM-3, más las contra-métricas SM-C1 y SM-C2 (esta última requiere FR-24).

### Evaluación de Completitud del PRD

El PRD es **sólido y de alta calidad**: está en estado *final*, usa un glosario normativo con fórmulas precisas, numera todos los FRs, trae consecuencias verificables y casos de aceptación numéricos, y no deja supuestos abiertos. Observaciones:
- Los NFRs no están numerados (viven en el §8 y dentro de los FRs); se numeraron aquí para trazarlos.
- Hay una sola pregunta abierta (categorías iniciales), asignada explícitamente a una historia.
- **Riesgo de calendario:** hoy es 2026-11-04 y la meta era "instalada a inicios de noviembre de 2026"; el plazo está vencido o a punto de vencer.
- Ambigüedades menores que conviene verificar en las historias: en FR-22, qué "Dinero libre resultante" se muestra para 🟡 por reserva de Meta; en FR-9, qué pasa si el adelanto excede también el Presupuesto del mes siguiente; en FR-20, el comportamiento del Ritmo cuando la Meta está "vencida".

## Validación de Cobertura de Épicas

`epics.md` incluye su propio *FR Coverage Map* (FR1–FR30). La numeración de las épicas (FR1) equivale a la del PRD (FR-1). Las épicas agregan **FR28–FR30** (exportación, respaldo en Drive y restauración), que en el PRD viven en §8 *Respaldo* (aquí NFR-9).

### Matriz de Cobertura

| FR | Requisito del PRD (resumen) | Cobertura en épicas | Estado |
|---|---|---|---|
| FR-1 | Dos Pagos, día y monto; día inexistente → último día | E1 · H1.3, H1.7 | ✓ |
| FR-2 | Deudas, tasa opcional, Deuda objetivo y fecha; cuotas como Obligaciones; "aproximado" | E1 · H1.6, H1.7 | ✓ |
| FR-3 | Obligaciones mensuales/anuales por Vehículo; Presupuestos esenciales | E1 · H1.4, H1.5 | ✓ |
| FR-4 | Aporte al fondo enduro, Colchón, Saldo real inicial | E1 · H1.3, H1.5 | ✓ |
| FR-5 | Vehículos con nombre | E1 · H1.4 | ✓ |
| FR-6 | Registro manual en ≤ 3 toques | E2 · H2.1 | ✓ |
| FR-7 | Registro por foto, confirmación, cola offline, ≤ 10 s | E4 · H4.1, H4.2, H4.3 | ✓ |
| FR-8 | Clasificación por defecto editable | E1 · H1.5 (siembra) + E2 · H2.1 | ✓ |
| FR-9 | Adelanto de gasto previsto | E2 · H2.2 | ✓ |
| FR-10 | Dinero libre restante e Impacto en días al guardar | E2 · H2.1 + E3 · H3.3 | ✓ |
| FR-11 | Confirmar Pago; Otros ingresos | E2 · H2.3 | ✓ |
| FR-12 | Editar y borrar con recálculo | E2 · H2.5 (+ H3.1 para Abonos) | ✓ |
| FR-13 | Pantalla principal completa; Dinero libre negativo en rojo | E1 · H1.3, H1.4, H1.5 + E3 · H3.2 | ✓ |
| FR-14 | Cuadre; pedirlo al confirmar Pago; recordarlo al día siguiente | E2 · H2.6 + E6 · H6.2 | ✓ |
| FR-15 | Historial de Cuadres (monto y %) | E2 · H2.6 | ✓ |
| FR-16 | Fecha de la Meta proyectada y Día de Libertad | E3 · H3.2 | ✓ |
| FR-17 | Abono a cualquier Deuda; nunca automático | E3 · H3.1 | ✓ |
| FR-18 | Reserva de Meta; Abonos la consumen | E1 · H1.6 + E3 · H3.1 | ✓ |
| FR-19 | Ritmo, abonado, "al día"/"atrasado"; aviso si no cabe | E3 · H3.4 | ✓ |
| FR-20 | Meta cumplida o vencida | E3 · H3.5 (+ H5.1 sin Meta) | ✓ |
| FR-21 | Consulta "¿Puedo?" y "Lo compré" | E5 · H5.2 | ✓ |
| FR-22 | Reglas del Semáforo | E5 · H5.1 | ✓ |
| FR-23 | Respuesta en una frase, ≤ 5 s | E5 · H5.2 | ✓ |
| FR-24 | Registro de veredictos | E5 · H5.2 | ✓ |
| FR-25 | Agendar Sesión de pagos con notificación | E6 · H6.1 | ✓ |
| FR-26 | Lista y "ya pagamos"; cuota baja Deuda; anual libera reserva | E2 · H2.4 | ✓ |
| FR-27 | Avisos 30 y 7 días antes de las anuales de Vehículo | E6 · H6.2 | ✓ |
| §8 Respaldo | Exportación manual + respaldo en Drive + restaurar | E7 · H7.1, H7.2, H7.3 (FR28–FR30) | ✓ |

### Cobertura de NFRs (PRD §8 y restricciones)

| NFR | Cobertura | Estado |
|---|---|---|
| NFR-1/2/3 Rendimiento (3 toques, 10 s, 5 s) | H2.1, H4.1/H4.2, H5.2 | ✓ |
| NFR-4 Voz del socio | H1.2 (`src/textos/`, regla `no-raw-text`), H1.7, H2.1, H3.3, H5.2 | ✓ |
| NFR-5 Honestidad del cálculo | H1.3, H1.6, H3.2 (`{valor, aproximado}`, AD-7) | ✓ |
| NFR-6 Sin conexión | Implícito (datos locales) + H4.3 | ✓ (sin criterio explícito global) |
| NFR-7 Privacidad | H1.2 (log sin montos), H4.1, H6.1 (notificaciones sin montos), H7.1 | ✓ |
| NFR-8 Acceso con bloqueo o biometría | H1.2 | ✓ |
| NFR-9 Respaldo | E7 | ✓ |
| NFR-10 Moneda y formato | H1.2 (`formatearDinero`) | ✓ |
| NFR-11 Solo Android | H1.1, H1.8 | ✓ |
| NFR-12 Clave de API segura | H4.1 | ✓ |

### Requisitos Faltantes

**No se encontraron FRs del PRD sin cobertura.** Las épicas no traen FRs ajenos al PRD: FR28–FR30 provienen del §8.

Observaciones de trazabilidad (no son brechas):
- FR-13, FR-10, FR-14 y FR-18 se reparten entre dos épicas. Es correcto, pero exige que la épica posterior complete el criterio: por ejemplo, la pantalla principal no muestra la Meta hasta E3.
- La pregunta abierta del PRD §10.1 (categorías iniciales) queda **resuelta** en H1.5.
- NFR-6 (sin conexión) no tiene un criterio de aceptación transversal ("toda pantalla excepto la foto funciona en modo avión"); su cumplimiento solo se infiere de la arquitectura local.

### Estadísticas de Cobertura

- Total de FRs del PRD: **27** (+ el requisito de Respaldo del §8, que las épicas tratan como FR28–FR30)
- FRs cubiertos en las épicas: **27/27**
- Porcentaje de cobertura: **100 %**
- NFRs cubiertos: **12/12** (NFR-6 solo de forma implícita)

## Evaluación de Alineación UX

### Estado del Documento UX

**No encontrado.** No existe `*ux*.md` ni un contrato DESIGN/EXPERIENCE. El spine de arquitectura difiere explícitamente "Diseño de pantallas y navegación: se decide en UX y en las historias", y `epics.md` lo reconoce y compensa con **14 requisitos de interfaz derivados (UX-DR1–UX-DR14)** que salen del PRD y del spine.

**¿La UX está implícita?** Sí, claramente: es una app móvil Android de uso diario, con un objetivo de ≤ 3 toques y otro de ≤ 5 s, y sus recorridos (UJ-1 a UJ-4) se definen como flujos de pantalla.

### Alineación UX-DR ↔ PRD ↔ Arquitectura

| UX-DR | PRD | Soporte en la arquitectura | Historia | Estado |
|---|---|---|---|---|
| UX-DR1 Bloqueo de acceso | §8 Privacidad | AD-15 | 1.2 | ✓ |
| UX-DR2 Asistente inicial | §4.1 | AD-9 (siembra) | 1.7 | ✓ |
| UX-DR3 Pantalla principal | FR-13, UJ-1..4 | AD-1 (Estado único), AD-18 | 1.3–1.5, 3.2 | ✓ con observación (ver 2) |
| UX-DR4 Registro rápido | FR-6 | AD-19 | 2.1 | ✓ |
| UX-DR5 Confirmación de foto | FR-7 | AD-11, AD-22 | 4.2, 4.3 | ✓ |
| UX-DR6 Retroalimentación al guardar | FR-10 | AD-1, AD-17 | 2.1, 3.3 | ✓ |
| UX-DR7 "¿Puedo?" | FR-21..23 | AD-1, AD-15 | 5.2 | ✓ con observación (ver 3) |
| UX-DR8 Pago → Cuadre → Ritmo | FR-14, FR-19, UJ-4 | AD-2, AD-20 | 2.6, 3.4 | ✓ |
| UX-DR9 Sesión de pagos | FR-26, UJ-3 | AD-5, AD-13 | 2.4, 6.1 | ✓ |
| UX-DR10 Rastro visible | FR-12 | AD-3, AD-4 | 2.5 | ✓ |
| UX-DR11 Celebración y cambio de Meta | FR-20 | AD-21 | 3.5 | ✓ |
| UX-DR12 Marcas "aproximado" | §8 Honestidad | AD-1 `{valor, aproximado}` | 3.2 | ✓ |
| UX-DR13 Error amable | §8 Voz | AD-17, AD-23 | 1.2 | ✓ |
| UX-DR14 Ajustes | §4.1 | AD-9, AD-12, AD-14 | 1.7, 4.1, 6.1, 7.1–7.3 | ✓ |

La arquitectura soporta todos los UX-DR. No hay componentes de interfaz sin respaldo arquitectónico.

### Problemas de Alineación

1. **🟠 Conflicto de formato: "vas 2,1 de 6 millones" contra `formatearDinero()`.** UJ-4 y la H3.2 piden mostrar el Avance en millones con un decimal ("2,1 de 6 millones"). NFR-10/AD-7 dicen que todo monto se formatea **solo** con `formatearDinero()` (COP sin decimales, por ejemplo `2.100.000`). Ningún formateador abreviado está definido ni probado. Además, redondear "2,1 millones" debería ir en contra del usuario (AD-7): ¿2.149.999 se muestra como 2,1? **Recomendación:** agregar a la H1.2 o a la H3.2 un `formatearMillones()` con regla de redondeo explícita, o cambiar el ejemplo a formato completo.
2. **🟡 Navegación y puntos de entrada sin definir.** No hay mapa de pantallas ni historia de navegación. Varias pantallas se dan por existentes sin decir desde dónde se llega:
   - "lista de movimientos" (H2.2 y H2.5 la usan, pero ninguna historia la crea ni define sus criterios);
   - entrada al **Cuadre** fuera del flujo de confirmar Pago (H2.6 solo dice "la pantalla de Cuadre");
   - entrada al **Historial de Cuadres**, a **Otros ingresos**, a **Abonos** (H3.1) y a la lista de **Obligaciones pendientes** fuera de la notificación (H2.4).

   **Recomendación:** agregar a la H1.3 (o a una historia pequeña nueva) la estructura de navegación (pestañas o menú) y asignar a la H2.5 la creación explícita de la lista de movimientos.
3. **🟡 ≤ 5 s del Semáforo contra la biometría obligatoria al abrir.** La H5.2 incluye la autenticación (AD-15) dentro de los 5 s "con un uso normal". El criterio no es medible tal como está. **Recomendación:** definir el método de medición (p. ej. desde que se desbloquea hasta ver el veredicto, cronometrado manualmente sobre el APK release), o agregar un acceso directo (app shortcut) a "¿Puedo?".
4. **🟡 Accesibilidad del Semáforo y del rojo.** Los veredictos se basan en el color (🟢/🟡/🔴 y Dinero libre en rojo). Hay frase de texto, pero ningún criterio asegura que el veredicto se entienda sin el color (etiqueta textual, contraste, TalkBack). Para un solo usuario el riesgo es bajo, pero es fácil cubrirlo.

### Advertencias

- ⚠️ **Falta el documento UX en una aplicación claramente orientada al usuario.** Se mitiga bien con los UX-DR de `epics.md`, pero las decisiones visuales (jerarquía de la pantalla principal, componentes, colores y tipografía, estados vacíos y de carga) quedan a criterio del desarrollador historia por historia. Para un proyecto personal de un solo usuario y un desarrollador es un riesgo **aceptable**, siempre que se resuelvan los puntos 1 y 2.
- ⚠️ **Estados vacíos no especificados:** pantalla principal sin Deudas, sin Meta o sin movimientos; Sesión de pagos sin Obligaciones pendientes; bandeja de facturas vacía.

## Revisión de Calidad de Épicas

Revisé las 7 épicas y las 26 historias contra los estándares de *create-epics-and-stories*: valor para el usuario, independencia, dependencias, tamaño, criterios de aceptación y momento de creación de las tablas.

### Valor para el usuario e independencia de las épicas

| Épica | ¿Centrada en el usuario? | ¿Independiente (solo usa épicas anteriores)? |
|---|---|---|
| E1 Configurar mis finanzas y ver mi Dinero libre | ✓ (termina con el APK instalado y el Dinero libre visible) | ✓ Autónoma |
| E2 Registrar el día a día | ✓ | ✓ Solo E1 |
| E3 Meta y Día de Libertad | ✓ | ✓ E1 y E2 |
| E4 Gastos con foto | ✓ | ✓ E2 (`registrarGasto`) y E3 (Impacto) |
| E5 "¿Puedo?" | ✓ | ✓ E1 y E3 (`impactoEnDias`) |
| E6 Sesión de pagos y avisos | ✓ | ✓ E2 (H2.4) |
| E7 Exportación y respaldo | ✓ | ✓ Ninguna dependencia hacia adelante |

No hay épicas técnicas. H1.1 (proyecto base) es la historia de plantilla que exige la arquitectura (Expo SDK 57): **cumple**. Tampoco hay dependencias circulares entre épicas.

### Dependencias hacia adelante

**No se encontraron.** Todas las referencias entre historias apuntan hacia atrás: H2.6 usa H2.3; H3.4 usa H2.3 y H2.6; H4.2 usa H2.1 y H3.3; H6.1 abre la lista de H2.4; H7.3 usa H7.2. Los criterios repartidos entre épicas (FR-10, FR-13, FR-14, FR-18) están bien declarados como "parte base" o "parte de la Meta".

### Momento de creación de las tablas

✓ **Correcto.** Cada tabla nace en la primera historia que la necesita: `rastro` y config de Pagos (H1.3); `vehiculos` y `obligaciones` (H1.4); `categorias`, presupuestos y fondos (H1.5); `deudas` y `metas` (H1.6); `gastos` (H2.1); `pagos_confirmados` y `otros_ingresos` (H2.3); `obligaciones_pagadas` (H2.4); `cuadres` (H2.6); `abonos` (H3.1); `fotos` (H4.2); `consultas_semaforo` (H5.2).

### Hallazgos por severidad

#### 🔴 Violaciones Críticas

**Ninguna.** No hay épicas técnicas sin valor, dependencias hacia adelante ni historias del tamaño de una épica imposibles de completar.

#### 🟠 Problemas Mayores

1. **H1.6, prueba fija: el "número de Periodos restantes" no está definido.** El addendum dice "Periodos restantes, contando el actual: 6" para el 3-nov. AD-20 y la H1.6 definen el Periodo, pero **no cómo contar los restantes** hasta la fecha de la Meta. Con el Pago 2 en el día 31 (→ 30-nov, que es lo que muestra la tabla), los inicios de Periodo son 31-oct, 10-nov, 30-nov, 10-dic, 31-dic, 10-ene y 31-ene. Da 6 o 7 según se cuente o no el Periodo que empieza el mismo día de la Meta. La H1.3 usa "Pago 2 (día 30)", y con eso el último Periodo empieza el 30-ene. La prueba fija de 1.350.000 depende de una regla implícita. **Remedio:** agregar a la H1.6 un criterio explícito ("Periodos restantes = Periodos cuya fecha de inicio es ≤ fechaObjetivo, incluido el actual", o la regla que dé 6) y fijar el día del Pago 2 del caso de prueba.
2. **Ritmo de la Meta con la Meta vencida o en su último Periodo.** Si `hoy > fechaObjetivo` (H3.5), los Periodos restantes son 0 o negativos y la fórmula divide por cero. AD-1 exige que `domain/` sea total, pero ninguna historia dice qué Ritmo, reserva de Meta ni Semáforo se usan cuando la Meta está **vencida** (H3.5 solo lo resuelve para la *cumplida*). **Remedio:** agregar a la H3.5 o a la H1.6 la regla para la Meta vencida (p. ej. tratarla como sin Meta activa hasta que haya nueva fecha, igual que la cumplida) y una prueba de `domain/`.
3. **H3.2: proyección de una Deuda que nunca llega a cero.** Si la cuota es menor o igual que el interés mensual (o la tasa es enorme), la Fecha de la Meta proyectada y el Día de Libertad no convergen. No hay criterio para ese caso, y la totalidad de `domain/` (AD-1) y el límite de < 200 ms (NFR10) quedan en riesgo. **Remedio:** criterio con un tope de proyección (p. ej. 600 meses) que devuelva `{valor: null, aproximado}` y un texto de la Voz del socio ("con esta cuota la Deuda no baja").
4. **H1.5: categorías iniciales con clasificación discutible frente al PRD.**
   - **"Salud" → Gusto:** un medicamento o una consulta médica mostraría Impacto en días y entraría en el Semáforo como un capricho. Eso contradice la definición de Gusto ("elegido, no necesario") y la Voz del socio ("nunca culpa").
   - **"Combustible" → Presupuesto de mantenimiento:** el PRD define ese presupuesto como "aceite, pastillas, llantas de uso, repuestos". La gasolina mensual lo agotaría y generaría *adelantos* en cadena (FR-9) todos los meses, deformando el Dinero libre.

   **Remedio:** que Priettos confirme la lista. Opciones: Salud → Esencial (con su propio Presupuesto o sin enlace), y Combustible con un Presupuesto propio, o dejar el presupuesto de mantenimiento con un monto que lo incluya.
5. **H1.3 está sobredimensionada.** En una sola historia caen el reloj y la zona horaria (AD-8), `Hechos` y `cargarHechos` (AD-18), `useEstado` reactivo, `ejecutar()`, los comandos de configuración, el `rastro`, el Saldo proyectado por día, el Dinero libre, la pantalla principal y los Pagos atrasados. Es el esqueleto de toda la app y la historia más riesgosa del plan. **Remedio:** partirla en (a) reloj + `Hechos` + `calcularEstado` mínimo con pruebas de `domain/`, y (b) configuración de Pagos, saldo inicial, Colchón y pantalla principal.

#### 🟡 Observaciones Menores

1. **H1.6 también es grande:** Deudas, `fijarMeta`, amortización francesa, Periodo, Ritmo y la prueba integral. Se puede separar "Deudas y amortización" de "Meta, Ritmo y reserva".
2. **H1.2 es una historia "cajón":** junta autenticación, log, ErrorBoundary, `Resultado<T>` y `formatearDinero`. Es aceptable por ser transversal, pero tiene poca cohesión.
3. **Inconsistencia en la descripción de E3:** dice que la épica "implementa la amortización francesa (AD-6)", pero eso ya se hace en la H1.6, y la H2.4 lo usa antes.
4. **H2.4, pagos distintos a la cuota:**
   - **Pago mayor:** la H2.4 dice que "el exceso no cuenta como Abono", pero según AD-6 (capital = monto pagado − interés) el exceso **sí** baja el saldo como capital. El criterio debe decirlo explícitamente: baja el saldo, pero no consume la reserva de Meta.
   - **Pago parcial:** no se define si la ocurrencia queda cerrada o pendiente por la diferencia.
5. **H2.6, porcentaje del Cuadre:** no se define la base (¿Saldo real, como SM-2?) ni el caso de Saldo real = 0.
6. **H3.4: la condición "no cabe sin bajar del Colchón (Dinero libre < 0 por la reserva)" es ambigua.** Propuesta: `dineroLibre < 0 && dineroLibre + reservaMeta ≥ 0`, o simplemente `dineroLibre < 0` con reserva de Meta > 0.
7. **H4.3, detección de "vuelve la conexión":** requiere `expo-network` o `@react-native-community/netinfo`, que **no están en el stack** de la arquitectura ni en la H1.1.
8. **H5.2, "≤ 5 s con un uso normal":** no es medible tal como está (ver Alineación UX, punto 3).
9. **H6.1, FR-25 dice "agendar":** la historia solo permite fijar la hora, con el día fijo (día siguiente al Pago). Conviene confirmar que no hace falta elegir el día.
10. **H6.1, permisos de Android:** no menciona `POST_NOTIFICATIONS` (Android 13+) ni si las notificaciones programadas necesitan alarmas exactas para llegar a tiempo.
11. **Navegación y lista de movimientos:** ninguna historia crea la lista de movimientos ni la navegación general (ver Alineación UX, punto 2).
12. **NFR-6 (sin conexión):** no hay un criterio global y verificable de "modo avión".
13. **No hay CI:** la Definition of Done (`npm run verificar`) es solo local. Es aceptable para un desarrollador único, pero vale considerar un hook de pre-commit.

### Checklist de Buenas Prácticas

| Criterio | E1 | E2 | E3 | E4 | E5 | E6 | E7 |
|---|---|---|---|---|---|---|---|
| Entrega valor al usuario | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Funciona de forma independiente | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Historias bien dimensionadas | ⚠️ (1.3, 1.6) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sin dependencias hacia adelante | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tablas creadas cuando se necesitan | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Criterios de aceptación claros (Given/When/Then) | ⚠️ (1.6) | ⚠️ (2.4, 2.6) | ⚠️ (3.2, 3.4, 3.5) | ✓ | ⚠️ (5.2) | ✓ | ✓ |
| Trazabilidad a FRs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Calidad general:** muy alta. Los criterios siguen el formato BDD, son específicos (nombres de comandos, tablas, fórmulas) e incluyen pruebas fijas con cifras. Los hallazgos son casos borde del dominio financiero y decisiones de producto pendientes, no defectos estructurales.

## Resumen y Recomendaciones

### Estado General de Preparación

**🟠 NECESITA TRABAJO (acotado).** La planificación es de alta calidad y está casi lista: cobertura de FRs del 100 %, ninguna violación crítica, sin dependencias hacia adelante y arquitectura alineada. Pero hay **6 problemas mayores**, varios de ellos en el núcleo de cálculo de la Épica 1. **La H1.1 (proyecto base) y la H1.2 pueden empezar hoy.** Los problemas mayores deben quedar resueltos antes de la **H1.6**.

### Problemas que Requieren Acción Inmediata

1. **📅 El plazo ya venció y no hay código.** El PRD pedía la app "instalada a inicios de noviembre de 2026". Hoy es 2026-11-04 y el repositorio solo tiene artefactos de planificación: 26 historias para un desarrollador. La Meta de negocio (31-ene-2027) también se acerca. Cada semana sin la app es una semana sin Ritmo ni reserva de Meta.
2. **Regla de "Periodos restantes" sin definir** (H1.6). La prueba fija de Dinero libre = 1.350.000 depende de ella.
3. **Meta vencida y Deuda que no converge** (H3.5, H3.2). Hay riesgo de división por cero o de bucle infinito en un `domain/` que debe ser total.
4. **Categorías iniciales "Salud → Gusto" y "Combustible → mantenimiento"** (H1.5). Son decisiones de producto que distorsionan el Dinero libre y la Voz del socio desde el primer día.
5. **Formato "2,1 de 6 millones"** contra `formatearDinero()` (UJ-4, H3.2).
6. **H1.3 sobredimensionada**: concentra el esqueleto de toda la app.

### Próximos Pasos Recomendados

1. **Fijar una nueva fecha y un recorte mínimo.** Instalar primero el APK con las Épicas 1, 2 y 3 (registrar, cuadrar, seguir la Meta). El PRD §6.1 ya dice que "con las cuatro primeras se puede registrar, cuadrar y seguir la Meta". Las Épicas 4 a 7 vienen después, en ese orden, y el respaldo en Drive (H7.3) queda como candidato explícito a v1.1.
2. **Corregir `epics.md` con `bmad-correct-course` o una edición directa (≈ 30 min)**:
   - H1.6: regla de Periodos restantes y día del Pago 2 del caso de prueba;
   - H3.5: comportamiento con la Meta vencida;
   - H3.2: tope de proyección y caso "no converge";
   - H1.5: confirmar la clasificación de Salud y Combustible;
   - H3.2 o H1.2: `formatearMillones()` con redondeo en contra del usuario;
   - H2.4 y H2.6: pago mayor o parcial de la cuota y base del porcentaje del Cuadre.
3. **Partir la H1.3** (núcleo `calcularEstado` + reloj por un lado, configuración de Pagos + pantalla principal por otro). Opcionalmente, partir también la H1.6.
4. **Agregar al stack** `expo-network` (o NetInfo) para la H4.3, y anotar el permiso `POST_NOTIFICATIONS` en la H6.1.
5. **Definir la navegación** (pestañas o menú y lista de movimientos) dentro de la H1.3 o la H2.5, en lugar de un documento UX completo, que no compensa en este plazo.
6. Después, ejecutar `bmad-sprint-planning` y empezar con `bmad-create-story` para la H1.1.

### Nota Final

Esta evaluación identificó **24 hallazgos en 5 categorías**: 0 críticos, 6 mayores y 18 menores/advertencias. Las categorías son calendario (1), PRD (3 ambigüedades), alineación UX (4 problemas y 2 advertencias), calidad de historias (5 mayores y 13 menores) y cobertura (0 brechas). Lo más valioso del plan está bien: un solo cálculo puro, pruebas fijas con cifras reales y trazabilidad completa. Los problemas mayores son casos borde financieros y decisiones de producto que **un agente de desarrollo no debería adivinar**. Resolverlos toma menos de una hora y evita reescribir el núcleo después. Puedes corregirlos ahora o seguir así sabiendo dónde están los riesgos.

---

**Evaluador:** John (PM) — flujo `bmad-check-implementation-readiness`
**Fecha:** 2026-11-04

## Anexo — Correcciones aplicadas (2026-11-04)

Decisiones de Priettos: **Salud → Esencial**; **Combustible → dentro del Presupuesto de mantenimiento de vehículos**; **Meta vencida → se trata como sin Meta para el cálculo** (decisión delegada al PM).

Cambios en `epics.md` (copia previa en el scratchpad de la sesión):

| Hallazgo | Corrección |
|---|---|
| 🟠 H1.3 sobredimensionada | Se partió en **1.3** (núcleo: reloj, Hechos, `calcularEstado`, `useEstado`, `ejecutar`, rastro) y **1.4** (Pagos, saldo inicial, Colchón, pantalla principal y navegación base). Las antiguas 1.4–1.8 pasan a ser **1.5–1.9**. |
| 🟠 Periodos restantes sin definir | En la H1.7 (antes 1.6): Periodos cuyo último día ≤ `fechaObjetivo`, mínimo 1. La prueba fija queda explícita: Pago 2 el día 30, Deuda sin tasa, 6 Periodos. |
| 🟠 Meta vencida | H1.7, H3.5 y H5.1: Ritmo y reserva en 0, Impacto `null`, Semáforo 🟢/🔴 y nunca se divide por cero. |
| 🟠 Deuda que no converge | H3.2: tope de 600 meses → `{valor: null}` + texto con la Voz del socio. |
| 🟠 Categorías iniciales | H1.6: Salud → Esencial sin Presupuesto; Combustible en mantenimiento, con texto de ayuda para incluirlo en el monto. |
| 🟠 "2,1 de 6 millones" | H3.2: `formatearMillones(monto, sentido)` con redondeo nunca a favor, más pruebas. |
| 🟡 Pago de cuota mayor o menor | H2.4: el exceso baja el saldo pero no es Abono; un pago menor cierra la ocurrencia por el monto real. |
| 🟡 % del Cuadre | H2.6: base = Saldo real; "—" si es ≤ 0. Entrada al Cuadre desde la pantalla principal. |
| 🟡 Condición de la H3.4 | `dineroLibre < 0 && reservaMeta > 0`. |
| 🟡 Navegación y lista de movimientos | H1.4 (navegación base) y H2.5 (pestaña Movimientos). |
| 🟡 Estados vacíos | H1.4 (pantalla principal) y H2.4 ("todo al día"). |
| 🟡 Conexión para la cola de fotos | `expo-network` en el stack, H1.1 y H4.3. |
| 🟡 ≤ 5 s medible | H5.2: cronómetro sobre el APK release, mediana de 5 intentos; `evaluarCompra` < 50 ms. |
| 🟡 Permisos de notificaciones | H6.1: `POST_NOTIFICATIONS`, notificaciones inexactas. |
| 🟡 Descripción de E3 | Ahora dice que se apoya en la amortización de la H1.7. |

`ARCHITECTURE-SPINE.md`: AD-21 incorpora la Meta vencida y la regla de Periodos restantes; el stack agrega `expo-network`.

**Pendientes (no bloquean):** partir opcionalmente la H1.7 (Deudas/amortización vs. Meta/Ritmo); NFR-6 sin criterio global de "modo avión"; sin CI. **Plazo:** sigue vencido; hay que fijar una nueva fecha en Sprint Planning.

**Estado actualizado: ✅ LISTO para implementar** (con el riesgo de calendario como única advertencia relevante).
