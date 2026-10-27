CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`sender_name` text NOT NULL,
	`sender_email` text NOT NULL,
	`sender_phone` text,
	`message` text NOT NULL,
	`status` text DEFAULT 'unread' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
