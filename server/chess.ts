import { nanoid } from 'nanoid';
import { getDb } from './db';
import { games, gameInvitations, chatMessages, puzzles, puzzleAttempts, aiGames, notifications, users } from '../drizzle/schema';
import { eq, and, or, desc } from 'drizzle-orm';

/**
 * Game Management
 */
export async function createGame(whitePlayerId: number, blackPlayerId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const gameId = nanoid();
  const now = new Date();

  await db.insert(games).values({
    id: gameId,
    whitePlayerId,
    blackPlayerId,
    status: 'active', // Set to active immediately
    moves: [],
    startedAt: now,
    createdAt: now,
  });

  return gameId;
}

export async function getGameById(gameId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  return result[0] || null;
}

export async function updateGameStatus(gameId: string, status: string, result?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const updates: any = { status };
  if (result) updates.result = result;
  if (status === 'completed') updates.completedAt = new Date();

  await db.update(games).set(updates).where(eq(games.id, gameId));
}

export async function recordMove(gameId: string, move: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const game = await getGameById(gameId);
  if (!game) throw new Error('Game not found');

  const moves = (game.moves as any[]) || [];
  moves.push(move);

  await db.update(games).set({ moves }).where(eq(games.id, gameId));
}

/**
 * Game Invitations
 */
export async function createInvitation(fromPlayerId: number, toPlayerId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const invitationId = nanoid();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(gameInvitations).values({
    id: invitationId,
    fromPlayerId,
    toPlayerId,
    status: 'pending',
    expiresAt,
    createdAt: new Date(),
  });

  return invitationId;
}

export async function getInvitationsForPlayer(playerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(gameInvitations)
    .where(and(eq(gameInvitations.toPlayerId, playerId), eq(gameInvitations.status, 'pending')));

  return result;
}

export async function getInvitationById(invitationId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(gameInvitations).where(eq(gameInvitations.id, invitationId)).limit(1);
  return result[0] || null;
}

export async function acceptInvitation(invitationId: string, gameId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const invitation = await getInvitationById(invitationId);
  if (!invitation) throw new Error('Invitation not found');

  // Create the actual game record
  // By default, the challenger (fromPlayerId) is white, and the recipient is black
  // You could randomize this or add it to invitation data
  await createGame(invitation.fromPlayerId, invitation.toPlayerId);

  // Update invitation status
  await db.update(gameInvitations).set({ status: 'accepted', gameId }).where(eq(gameInvitations.id, invitationId));
}

export async function rejectInvitation(invitationId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(gameInvitations).set({ status: 'rejected' }).where(eq(gameInvitations.id, invitationId));
}

/**
 * Chat Messages
 */
export async function addChatMessage(gameId: string, playerId: number, message: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const messageId = nanoid();

  await db.insert(chatMessages).values({
    id: messageId,
    gameId,
    playerId,
    message,
    createdAt: new Date(),
  });

  return messageId;
}

export async function getChatMessages(gameId: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(chatMessages).where(eq(chatMessages.gameId, gameId));
  return result;
}

/**
 * Puzzles
 */
export async function getPuzzles(difficulty?: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  if (difficulty) {
    const result = await db.select().from(puzzles).where(eq(puzzles.difficulty, difficulty as any)).limit(limit);
    return result;
  }

  const result = await db.select().from(puzzles).limit(limit);
  return result;
}

export async function getPuzzleById(puzzleId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(puzzles).where(eq(puzzles.id, puzzleId)).limit(1);
  return result[0] || null;
}

export async function recordPuzzleAttempt(puzzleId: string, playerId: number, solved: boolean, timeSpent?: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const attemptId = nanoid();

  await db.insert(puzzleAttempts).values({
    id: attemptId,
    puzzleId,
    playerId,
    solved,
    timeSpent,
    createdAt: new Date(),
  });

  return attemptId;
}

/**
 * AI Games
 */
export async function createAIGame(playerId: number, difficulty: string, playerColor: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const gameId = nanoid();

  await db.insert(aiGames).values({
    id: gameId,
    playerId,
    difficulty: difficulty as any,
    playerColor: playerColor as any,
    status: 'active',
    moves: [],
    startedAt: new Date(),
    createdAt: new Date(),
  });

  return gameId;
}

export async function getAIGameById(gameId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(aiGames).where(eq(aiGames.id, gameId)).limit(1);
  return result[0] || null;
}

export async function updateAIGame(gameId: string, updates: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  if (updates.status === 'completed' && !updates.completedAt) {
    updates.completedAt = new Date();
  }

  await db.update(aiGames).set(updates).where(eq(aiGames.id, gameId));
}

export async function recordAIMove(gameId: string, move: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const game = await getAIGameById(gameId);
  if (!game) throw new Error('AI Game not found');

  const moves = (game.moves as any[]) || [];
  moves.push(move);

  await db.update(aiGames).set({ moves }).where(eq(aiGames.id, gameId));
}

