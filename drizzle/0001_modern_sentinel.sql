CREATE TABLE `user_details_jegal` (
	`id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`data` text,
	`business_name` text,
	`is_verified` boolean NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_details_jegal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_details_jegal` ADD CONSTRAINT `user_details_jegal_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;