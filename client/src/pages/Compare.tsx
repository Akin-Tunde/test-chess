import React, { useState, useEffect } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Trophy, TrendingUp, ChevronLeft, Zap, ArrowLeftRight } from "lucide-react";
import { useLocation, useSearch } from "wouter";

export default function Compare() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const player1Id = searchParams.get('p1') ? parseInt(searchParams.get('p1')!) : currentUser?.id;
  const player2Id = searchParams.get('p2') ? parseInt(searchParams.get('p2')!) : null;

  const { data: player1Stats, isLoading: p1Loading } = trpc.chess.getPlayerStats.useQuery(
    { playerId: player1Id! },
    { enabled: !!player1Id }
  );

  const { data: player2Stats, isLoading: p2Loading } = trpc.chess.getPlayerStats.useQuery(
    { playerId: player2Id! },
    { enabled: !!player2Id }
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || p1Loading || p2Loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-primary animate-spin mb-4 mx-auto" />
          <p className="text-foreground">Comparing tactical data...</p>
        </div>
      </div>
    );
  }

  const renderStatRow = (label: string, val1: number | string, val2: number | string, higherIsBetter = true) => {
    const n1 = typeof val1 === 'string' ? parseFloat(val1) : val1;
    const n2 = typeof val2 === 'string' ? parseFloat(val2) : val2;
    
    let p1Color = "text-foreground";
    let p2Color = "text-foreground";
    
    if (n1 > n2) {
      p1Color = higherIsBetter ? "text-green-500 font-bold" : "text-red-500 font-bold";
      p2Color = higherIsBetter ? "text-red-500" : "text-green-500";
    } else if (n2 > n1) {
      p2Color = higherIsBetter ? "text-green-500 font-bold" : "text-red-500 font-bold";
      p1Color = higherIsBetter ? "text-red-500" : "text-green-500";
    }

    return (
      <div className="grid grid-cols-3 gap-2 md:gap-4 py-3 md:py-4 border-b border-border/50 items-center">
        <div className={`text-right text-lg md:text-xl font-mono ${p1Color}`}>{val1}</div>
        <div className="text-center text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={`text-left text-lg md:text-xl font-mono ${p2Color}`}>{val2}</div>
      </div>
    );
  };

  const getWinRate = (s: any) => {
    const total = (s?.wins || 0) + (s?.losses || 0) + (s?.draws || 0);
    return total > 0 ? ((s?.wins || 0) / total * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border p-3 md:p-4 sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/leaderboard")} className="flex items-center gap-2 text-xs md:text-sm h-9 md:h-10">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold neon-text uppercase">TACTICAL COMPARISON</h1>
          </div>
          <div className="w-10 md:w-20"></div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {!player2Id ? (
          <Card className="p-12 hud-frame bg-card text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">No Opponent Selected</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8">Select a player from the leaderboard to compare stats.</p>
            <Button onClick={() => navigate("/leaderboard")} className="btn-neon px-8">Go to Leaderboard</Button>
          </Card>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {/* Comparison Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
              <Card className="p-6 hud-frame bg-card text-center border-primary/50">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold neon-text truncate uppercase">{player1Stats?.name}</h2>
                <p className="text-xs text-muted-foreground uppercase">Ranked Player</p>
              </Card>

              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary/20 border-2 border-secondary flex items-center justify-center mb-2">
                  <span className="text-xl md:text-2xl font-black italic text-secondary">VS</span>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              <Card className="p-6 hud-frame bg-card text-center border-secondary/50">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/20 border-2 border-secondary flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 md:w-10 md:h-10 text-secondary" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold neon-text-pink truncate uppercase">{player2Stats?.name}</h2>
                <p className="text-xs text-muted-foreground uppercase">Ranked Player</p>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card className="p-6 md:p-8 hud-frame bg-card">
              <div className="space-y-1">
                {renderStatRow("Rating", player1Stats?.rating || 1200, player2Stats?.rating || 1200)}
                {renderStatRow("Wins", player1Stats?.wins || 0, player2Stats?.wins || 0)}
                {renderStatRow("Losses", player1Stats?.losses || 0, player2Stats?.losses || 0, false)}
                {renderStatRow("Draws", player1Stats?.draws || 0, player2Stats?.draws || 0)}
                {renderStatRow("Win Rate %", getWinRate(player1Stats), getWinRate(player2Stats))}
                {renderStatRow("Total Games", 
                  (player1Stats?.wins || 0) + (player1Stats?.losses || 0) + (player1Stats?.draws || 0),
                  (player2Stats?.wins || 0) + (player2Stats?.losses || 0) + (player2Stats?.draws || 0)
                )}
              </div>
            </Card>

            {/* Visual Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <Card className="p-5 md:p-6 hud-frame bg-card">
                <h3 className="text-base md:text-lg font-bold neon-text mb-6 flex items-center gap-2 uppercase">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> Rating Comparison
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium uppercase">{player1Stats?.name}</span>
                      <span className="text-xs md:text-sm font-bold text-primary">{player1Stats?.rating}</span>
                    </div>
                    <div className="w-full bg-border h-3 md:h-4 rounded-full overflow-hidden">
                      <div className="bg-primary h-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" style={{ width: `${Math.min(100, (player1Stats?.rating || 0) / 3000 * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium uppercase">{player2Stats?.name}</span>
                      <span className="text-xs md:text-sm font-bold text-secondary">{player2Stats?.rating}</span>
                    </div>
                    <div className="w-full bg-border h-3 md:h-4 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full shadow-[0_0_10px_rgba(var(--secondary),0.5)]" style={{ width: `${Math.min(100, (player2Stats?.rating || 0) / 3000 * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 md:p-6 hud-frame bg-card">
                <h3 className="text-base md:text-lg font-bold neon-text mb-6 flex items-center gap-2 uppercase">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5" /> Win Rate Analysis
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium uppercase">{player1Stats?.name}</span>
                      <span className="text-xs md:text-sm font-bold text-green-500">{getWinRate(player1Stats)}%</span>
                    </div>
                    <div className="w-full bg-border h-3 md:h-4 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${getWinRate(player1Stats)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium uppercase">{player2Stats?.name}</span>
                      <span className="text-xs md:text-sm font-bold text-green-400">{getWinRate(player2Stats)}%</span>
                    </div>
                    <div className="w-full bg-border h-3 md:h-4 rounded-full overflow-hidden">
                      <div className="bg-green-400 h-full opacity-80 shadow-[0_0_10px_rgba(74,222,128,0.5)]" style={{ width: `${getWinRate(player2Stats)}%` }} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
