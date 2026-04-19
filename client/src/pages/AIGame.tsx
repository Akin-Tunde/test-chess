import { useEffect, useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cpu, Flag, RotateCcw, ChevronLeft, Zap, Trophy, BrainCircuit, Lightbulb } from "lucide-react";
import ChessBoard from "@/components/ChessBoard3D";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Chess } from "chess.js";

export default function AIGame() {
  const params = useParams();
  const gameId = params?.gameId as string;
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [moves, setMoves] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("active");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Fetch game data
  const { data: game, isLoading } = trpc.chess.getAIGame.useQuery(
    { gameId },
    { enabled: !!gameId }
  );

  const recordMoveMutation = trpc.chess.recordAIMove.useMutation();
  const updateStatusMutation = trpc.chess.updateAIGameStatus.useMutation();
  const generateAiMoveMutation = trpc.chess.generateAIMove.useMutation();
  const getAnalysisMutation = trpc.chess.getAIAnalysis.useMutation();

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const chess = useMemo(() => {
    const c = new Chess();
    moves.forEach(m => {
      try {
        c.move(m);
      } catch (e) {
        console.error("Invalid move in history:", m);
      }
    });
    return c;
  }, [moves]);

  useEffect(() => {
    if (game) {
      setMoves((game.moves as any[]) || []);
      setStatus(game.status);
      setDifficulty(game.difficulty);
      setPlayerColor(game.playerColor as 'white' | 'black');
    }
  }, [game]);

  const isPlayerTurn = useMemo(() => {
    if (status !== 'active') return false;
    const turn = chess.turn() === 'w' ? 'white' : 'black';
    return turn === playerColor;
  }, [chess, playerColor, status]);

  // AI Move Trigger
  useEffect(() => {
    if (status === 'active' && !isPlayerTurn && !isAiThinking) {
      handleAiMove();
    }
  }, [isPlayerTurn, status]);

  const handleAiMove = async () => {
    setIsAiThinking(true);
    try {
      const fen = chess.fen();
      const history = chess.history();
      
      const result = await generateAiMoveMutation.mutateAsync({
        gameId,
        fen,
        difficulty: difficulty as any,
        history
      });

      if (result.move) {
        try {
          const move = chess.move(result.move);
          if (move) {
            const newMoves = [...moves, move];
            setMoves(newMoves);
            await recordMoveMutation.mutateAsync({ gameId, move });
            checkGameEnd();
          }
        } catch (e) {
          console.error("AI generated invalid move:", result.move);
          toast.error("AI made an error. Retrying...");
          // In a real app, you might want to retry or have a fallback
        }
      }
    } catch (error) {
      console.error("Failed to get AI move:", error);
      toast.error("AI connection lost");
    } finally {
      setIsAiThinking(false);
    }
  };

  const handlePlayerMove = async (move: any) => {
    const newMoves = [...moves, move];
    setMoves(newMoves);
    await recordMoveMutation.mutateAsync({ gameId, move });
    checkGameEnd();
  };

  const checkGameEnd = () => {
    if (chess.isGameOver()) {
      let result = "draw";
      if (chess.isCheckmate()) {
        result = chess.turn() === 'w' ? 'black_win' : 'white_win';
      }
      
      const finalResult = result === 'draw' ? 'draw' : 
                         (result === (playerColor === 'white' ? 'white_win' : 'black_win') ? 'player_win' : 'ai_win');
      
      setStatus('completed');
      updateStatusMutation.mutate({
        gameId,
        status: 'completed',
        result: finalResult
      });
      
      toast.info(`Game Over: ${finalResult.replace('_', ' ').toUpperCase()}`);
    }
  };

  const handleResign = () => {
    setStatus('completed');
    updateStatusMutation.mutate({
      gameId,
      status: 'completed',
      result: 'ai_win'
    });
    toast.info("You resigned. AI wins.");
  };

  const handleGetAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await getAnalysisMutation.mutateAsync({
        fen: chess.fen(),
        history: chess.history()
      });
      setAnalysis(result.analysis);
    } catch (error) {
      console.error("Failed to get analysis:", error);
      toast.error("Failed to get AI analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Zap className="w-12 h-12 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="h-8 w-8 text-secondary" />
              <h1 className="text-4xl font-black neon-text-pink">AI CHALLENGE</h1>
            </div>
            <p className="text-muted-foreground">Difficulty: <span className="text-secondary uppercase font-bold">{difficulty}</span></p>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/lobby")} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Back to Lobby
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-card border-border p-6 hud-frame">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${isAiThinking ? 'bg-secondary animate-pulse shadow-[0_0_10px_rgba(var(--secondary),0.8)]' : 'bg-muted'}`} />
                  <span className="font-bold text-lg">AI ENGINE</span>
                  {isAiThinking && <Badge variant="outline" className="border-secondary text-secondary animate-pulse">THINKING...</Badge>}
                </div>
                <Badge variant="outline" className="border-primary text-primary">
                  {chess.turn() === 'w' ? 'White' : 'Black'} to Move
                </Badge>
              </div>

              <ChessBoard
                isPlayable={isPlayerTurn && status === 'active'}
                onMove={handlePlayerMove}
                playerColor={playerColor}
                moves={moves}
              />

              {status === 'completed' && (
                <div className="mt-6 p-6 bg-primary/10 border border-primary/30 rounded-lg text-center">
                  <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold neon-text mb-2">GAME OVER</h2>
                  <p className="text-lg mb-6 uppercase tracking-widest">{game?.result?.replace('_', ' ')}</p>
                  <Button onClick={() => setLocation("/lobby")} className="btn-neon">Return to Lobby</Button>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 hud-frame bg-card">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Game Controls
              </h3>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 border-primary/50 text-primary hover:bg-primary/10"
                  onClick={handleGetAnalysis}
                  disabled={status !== 'active' || isAnalyzing}
                >
                  <BrainCircuit className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} /> 
                  {isAnalyzing ? 'Analyzing...' : 'Get AI Analysis'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  onClick={handleResign}
                  disabled={status !== 'active'}
                >
                  <Flag className="h-4 w-4" /> Resign Game
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  onClick={() => setLocation("/lobby")}
                >
                  <RotateCcw className="h-4 w-4" /> New Game
                </Button>
              </div>
            </Card>

            {analysis && (
              <Card className="p-6 hud-frame bg-card border-secondary/50">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-secondary">
                  <Lightbulb className="h-5 w-5" />
                  AI Analysis
                </h3>
                <div className="prose prose-invert prose-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {analysis}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4 w-full text-xs"
                  onClick={() => setAnalysis(null)}
                >
                  Clear Analysis
                </Button>
              </Card>
            )}

            <Card className="p-6 hud-frame bg-card">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Match Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Player:</span>
                  <span className="font-bold">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color:</span>
                  <span className="font-bold uppercase">{playerColor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="font-bold text-secondary uppercase">{difficulty}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Moves:</span>
                  <span className="font-bold">{moves.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
