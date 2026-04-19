import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";

describe("Chess Move Validation", () => {
  it("should allow legal starting moves", () => {
    const chess = new Chess();
    const move = chess.move("e4");
    expect(move).toBeDefined();
    // In some versions of chess.js, the en passant square is only present if a capture is possible.
    // We'll just check if the position part of the FEN is correct.
    expect(chess.fen()).toContain("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq");
  });

  it("should reject illegal moves", () => {
    const chess = new Chess();
    // Move e5 is illegal for white on the first move
    expect(() => chess.move("e5")).toThrow();
  });

  it("should detect checkmate", () => {
    const chess = new Chess();
    // Scholar's Mate
    chess.move("e4");
    chess.move("e5");
    chess.move("Qh5");
    chess.move("Nc6");
    chess.move("Bc4");
    chess.move("Nf6");
    chess.move("Qxf7#");
    
    expect(chess.isCheckmate()).toBe(true);
    expect(chess.isGameOver()).toBe(true);
  });

  it("should detect stalemate", () => {
    // Corrected stalemate position
    // White to move, but let's set it up so it's black's turn and black has no moves
    const chess = new Chess("k7/8/8/8/8/8/5Q2/K7 w - - 0 1");
    chess.move("Qb6"); // White moves to b6, black is not in check but has no legal moves
    expect(chess.isStalemate()).toBe(true);
  });

  it("should handle pawn promotion", () => {
    const chess = new Chess("8/P7/8/8/8/8/k7/7K w - - 0 1");
    const move = chess.move({ from: "a7", to: "a8", promotion: "q" });
    expect(move).toBeDefined();
    expect(chess.get("a8").type).toBe("q");
  });
});
