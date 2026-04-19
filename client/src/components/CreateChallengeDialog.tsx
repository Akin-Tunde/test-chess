import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, Swords } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CreateChallengeDialog() {
  const [open, setOpen] = useState(false);
  const [timeControl, setTimeControl] = useState("10+5");
  const [color, setColor] = useState("random");
  
  const createInvitation = trpc.chess.sendInvitation.useMutation({
    onSuccess: () => {
      toast.success("Challenge created successfully!");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create challenge: ${error.message}`);
    }
  });

  const handleCreate = () => {
    // For now, we'll just send a general invitation or a placeholder logic
    // In a real app, this might create an 'open challenge' entry in the DB
    // For this implementation, we'll assume the user is looking for any opponent
    toast.info("Searching for opponent...");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-neon">
          <Plus className="w-4 h-4 mr-2" />
          Create Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border hud-frame sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="neon-text text-2xl">NEW CHALLENGE</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <Label className="text-primary flex items-center gap-2">
              <Clock className="w-4 h-4" /> Time Control
            </Label>
            <Select value={timeControl} onValueChange={setTimeControl}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="1+0">Bullet (1+0)</SelectItem>
                <SelectItem value="3+2">Blitz (3+2)</SelectItem>
                <SelectItem value="5+3">Blitz (5+3)</SelectItem>
                <SelectItem value="10+5">Rapid (10+5)</SelectItem>
                <SelectItem value="30+0">Classical (30+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-secondary flex items-center gap-2">
              <Swords className="w-4 h-4" /> I Play As
            </Label>
            <RadioGroup value={color} onValueChange={setColor} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="white" id="white" className="border-primary text-primary" />
                <Label htmlFor="white">White</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="black" id="black" className="border-secondary text-secondary" />
                <Label htmlFor="black">Black</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="random" id="random" className="border-muted text-muted" />
                <Label htmlFor="random">Random</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-border">
            Cancel
          </Button>
          <Button onClick={handleCreate} className="btn-neon">
            Broadcast Challenge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
