import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface NotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialNotes?: string;
  onSave: (notes: string) => void;
  workoutName?: string;
}

export const NotesModal = ({
  open,
  onOpenChange,
  initialNotes = "",
  onSave,
  workoutName,
}: NotesModalProps) => {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes, open]);

  const handleSave = () => {
    onSave(notes);
    onOpenChange(false);
  };

  const remainingChars = 500 - notes.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5 text-[#FFD700]" />
            Note Allenamento
          </DialogTitle>
          {workoutName && (
            <p className="text-sm text-muted-foreground">{workoutName}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">
              Come ti sei sentito?
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Oggi sentivo le spalle stanche, ho ridotto il peso su Military Press. Ottima sessione comunque!"
              className="min-h-[200px] bg-muted border-gold/20 focus:border-gold/50 text-foreground placeholder:text-muted-foreground resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {remainingChars} caratteri rimanenti
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold">
            💾 Salva Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
