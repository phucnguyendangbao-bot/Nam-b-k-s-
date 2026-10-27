CREATE TABLE `dialect_entries` (
	`content_id` text PRIMARY KEY NOT NULL,
	`headword` text NOT NULL,
	`meaning` text NOT NULL,
	`usage_context` text NOT NULL,
	`example` text NOT NULL,
	`example_note` text NOT NULL,
	`regional_scope` text NOT NULL,
	`part_of_speech` text NOT NULL,
	`audio_asset_id` text,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`reviewer` text,
	`reviewed_at` text,
	FOREIGN KEY (`content_id`) REFERENCES `cultural_contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`audio_asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`caption` text NOT NULL,
	`author` text NOT NULL,
	`source_url` text NOT NULL,
	`license_name` text NOT NULL,
	`license_url` text NOT NULL,
	`modifications` text NOT NULL,
	`attribution` text NOT NULL,
	`commercial_allowed` integer DEFAULT 0 NOT NULL,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`reviewer` text,
	`reviewed_at` text,
	`file_sha256` text DEFAULT '' NOT NULL,
	`width` integer,
	`height` integer,
	FOREIGN KEY (`content_id`) REFERENCES `cultural_contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `media_content` ON `media_assets` (`content_id`);--> statement-breakpoint
ALTER TABLE `cultural_contents` ADD `content_kind` text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE `cultural_contents` ADD `introduction` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cultural_contents` ADD `topic` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cultural_contents` ADD `scope_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cultural_contents` ADD `sections_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `cultural_contents` ADD `text_license` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cultural_contents` ADD `text_license_url` text DEFAULT '' NOT NULL;