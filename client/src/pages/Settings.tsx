import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, User, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  
  const [notifications, setNotifications] = useState({
    gameInvites: true,
    turnAlerts: true,
    puzzleResults: false,
    gameResults: true,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showRating: true,
  });

  // Fetch notification preferences
  const getPreferencesQuery = trpc.chess.getNotificationPreferences.useQuery();
  const updatePreferencesMutation = trpc.chess.updateNotificationPreferences.useMutation();

  useEffect(() => {
    if (getPreferencesQuery.data) {
      setNotifications(getPreferencesQuery.data);
      setIsLoading(false);
    }
  }, [getPreferencesQuery.data]);

  const handleSave = async () => {
    try {
      await updatePreferencesMutation.mutateAsync({
        gameInvites: notifications.gameInvites,
        turnAlerts: notifications.turnAlerts,
        puzzleResults: notifications.puzzleResults,
        gameResults: notifications.gameResults,
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-0 md:px-4 py-4 md:py-8">
        <header className="mb-8 md:mb-12 px-4 md:px-0">
          <div className="flex items-center gap-4 mb-2">
            <SettingsIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-black neon-text uppercase">SETTINGS</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">Configure your neural interface and game preferences.</p>
          <div className="tech-divider mt-4" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
          {/* Left Column: Categories */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Appearance */}
            <Card className="p-5 md:p-6 hud-frame bg-card">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <h3 className="text-lg md:text-xl font-bold neon-text uppercase">Appearance</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm md:text-base font-bold uppercase">Dark Mode</Label>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Switch between light and dark cyberpunk themes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Sun className={`h-4 w-4 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <Switch 
                      checked={theme === 'dark'} 
                      onCheckedChange={() => toggleTheme?.()}
                      disabled={!switchable}
                    />
                    <Moon className={`h-4 w-4 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </div>
                {!switchable && (
                  <p className="text-[10px] md:text-xs text-yellow-500/80 italic uppercase">
                    * Theme switching is currently locked by system administrator.
                  </p>
                )}
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-5 md:p-6 hud-frame bg-card">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
                <h3 className="text-lg md:text-xl font-bold neon-text-pink uppercase">Notifications</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  { id: 'gameInvites', label: 'Game Invitations', desc: 'Receive alerts when other players challenge you.' },
                  { id: 'turnAlerts', label: 'Turn Alerts', desc: "Get notified when it's your turn to move." },
                  { id: 'puzzleResults', label: 'Puzzle Results', desc: 'Receive summaries of your daily puzzle performance.' },
                  { id: 'gameResults', label: 'Game Results', desc: 'Get notified when your games are completed.' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label className="text-sm md:text-base font-bold uppercase">{item.label}</Label>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={(notifications as any)[item.id]} 
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.id]: checked }))}
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Privacy */}
            <Card className="p-5 md:p-6 hud-frame bg-card">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <h3 className="text-lg md:text-xl font-bold neon-text uppercase">Privacy & Security</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm md:text-base font-bold uppercase">Public Profile</Label>
                    <p className="text-xs md:text-sm text-muted-foreground">Allow other players to view your match history and stats.</p>
                  </div>
                  <Switch 
                    checked={privacy.publicProfile} 
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, publicProfile: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm md:text-base font-bold uppercase">Show Rating</Label>
                    <p className="text-xs md:text-sm text-muted-foreground">Display your Elo rating on the global leaderboard.</p>
                  </div>
                  <Switch 
                    checked={privacy.showRating} 
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showRating: checked }))}
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3 md:gap-4">
              <Button variant="outline" className="border-border text-xs md:text-sm">Reset Defaults</Button>
              <Button onClick={handleSave} disabled={isLoading || updatePreferencesMutation.isPending} className="btn-neon px-6 md:px-8 text-xs md:text-sm">
                {updatePreferencesMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Right Column: User Info Summary */}
          <div className="space-y-6 md:space-y-8">
            <Card className="p-5 md:p-6 hud-frame bg-card">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
                <h3 className="text-lg md:text-xl font-bold neon-text-pink uppercase">Account</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 md:p-4 bg-background/50 rounded border border-border">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase mb-1">Username</p>
                  <p className="font-bold text-sm md:text-base">{user?.name}</p>
                </div>
                <div className="p-3 md:p-4 bg-background/50 rounded border border-border">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase mb-1">Email</p>
                  <p className="font-bold text-sm md:text-base truncate">{user?.email}</p>
                </div>
                <div className="p-3 md:p-4 bg-background/50 rounded border border-border">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase mb-1">Account Type</p>
                  <p className="font-bold text-sm md:text-base text-primary uppercase">Standard Neural Link</p>
                </div>
              </div>
              
              <Button variant="link" className="w-full mt-4 text-muted-foreground hover:text-red-500 text-xs uppercase">
                Delete Account
              </Button>
            </Card>

            <Card className="p-5 md:p-6 hud-frame bg-card border-primary/30">
              <h3 className="text-base md:text-lg font-bold neon-text mb-4 uppercase">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] md:text-xs uppercase">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono">2.4.0-stable</span>
                </div>
                <div className="flex justify-between items-center text-[10px] md:text-xs uppercase">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="text-green-500 font-mono">24ms</span>
                </div>
                <div className="flex justify-between items-center text-[10px] md:text-xs uppercase">
                  <span className="text-muted-foreground">Encryption</span>
                  <span className="text-primary font-mono">AES-256</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
