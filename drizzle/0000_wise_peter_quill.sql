CREATE TABLE `user_bookmarks` (
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `kind`, `target_id`)
);
--> statement-breakpoint
CREATE TABLE `source_citations` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`source_id` text NOT NULL,
	`statement` text DEFAULT '' NOT NULL,
	`claim_kind` text DEFAULT 'fact' NOT NULL,
	`locator` text DEFAULT '' NOT NULL,
	`source_version` text DEFAULT '' NOT NULL,
	`relation` text DEFAULT 'lead' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`review_note` text DEFAULT '' NOT NULL,
	`reviewer` text,
	`reviewed_at` text,
	FOREIGN KEY (`content_id`) REFERENCES `cultural_contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `source_registry`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `citation_content` ON `source_citations` (`content_id`);--> statement-breakpoint
CREATE TABLE `cultural_contents` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`historical_area` text NOT NULL,
	`community` text NOT NULL,
	`classification` text NOT NULL,
	`imported_verification` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`approved_revision` integer DEFAULT 0 NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`storage_consent` integer DEFAULT 0 NOT NULL,
	`publish_rights` integer DEFAULT 0 NOT NULL,
	`rights_basis` text DEFAULT '' NOT NULL,
	`rights_reviewer` text,
	`latitude` real,
	`longitude` real,
	`geo_reviewed` integer DEFAULT 0 NOT NULL,
	`geo_basis` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cultural_contents_slug_unique` ON `cultural_contents` (`slug`);--> statement-breakpoint
CREATE INDEX `contents_status_category` ON `cultural_contents` (`status`,`category`);--> statement-breakpoint
CREATE TABLE `review_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tour_progress` (
	`user_id` text NOT NULL,
	`tour_id` text NOT NULL,
	`stop_id` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `tour_id`),
	FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stop_id`) REFERENCES `tour_stops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entity_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`kind` text NOT NULL,
	`source_id` text NOT NULL,
	`locator` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text NOT NULL,
	`reviewer` text,
	FOREIGN KEY (`from_id`) REFERENCES `cultural_contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_id`) REFERENCES `cultural_contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `source_registry`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`revision` integer NOT NULL,
	`snapshot_json` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `cultural_contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `source_registry` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_type` text NOT NULL,
	`url` text NOT NULL,
	`topics` text NOT NULL,
	`format` text NOT NULL,
	`license_reported` text NOT NULL,
	`next_action` text NOT NULL,
	`notes` text NOT NULL,
	`input_locator` text NOT NULL,
	`batch_hash` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tour_stops` (
	`id` text PRIMARY KEY NOT NULL,
	`tour_id` text NOT NULL,
	`content_id` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `cultural_contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `community_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`contributor_name` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`provenance` text NOT NULL,
	`storage_consent` integer NOT NULL,
	`publication_consent` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewer` text,
	`review_note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tours` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reviewed_by` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tours_slug_unique` ON `tours` (`slug`);