CREATE TABLE `obligaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`tipo` text NOT NULL,
	`nombre` text NOT NULL,
	`monto` integer,
	`dia` integer,
	`fecha_vencimiento` text,
	`vehiculo_id` text,
	`reserva_inicial_monto` integer,
	`reserva_inicial_fecha` text
);
--> statement-breakpoint
CREATE TABLE `vehiculos` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`nombre` text NOT NULL
);
