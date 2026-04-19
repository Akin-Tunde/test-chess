import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { History, ChevronLeft, ChevronRight, Play, Download, Calendar, User, Trophy } from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";

export default function GameHistory() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [replayMoveIndex, setReplayMoveIndex] = useState(-1);
  const [filterResult, setFilterResult] = useState<string>('');
  const [filterColor, setFilterColor] = useState<string>('');

  // Fetch game history with filters
  const { data: games, isLoading } = trpc.chess.searchGameHistory.useQuery(
    {
      limit: 50,
      result: filterResult ? (filterResult as any) : undefined,
      playerColor: filterColor ? (filterColor as any) : undefined,
    },
    { enabled: !!user }
  );

  const selectedGame = games?.find(g => g.id === selectedGameId);
  const moves = (selectedGame?.moves as any[]) || [];
  const currentMoves = replayMoveIndex === -1 ? moves : moves.slice(0, replayMoveIndex + 1);

  useEffect(() => {
    if (games && games.length > 0 && !selectedGameId) {
      setSelectedGameId(games[0].id);
    }
  }, [games, selectedGameId]);

  const handleNextMove = () => {
    if (replayMoveIndex < moves.length - 1) {
      setReplayMoveIndex(prev => prev + 1);
    }
  };

  const handlePrevMove = () => {
    if (replayMoveIndex > -1) {
      setReplayMoveIndex(prev => prev - 1);
    }
  };

  const handleResetReplay = () => {
    setReplayMoveIndex(-1);
  };

  const handleDownloadPGN = () => {
    if (!selectedGame) return;
    const pgn = selectedGame.pgn || "";
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${selectedGame.id}.pgn`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-0 md:px-4 py-4 md:py-8">
        <header className="mb-8 px-4 md:px-0">
          <div className="flex items-center gap-4 mb-2">
            <History className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-black neon-text">GAME HISTORY</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">Review your past matches and analyze your moves.</p>
          <div className="tech-divider mt-4" />
          
          {/* Filters */}
          <div className="flex gap-4 mt-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs md:text-sm font-semibold text-muted-foreground uppercase">Result:</label>
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="px-2 py-1.5 md:px-3 md:py-2 rounded border border-border bg-background text-foreground text-xs md:text-sm"
              >
                <option value="">All Results</option>
                <option value="white_win">White Win</option>
                <option value="black_win">Black Win</option>
                <option value="draw">Draw</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs md:text-sm font-semibold text-muted-foreground uppercase">Color:</label>
              <select
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                className="px-2 py-1.5 md:px-3 md:py-2 rounded border border-border bg-background text-foreground text-xs md:text-sm"
              >
                <option value="">Any Color</option>
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </div>
            {(filterResult || filterColor) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterResult('');
                  setFilterColor('');
                }}
                className="text-[10px] md:text-xs h-8"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
          {/* Left Column: Game List */}
          <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
            <Card className="bg-card border-border p-4 hud-frame h-[400px] lg:h-[calc(100vh-250px)] flex flex-col">
              <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-secondary" />
                Recent Matches
              </h2>
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-3">
                  {games?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No games played yet.</p>
                  ) : (
                    games?.map((game) => {
                      const isWhite = game.whitePlayerId === user?.id;
                      const opponentId = isWhite ? game.blackPlayerId : game.whitePlayerId;
                      const result = game.result;
                      const isWin = (isWhite && result === 'white_win') || (!isWhite && result === 'black_win');
                      const isDraw = result === 'draw';
                      
                      return (
                        <div
                          key={game.id}
                          onClick={() => {
                            setSelectedGameId(game.id);
                            setReplayMoveIndex(-1);
                            // Scroll to top on mobile when selecting a game
                            if (window.innerWidth < 1024) {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={`p-3 md:p-4 rounded border cursor-pointer transition-all ${
                            selectedGameId === game.id
                              ? "bg-primary/10 border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                              : "bg-background/50 border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Badge 
                              variant={isWin ? "default" : isDraw ? "outline" : "destructive"}
                              className={isWin ? "bg-green-500/20 text-green-400 border-green-500/50 text-[10px]" : "text-[10px]"}
                            >
                              {isWin ? "WIN" : isDraw ? "DRAW" : "LOSS"}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {game.completedAt ? format(new Date(game.completedAt), 'MMM d, HH:mm') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>vs Player #{opponentId}</span>
                          </div>
                          <div className="mt-2 text-[10px] text-muted-foreground">
                            Played as {isWhite ? "White" : "Black"} • {game.status}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Right Column: Replay Viewer */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {selectedGame ? (
              <Card className="bg-card border-border p-4 md:p-6 hud-frame">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-secondary uppercase">Replay Viewer</h2>
                    <p className="text-[10px] md:text-sm text-muted-foreground font-mono">ID: {selectedGame.id}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={handleDownloadPGN} className="gap-2 flex-1 sm:flex-none text-xs">
                      <Download className="h-3.5 w-3.5" />
                      PGN
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setLocation(`/game/${selectedGame.id}`)} className="gap-2 flex-1 sm:flex-none text-xs">
                      <Play className="h-3.5 w-3.5" />
                      View Full
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="w-full max-w-[400px] mx-auto md:max-w-none">
                    <ChessBoard
                      isPlayable={false}
                      moves={currentMoves}
                      playerColor={selectedGame.whitePlayerId === user?.id ? 'white' : 'black'}
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="bg-background/50 p-4 rounded border border-border">
                      <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2 uppercase">
                        <Play className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        Controls
                      </h3>
                      <div className="flex justify-center gap-4 mb-6">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={handlePrevMove}
                          disabled={replayMoveIndex === -1}
                          className="h-10 w-10"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col items-center justify-center min-w-[60px]">
                          <span className="text-xl md:text-2xl font-bold">
                            {replayMoveIndex === -1 ? moves.length : replayMoveIndex + 1}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">of {moves.length}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={handleNextMove}
                          disabled={replayMoveIndex === moves.length - 1}
                          className="h-10 w-10"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full text-xs" 
                        onClick={handleResetReplay}
                        disabled={replayMoveIndex === -1}
                      >
                        Reset to Final Position
                      </Button>
                    </div>

                    <Card className="bg-background/30 border-border p-4">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Game Summary</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">White:</span>
                          <span className="font-medium">Player #{selectedGame.whitePlayerId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Black:</span>
                          <span className="font-medium">Player #{selectedGame.blackPlayerId}</span>
                        </div>
                        <Separator className="my-2 bg-border/50" />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Result:</span>
                          <span className="font-bold text-primary">{selectedGame.result?.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Moves:</span>
                          <span className="font-bold">{moves.length}</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-card border-border p-12 text-center hud-frame flex flex-col items-center justify-center h-full min-h-[400px]">
                <History className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                <h2 className="text-xl font-bold mb-2">Select a game to view replay</h2>
                <p className="text-muted-foreground">Your match history will appear on the left column.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
