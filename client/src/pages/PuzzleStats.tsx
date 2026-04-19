import React from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Trophy, Target, Zap, Clock, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function PuzzleStats() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.chess.getPuzzleStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: attempts, isLoading: attemptsLoading } = trpc.chess.getPuzzleAttempts.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated }
  );

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || statsLoading || attemptsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-primary animate-spin mb-4 mx-auto" />
          <p className="text-foreground">Loading puzzle statistics...</p>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    beginner: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500' },
    intermediate: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500' },
    advanced: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500' },
    expert: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border p-3 md:p-4 sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/lobby")} className="flex items-center gap-2 text-xs md:text-sm h-9 md:h-10">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold neon-text uppercase">PUZZLE STATISTICS</h1>
          </div>
          <div className="w-10 md:w-20"></div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Total Attempts */}
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Attempts</h3>
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold neon-text">{stats?.totalAttempts || 0}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase">Puzzles attempted</p>
          </Card>

          {/* Solved */}
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Solved</h3>
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-green-500">{stats?.totalSolved || 0}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase">Correct solutions</p>
          </Card>

          {/* Solve Rate */}
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Solve Rate</h3>
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold neon-text-pink">{stats?.solveRate || 0}%</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase">Success rate</p>
          </Card>

          {/* Avg Time */}
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Avg Time</h3>
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-yellow-500">{stats?.averageTimeSpent || 0}s</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase">Per puzzle</p>
          </Card>
        </div>

        {/* Difficulty Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <h3 className="text-base md:text-lg font-bold neon-text mb-6 uppercase">Performance by Difficulty</h3>
            <div className="space-y-4">
              {Object.entries(stats?.byDifficulty || {}).map(([difficulty, data]: any) => {
                const colors = difficultyColors[difficulty as keyof typeof difficultyColors];
                return (
                  <div key={difficulty} className={`p-4 ${colors.bg} border ${colors.border} rounded`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold capitalize text-sm md:text-base">{difficulty}</span>
                      <span className={`text-sm font-bold ${colors.text}`}>{data.solveRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground mb-2 uppercase">
                      <span>{data.solved} / {data.attempts} solved</span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors.text.replace('text-', 'bg-')} shadow-[0_0_5px_rgba(var(--primary),0.3)]`}
                        style={{ width: `${data.solveRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Overall Progress */}
          <Card className="p-5 md:p-6 hud-frame bg-card">
            <h3 className="text-base md:text-lg font-bold neon-text mb-6 uppercase">Overall Progress</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-3">
                  <span className="text-xs md:text-sm text-muted-foreground uppercase">Completion Rate</span>
                  <span className="text-xs md:text-sm font-bold text-primary">{stats?.solveRate || 0}%</span>
                </div>
                <div className="w-full bg-border h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    style={{ width: `${stats?.solveRate || 0}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1 uppercase">Correct</p>
                  <p className="text-xl md:text-2xl font-bold text-green-500">{stats?.totalSolved || 0}</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1 uppercase">Incorrect</p>
                  <p className="text-xl md:text-2xl font-bold text-red-500">{(stats?.totalAttempts || 0) - (stats?.totalSolved || 0)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Attempts */}
        {attempts && attempts.length > 0 && (
          <Card className="p-5 md:p-6 hud-frame bg-card mb-8">
            <h3 className="text-base md:text-lg font-bold neon-text mb-6 uppercase">Recent Attempts</h3>
            <div className="space-y-3">
              {attempts.map((attempt) => {
                const colors = difficultyColors[attempt.puzzleDifficulty as keyof typeof difficultyColors];
                return (
                  <div key={attempt.id} className={`p-3 md:p-4 ${colors.bg} border ${colors.border} rounded flex justify-between items-center gap-4`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base truncate">{attempt.puzzleTitle}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        {new Date(attempt.createdAt).toLocaleDateString()} • {new Date(attempt.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                      <span className={`hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-1 rounded ${colors.text} ${colors.bg} border ${colors.border}`}>
                        {attempt.puzzleDifficulty}
                      </span>
                      <span className={`text-lg md:text-xl font-bold ${attempt.solved ? 'text-green-500' : 'text-red-500'}`}>
                        {attempt.solved ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 md:gap-4 justify-center flex-wrap">
          <Button onClick={() => navigate("/puzzles")} className="btn-neon px-6 md:px-8 text-xs md:text-sm flex-1 sm:flex-none">
            Solve More Puzzles
          </Button>
          <Button onClick={() => navigate("/profile")} className="btn-neon-pink px-6 md:px-8 text-xs md:text-sm flex-1 sm:flex-none">
            View Profile
          </Button>
        </div>
      </main>
    </div>
  );
}