export async function getMyAIGames(playerId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(aiGames)
    .where(eq(aiGames.playerId, playerId))
    .orderBy(desc(aiGames.createdAt))
    .limit(limit);

  return result;
}

/**
 * Notifications
 */
export async function createNotification(userId: number, type: string, title: string, message: string, data?: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const notificationId = nanoid();

  await db.insert(notifications).values({
    id: notificationId,
    userId,
    type: type as any,
    title,
    message,
    data,
    read: false,
    createdAt: new Date(),
  });

  return notificationId;
}

export async function getNotificationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(notifications).where(eq(notifications.userId, userId));
  return result;
}

export async function markNotificationAsRead(notificationId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
}

/**
 * User Statistics
 */
export async function updateUserStats(userId: number, result: 'win' | 'loss' | 'draw', ratingChange: number = 0) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) throw new Error('User not found');

  const updates: any = {};
  if (result === 'win') updates.wins = (user[0].wins || 0) + 1;
  if (result === 'loss') updates.losses = (user[0].losses || 0) + 1;
  if (result === 'draw') updates.draws = (user[0].draws || 0) + 1;

  if (ratingChange !== 0) {
    updates.rating = Math.max(0, (user[0].rating || 1200) + ratingChange);
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
}

export async function getLeaderboard(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      rating: users.rating,
      wins: users.wins,
      losses: users.losses,
      draws: users.draws,
    })
    .from(users)
    .orderBy((t) => desc(t.rating))
    .limit(limit);

  return result;
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      rating: users.rating,
      wins: users.wins,
      losses: users.losses,
      draws: users.draws,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] || null;
}

export async function getPlayerGames(playerId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(games)
    .where(or(eq(games.whitePlayerId, playerId), eq(games.blackPlayerId, playerId)))
    .limit(limit);

  return result;
}

/**
 * Puzzle Statistics
 */
export async function getPuzzleStats(playerId: number) {
  const db = await getDb();
  if (!db) return null;

  const attempts = await db.select().from(puzzleAttempts).where(eq(puzzleAttempts.playerId, playerId));
  
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      totalSolved: 0,
      solveRate: 0,
      byDifficulty: {
        beginner: { attempts: 0, solved: 0, solveRate: 0 },
        intermediate: { attempts: 0, solved: 0, solveRate: 0 },
        advanced: { attempts: 0, solved: 0, solveRate: 0 },
        expert: { attempts: 0, solved: 0, solveRate: 0 },
      },
      averageTimeSpent: 0,
      recentAttempts: [],
    };
  }

  // Get puzzle details for difficulty classification
  const puzzleIds = [...new Set(attempts.map(a => a.puzzleId))];
  const puzzleDetails = await db.select().from(puzzles).where(
    puzzleIds.length > 0 ? or(...puzzleIds.map(id => eq(puzzles.id, id))) : undefined
  );
  
  const puzzleMap = new Map(puzzleDetails.map(p => [p.id, p]));

  // Calculate statistics
  const totalAttempts = attempts.length;
  const totalSolved = attempts.filter(a => a.solved).length;
  const solveRate = totalAttempts > 0 ? (totalSolved / totalAttempts * 100) : 0;

  // Group by difficulty
  const byDifficulty: any = {
    beginner: { attempts: 0, solved: 0, solveRate: 0 },
    intermediate: { attempts: 0, solved: 0, solveRate: 0 },
    advanced: { attempts: 0, solved: 0, solveRate: 0 },
    expert: { attempts: 0, solved: 0, solveRate: 0 },
  };

  attempts.forEach(attempt => {
    const puzzle = puzzleMap.get(attempt.puzzleId);
    const difficulty = puzzle?.difficulty || 'intermediate';
    
    if (byDifficulty[difficulty]) {
      byDifficulty[difficulty].attempts += 1;
      if (attempt.solved) {
        byDifficulty[difficulty].solved += 1;
      }
    }
  });

  // Calculate solve rates per difficulty
  Object.keys(byDifficulty).forEach(difficulty => {
    const stats = byDifficulty[difficulty];
    stats.solveRate = stats.attempts > 0 ? (stats.solved / stats.attempts * 100) : 0;
  });

  // Calculate average time spent
  const attemptsWithTime = attempts.filter(a => a.timeSpent);
  const averageTimeSpent = attemptsWithTime.length > 0
    ? attemptsWithTime.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attemptsWithTime.length
    : 0;

  // Get recent attempts (last 5)
  const recentAttempts = attempts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(attempt => ({
      ...attempt,
      puzzleTitle: puzzleMap.get(attempt.puzzleId)?.title || 'Unknown',
      puzzleDifficulty: puzzleMap.get(attempt.puzzleId)?.difficulty || 'intermediate',
    }));

  return {
    totalAttempts,
    totalSolved,
    solveRate: Math.round(solveRate * 10) / 10,
    byDifficulty,
    averageTimeSpent: Math.round(averageTimeSpent),
    recentAttempts,
  };
}

