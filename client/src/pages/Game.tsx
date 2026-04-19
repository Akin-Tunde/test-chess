import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, MessageSquare, Flag, Handshake, Eye } from "lucide-react";
import ChessBoard from "@/components/ChessBoard3D";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface ChatMessage {
  playerId: number;
  message: string;
  timestamp: number;
}

interface GameState {
  gameId: string;
  whitePlayerId: number;
  blackPlayerId: number;
  status: string;
  result?: string;
  moves: any[];
  currentTurn: 'white' | 'black';
  whiteTime: number;
  blackTime: number;
}

export default function Game() {
  const params = useParams();
  const gameId = params?.gameId as string;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<string>("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Fetch game data
  const { data: game, isLoading } = trpc.chess.getGame.useQuery(
    { gameId },
    { enabled: !!gameId }
  );

  // Fetch chat messages
  const { data: messages } = trpc.chess.getGameChat.useQuery(
    { gameId },
    { enabled: !!gameId }
  );

  // Initialize game state
  useEffect(() => {
    if (game && user) {
      const isWhite = game.whitePlayerId === user.id;
      const isBlack = game.blackPlayerId === user.id;
      const isSpectating = !isWhite && !isBlack;
      
      setIsSpectator(isSpectating);
      setPlayerColor(isWhite ? 'white' : 'black');
      
      const moves = (game.moves as any[]) || [];
      const currentTurn = moves.length % 2 === 0 ? 'white' : 'black';
      
      setGameState({
        gameId: game.id,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        status: game.status,
        result: game.result,
        moves,
        currentTurn,
        whiteTime: 10 * 60 * 1000, // 10 minutes
        blackTime: 10 * 60 * 1000,
      });

      setIsPlayerTurn(currentTurn === (isWhite ? 'white' : 'black'));
      
      if (game.status === 'completed') {
        setGameEnded(true);
        setGameResult(game.result || "Game ended");
      }
    }
  }, [game, user]);

  // Load chat messages
  useEffect(() => {
    if (messages) {
      setChatMessages(
        messages.map((msg: any) => ({
          playerId: msg.playerId,
          message: msg.message,
          timestamp: new Date(msg.createdAt).getTime(),
        }))
      );
    }
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !gameId || !isConnected || !gameState) return;

    // Join game room or spectate
    if (isSpectator) {
      socket.emit("game:spectate", gameId);
    } else {
      socket.emit("game:join", gameId, gameState.whitePlayerId, gameState.blackPlayerId);
    }

    // Listen for opponent ready
    socket.on("game:opponent-ready", (data) => {
      toast.success(`Opponent is ready! Game starting...`);
    });

    // Listen for state sync (for reconnection)
    socket.on("game:sync-state", (data: { moves: any[], status: string, result?: string }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const newMoves = data.moves;
        const newTurn = newMoves.length % 2 === 0 ? 'white' : 'black';
        
        // Only update if we have new moves
        if (newMoves.length > prev.moves.length) {
          setIsPlayerTurn(newTurn === playerColor);
        }
        
        return {
          ...prev,
          moves: newMoves,
          currentTurn: newTurn,
          status: data.status,
          result: data.result,
        };
      });

      if (data.status === 'completed') {
        setGameEnded(true);
        setGameResult(data.result || "Game ended");
      }
    });

    // Listen for opponent moves
    socket.on("game:move-received", (data: { playerId: number; move: any }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const newMoves = [...prev.moves, data.move];
        const newTurn = newMoves.length % 2 === 0 ? 'white' : 'black';
        return {
          ...prev,
          moves: newMoves,
          currentTurn: newTurn,
        };
      });
      setIsPlayerTurn(true);
    });

    // Listen for chat messages
    socket.on("game:chat-message", (data: { playerId: number; message: string; timestamp: number }) => {
      setChatMessages((prev) => [...prev, data]);
    });

    // Listen for game end
    socket.on("game:ended", (data: { result: string }) => {
      setGameEnded(true);
      setGameResult(data.result);
      toast.info(`Game ended: ${data.result}`);
    });

    // Listen for spectator joined
    socket.on("game:spectator-joined", (data: { spectatorId: number; timestamp: number }) => {
      setSpectatorCount((prev) => prev + 1);
    });

    // Listen for spectator left
    socket.on("game:spectator-left", (data: { spectatorId: number; timestamp: number }) => {
      setSpectatorCount((prev) => Math.max(0, prev - 1));
    });

    // Listen for spectate denied
    socket.on("game:spectate-denied", (data: { reason: string }) => {
      toast.error(`Cannot spectate: ${data.reason}`);
      setLocation("/lobby");
    });

    return () => {
      socket.off("game:opponent-ready");
      socket.off("game:sync-state");
      socket.off("game:move-received");
      socket.off("game:chat-message");
      socket.off("game:ended");
      socket.off("game:spectator-joined");
      socket.off("game:spectator-left");
      socket.off("game:spectate-denied");
    };
  }, [socket, gameId, isConnected, gameState?.whitePlayerId, gameState?.blackPlayerId, playerColor, isSpectator, setLocation]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleMove = async (move: any) => {
    if (isSpectator) {
      toast.error("Spectators cannot make moves");
      return;
    }

    if (!isPlayerTurn || !gameState) {
      toast.error("It's not your turn!");
      return;
    }

    // Emit move to opponent via socket
    socket?.emit("game:move", gameId, move);

    // Update local state
    setGameState((prev) => {
      if (!prev) return prev;
      const newMoves = [...prev.moves, move];
      const newTurn = newMoves.length % 2 === 0 ? 'white' : 'black';
      return {
        ...prev,
        moves: newMoves,
        currentTurn: newTurn,
      };
    });

    setIsPlayerTurn(false);

    // Save move to database
    try {
      await trpc.chess.recordMove.mutate({ gameId, move });
    } catch (error) {
      console.error("Failed to save move:", error);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !gameState) return;

    if (isSpectator) {
      toast.error("Spectators cannot send messages");
      return;
    }

    try {
      await trpc.chess.sendMessage.mutate({
        gameId,
        message: chatInput,
      });

      // Emit chat via socket
      socket?.emit("game:chat", gameId, chatInput);

      setChatInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleResign = async () => {
    if (isSpectator) {
      toast.error("Spectators cannot resign");
      return;
    }

    if (!gameState) return;

    const result = playerColor === 'white' ? 'black_win' : 'white_win';
    socket?.emit("game:end", gameId, { result });

    try {
      await trpc.chess.updateGameStatus.mutate({
        gameId,
        status: 'completed',
        result,
      });
    } catch (error) {
      console.error("Failed to resign:", error);
    }
  };

  const handleOfferDraw = () => {
    if (isSpectator) {
      toast.error("Spectators cannot offer draws");
      return;
    }
    toast.info("Draw offer sent to opponent");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!gameState) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Card className="bg-card border-border p-8 text-center hud-frame">
            <p className="text-destructive mb-4">Game not found</p>
            <Button onClick={() => setLocation("/lobby")}>Back to Lobby</Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const opponentId = playerColor === 'white' ? gameState.blackPlayerId : gameState.whitePlayerId;
  const opponentName = `Player #${opponentId}`;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-black neon-text mb-2">
            {isSpectator ? "SPECTATING GAME" : "ACTIVE GAME"}
          </h1>
          <div className="tech-divider mt-4" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Chess Board */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border p-6 hud-frame">
              {/* Opponent Info */}
              <div className="mb-6 pb-4 border-b border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isSpectator ? "Spectating" : "Opponent"}
                    </p>
                    <p className="text-lg font-bold text-secondary">
                      {isSpectator ? "Live Game" : opponentName}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isSpectator && spectatorCount > 0 && (
                      <Badge variant="outline" className="border-primary text-primary">
                        <Eye className="w-3 h-3 mr-1" />
                        {spectatorCount} Spectator{spectatorCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-secondary text-secondary">
                      {gameState.currentTurn === 'black' ? '♚' : '♔'} {gameState.currentTurn === 'black' ? 'Black' : 'White'} to Move
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Chess Board */}
              <ChessBoard
                gameId={gameId}
                isPlayable={!isSpectator && isPlayerTurn && !gameEnded}
                onMove={handleMove}
                playerColor={playerColor}
                moves={gameState.moves}
              />

              {/* Spectator Notice */}
              {isSpectator && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary rounded text-center">
                  <p className="text-sm text-primary font-semibold flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    You are spectating this game
                  </p>
                </div>
              )}

              {/* Game Status */}
              {gameEnded && (
                <div className="mt-6 p-4 bg-background/50 rounded border border-border text-center">
                  <p className="text-lg font-bold neon-text mb-2">Game Over</p>
                  <p className="text-muted-foreground mb-4">{gameResult}</p>
                  <Button onClick={() => setLocation("/lobby")}>Back to Lobby</Button>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Chat & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Info */}
            <Card className="bg-card border-border p-6 hud-frame">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">WHITE</p>
                  <p className="text-sm font-semibold">Player #{gameState.whitePlayerId}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">BLACK</p>
                  <p className="text-sm font-semibold">Player #{gameState.blackPlayerId}</p>
                </div>
              </div>
            </Card>

            {/* Chat Panel */}
            <Card className="bg-card border-border p-6 hud-frame flex flex-col h-96">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Game Chat
              </h3>
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-3 pr-4">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No messages yet</p>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="text-xs text-secondary font-semibold">
                          Player #{msg.playerId}
                        </p>
                        <p className="text-muted-foreground">{msg.message}</p>
                      </div>
                    ))
                  )}
                  <div ref={chatScrollRef} />
                </div>
              </ScrollArea>

              {!isSpectator && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                    className="bg-background border-border"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendChat}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    Send
                  </Button>
                </div>
              )}

              {isSpectator && (
                <p className="text-xs text-muted-foreground text-center">
                  Spectators cannot send messages
                </p>
              )}
            </Card>

            {/* Game Controls */}
            {!isSpectator && (
              <Card className="bg-card border-border p-6 hud-frame">
                <div className="space-y-3">
                  <Button
                    onClick={handleOfferDraw}
                    variant="outline"
                    className="w-full border-secondary text-secondary hover:bg-secondary/10"
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    Offer Draw
                  </Button>
                  <Button
                    onClick={handleResign}
                    variant="destructive"
                    className="w-full"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Resign
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
