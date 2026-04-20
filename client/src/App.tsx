import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SocketProvider } from "./contexts/SocketContext";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Puzzles from "./pages/Puzzles";
import PuzzleStats from "./pages/PuzzleStats";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import GameHistory from "./pages/GameHistory";
import Compare from "./pages/Compare";
import AIGame from "./pages/AIGame";
import AIVsAI from "./pages/AIVsAI";
import Settings from "./pages/Settings";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/lobby"} component={Lobby} />
      <Route path={"/game/:gameId"} component={Game} />
      <Route path={"/puzzles"} component={Puzzles} />
      <Route path={"/puzzle-stats"} component={PuzzleStats} />
      <Route path={"/leaderboard"} component={Leaderboard} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/history"} component={GameHistory} />
      <Route path={"/compare"} component={Compare} />
      <Route path={"/ai/:gameId"} component={AIGame} />
      <Route path={"/ai-vs-ai"} component={AIVsAI} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <SocketProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SocketProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
