import React, { useState } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Zap, ChevronLeft, ArrowLeftRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Leaderboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [limit, setLimit] = useState(50);

  const { data: leaderboard, isLoading: leaderboardLoading } = trpc.chess.getLeaderboard.useQuery({ limit });

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };

  const getRankColor = (position: number) => {
    if (position === 1) return 'bg-yellow-500/10 border-yellow-500/50';
    if (position === 2) return 'bg-gray-400/10 border-gray-400/50';
    if (position === 3) return 'bg-orange-600/10 border-orange-600/50';
    return 'bg-card border-border';
  };

  if (authLoading || leaderboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-primary animate-spin mb-4 mx-auto" />
          <p className="text-foreground">Loading global rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border p-3 md:p-4 sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/lobby")} className="flex items-center gap-2 text-xs md:text-sm h-9 md:h-10">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold neon-text uppercase">GLOBAL RANKINGS</h1>
          </div>
          <div className="w-10 md:w-20"></div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Top 3 Players */}
          {leaderboard?.slice(0, 3).map((player, idx) => (
            <Card key={player.id} className={`p-5 md:p-6 hud-frame border ${getRankColor(idx + 1)}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl md:text-3xl font-bold neon-text">#{idx + 1}</span>
                {getMedalIcon(idx + 1)}
              </div>
              <h3 className="text-base md:text-lg font-bold mb-2 truncate uppercase">{player.name}</h3>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase">Rating:</span>
                  <span className="text-primary font-bold">{player.rating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase">Wins:</span>
                  <span className="text-green-500 font-bold">{player.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase">Losses:</span>
                  <span className="text-red-500 font-bold">{player.losses}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <Card className="hud-frame bg-card overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left font-bold text-muted-foreground uppercase tracking-wider">Rank</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left font-bold text-muted-foreground uppercase tracking-wider">Player</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">Rating</th>
                  <th className="hidden md:table-cell px-4 md:px-6 py-3 md:py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">Wins</th>
                  <th className="hidden md:table-cell px-4 md:px-6 py-3 md:py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">Losses</th>
                  <th className="hidden sm:table-cell px-4 md:px-6 py-3 md:py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">Win Rate</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard?.map((player, idx) => {
                  const totalGames = player.wins + player.losses + player.draws;
                  const winRate = totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(1) : '0.0';
                  
                  return (
                    <tr key={player.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base md:text-lg neon-text">#{idx + 1}</span>
                          {idx < 3 && getMedalIcon(idx + 1)}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 font-medium truncate max-w-[120px] md:max-w-none">
                        {player.name}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span className="px-2 md:px-3 py-1 bg-primary/20 text-primary rounded border border-primary/30 font-bold font-mono">
                          {player.rating}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 md:px-6 py-3 md:py-4 text-center text-green-500 font-semibold">{player.wins}</td>
                      <td className="hidden md:table-cell px-4 md:px-6 py-3 md:py-4 text-center text-red-500 font-semibold">{player.losses}</td>
                      <td className="hidden sm:table-cell px-4 md:px-6 py-3 md:py-4 text-center">
                        <span className="text-secondary font-bold">{winRate}%</span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary hover:bg-primary/10 h-8 px-2 md:px-3"
                          onClick={() => navigate(`/compare?p2=${player.id}`)}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 md:mr-2" /> 
                          <span className="hidden md:inline">Compare</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {leaderboard && leaderboard.length >= limit && (
          <div className="mt-8 text-center">
            <Button
              onClick={() => setLimit(limit + 50)}
              className="btn-neon px-8"
            >
              Load More Players
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
