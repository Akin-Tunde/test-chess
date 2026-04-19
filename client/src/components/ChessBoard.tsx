import React, { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import './ChessBoard.css';

interface ChessBoardProps {
  gameId?: string;
  isPlayable?: boolean;
  onMove?: (move: any) => void;
  initialFen?: string;
  moves?: any[]; // Added moves prop to sync from external source
  playerColor?: 'white' | 'black';
}

interface Square {
  piece: string | null;
  file: number;
  rank: number;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  gameId,
  isPlayable = true,
  onMove,
  initialFen,
  moves = [],
  playerColor = 'white',
}) => {
  // Use useMemo to create the chess instance and apply moves
  const chess = useMemo(() => {
    const c = new Chess(initialFen);
    moves.forEach(m => {
      try {
        c.move(m);
      } catch (e) {
        console.error('Failed to apply move:', m, e);
      }
    });
    return c;
  }, [initialFen, moves]);

  const [board, setBoard] = useState<Square[][]>([]);
  const [selectedSquare, setSelectedSquare] = useState<{ file: number; rank: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<Set<string>>(new Set());

  // Update board whenever the chess instance changes
  useEffect(() => {
    updateBoard();
  }, [chess]);

  const updateBoard = () => {
    const newBoard: Square[][] = [];
    const fenBoard = chess.board() as any;

    for (let rank = 7; rank >= 0; rank--) {
      const row: Square[] = [];
      for (let file = 0; file < 8; file++) {
        const piece = fenBoard[rank]?.[file];
        row.push({
          piece: piece ? `${piece.color}${piece.type}` : null,
          file,
          rank,
          // Store the square name for easier lookup
        });
      }
      newBoard.push(row);
    }

    setBoard(newBoard);
  };

  const getSquareName = (file: number, rank: number): string => {
    return String.fromCharCode(97 + file) + (rank + 1);
  };

  const handleSquareClick = (file: number, rank: number) => {
    if (!isPlayable) return;

    // Only allow moving if it's the player's turn
    const turn = chess.turn() === 'w' ? 'white' : 'black';
    if (turn !== playerColor) return;

    const squareName = getSquareName(file, rank);

    // If clicking the same square, deselect
    if (selectedSquare?.file === file && selectedSquare?.rank === rank) {
      setSelectedSquare(null);
      setLegalMoves(new Set());
      return;
    }

    // If a square is already selected, try to make a move
    if (selectedSquare) {
      const fromSquare = getSquareName(selectedSquare.file, selectedSquare.rank);
      const toSquare = squareName;

      try {
        // We need to check if this is a legal move first
        const move = chess.move({
          from: fromSquare,
          to: toSquare,
          promotion: 'q', // Default to queen promotion
        });

        if (move) {
          updateBoard();
          setSelectedSquare(null);
          setLegalMoves(new Set());

          if (onMove) {
            onMove(move);
          }
        } else {
          // Invalid move, select new square if it has a piece of player's color
          const piece = chess.get(squareName as any);
          if (piece && (piece.color === 'w' ? 'white' : 'black') === playerColor) {
            setSelectedSquare({ file, rank });
            updateLegalMoves(file, rank);
          } else {
            setSelectedSquare(null);
            setLegalMoves(new Set());
          }
        }
      } catch (error) {
        console.error('Invalid move:', error);
        setSelectedSquare(null);
        setLegalMoves(new Set());
      }
    } else {
      // Select a new square and show legal moves only if it's player's piece
      const piece = chess.get(squareName as any);
      if (piece && (piece.color === 'w' ? 'white' : 'black') === playerColor) {
        setSelectedSquare({ file, rank });
        updateLegalMoves(file, rank);
      }
    }
  };

  const updateLegalMoves = (file: number, rank: number) => {
    const squareName = getSquareName(file, rank);
    const moves = chess.moves({ square: squareName as any, verbose: true }) as any[];
    const legalSquares = new Set(
      moves.map((m: any) => {
        const toSquare = typeof m === 'string' ? m : m.to;
        return toSquare;
      })
    );
    setLegalMoves(legalSquares);
  };

  const isLegalMove = (file: number, rank: number): boolean => {
    return legalMoves.has(getSquareName(file, rank));
  };

  const isSelected = (file: number, rank: number): boolean => {
    return selectedSquare?.file === file && selectedSquare?.rank === rank;
  };

  const getSquareColor = (file: number, rank: number): string => {
    const isLight = (file + rank) % 2 === 0;
    return isLight ? 'light-square' : 'dark-square';
  };

  const getPieceImage = (piece: string | null): string => {
    if (!piece) return '';
    const pieceMap: Record<string, string> = {
      wK: '♔',
      wQ: '♕',
      wR: '♖',
      wB: '♗',
      wN: '♘',
      wP: '♙',
      bK: '♚',
      bQ: '♛',
      bR: '♜',
      bB: '♝',
      bN: '♞',
      bP: '♟',
    };
    return pieceMap[piece] || '';
  };

  return (
    <div className="chess-board-container">
      <div className={`chess-board ${playerColor === 'black' ? 'flipped' : ''}`}>
        {board.map((row, rankIdx) => (
          <div key={rankIdx} className="chess-row">
            {row.map((square) => (
              <div
                key={`${square.file}-${square.rank}`}
                className={`chess-square ${getSquareColor(square.file, square.rank)} ${
                  isSelected(square.file, square.rank) ? 'selected' : ''
                } ${isLegalMove(square.file, square.rank) ? 'legal-move' : ''}`}
                onClick={() => handleSquareClick(square.file, square.rank)}
              >
                {isLegalMove(square.file, square.rank) && (
                  <div className="legal-move-indicator"></div>
                )}
                {square.piece && (
                  <div className="chess-piece">{getPieceImage(square.piece)}</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Move History */}
      <div className="move-history">
        <h3 className="neon-text-purple">Move History</h3>
        <div className="moves-list">
          {chess.history().map((move: string, idx: number) => (
            <span key={idx} className="move-notation">
              {idx % 2 === 0 && <span className="move-number">{Math.floor(idx / 2) + 1}.</span>}
              {move}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
