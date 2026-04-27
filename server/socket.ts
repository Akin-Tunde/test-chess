import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { ENV } from "./_core/env";
import * as chess from './chess';

interface GameRoom {
  gameId: string;
  whitePlayerId: number;
  blackPlayerId: number;
  players: Map<number, string>; // playerId -> socketId
  spectators: Map<number, string>; // spectatorId -> socketId
  isPublic: boolean; // Whether the game can be spectated
}

interface PuzzleRoom {
  puzzleId: string;
  playerId: number;
  socketId: string;
}

const gameRooms = new Map<string, GameRoom>();
const puzzleRooms = new Map<string, PuzzleRoom>();
const playerSockets = new Map<number, string>(); // playerId -> socketId

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: ENV.socketIOCorsOrigin || "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Player connected: ${socket.id}`);

    // Player joins and registers their ID
    socket.on("player:register", (playerId: number) => {
      playerSockets.set(playerId, socket.id);
      socket.data.playerId = playerId;
      console.log(`[Socket] Player ${playerId} registered with socket ${socket.id}`);
    });

    // Game events
    socket.on("game:join", async (gameId: string, whitePlayerId: number, blackPlayerId: number) => {
      const playerId = socket.data.playerId;
      if (!playerId) return;

      socket.join(`game:${gameId}`);

      if (!gameRooms.has(gameId)) {
        gameRooms.set(gameId, {
          gameId,
          whitePlayerId,
          blackPlayerId,
          players: new Map(),
          spectators: new Map(),
          isPublic: true, // Default to public
        });
      }

      const room = gameRooms.get(gameId)!;
      room.players.set(playerId, socket.id);

      // Notify other player that opponent is ready
      socket.to(`game:${gameId}`).emit("game:opponent-ready", {
        playerId,
        timestamp: Date.now(),
      });

      // Sync game state from DB on join/reconnect
      try {
        const game = await chess.getGameById(gameId);
        if (game) {
          socket.emit("game:sync-state", {
            moves: game.moves || [],
            status: game.status,
            result: game.result,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error(`[Socket] Failed to sync game state for ${gameId}:`, error);
      }

      console.log(`[Socket] Player ${playerId} joined game ${gameId}`);
    });

    // Move events
    socket.on("game:move", (gameId: string, move: any) => {
      const playerId = socket.data.playerId;
      socket.to(`game:${gameId}`).emit("game:move-received", {
        playerId,
        move,
        timestamp: Date.now(),
      });
      console.log(`[Socket] Move in game ${gameId} from player ${playerId}`);
    });

    // Chat events
    socket.on("game:chat", (gameId: string, message: string) => {
      const playerId = socket.data.playerId;
      io.to(`game:${gameId}`).emit("game:chat-message", {
        playerId,
        message,
        timestamp: Date.now(),
      });
    });

    // Game end events
    socket.on("game:end", (gameId: string, result: any) => {
      io.to(`game:${gameId}`).emit("game:ended", {
        result,
        timestamp: Date.now(),
      });
      gameRooms.delete(gameId);
      socket.leave(`game:${gameId}`);
    });

    // Puzzle events
    socket.on("puzzle:start", (puzzleId: string) => {
      const playerId = socket.data.playerId;
      socket.join(`puzzle:${puzzleId}:${playerId}`);
      puzzleRooms.set(`${puzzleId}:${playerId}`, {
        puzzleId,
        playerId,
        socketId: socket.id,
      });
    });

    socket.on("puzzle:submit", (puzzleId: string, solution: any) => {
      const playerId = socket.data.playerId;
      socket.emit("puzzle:result", {
        puzzleId,
        playerId,
        timestamp: Date.now(),
      });
    });

    // Invitation events
    socket.on("invite:send", (toPlayerId: number, invitationId: string) => {
      const fromPlayerId = socket.data.playerId;
      const toPlayerSocket = playerSockets.get(toPlayerId);

      if (toPlayerSocket) {
        io.to(toPlayerSocket).emit("invite:received", {
          fromPlayerId,
          invitationId,
          timestamp: Date.now(),
        });
        console.log(`[Socket] Invitation from ${fromPlayerId} to ${toPlayerId}`);
      }
    });

    socket.on("invite:accept", (invitationId: string, gameId: string, fromPlayerId: number) => {
  // 1. Find the socket ID of the person who CREATED the challenge
  const creatorSocketId = playerSockets.get(fromPlayerId);

  if (creatorSocketId) {
    // 2. Tell the creator that their invitation was accepted
    io.to(creatorSocketId).emit("invite:accepted", {
      invitationId,
      gameId,
      timestamp: Date.now(),
    });
    console.log(`[Socket] Notifying creator ${fromPlayerId} that game ${gameId} is ready`);
  }
});

    socket.on("invite:reject", (invitationId: string) => {
      const playerId = socket.data.playerId;
      socket.emit("invite:rejected", {
        invitationId,
        timestamp: Date.now(),
      });
    });

    // Spectator join
    socket.on("game:spectate", async (gameId: string) => {
      const spectatorId = socket.data.playerId;
      if (!spectatorId) return;

      socket.join(`game:${gameId}`);

      if (!gameRooms.has(gameId)) {
        gameRooms.set(gameId, {
          gameId,
          whitePlayerId: 0,
          blackPlayerId: 0,
          players: new Map(),
          spectators: new Map(),
          isPublic: true,
        });
      }

      const room = gameRooms.get(gameId)!;
      
      // Check if game is public
      if (!room.isPublic) {
        socket.emit("game:spectate-denied", { reason: "Game is private" });
        socket.leave(`game:${gameId}`);
        return;
      }

      room.spectators.set(spectatorId, socket.id);
      socket.data.isSpectator = true;
      socket.data.spectatingGameId = gameId;

      // Sync game state from DB on join
      try {
        const game = await chess.getGameById(gameId);
        if (game) {
          socket.emit("game:sync-state", {
            moves: game.moves || [],
            status: game.status,
            result: game.result,
            whitePlayerId: game.whitePlayerId,
            blackPlayerId: game.blackPlayerId,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error(`[Socket] Failed to sync game state for spectator ${spectatorId}:`, error);
      }

      // Notify others that a spectator joined
      socket.to(`game:${gameId}`).emit("game:spectator-joined", {
        spectatorId,
        timestamp: Date.now(),
      });

      console.log(`[Socket] Spectator ${spectatorId} joined game ${gameId}`);
    });

    // Spectator leave
    socket.on("game:spectate-leave", (gameId: string) => {
      const spectatorId = socket.data.playerId;
      if (!spectatorId) return;

      const room = gameRooms.get(gameId);
      if (room) {
        room.spectators.delete(spectatorId);
        socket.to(`game:${gameId}`).emit("game:spectator-left", {
          spectatorId,
          timestamp: Date.now(),
        });
      }

      socket.leave(`game:${gameId}`);
      socket.data.isSpectator = false;
      socket.data.spectatingGameId = null;
      console.log(`[Socket] Spectator ${spectatorId} left game ${gameId}`);
    });

    // Get active games (for lobby)
    socket.on("games:list-active", async () => {
      try {
        const activeGames = Array.from(gameRooms.values())
          .filter(room => room.isPublic)
          .map(room => ({
            gameId: room.gameId,
            whitePlayerId: room.whitePlayerId,
            blackPlayerId: room.blackPlayerId,
            spectatorCount: room.spectators.size,
          }));
        socket.emit("games:active-list", activeGames);
      } catch (error) {
        console.error("[Socket] Failed to list active games:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      const playerId = socket.data.playerId;
      if (playerId) {
        // Remove from spectating if applicable
        if (socket.data.isSpectator && socket.data.spectatingGameId) {
          const room = gameRooms.get(socket.data.spectatingGameId);
          if (room) {
            room.spectators.delete(playerId);
          }
        }
        playerSockets.delete(playerId);
        console.log(`[Socket] Player ${playerId} disconnected`);
      }
    });
  });

  return io;
}

export function notifyPlayer(io: SocketIOServer, playerId: number, event: string, data: any) {
  const socketId = playerSockets.get(playerId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
}

export function broadcastToGame(io: SocketIOServer, gameId: string, event: string, data: any) {
  io.to(`game:${gameId}`).emit(event, data);
}
