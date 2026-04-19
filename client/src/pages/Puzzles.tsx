import React, { useState, useEffect } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ChessBoard from "@/components/ChessBoard3D";
import { Zap, ChevronLeft, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Puzzles() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'solving' | 'correct' | 'incorrect'>('solving');
  const [moves, setMoves] = useState<any[]>([]);

  const { data: puzzles, isLoading: puzzlesLoading } = trpc.chess.getPuzzles.useQuery({ limit: 10 });
  const submitSolution = trpc.chess.submitPuzzleSolution.useMutation();

  const currentPuzzle = puzzles?.[currentPuzzleIndex];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleMove = (move: any) => {
    if (!currentPuzzle || puzzleStatus !== 'solving') return;

    const newMoves = [...moves, move];
    setMoves(newMoves);

    // Check if the move is correct (simplified for this version)
    // In a real app, we would compare with currentPuzzle.solution array
    const solution = currentPuzzle.solution as string[];
    const moveNotation = move.san;

    if (moveNotation === solution[moves.length]) {
      if (newMoves.length === solution.length) {
        setPuzzleStatus('correct');
        submitSolution.mutate({
          puzzleId: currentPuzzle.id,
          solved: true,
        });
      }
    } else {
      setPuzzleStatus('incorrect');
      submitSolution.mutate({
        puzzleId: currentPuzzle.id,
        solved: false,
      });
    }
  };

  const nextPuzzle = () => {
    if (puzzles && currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
      setPuzzleStatus('solving');
      setMoves([]);
    }
  };

  const resetPuzzle = () => {
    setPuzzleStatus('solving');
    setMoves([]);
  };

  if (authLoading || puzzlesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-primary animate-spin mb-4 mx-auto" />
          <p className="text-foreground">Loading tactical data...</p>
        </div>
      </div>
    );
  }

  if (!currentPuzzle) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold neon-text mb-4">No Puzzles Found</h2>
        <Button onClick={() => navigate("/lobby")} className="btn-neon">Back to Lobby</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/lobby")} className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold neon-text">TACTICAL TRAINING</h1>
          </div>
          <div className="w-20"></div>
        </div>
      </nav>

      <main className="container mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-4 hud-frame bg-card">
            <ChessBoard
              initialFen={currentPuzzle.fen}
              moves={moves}
              onMove={handleMove}
              isPlayable={puzzleStatus === 'solving'}
              playerColor={currentPuzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black'}
            />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6 hud-frame bg-card">
            <h2 className="text-xl font-bold neon-text mb-2">{currentPuzzle.title}</h2>
            <p className="text-muted-foreground mb-4">{currentPuzzle.description}</p>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs uppercase tracking-wider text-secondary">Difficulty:</span>
              <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded border border-secondary/30">
                {currentPuzzle.difficulty}
              </span>
            </div>

            {puzzleStatus === 'correct' && (
              <div className="p-4 bg-green-500/10 border border-green-500/50 rounded flex items-center gap-3 mb-6">
                <CheckCircle2 className="text-green-500 w-6 h-6" />
                <div>
                  <p className="text-green-500 font-bold">Puzzle Solved!</p>
                  <p className="text-xs text-green-500/70">Tactical efficiency increased.</p>
                </div>
              </div>
            )}

            {puzzleStatus === 'incorrect' && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded flex items-center gap-3 mb-6">
                <XCircle className="text-red-500 w-6 h-6" />
                <div>
                  <p className="text-red-500 font-bold">Incorrect Move</p>
                  <p className="text-xs text-red-500/70">Neural link unstable. Try again.</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {puzzleStatus !== 'solving' && (
                <Button onClick={nextPuzzle} className="btn-neon w-full">
                  Next Puzzle
                </Button>
              )}
              <Button onClick={resetPuzzle} variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10">
                Reset Puzzle
              </Button>
            </div>
          </Card>

          <Card className="p-6 hud-frame bg-card">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Training Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Puzzle {currentPuzzleIndex + 1} of {puzzles.length}</span>
                <span className="text-xs text-primary">{Math.round(((currentPuzzleIndex) / puzzles.length) * 100)}%</span>
              </div>
              <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500" 
                  style={{ width: `${((currentPuzzleIndex) / puzzles.length) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
