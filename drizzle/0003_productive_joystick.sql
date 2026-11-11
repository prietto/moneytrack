CREATE TABLE `categorias` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`nombre` text NOT NULL,
	`clase_default` text NOT NULL,
	`presupuesto_id` text,
	`fondo_id` text,
	`requiere_vehiculo` integer DEFAULT false NOT NULL,
	`es_sistema` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fondos` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`nombre` text NOT NULL,
	`aporte_mensual` integer,
	`saldo_inicial_monto` integer,
	`saldo_inicial_fecha` text
);
--> statement-breakpoint
CREATE TABLE `presupuestos` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`nombre` text NOT NULL,
	`monto_mensual` integer
);
