ALTER TABLE `gameInvitations` MODIFY COLUMN `toPlayerId` int;--> statement-breakpoint
ALTER TABLE `gameInvitations` ADD `timeControl` varchar(20) DEFAULT '10+5';