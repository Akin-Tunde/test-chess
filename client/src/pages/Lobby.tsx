import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Swords, Trophy, Clock, Cpu, Eye, Zap } from "lucide-react";
import CreateChallengeDialog from "@/components/CreateChallengeDialog";
import PlayerSearch from "@/components/PlayerSearch";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Lobby() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const { socket, isConnected } = useSocket();
  const createAIGameMutation = trpc.chess.createAIGame.useMutation();
  
  // tRPC queries
  const { data: invitations, isLoading: loadingInvites, refetch: refetchInvitations } = trpc.chess.getMyInvitations.useQuery();
  const { data: leaderboard, isLoading: loadingLeaderboard } = trpc.chess.getLeaderboard.useQuery({ limit: 10 });
  const { data: openChallenges } = trpc.chess.getOpenChallenges.useQuery();

// Inside Lobby component, with other queries
const { data: myChallenges, refetch: refetchMyChallenges } = trpc.chess.getMyChallenges.useQuery();
const { data: myActiveGames } = trpc.chess.getMyActiveGames.useQuery();

  // tRPC mutations
  const acceptInvitationMutation = trpc.chess.acceptInvitation.useMutation({
  onSuccess: (data) => {
    if (data.gameId) {
      toast.success("Invitation accepted! Starting game...");
      setLocation(`/game/${data.gameId}`); // Use the real ID
    } else {
      toast.error("Game creation failed: No ID returned");
    }
  },
  onError: (error) => {
    toast.error("Failed to accept invitation");
  },
});
  const rejectInvitationMutation = trpc.chess.rejectInvitation.useMutation();

// client/src/pages/Lobby.tsx - Update handleAcceptInvitation

const handleAcceptInvitation = async (invitationId: string, fromPlayerId: number) => {
  try {
    const result = await acceptInvitationMutation.mutateAsync({
      invitationId,
      gameId: "placeholder",
    });

    if (result.gameId) {
      // ADD fromPlayerId as the third argument here:
      socket?.emit("invite:accept", invitationId, result.gameId, fromPlayerId);
      
      // The joiner redirects immediately
      setLocation(`/game/${result.gameId}`);
    }
  } catch (error) {
    console.error("Failed to accept:", error);
  }
};

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await rejectInvitationMutation.mutateAsync({
        invitationId,
      });

      toast.success("Invitation declined");
      refetchInvitations();

      socket?.emit("invite:reject", invitationId);
    } catch (error) {
      toast.error("Failed to decline invitation");
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

useEffect(() => {
  if (!socket) return;

  // Listen for the "Your challenge was accepted" event
  socket.on("invite:accepted", (data: { gameId: string }) => {
    toast.success("An opponent has joined! Connecting to neural link...");
    
    // Auto-redirect the creator to the game page
    setTimeout(() => {
      setLocation(`/game/${data.gameId}`);
    }, 1500);
  });

  return () => {
    socket.off("invite:accepted");
  };
}, [socket, setLocation]);

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
                <TabsTrigger value="my-games" className="data-[state=active]:neon-text-purple shrink-0">
    My Games
    {(myActiveGames?.length || 0) + (myChallenges?.length || 0) > 0 && (
      <Badge className="ml-2 bg-purple-500">{ (myActiveGames?.length || 0) + (myChallenges?.length || 0) }</Badge>
    )}
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
  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
    <div className="order-first sm:order-last w-full sm:w-auto">
      <CreateChallengeDialog />
    </div>
    
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search challenges..."
        className="pl-10 bg-card border-border focus:border-primary w-full"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  </div>

  {/* REPLACE THE OLD PLACEHOLDER CARD WITH THIS BLOCK: */}
{openChallenges && openChallenges.length > 0 ? (
  <div className="grid gap-4">
    {openChallenges
      // 2. ADD THIS FILTER LINE:
      .filter((challenge) => challenge.fromPlayerId !== user?.id) 
      .map((challenge) => (
        <Card key={challenge.id} className="p-4 flex justify-between items-center hud-frame bg-card">
          <div>
            <p className="font-bold text-primary">Challenge from Player {challenge.fromPlayerName || `Player #${challenge.fromPlayerId}`}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Time Control: {challenge.timeControl || "10+5"}
            </p>
          </div>
          <Button 
            className="btn-neon" 
            onClick={() => handleAcceptInvitation(challenge.id, challenge.fromPlayerId!)}
          >
            Join Match
          </Button>
        </Card>
      ))}
      
    {/* 3. OPTIONAL: Show a message if only your own challenges exist */}
    {openChallenges.every(c => c.fromPlayerId === user?.id) && (
      <div className="text-center py-8 border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">Your challenge is live. Waiting for an opponent...</p>
      </div>
    )}
  </div>
) : (
  <Card className="bg-card border-border p-8 text-center hud-frame">
    <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
    <p>No open challenges found. Create one to start playing!</p>
  </Card>
)}


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

              <TabsContent value="my-games" className="space-y-8">
  {/* 1. ACTIVE GAMES SECTION */}
  <section>
  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
    <Zap className="w-4 h-4" /> Active Matches
  </h3>
  {myActiveGames && myActiveGames.length > 0 ? (
    <div className="grid gap-4">
      {myActiveGames.map(game => {
        // LOGIC: If I am the white player, show the black player's name. 
        // Otherwise, show the white player's name.
        const isWhite = game.whitePlayerId === user?.id;
        const opponentName = isWhite ? game.blackPlayerName : game.whitePlayerName;
        const opponentId = isWhite ? game.blackPlayerId : game.whitePlayerId;

        return (
          <Card key={game.id} className="p-4 flex justify-between items-center hud-frame border-primary/50">
            <div>
              <p className="font-bold text-primary">
                vs {opponentName || `Player #${opponentId}`}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">
                Neural Link Active • ID: {game.id.slice(0, 8)}
              </p>
            </div>
            <Button className="btn-neon" onClick={() => setLocation(`/game/${game.id}`)}>
              Resume Link
            </Button>
          </Card>
        );
      })}
    </div>
  ) : (
    <p className="text-xs text-muted-foreground italic">No active neural links found.</p>
  )}
</section>

  {/* 2. WAITING CHALLENGES SECTION */}
  <section>
    <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
      <Clock className="w-4 h-4" /> Waiting for Opponent
    </h3>
    {myChallenges && myChallenges.length > 0 ? (
      <div className="grid gap-4">
        {myChallenges.map(challenge => (
          <Card key={challenge.id} className="p-4 flex justify-between items-center hud-frame border-secondary/50">
            <div>
              <p className="font-bold text-secondary">Broadcast Live</p>
              <p className="text-[10px] text-muted-foreground uppercase">Time: {challenge.timeControl}</p>
            </div>
            <Badge variant="outline" className="border-secondary text-secondary animate-pulse">
              PENDING...
            </Badge>
          </Card>
        ))}
      </div>
    ) : (
      <p className="text-xs text-muted-foreground italic">No open broadcasts.</p>
    )}
  </section>
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
