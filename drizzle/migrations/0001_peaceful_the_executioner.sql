CREATE TABLE `suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`listing_id` text,
	`submitter_name` text,
	`submitter_email` text,
	`title` text NOT NULL,
	`town` text,
	`category_type` text,
	`details` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `users` ADD `tier` text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tier_expires_at` integer;