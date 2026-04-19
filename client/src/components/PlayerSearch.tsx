import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useSocket } from "@/contexts/SocketContext";

export default function PlayerSearch() {
  const [query, setQuery] = useState("");
  const { socket } = useSocket();
  
  // In a real app, we'd have a search endpoint. 
  // For now, we'll use the leaderboard as a source of players to challenge.
  const { data: players, isLoading } = trpc.chess.getLeaderboard.useQuery({ limit: 10 });
  
  const sendInvite = trpc.chess.sendInvitation.useMutation({
    onSuccess: (data, variables) => {
      toast.success("Invitation sent!");
      if (socket) {
        socket.emit("invite:send", variables.toPlayerId, data.invitationId);
      }
    },
    onError: (error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    }
  });

  const filteredPlayers = players?.filter(p => 
    p.name?.toLowerCase().includes(query.toLowerCase()) || 
    p.id.toString().includes(query)
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search players by name or ID..."
          className="pl-10 bg-card border-border"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Searching players...</p>
        ) : filteredPlayers && filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <Card key={player.id} className="bg-card border-border p-4 flex justify-between items-center hud-frame">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                  <span className="text-primary font-bold">{player.name?.[0] || "P"}</span>
                </div>
                <div>
                  <p className="font-bold">{player.name || `Player ${player.id}`}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Trophy className="w-3 h-3 text-secondary" />
                    <span>{player.rating} ELO</span>
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10"
                onClick={() => sendInvite.mutate({ toPlayerId: player.id })}
                disabled={sendInvite.isPending}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Challenge
              </Button>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
            No players found matching your search.
          </p>
        )}
      </div>
    </div>
  );
}
