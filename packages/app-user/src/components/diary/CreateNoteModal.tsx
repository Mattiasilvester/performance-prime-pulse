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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryIcons, categoryLabels, type NoteCategory } from "@/lib/diaryNotesStorage";

interface CreateNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: { content: string; category: NoteCategory; isPinned: boolean }) => void;
}

const placeholders = [
  "Come ti senti oggi?",
  "Cosa hai imparato?",
  "Quali progressi hai fatto?",
  "Come è andato l'allenamento?",
  "Cosa ti motiva?",
];

export const CreateNoteModal = ({ open, onOpenChange, onSave }: CreateNoteModalProps) => {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory | "">("");
  const [isPinned, setIsPinned] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPlaceholder(placeholders[Math.floor(Math.random() * placeholders.length)]);
    } else {
      // Reset form when closed
      setContent("");
      setCategory("");
      setIsPinned(false);
      setError("");
    }
  }, [open]);

  const handleSave = () => {
    // Validation
    if (content.trim().length < 10) {
      setError("La nota deve contenere almeno 10 caratteri");
      return;
    }
    if (content.length > 500) {
      setError("La nota non può superare 500 caratteri");
      return;
    }
    if (!category) {
      setError("Seleziona una categoria");
      return;
    }

    onSave({
      content: content.trim(),
      category: category as NoteCategory,
      isPinned,
    });
    onOpenChange(false);
  };

  const remainingChars = 500 - content.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            📝 Nuova Nota
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category Select */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-foreground">
              Categoria *
            </Label>
            <Select value={category} onValueChange={(value) => setCategory(value as NoteCategory)}>
              <SelectTrigger className="!bg-muted border-border text-foreground">
                <SelectValue placeholder="Seleziona categoria..." />
              </SelectTrigger>
              <SelectContent className="!bg-muted">
                {(Object.keys(categoryLabels) as NoteCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat} className="focus:!bg-muted">
                    {categoryIcons[cat]} {categoryLabels[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-foreground">
              Contenuto *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value.slice(0, 500));
                setError("");
              }}
              placeholder={placeholder}
              className="min-h-[150px] !bg-muted border-border text-foreground resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {remainingChars} caratteri rimanenti
              </p>
              {content.length >= 10 && (
                <p className="text-xs text-green-600">
                  ✓ Minimo raggiunto
                </p>
              )}
            </div>
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <Label htmlFor="pin" className="text-foreground cursor-pointer">
              📌 Fissa in cima
            </Label>
            <Switch
              id="pin"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} className="gap-2">
            💾 Salva Nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

