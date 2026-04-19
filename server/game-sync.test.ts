import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Chess } from "chess.js";
import * as chess from "./chess";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";

describe("Game State Synchronization", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    (getDb as any).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should retrieve game state correctly", async () => {
    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "active",
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
      ],
      result: null,
      startedAt: new Date(),
      createdAt: new Date(),
    };

    mockDb.where.mockReturnThis();
    mockDb.limit.mockResolvedValue([mockGame]);

    const game = await chess.getGameById("game-123");

    expect(game).toEqual(mockGame);
    expect(mockDb.select).toHaveBeenCalled();
  });

  it("should handle game not found", async () => {
    mockDb.limit.mockResolvedValue([]);

    const game = await chess.getGameById("nonexistent-game");

    expect(game).toBeNull();
  });

  it("should record moves and maintain move history", async () => {
    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "active",
      moves: [{ from: "e2", to: "e4" }],
      result: null,
    };

    // Mock getGameById to return the game
    mockDb.limit.mockResolvedValue([mockGame]);
    mockDb.where.mockReturnThis();

    const newMove = { from: "e7", to: "e5" };
    await chess.recordMove("game-123", newMove);

    // Verify update was called
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalled();
  });

  it("should update game status correctly", async () => {
    mockDb.where.mockReturnThis();

    await chess.updateGameStatus("game-123", "completed", "white_win");

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalled();
  });

  it("should handle game state with multiple moves", async () => {
    const moves = [
      { from: "e2", to: "e4" },
      { from: "e7", to: "e5" },
      { from: "g1", to: "f3" },
      { from: "b8", to: "c6" },
    ];

    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "active",
      moves: moves.slice(0, 3),
      result: null,
    };

    mockDb.limit.mockResolvedValue([mockGame]);
    mockDb.where.mockReturnThis();

    await chess.recordMove("game-123", moves[3]);

    expect(mockDb.set).toHaveBeenCalled();
  });

  it("should verify move sequence validity", () => {
    const chessGame = new Chess();
    const moves = [
      { from: "e2", to: "e4" },
      { from: "e7", to: "e5" },
      { from: "g1", to: "f3" },
      { from: "b8", to: "c6" },
    ];

    // Apply moves and verify they're all legal
    moves.forEach((move) => {
      const result = chessGame.move(move);
      expect(result).toBeDefined();
      expect(result.san).toBeDefined(); // Verify move was recorded in algebraic notation
    });

    // Verify final position - just check that the position is valid
    expect(chessGame.fen()).toBeDefined();
    expect(chessGame.fen()).toContain("r1bqkbnr"); // Black king-side rook moved
  });

  it("should handle game reconnection with state sync", async () => {
    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "active",
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
        { from: "g1", to: "f3" },
      ],
      result: null,
    };

    mockDb.limit.mockResolvedValue([mockGame]);

    // Simulate reconnection: fetch game state
    const game = await chess.getGameById("game-123");

    // Verify all moves are present
    expect(game?.moves).toHaveLength(3);
    expect(game?.moves[0]).toEqual({ from: "e2", to: "e4" });
    expect(game?.moves[2]).toEqual({ from: "g1", to: "f3" });
  });

  it("should maintain game integrity after multiple reconnections", async () => {
    const moves = [
      { from: "e2", to: "e4" },
      { from: "e7", to: "e5" },
    ];

    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "active",
      moves: moves,
      result: null,
    };

    // Simulate multiple reconnections
    for (let i = 0; i < 3; i++) {
      mockDb.limit.mockResolvedValue([mockGame]);
      const game = await chess.getGameById("game-123");

      expect(game?.moves).toEqual(moves);
      expect(game?.status).toBe("active");
    }
  });

  it("should handle game state with completed status", async () => {
    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "completed",
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
      ],
      result: "white_win",
      completedAt: new Date(),
    };

    mockDb.limit.mockResolvedValue([mockGame]);

    const game = await chess.getGameById("game-123");

    expect(game?.status).toBe("completed");
    expect(game?.result).toBe("white_win");
  });

  it("should reconstruct board state from move history", () => {
    const moves = [
      { from: "e2", to: "e4" },
      { from: "e7", to: "e5" },
      { from: "g1", to: "f3" },
      { from: "b8", to: "c6" },
      { from: "f1", to: "b5" },
    ];

    const chessGame = new Chess();
    moves.forEach((move) => {
      chessGame.move(move);
    });

    // Verify the reconstructed position is valid
    expect(chessGame.fen()).toBeDefined();
    expect(chessGame.fen()).toContain("1B2p3"); // Bishop on b5
  });
});

describe("Game Reconnection Scenarios", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    (getDb as any).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should sync state when player reconnects mid-game", async () => {
    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "active",
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
        { from: "g1", to: "f3" },
      ],
      result: null,
    };

    mockDb.limit.mockResolvedValue([mockGame]);

    // Player reconnects and fetches game state
    const game = await chess.getGameById("game-123");

    // Verify all moves are synced
    expect(game?.moves).toHaveLength(3);
    expect(game?.status).toBe("active");
  });

  it("should handle reconnection after opponent has moved", async () => {
    const initialMoves = [
      { from: "e2", to: "e4" },
      { from: "e7", to: "e5" },
    ];

    const updatedMoves = [
      ...initialMoves,
      { from: "g1", to: "f3" },
    ];

    // First fetch (before opponent moved)
    mockDb.limit.mockResolvedValueOnce([
      {
        id: "game-123",
        whitePlayerId: 1,
        blackPlayerId: 2,
        status: "active",
        moves: initialMoves,
        result: null,
      },
    ]);

    const game1 = await chess.getGameById("game-123");
    expect(game1?.moves).toHaveLength(2);

    // Second fetch (after opponent moved)
    mockDb.limit.mockResolvedValueOnce([
      {
        id: "game-123",
        whitePlayerId: 1,
        blackPlayerId: 2,
        status: "active",
        moves: updatedMoves,
        result: null,
      },
    ]);

    const game2 = await chess.getGameById("game-123");
    expect(game2?.moves).toHaveLength(3);
  });

  it("should handle reconnection after game completion", async () => {
    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "completed",
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
      ],
      result: "white_win",
      completedAt: new Date(),
    };

    mockDb.limit.mockResolvedValue([mockGame]);

    const game = await chess.getGameById("game-123");

    expect(game?.status).toBe("completed");
    expect(game?.result).toBe("white_win");
  });

  it("should preserve move order on reconnection", async () => {
    const moves = [
      { from: "e2", to: "e4" },
      { from: "c7", to: "c5" },
      { from: "g1", to: "f3" },
      { from: "d7", to: "d6" },
    ];

    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "active",
      moves: moves,
      result: null,
    };

    mockDb.limit.mockResolvedValue([mockGame]);

    const game = await chess.getGameById("game-123");

    // Verify moves are in correct order
    expect(game?.moves).toEqual(moves);
    moves.forEach((move, index) => {
      expect(game?.moves[index]).toEqual(move);
    });
  });

  it("should handle rapid reconnections", async () => {
    const mockGame = {
      id: "game-123",
      whitePlayerId: 1,
      blackPlayerId: 2,
      status: "active",
      moves: [{ from: "e2", to: "e4" }],
      result: null,
    };

    mockDb.limit.mockResolvedValue([mockGame]);

    // Simulate rapid reconnections
    const promises = Array(5).fill(null).map(() => chess.getGameById("game-123"));
    const results = await Promise.all(promises);

    // All reconnections should return the same game state
    results.forEach((result) => {
      expect(result?.id).toBe("game-123");
      expect(result?.moves).toHaveLength(1);
    });
  });
});
