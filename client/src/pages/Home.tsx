import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
// import { getLoginUrl } from "@/const";
import { Zap, Users, Brain, Trophy, Gamepad2, MessageSquare } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Zap className="w-12 h-12 text-primary" />
          </div>
          <p className="text-foreground">Initializing neural network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 245, 255, 0.05) 25%, rgba(0, 245, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 245, 255, 0.05) 75%, rgba(0, 245, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 245, 255, 0.05) 25%, rgba(0, 245, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 245, 255, 0.05) 75%, rgba(0, 245, 255, 0.05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold neon-text">CHESS NEXUS</h1>
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate("/lobby")}
                  className="btn-neon"
                >
                  Play Game
                </Button>
                <Button
                  onClick={() => navigate("/profile")}
                  className="btn-neon-pink"
                >
                  Profile
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate("/login")}
                  className="btn-neon"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  className="btn-neon-pink"
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 neon-text">
            ENTER THE CHESS NEXUS
          </h2>
          <p className="text-xl text-secondary mb-8">
            Real-time multiplayer chess with AI opponents and tactical puzzles
          </p>
          <div className="tech-divider my-8" />
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Multiplayer */}
          <Card className="bg-card border-border p-6 hud-frame">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-bold neon-text">Real-Time Multiplayer</h3>
            </div>
            <p className="text-muted-foreground">
              Challenge players worldwide with instant move synchronization and live chat
            </p>
          </Card>

          {/* AI Opponent */}
          <Card className="bg-card border-border p-6 hud-frame">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-secondary" />
              <h3 className="text-lg font-bold neon-text-pink">LLM-Powered AI</h3>
            </div>
            <p className="text-muted-foreground">
              Play against intelligent AI with adjustable difficulty levels
            </p>
          </Card>

          {/* Puzzles */}
          <Card className="bg-card border-border p-6 hud-frame">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-bold neon-text">Tactical Puzzles</h3>
            </div>
            <p className="text-muted-foreground">
              Solve chess puzzles and improve your tactical skills
            </p>
          </Card>

          {/* Leaderboard */}
          <Card className="bg-card border-border p-6 hud-frame">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-secondary" />
              <h3 className="text-lg font-bold neon-text-pink">Global Leaderboard</h3>
            </div>
            <p className="text-muted-foreground">
              Climb the ranks and compete with the best players
            </p>
          </Card>

          {/* Game History */}
          <Card className="bg-card border-border p-6 hud-frame">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-bold neon-text">Game History</h3>
            </div>
            <p className="text-muted-foreground">
              Replay your games and analyze your moves step by step
            </p>
          </Card>

          {/* In-Game Chat */}
          <Card className="bg-card border-border p-6 hud-frame">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-secondary" />
              <h3 className="text-lg font-bold neon-text-pink">Live Chat</h3>
            </div>
            <p className="text-muted-foreground">
              Communicate with your opponent during matches
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="text-center py-12 border-t border-b border-border">
            <h3 className="text-2xl font-bold mb-6 neon-text">Ready to compete?</h3>
            <Button
              onClick={() => navigate("/register")}
              className="btn-neon px-8 py-3 text-lg"
            >
              Start Playing Now
            </Button>
          </div>
        )}

        {isAuthenticated && (
          <div className="text-center py-12 border-t border-b border-border">
            <h3 className="text-2xl font-bold mb-6 neon-text">
              Welcome back, {user?.name}
            </h3>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={() => navigate("/lobby")}
                className="btn-neon px-8 py-3"
              >
                Find a Game
              </Button>
              <Button
                onClick={() => navigate("/puzzles")}
                className="btn-neon-pink px-8 py-3"
              >
                Solve Puzzles
              </Button>
              <Button
                onClick={() => navigate("/ai")}
                className="btn-neon px-8 py-3"
              >
                Play AI
              </Button>
              <Button
                onClick={() => navigate("/leaderboard")}
                className="btn-neon-pink px-8 py-3"
              >
                View Rankings
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Chess Nexus © 2026 | Real-time multiplayer chess platform</p>
          <p className="text-sm mt-2">Powered by Google Auth & WebSocket technology</p>
        </div>
      </footer>
    </div>
  );
}
