CREATE TABLE `ajustes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`saldo_inicial_monto` integer,
	`saldo_inicial_fecha` text,
	`colchon` integer
);
--> statement-breakpoint
CREATE TABLE `pagos` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`numero` integer NOT NULL,
	`dia` integer NOT NULL,
	`monto_esperado` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pagos_numero_vigente` ON `pagos` (`numero`) WHERE "pagos"."deleted_at" is null;