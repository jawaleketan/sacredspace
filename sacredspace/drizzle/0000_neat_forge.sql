CREATE TABLE `contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deity_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`body` text NOT NULL,
	`transliteration` text,
	`translation` text,
	`description` text,
	`audio_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`deity_id`) REFERENCES `deities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deities_slug_unique` ON `deities` (`slug`);--> statement-breakpoint
CREATE TABLE `likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`session_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action
);
