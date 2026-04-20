CREATE TABLE `aiGames` (
	`id` varchar(64) NOT NULL,
	`playerId` int NOT NULL,
	`difficulty` enum('easy','medium','hard','expert') NOT NULL DEFAULT 'medium',
	`playerColor` enum('white','black') NOT NULL DEFAULT 'white',
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`result` enum('player_win','ai_win','draw','abandoned'),
	`pgn` text,
	`moves` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiGames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` varchar(64) NOT NULL,
	`gameId` varchar(64) NOT NULL,
	`playerId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameInvitations` (
	`id` varchar(64) NOT NULL,
	`fromPlayerId` int NOT NULL,
	`toPlayerId` int NOT NULL,
	`status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
	`gameId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `gameInvitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` varchar(64) NOT NULL,
	`whitePlayerId` int NOT NULL,
	`blackPlayerId` int NOT NULL,
	`status` enum('pending','active','completed','abandoned') NOT NULL DEFAULT 'pending',
	`result` enum('white_win','black_win','draw','abandoned'),
	`pgn` text,
	`moves` json,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('game_invitation','turn_alert','puzzle_result','game_result') NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `puzzleAttempts` (
	`id` varchar(64) NOT NULL,
	`puzzleId` varchar(64) NOT NULL,
	`playerId` int NOT NULL,
	`solved` boolean NOT NULL DEFAULT false,
	`attempts` int NOT NULL DEFAULT 1,
	`timeSpent` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `puzzleAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `puzzles` (
	`id` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`fen` text NOT NULL,
	`solution` json NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'intermediate',
	`theme` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `puzzles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`password` text,
	`salt` varchar(64),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`rating` int NOT NULL DEFAULT 1200,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`draws` int NOT NULL DEFAULT 0,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `playerIdx` ON `aiGames` (`playerId`);--> statement-breakpoint
CREATE INDEX `gameIdx` ON `chatMessages` (`gameId`);--> statement-breakpoint
CREATE INDEX `toPlayerIdx` ON `gameInvitations` (`toPlayerId`);--> statement-breakpoint
CREATE INDEX `whitePlayerIdx` ON `games` (`whitePlayerId`);--> statement-breakpoint
CREATE INDEX `blackPlayerIdx` ON `games` (`blackPlayerId`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `playerIdx` ON `puzzleAttempts` (`playerId`);--> statement-breakpoint
CREATE INDEX `puzzleIdx` ON `puzzleAttempts` (`puzzleId`);