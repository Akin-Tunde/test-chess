import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import * as chess from './chess';
import { TRPCError } from '@trpc/server';

export const chessRouter = router({
  // Game Management
  recordMove: protectedProcedure
    .input(z.object({ gameId: z.string(), move: z.any() }))
    .mutation(async ({ input }) => {
      await chess.recordMove(input.gameId, input.move);
      return { success: true };
    }),

  createGame: protectedProcedure
    .input(z.object({ opponentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.opponentId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot play against yourself' });
      }

      const gameId = await chess.createGame(ctx.user.id, input.opponentId);
      return { gameId };
    }),

  getGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const game = await chess.getGameById(input.gameId);
      if (!game) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Game not found' });
      }
      return game;
    }),

  // Invitations
  sendInvitation: protectedProcedure
    .input(z.object({ toPlayerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const invitationId = await chess.createInvitation(ctx.user.id, input.toPlayerId);
      return { invitationId };
    }),

  getMyInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations = await chess.getInvitationsForPlayer(ctx.user.id);
    return invitations;
  }),

  acceptInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string(), gameId: z.string() }))
    .mutation(async ({ input }) => {
      await chess.acceptInvitation(input.invitationId, input.gameId);
      return { success: true };
    }),

  rejectInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ input }) => {
      await chess.rejectInvitation(input.invitationId);
      return { success: true };
    }),

  updateGameStatus: protectedProcedure
    .input(z.object({ gameId: z.string(), status: z.string(), result: z.string().optional() }))
    .mutation(async ({ input }) => {
      await chess.updateGameStatus(input.gameId, input.status, input.result);
      return { success: true };
    }),

  // Chat
  sendMessage: protectedProcedure
    .input(z.object({ gameId: z.string(), message: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const messageId = await chess.addChatMessage(input.gameId, ctx.user.id, input.message);
      return { messageId };
    }),

  getGameChat: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const messages = await chess.getChatMessages(input.gameId);
      return messages;
    }),

  // Puzzles
  getPuzzles: publicProcedure
    .input(z.object({ difficulty: z.string().optional(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const puzzles = await chess.getPuzzles(input.difficulty, input.limit);
      return puzzles;
    }),

  getPuzzle: publicProcedure
    .input(z.object({ puzzleId: z.string() }))
    .query(async ({ input }) => {
      const puzzle = await chess.getPuzzleById(input.puzzleId);
      if (!puzzle) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Puzzle not found' });
      }
      return puzzle;
    }),

  submitPuzzleSolution: protectedProcedure
    .input(z.object({ puzzleId: z.string(), solved: z.boolean(), timeSpent: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const attemptId = await chess.recordPuzzleAttempt(
        input.puzzleId,
        ctx.user.id,
        input.solved,
        input.timeSpent
      );
      return { attemptId };
    }),

  // AI Games
  createAIGame: protectedProcedure
    .input(z.object({ difficulty: z.enum(['easy', 'medium', 'hard', 'expert']), playerColor: z.enum(['white', 'black']) }))
    .mutation(async ({ ctx, input }) => {
      const gameId = await chess.createAIGame(ctx.user.id, input.difficulty, input.playerColor);
      return { gameId };
    }),

  getAIGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const game = await chess.getAIGameById(input.gameId);
      if (!game) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'AI game not found' });
      }
      return game;
    }),

  recordAIMove: protectedProcedure
    .input(z.object({ gameId: z.string(), move: z.any() }))
    .mutation(async ({ input }) => {
      await chess.recordAIMove(input.gameId, input.move);
      return { success: true };
    }),

  updateAIGameStatus: protectedProcedure
    .input(z.object({ gameId: z.string(), status: z.string(), result: z.string().optional() }))
    .mutation(async ({ input }) => {
      await chess.updateAIGame(input.gameId, { status: input.status, result: input.result });
      return { success: true };
    }),

  getMyAIGames: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return await chess.getMyAIGames(ctx.user.id, input.limit);
    }),

  generateAIMove: protectedProcedure
    .input(z.object({ 
      gameId: z.string(), 
      fen: z.string(), 
      difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
      history: z.array(z.string()).optional()
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import('./_core/llm');
      
      const difficultyPrompts = {
        easy: "You are a beginner chess player. Make a legal move, but don't worry about making the best tactical choice. Sometimes make mistakes.",
        medium: "You are an intermediate chess player. Make solid legal moves and look for basic tactical opportunities.",
        hard: "You are an advanced chess player. Make strong tactical moves and follow sound positional principles.",
        expert: "You are a grandmaster level chess player. Make the absolute best move possible in the given position."
      };

      const systemPrompt = `${difficultyPrompts[input.difficulty]} 
      Respond ONLY with the move in Standard Algebraic Notation (SAN) or UCI format (e.g., "e4", "Nf3", "e2e4"). 
      Current position FEN: ${input.fen}
      ${input.history ? `Move history: ${input.history.join(', ')}` : ''}`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: "What is your move?" }
          ],
          maxTokens: 10
        });

        const move = (result.choices[0].message.content as string).trim();
        return { move };
      } catch (error) {
        console.error("AI Move Generation Error:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate AI move' });
      }
    }),

  getAIAnalysis: protectedProcedure
    .input(z.object({ 
      fen: z.string(), 
      history: z.array(z.string()).optional() 
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import('./_core/llm');
      
      const systemPrompt = `You are a grandmaster chess analyst. 
      Analyze the current position and provide:
      1. An evaluation of the position (who is better and why).
      2. The best move for the current player.
      3. A brief explanation of the tactical or positional ideas.
      
      Respond in Markdown format.
      Current position FEN: ${input.fen}
      ${input.history ? `Move history: ${input.history.join(', ')}` : ''}`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: "Analyze this position." }
          ],
          maxTokens: 500
        });

        const analysis = (result.choices[0].message.content as string).trim();
        return { analysis };
      } catch (error) {
        console.error("AI Analysis Error:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate AI analysis' });
      }
    }),

  // Leaderboard & Stats
  getLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const leaderboard = await chess.getLeaderboard(input.limit);
      return leaderboard;
    }),

  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await chess.getUserStats(ctx.user.id);
    return stats;
  }),

  getPlayerStats: publicProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      const stats = await chess.getUserStats(input.playerId);
      if (!stats) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' });
      }
      return stats;
    }),

  // Game History
  getMyGameHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const games = await chess.getPlayerGames(ctx.user.id, input.limit);
      return games;
    }),

  // Notifications
  getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await chess.getNotificationsForUser(ctx.user.id);
    return notifications;
  }),

  markNotificationAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      await chess.markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  // Puzzle Statistics
  getPuzzleStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await chess.getPuzzleStats(ctx.user.id);
    return stats;
  }),

  getPuzzleAttempts: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const attempts = await chess.getPuzzleAttempts(ctx.user.id, input.limit);
      return attempts;
    }),

  // Game Search & Filtering
  searchGameHistory: protectedProcedure
    .input(z.object({
      result: z.enum(['white_win', 'black_win', 'draw', 'abandoned']).optional(),
      status: z.enum(['pending', 'active', 'completed', 'abandoned']).optional(),
      opponentId: z.number().optional(),
      playerColor: z.enum(['white', 'black']).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const games = await chess.searchGameHistory(ctx.user.id, {
        result: input.result,
        status: input.status,
        opponentId: input.opponentId,
        playerColor: input.playerColor,
      }, input.limit);
      return games;
    }),

  getGamesByResult: protectedProcedure
    .input(z.object({
      result: z.enum(['white_win', 'black_win', 'draw', 'abandoned']),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const games = await chess.getGamesByResult(ctx.user.id, input.result, input.limit);
      return games;
    }),

  getGamesAgainstOpponent: protectedProcedure
    .input(z.object({
      opponentId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const games = await chess.getGamesAgainstOpponent(ctx.user.id, input.opponentId, input.limit);
      return games;
    }),

  // Notification Preferences
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await chess.getNotificationPreferences(ctx.user.id);
    return prefs;
  }),

  updateNotificationPreferences: protectedProcedure
    .input(z.object({
      gameInvites: z.boolean().optional(),
      turnAlerts: z.boolean().optional(),
      puzzleResults: z.boolean().optional(),
      gameResults: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await chess.updateNotificationPreferences(ctx.user.id, input);
      return { success: true };
    }),
});