export async function getPuzzleAttempts(playerId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const attempts = await db
    .select()
    .from(puzzleAttempts)
    .where(eq(puzzleAttempts.playerId, playerId))
    .orderBy(desc(puzzleAttempts.createdAt))
    .limit(limit);

  // Enrich with puzzle details
  const puzzleIds = [...new Set(attempts.map(a => a.puzzleId))];
  const puzzleDetails = await db.select().from(puzzles).where(
    puzzleIds.length > 0 ? or(...puzzleIds.map(id => eq(puzzles.id, id))) : undefined
  );
  
  const puzzleMap = new Map(puzzleDetails.map(p => [p.id, p]));

  return attempts.map(attempt => ({
    ...attempt,
    puzzleTitle: puzzleMap.get(attempt.puzzleId)?.title || 'Unknown',
    puzzleDifficulty: puzzleMap.get(attempt.puzzleId)?.difficulty || 'intermediate',
  }));
}


/**
 * Game Search & Filtering
 */
export async function searchGameHistory(
  playerId: number,
  filters?: {
    result?: string;
    status?: string;
    opponentId?: number;
    playerColor?: string;
  },
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [or(eq(games.whitePlayerId, playerId), eq(games.blackPlayerId, playerId))];

  if (filters?.result) {
    conditions.push(eq(games.result, filters.result as any));
  }

  if (filters?.status) {
    conditions.push(eq(games.status, filters.status as any));
  }

  if (filters?.opponentId) {
    conditions.push(
      or(
        and(eq(games.whitePlayerId, playerId), eq(games.blackPlayerId, filters.opponentId)),
        and(eq(games.blackPlayerId, playerId), eq(games.whitePlayerId, filters.opponentId))
      )
    );
  }

  if (filters?.playerColor) {
    if (filters.playerColor === 'white') {
      conditions.push(eq(games.whitePlayerId, playerId));
    } else {
      conditions.push(eq(games.blackPlayerId, playerId));
    }
  }

  const result = await db
    .select()
    .from(games)
    .where(and(...conditions))
    .orderBy(desc(games.completedAt || games.createdAt))
    .limit(limit);

  return result;
}

export async function getGamesByResult(playerId: number, result: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const gameList = await db
    .select()
    .from(games)
    .where(
      and(
        or(eq(games.whitePlayerId, playerId), eq(games.blackPlayerId, playerId)),
        eq(games.result, result as any)
      )
    )
    .orderBy(desc(games.completedAt))
    .limit(limit);

  return gameList;
}

export async function getGamesAgainstOpponent(playerId: number, opponentId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const gameList = await db
    .select()
    .from(games)
    .where(
      or(
        and(eq(games.whitePlayerId, playerId), eq(games.blackPlayerId, opponentId)),
        and(eq(games.blackPlayerId, playerId), eq(games.whitePlayerId, opponentId))
      )
    )
    .orderBy(desc(games.completedAt))
    .limit(limit);

  return gameList;
}


/**
 * Notification Preferences
 */
export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) return null;

  // Return default preferences if not stored in metadata
  const metadata = user[0].metadata as any || {};
  return {
    gameInvites: metadata.notificationPreferences?.gameInvites ?? true,
    turnAlerts: metadata.notificationPreferences?.turnAlerts ?? true,
    puzzleResults: metadata.notificationPreferences?.puzzleResults ?? false,
    gameResults: metadata.notificationPreferences?.gameResults ?? true,
  };
}

export async function updateNotificationPreferences(userId: number, preferences: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) throw new Error('User not found');

  const metadata = user[0].metadata as any || {};
  metadata.notificationPreferences = {
    ...(metadata.notificationPreferences || {}),
    ...preferences,
  };

  await db.update(users).set({ metadata }).where(eq(users.id, userId));
}

export async function triggerNotification(userId: number, type: string, title: string, message: string, data?: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check user preferences
  const prefs = await getNotificationPreferences(userId);
  if (!prefs) return;

  let shouldNotify = true;
  switch (type) {
    case 'game_invitation':
      shouldNotify = prefs.gameInvites;
      break;
    case 'turn_alert':
      shouldNotify = prefs.turnAlerts;
      break;
    case 'puzzle_result':
      shouldNotify = prefs.puzzleResults;
      break;
    case 'game_result':
      shouldNotify = prefs.gameResults;
      break;
  }

  if (!shouldNotify) return;

  // Create the notification
  await createNotification(userId, type, title, message, data);
}
