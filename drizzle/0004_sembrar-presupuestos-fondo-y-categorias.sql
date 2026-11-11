-- Siembra de H1.6 (AD-9, AD-10): Presupuestos esenciales, Fondo protegido y
-- categorías iniciales, sin montos (los confirma Priettos). Ids fijos con forma
-- UUID v4, iguales a IDS_SIEMBRA de src/data/siembra.ts. Una sentencia por
-- bloque: el migrador de Expo ejecuta un bloque a la vez.
INSERT INTO `presupuestos` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `monto_mensual`) VALUES ('00000000-0000-4000-8000-000000000101', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Comida', NULL);
--> statement-breakpoint
INSERT INTO `presupuestos` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `monto_mensual`) VALUES ('00000000-0000-4000-8000-000000000102', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Mantenimiento de vehículos', NULL);
--> statement-breakpoint
INSERT INTO `fondos` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `aporte_mensual`, `saldo_inicial_monto`, `saldo_inicial_fecha`) VALUES ('00000000-0000-4000-8000-000000000201', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Fondo enduro', NULL, NULL, NULL);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000301', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Mercado y comida', 'esencial', '00000000-0000-4000-8000-000000000101', NULL, 0, 0);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000302', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Mantenimiento de vehículo', 'esencial', '00000000-0000-4000-8000-000000000102', NULL, 1, 0);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000303', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Combustible', 'esencial', '00000000-0000-4000-8000-000000000102', NULL, 1, 0);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000304', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Equipo de enduro', 'fondo', NULL, '00000000-0000-4000-8000-000000000201', 0, 0);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000305', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Salud', 'esencial', NULL, NULL, 0, 0);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000306', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Comida afuera', 'gusto', NULL, NULL, 0, 0);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000307', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Salidas', 'gusto', NULL, NULL, 0, 0);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000308', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Compras personales', 'gusto', NULL, NULL, 0, 0);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000309', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Otros', 'gusto', NULL, NULL, 0, 0);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000310', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Pago de Obligación', 'esencial', NULL, NULL, 0, 1);
--> statement-breakpoint
INSERT INTO `categorias` (`id`, `created_at`, `updated_at`, `deleted_at`, `nombre`, `clase_default`, `presupuesto_id`, `fondo_id`, `requiere_vehiculo`, `es_sistema`) VALUES ('00000000-0000-4000-8000-000000000311', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, 'Sin registrar', 'gusto', NULL, NULL, 0, 1);
