import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Swords, Trophy, Clock, Cpu, Eye } from "lucide-react";
import CreateChallengeDialog from "@/components/CreateChallengeDialog";
import PlayerSearch from "@/components/PlayerSearch";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";

export default function Lobby() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const { socket, isConnected } = useSocket();
  const createAIGameMutation = trpc.chess.createAIGame.useMutation();
  
  // tRPC queries
  const { data: invitations, isLoading: loadingInvites, refetch: refetchInvitations } = trpc.chess.getMyInvitations.useQuery();
  const { data: leaderboard, isLoading: loadingLeaderboard } = trpc.chess.getLeaderboard.useQuery({ limit: 10 });

  // tRPC mutations
  const acceptInvitationMutation = trpc.chess.acceptInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Invitation accepted! Starting game...");
      setLocation(`/game/${data.gameId || 'new'}`);
    },
    onError: (error) => {
      toast.error("Failed to accept invitation");
      console.error(error);
    },
  });

  const rejectInvitationMutation = trpc.chess.rejectInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation declined");
      refetchInvitations();
    },
    onError: () => {
      toast.error("Failed to decline invitation");
    },
  });

  const handleAcceptInvitation = async (invitationId: string, fromPlayerId: number) => {
    try {
      // Generate a game ID (in production, this would be created by the backend)
      const gameId = `game_${Date.now()}`;
      
      await acceptInvitationMutation.mutateAsync({
        invitationId,
        gameId,
      });

      // Emit socket event to notify opponent
      socket?.emit("invite:accept", invitationId, gameId);
    } catch (error) {
      console.error("Failed to accept invitation:", error);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await rejectInvitationMutation.mutateAsync({
        invitationId,
      });

      socket?.emit("invite:reject", invitationId);
    } catch (error) {
      console.error("Failed to decline invitation:", error);
    }
  };

  // Fetch active games for spectating
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("games:list-active");
    socket.on("games:active-list", (games: any[]) => {
      setActiveGames(games);
    });

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      socket.emit("games:list-active");
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.off("games:active-list");
    };
  }, [socket, isConnected]);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-0 md:px-4 py-4 md:py-8">
        <header className="mb-8 md:mb-12 px-4 md:px-0">
          <h1 className="text-3xl md:text-4xl font-black neon-text mb-2">GAME LOBBY</h1>
          <p className="text-sm md:text-base text-muted-foreground">Find an opponent or challenge a friend to a match.</p>
          <div className="tech-divider mt-4" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
          {/* Left Column: Challenges & Invitations */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <Tabs defaultValue="challenges" className="w-full">
              <TabsList className="bg-card border-border mb-6 w-full justify-start overflow-x-auto overflow-y-hidden no-scrollbar">
                <TabsTrigger value="challenges" className="data-[state=active]:neon-text shrink-0">
                  Open Challenges
                </TabsTrigger>
                <TabsTrigger value="invitations" className="data-[state=active]:neon-text-pink shrink-0">
                  My Invitations
                  {invitations && invitations.length > 0 && (
                    <Badge className="ml-2 bg-secondary text-white animate-pulse">
                      {invitations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="search" className="data-[state=active]:neon-text-purple shrink-0">
                  Find Players
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:neon-text-secondary shrink-0">
                  AI Mode
                </TabsTrigger>
                <TabsTrigger value="ai-vs-ai" className="data-[state=active]:neon-text-primary shrink-0">
                  AI vs AI
                </TabsTrigger>
                <TabsTrigger value="live" className="data-[state=active]:neon-text-purple shrink-0">
                  <Eye className="w-4 h-4 mr-2" />
                  Live Games
                  {activeGames.length > 0 && (
                    <Badge className="ml-2 bg-primary text-white animate-pulse">
                      {activeGames.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="challenges" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search challenges..."
                      className="pl-10 bg-card border-border focus:border-primary w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <CreateChallengeDialog />
                  </div>
                </div>

                {/* Placeholder for challenges list */}
                <Card className="bg-card border-border p-8 md:p-12 text-center hud-frame">
                  <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground text-sm md:text-base">No open challenges found. Create one to start playing!</p>
                </Card>
              </TabsContent>

              <TabsContent value="search" className="space-y-4">
                <PlayerSearch />
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <Card className="p-6 md:p-8 hud-frame bg-card text-center">
                  <Cpu className="w-12 h-12 md:w-16 md:h-16 text-secondary mx-auto mb-6" />
                  <h2 className="text-xl md:text-2xl font-bold mb-4">AI CHALLENGE</h2>
                  <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto">
                    Test your skills against our LLM-powered chess engine. 
                    Choose your difficulty and sharpen your tactics.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    {['easy', 'medium', 'hard', 'expert'].map((level) => (
                      <Button 
                        key={level}
                        variant="outline" 
                        className="capitalize border-secondary/50 hover:bg-secondary/10 text-xs md:text-sm"
                        onClick={async () => {
                          try {
                            const { gameId } = await createAIGameMutation.mutateAsync({
                              difficulty: level as any,
                              playerColor: 'white'
                            });
                            setLocation(`/ai/${gameId}`);
                          } catch (e) {
                            toast.error("Failed to start AI game");
                          }
                        }}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="ai-vs-ai" className="space-y-4">
                <Card className="p-6 md:p-8 hud-frame bg-card text-center">
                  <div className="flex justify-center -space-x-4 mb-6">
                    <Cpu className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                    <Cpu className="w-12 h-12 md:w-16 md:h-16 text-secondary" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4">AI VS AI SPECTATOR</h2>
                  <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto">
                    Watch two neural networks battle it out in a full 3D environment. 
                    Observe high-level tactics and learn from the machines.
                  </p>
                  <Button 
                    className="btn-neon px-8 py-6 text-lg"
                    onClick={() => setLocation("/ai-vs-ai")}
                  >
                    Enter Spectator Mode
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="live" className="space-y-4">
                {activeGames.length === 0 ? (
                  <Card className="bg-card border-border p-8 md:p-12 text-center hud-frame">
                    <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground text-sm md:text-base">No live games available to spectate.</p>
                  </Card>
                ) : (
                  activeGames.map((game) => (
                    <Card key={game.gameId} className="bg-card border-border p-4 md:p-6 hud-frame">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-primary" />
                            <p className="font-bold text-primary">
                              Player #{game.whitePlayerId} vs Player #{game.blackPlayerId}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {game.spectatorCount} {game.spectatorCount === 1 ? 'spectator' : 'spectators'} watching
                          </p>
                        </div>
                        <Button
                          onClick={() => setLocation(`/game/${game.gameId}`)}
                          className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                        >
                          Watch Game
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="invitations" className="space-y-4">
                {loadingInvites ? (
                  <p className="text-center py-8">Loading invitations...</p>
                ) : invitations && invitations.length > 0 ? (
                  invitations.map((invite) => (
                    <Card key={invite.id} className="bg-card border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hud-frame">
                      <div>
                        <p className="font-bold text-primary">Challenge from Player #{invite.fromPlayerId}</p>
                        <p className="text-xs text-muted-foreground">Expires: {new Date(invite.expiresAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          size="sm" 
                          className="btn-neon flex-1 sm:flex-none"
                          onClick={() => handleAcceptInvitation(invite.id, invite.fromPlayerId)}
                          disabled={acceptInvitationMutation.isPending}
                        >
                          {acceptInvitationMutation.isPending ? 'Accepting...' : 'Accept'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-secondary text-secondary flex-1 sm:flex-none"
                          onClick={() => handleDeclineInvitation(invite.id)}
                          disabled={rejectInvitationMutation.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-card border-border p-12 text-center hud-frame">
                    <p className="text-muted-foreground">You have no pending invitations.</p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Leaderboard & Stats */}
          <div className="space-y-6 md:space-y-8">
            <Card className="bg-card border-border p-6 hud-frame">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-secondary" />
                <h3 className="text-xl font-bold neon-text-pink">TOP PLAYERS</h3>
              </div>
              
              <div className="space-y-4">
                {loadingLeaderboard ? (
                  <p className="text-sm text-muted-foreground">Loading rankings...</p>
                ) : leaderboard?.map((player, idx) => (
                  <div key={player.id} className="flex justify-between items-center border-b border-border/50 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                      <span className="font-bold text-sm md:text-base">{player.name || `Player ${player.id}`}</span>
                    </div>
                    <Badge variant="outline" className="border-primary text-primary font-mono text-xs">
                      {player.rating}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="link" 
                className="w-full mt-4 text-muted-foreground hover:text-primary text-sm"
                onClick={() => setLocation("/leaderboard")}
              >
                View Full Leaderboard
              </Button>
            </Card>

            <Card className="bg-card border-border p-6 hud-frame">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold neon-text">QUICK STATS</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-background/50 rounded border border-border">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase">Online</p>
                  <p className="text-xl md:text-2xl font-bold text-primary">24</p>
                </div>
                <div className="text-center p-3 bg-background/50 rounded border border-border">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase">Active Games</p>
                  <p className="text-xl md:text-2xl font-bold text-secondary">{activeGames.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
