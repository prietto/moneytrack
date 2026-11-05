CREATE TABLE `rastro` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`entidad` text NOT NULL,
	`entidad_id` text NOT NULL,
	`operacion` text NOT NULL,
	`antes` text NOT NULL,
	`despues` text,
	`fecha` text NOT NULL
);
