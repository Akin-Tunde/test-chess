import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cpu, ChevronLeft, Zap, Trophy, Play, Pause, RotateCcw } from "lucide-react";
import ChessBoard from "@/components/ChessBoard3D";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Chess } from "chess.js";

export default function AIVsAI() {
  const [, setLocation] = useLocation();
  const [moves, setMoves] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("active");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [isPaused, setIsPaused] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'white' | 'black'>('white');
  
  const generateAiMoveMutation = trpc.chess.generateAIMove.useMutation();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const chess = useMemo(() => {
    const c = new Chess();
    moves.forEach(m => {
      try { c.move(m); } catch (e) {}
    });
    return c;
  }, [moves]);

  useEffect(() => {
    if (status === 'active' && !isPaused && !isAiThinking) {
      // Add a small delay between moves for better viewing experience
      gameLoopRef.current = setTimeout(() => {
        handleAiMove();
      }, 1500);
    }
    return () => {
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, [moves, isPaused, status]);

  const handleAiMove = async () => {
    if (chess.isGameOver()) {
      setStatus('completed');
      return;
    }

    setIsAiThinking(true);
    try {
      const fen = chess.fen();
      const history = chess.history();
      
      const result = await generateAiMoveMutation.mutateAsync({
        gameId: "ai-vs-ai-temp", // Virtual ID for spectator mode
        fen,
        difficulty: difficulty as any,
        history
      });

      if (result.move) {
        try {
          const move = chess.move(result.move);
          if (move) {
            setMoves(prev => [...prev, move]);
            setCurrentTurn(chess.turn() === 'w' ? 'white' : 'black');
          }
        } catch (e) {
          console.error("AI generated invalid move:", result.move);
          // Retry after a short delay
          setTimeout(handleAiMove, 1000);
        }
      }
    } catch (error) {
      console.error("Failed to get AI move:", error);
      setIsPaused(true);
      toast.error("AI connection interrupted. Paused.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const resetGame = () => {
    setMoves([]);
    setStatus('active');
    setIsPaused(false);
    setCurrentTurn('white');
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                <Cpu className="h-8 w-8 text-primary" />
                <Cpu className="h-8 w-8 text-secondary" />
              </div>
              <h1 className="text-4xl font-black neon-text">AI VS AI SPECTATOR</h1>
            </div>
            <p className="text-muted-foreground">Watching two neural networks compete in real-time</p>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/lobby")} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Back to Lobby
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-card border-border p-6 hud-frame">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentTurn === 'white' && isAiThinking ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
                    <span className={`font-bold ${currentTurn === 'white' ? 'text-primary' : 'text-muted-foreground'}`}>AI WHITE</span>
                  </div>
                  <div className="text-xl font-black text-muted-foreground">VS</div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${currentTurn === 'black' ? 'text-secondary' : 'text-muted-foreground'}`}>AI BLACK</span>
                    <div className={`w-3 h-3 rounded-full ${currentTurn === 'black' && isAiThinking ? 'bg-secondary animate-pulse' : 'bg-muted'}`} />
                  </div>
                </div>
                <Badge variant="outline" className="border-primary text-primary uppercase tracking-widest">
                  {status === 'active' ? `${currentTurn} to move` : 'Game Over'}
                </Badge>
              </div>

              <ChessBoard
                isPlayable={false}
                playerColor="white"
                moves={moves}
              />

              {status === 'completed' && (
                <div className="mt-6 p-6 bg-primary/10 border border-primary/30 rounded-lg text-center">
                  <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold neon-text mb-2">MATCH CONCLUDED</h2>
                  <p className="text-lg mb-6 uppercase tracking-widest">
                    {chess.isCheckmate() ? `${currentTurn === 'white' ? 'BLACK' : 'WHITE'} WINS BY CHECKMATE` : 'DRAW'}
                  </p>
                  <Button onClick={resetGame} className="btn-neon">Watch New Match</Button>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 hud-frame bg-card">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Spectator Controls
              </h3>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 border-primary/50 text-primary hover:bg-primary/10"
                  onClick={() => setIsPaused(!isPaused)}
                  disabled={status !== 'active'}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Resume Match' : 'Pause Match'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  onClick={resetGame}
                >
                  <RotateCcw className="h-4 w-4" /> Restart Match
                </Button>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Engine Difficulty</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['easy', 'medium', 'hard', 'expert'].map((d) => (
                      <Button
                        key={d}
                        variant={difficulty === d ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs capitalize"
                        onClick={() => setDifficulty(d)}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 hud-frame bg-card">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Match Telemetry</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Moves:</span>
                  <span className="font-bold">{moves.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current FEN:</span>
                  <span className="font-mono text-[10px] truncate max-w-[150px]">{chess.fen()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-bold uppercase ${isAiThinking ? 'text-primary animate-pulse' : ''}`}>
                    {isAiThinking ? 'Thinking...' : (isPaused ? 'Paused' : 'Live')}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
