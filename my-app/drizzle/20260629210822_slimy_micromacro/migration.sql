CREATE TABLE `tenants` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`tenant_id` text,
	`email` text NOT NULL UNIQUE,
	`password` text NOT NULL,
	CONSTRAINT `fk_users_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`)
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`metadata` text NOT NULL,
	CONSTRAINT `fk_products_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_products`(`id`, `tenant_id`, `name`, `description`, `metadata`) SELECT `id`, `tenant_id`, `name`, `description`, `metadata` FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;