import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, float, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with chess-specific fields for ratings and statistics.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: text("password"),
  salt: varchar("salt", { length: 64 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  rating: int("rating").default(1200).notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  draws: int("draws").default(0).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Games table for storing completed and active games
 */
export const games = mysqlTable("games", {
  id: varchar("id", { length: 64 }).primaryKey(),
  whitePlayerId: int("whitePlayerId").notNull(),
  blackPlayerId: int("blackPlayerId").notNull(),
  status: mysqlEnum("status", ["pending", "active", "completed", "abandoned"]).default("pending").notNull(),
  result: mysqlEnum("result", ["white_win", "black_win", "draw", "abandoned"]),
  pgn: text("pgn"),
  moves: json("moves"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  whitePlayerIdx: index("whitePlayerIdx").on(table.whitePlayerId),
  blackPlayerIdx: index("blackPlayerIdx").on(table.blackPlayerId),
}));

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/**
 * Game invitations table
 */
export const gameInvitations = mysqlTable("gameInvitations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  fromPlayerId: int("fromPlayerId").notNull(),
  // CHANGE THIS: Remove .notNull() to allow public challenges
  toPlayerId: int("toPlayerId"), 
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "expired"]).default("pending").notNull(),
  // Add metadata for time control
  timeControl: varchar("timeControl", { length: 20 }).default("10+5"),
  gameId: varchar("gameId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, (table) => ({
  toPlayerIdx: index("toPlayerIdx").on(table.toPlayerId),
}));

export type GameInvitation = typeof gameInvitations.$inferSelect;
export type InsertGameInvitation = typeof gameInvitations.$inferInsert;

/**
 * Chat messages table for in-game communication
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  gameId: varchar("gameId", { length: 64 }).notNull(),
  playerId: int("playerId").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  gameIdx: index("gameIdx").on(table.gameId),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Chess puzzles table
 */
export const puzzles = mysqlTable("puzzles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fen: text("fen").notNull(),
  solution: json("solution").notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced", "expert"]).default("intermediate").notNull(),
  theme: varchar("theme", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Puzzle = typeof puzzles.$inferSelect;
export type InsertPuzzle = typeof puzzles.$inferInsert;

/**
 * Puzzle attempts table
 */
export const puzzleAttempts = mysqlTable("puzzleAttempts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  puzzleId: varchar("puzzleId", { length: 64 }).notNull(),
  playerId: int("playerId").notNull(),
  solved: boolean("solved").default(false).notNull(),
  attempts: int("attempts").default(1).notNull(),
  timeSpent: int("timeSpent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  playerIdx: index("playerIdx").on(table.playerId),
  puzzleIdx: index("puzzleIdx").on(table.puzzleId),
}));

export type PuzzleAttempt = typeof puzzleAttempts.$inferSelect;
export type InsertPuzzleAttempt = typeof puzzleAttempts.$inferInsert;

/**
 * AI games table for single-player mode
 */
export const aiGames = mysqlTable("aiGames", {
  id: varchar("id", { length: 64 }).primaryKey(),
  playerId: int("playerId").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard", "expert"]).default("medium").notNull(),
  playerColor: mysqlEnum("playerColor", ["white", "black"]).default("white").notNull(),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  result: mysqlEnum("result", ["player_win", "ai_win", "draw", "abandoned"]),
  pgn: text("pgn"),
  moves: json("moves"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  playerIdx: index("playerIdx").on(table.playerId),
}));

export type AIGame = typeof aiGames.$inferSelect;
export type InsertAIGame = typeof aiGames.$inferInsert;

/**
 * Notifications table
 */
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["game_invitation", "turn_alert", "puzzle_result", "game_result"]).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: json("data"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;