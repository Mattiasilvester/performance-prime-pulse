import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Dumbbell, Play, FileText, Trash2, Repeat, Share2, BarChart3 } from "lucide-react";
import { formatDuration, formatDateShort } from "@/services/diaryService";

interface WorkoutDiary {
  id: string;
  workout_name: string;
  workout_type?: string | null;
  status: 'saved' | 'completed';
  duration_minutes?: number | null;
  exercises_count?: number | null;
  completed_at?: string | null;
  saved_at: string;
  notes?: string | null;
}

interface WorkoutCardProps {
  entry: WorkoutDiary;
  onStart?: (id: string) => void;
  onNotes?: (id: string) => void;
  onRemove?: (id: string) => void;
  onRepeat?: (id: string) => void;
  onDetails?: (id: string) => void;
  onShare?: (id: string) => void;
}

export const WorkoutCard = ({
  entry,
  onStart,
  onNotes,
  onRemove,
  onRepeat,
  onDetails,
  onShare,
}: WorkoutCardProps) => {
  const getWorkoutIcon = (type?: string | null) => {
    switch (type?.toLowerCase()) {
      case 'forza':
        return '🏋️';
      case 'cardio':
        return '🏃';
      case 'hiit':
        return '🔥';
      case 'mobilita':
        return '🧘';
      default:
        return '💪';
    }
  };

  const isCompleted = entry.status === 'completed';
  const isSaved = entry.status === 'saved';

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-lg">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-3xl">{getWorkoutIcon(entry.workout_type)}</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground">
                {entry.workout_name}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                {entry.duration_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(entry.duration_minutes)}</span>
                  </div>
                )}
                {entry.exercises_count && (
                  <div className="flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    <span>{entry.exercises_count} esercizi</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Badge Status */}
          <Badge
            variant={isCompleted ? 'default' : 'secondary'}
            className={isCompleted ? 'bg-green-600 text-white' : 'bg-[#FFD700]/20 text-[#FFD700]'}
          >
            {isCompleted ? '✅ Completato' : '💾 Salvato'}
          </Badge>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground">
          {isCompleted && entry.completed_at && (
            <span>Completato il {formatDateShort(entry.completed_at)}</span>
          )}
          {isSaved && (
            <span>Salvato per dopo</span>
          )}
        </div>

        {/* Notes Preview */}
        {entry.notes && (
          <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground italic border-l-2 border-[#FFD700]">
            "{entry.notes.length > 100 ? `${entry.notes.slice(0, 100)}...` : entry.notes}"
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {isSaved ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => onStart?.(entry.id)}
                  size="sm"
                  className="gap-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold"
                >
                  <Play className="w-4 h-4" />
                  Inizia
                </Button>
                <Button
                  onClick={() => onNotes?.(entry.id)}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border text-foreground hover:bg-muted"
                >
                  <FileText className="w-4 h-4" />
                  Note
                </Button>
                <Button
                  onClick={() => onRemove?.(entry.id)}
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Rimuovi
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Prima riga: Ripeti, Note, Dettagli, Elimina */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => onRepeat?.(entry.id)}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-border text-foreground hover:bg-muted"
                >
                  <Repeat className="w-4 h-4" />
                  Ripeti
                </Button>
                <Button
                  onClick={() => onNotes?.(entry.id)}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border text-foreground hover:bg-muted"
                >
                  <FileText className="w-4 h-4" />
                  Note
                </Button>
                <Button
                  onClick={() => onDetails?.(entry.id)}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border text-foreground hover:bg-muted"
                >
                  <BarChart3 className="w-4 h-4" />
                  Dettagli
                </Button>
                <Button
                  onClick={() => onRemove?.(entry.id)}
                  variant="default"
                  size="sm"
                  className="gap-2 bg-destructive hover:bg-destructive/90 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden md:inline">Elimina</span>
                </Button>
              </div>
              {/* Seconda riga: Condividi */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onShare?.(entry.id)}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border text-foreground hover:bg-muted"
                >
                  <Share2 className="w-4 h-4" />
                  Condividi
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
