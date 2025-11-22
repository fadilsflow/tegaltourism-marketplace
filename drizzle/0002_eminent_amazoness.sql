CREATE TABLE `ad_claims` (
	`id` varchar(191) NOT NULL,
	`ad_id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`claimed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ads` (
	`id` varchar(191) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`image_url` text NOT NULL,
	`target_url` text NOT NULL,
	`reward_coin` int NOT NULL DEFAULT 0,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`quota` int,
	`status` text,
	`sort_order` int DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`impressions` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`amount` int NOT NULL,
	`type` text NOT NULL,
	`ad_id` varchar(191),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_details_jegal` MODIFY COLUMN `is_verified` enum('Menunggu','Disetujui','Arsip') NOT NULL DEFAULT 'Menunggu';--> statement-breakpoint
ALTER TABLE `user_details_jegal` ADD `contact` text;--> statement-breakpoint
ALTER TABLE `ad_claims` ADD CONSTRAINT `ad_claims_ad_id_ads_id_fk` FOREIGN KEY (`ad_id`) REFERENCES `ads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ad_claims` ADD CONSTRAINT `ad_claims_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_ad_id_ads_id_fk` FOREIGN KEY (`ad_id`) REFERENCES `ads`(`id`) ON DELETE set null ON UPDATE no action;