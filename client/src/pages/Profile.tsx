import React, { useState } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Trophy, TrendingUp, ChevronLeft, Zap, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.chess.getMyStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-primary animate-spin mb-4 mx-auto" />
          <p className="text-foreground">Loading profile data...</p>
        </div>
      </div>
    );
  }

  const totalGames = (stats?.wins || 0) + (stats?.losses || 0) + (stats?.draws || 0);
  const winRate = totalGames > 0 ? ((stats?.wins || 0) / totalGames * 100).toFixed(1) : '0.0';
  const drawRate = totalGames > 0 ? ((stats?.draws || 0) / totalGames * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border p-3 md:p-4 sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/lobby")} className="flex items-center gap-2 text-xs md:text-sm h-9 md:h-10">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold neon-text uppercase">PLAYER PROFILE</h1>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 text-xs md:text-sm h-9 md:h-10"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Profile Header */}
        <Card className="p-6 md:p-8 hud-frame bg-card mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 md:gap-8">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0">
              <User className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold neon-text mb-1 md:mb-2 truncate">{user?.name}</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-4 truncate">{user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="text-xs md:text-sm text-muted-foreground uppercase">Member since {new Date(user?.createdAt || '').toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Rating */}
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Rating</h3>
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold neon-text">{stats?.rating || 1200}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase">Elo Rating</p>
          </Card>

          {/* Total Games */}
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Games</h3>
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold neon-text-pink">{totalGames}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase">Matches played</p>
          </Card>

          {/* Win Rate */}
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Win Rate</h3>
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-green-500">{winRate}%</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase">Victories</p>
          </Card>

          {/* Draw Rate */}
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Draw Rate</h3>
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-yellow-500">{drawRate}%</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase">Draws</p>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Statistics */}
          <Card className="p-6 hud-frame bg-card">
            <h3 className="text-lg font-bold neon-text mb-6 uppercase">Match Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded">
                <span className="font-semibold text-sm md:text-base">Wins</span>
                <span className="text-xl md:text-2xl font-bold text-green-500">{stats?.wins || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded">
                <span className="font-semibold text-sm md:text-base">Losses</span>
                <span className="text-xl md:text-2xl font-bold text-red-500">{stats?.losses || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <span className="font-semibold text-sm md:text-base">Draws</span>
                <span className="text-xl md:text-2xl font-bold text-yellow-500">{stats?.draws || 0}</span>
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-6 hud-frame bg-card">
            <h3 className="text-lg font-bold neon-text mb-6 uppercase">Performance Metrics</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs md:text-sm text-muted-foreground uppercase">Win Rate</span>
                  <span className="text-xs md:text-sm font-bold">{winRate}%</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full shadow-[0_0_5px_rgba(34,197,94,0.5)]" style={{ width: `${winRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs md:text-sm text-muted-foreground uppercase">Loss Rate</span>
                  <span className="text-xs md:text-sm font-bold">{totalGames > 0 ? ((stats?.losses || 0) / totalGames * 100).toFixed(1) : '0.0'}%</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full shadow-[0_0_5px_rgba(239,68,68,0.5)]" style={{ width: `${totalGames > 0 ? ((stats?.losses || 0) / totalGames * 100) : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs md:text-sm text-muted-foreground uppercase">Draw Rate</span>
                  <span className="text-xs md:text-sm font-bold">{drawRate}%</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full shadow-[0_0_5px_rgba(234,179,8,0.5)]" style={{ width: `${drawRate}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-3 md:gap-4 justify-center flex-wrap">
          <Button onClick={() => navigate("/lobby")} className="btn-neon px-6 md:px-8 text-xs md:text-sm flex-1 sm:flex-none">
            Play Game
          </Button>
          <Button onClick={() => navigate("/puzzles")} className="btn-neon-pink px-6 md:px-8 text-xs md:text-sm flex-1 sm:flex-none">
            Solve Puzzles
          </Button>
          <Button onClick={() => navigate("/puzzle-stats")} className="btn-neon px-6 md:px-8 text-xs md:text-sm flex-1 sm:flex-none">
            Puzzle Stats
          </Button>
          <Button onClick={() => navigate("/leaderboard")} className="btn-neon px-6 md:px-8 text-xs md:text-sm flex-1 sm:flex-none">
            View Rankings
          </Button>
        </div>
      </main>
    </div>
  );
}
