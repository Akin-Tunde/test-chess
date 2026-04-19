import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, Zap } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground overflow-hidden relative">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 245, 255, 0.05) 25%, rgba(0, 245, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 245, 255, 0.05) 75%, rgba(0, 245, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 245, 255, 0.05) 25%, rgba(0, 245, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 245, 255, 0.05) 75%, rgba(0, 245, 255, 0.05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <Card className="w-full max-w-lg mx-4 hud-frame bg-card relative z-10 border-border">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse blur-xl" />
              <AlertCircle className="relative h-20 w-20 text-primary" />
            </div>
          </div>

          <h1 className="text-6xl font-black neon-text mb-4">404</h1>

          <h2 className="text-2xl font-bold neon-text-pink mb-6 tracking-widest uppercase">
            Connection Lost
          </h2>

          <div className="tech-divider mb-8" />

          <p className="text-muted-foreground mb-10 leading-relaxed font-mono text-sm">
            THE REQUESTED NEURAL PATHWAY DOES NOT EXIST.
            <br />
            THE DATA MAY HAVE BEEN WIPED OR REALLOCATED.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="btn-neon px-8 py-6 text-lg group"
            >
              <Home className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              RETURN TO NEXUS
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="border-primary/50 text-primary hover:bg-primary/10 px-8 py-6 text-lg font-bold"
            >
              <Zap className="w-5 h-5 mr-2" />
              RETRY LINK
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Decorative scan lines */}
      <div className="fixed inset-0 pointer-events-none scan-lines opacity-20" />
    </div>
  );
}
