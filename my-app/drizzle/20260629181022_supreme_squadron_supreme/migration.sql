CREATE TABLE `products` (
	`id` text PRIMARY KEY,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`metadata` text NOT NULL
);
