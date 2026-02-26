import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { WorkoutDiary } from "@/services/diaryService";

interface WorkoutDetailsModalProps {
  entry: WorkoutDiary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkoutDetailsModal({ entry, open, onOpenChange }: WorkoutDetailsModalProps) {
  if (!entry) return null;

  // Calcola durata totale reale (lavoro + riposo)
  const calculateTotalDuration = (): number => {
    if (!entry.exercises || entry.exercises.length === 0) {
      return entry.duration_minutes || 0;
    }
    
    const totalSeconds = entry.exercises.reduce((total: number, exercise: unknown) => {
      const ex = exercise as { duration?: string; rest?: string };
      const duration = parseInt(ex.duration ?? '', 10) || 0;
      const rest = parseInt(ex.rest ?? '', 10) || 0;
      return total + duration + rest;
    }, 0) as number;
    
    // Converti in minuti e arrotonda
    return Math.ceil(totalSeconds / 60);
  };

  const totalDurationMinutes = calculateTotalDuration();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&>button]:flex [&>button]:items-center [&>button]:justify-center">
        <DialogHeader>
          <DialogTitle className="text-xl">📊 Dettagli Allenamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header workout */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg">{entry.workout_name}</h3>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span>⏱️ {totalDurationMinutes} min</span>
              <span>•</span>
              <span>🏋️ {entry.exercises_count} esercizi</span>
              {entry.completed_at && (
                <>
                  <span>•</span>
                  <span>✅ {new Date(entry.completed_at).toLocaleDateString('it-IT')}</span>
                </>
              )}
            </div>
          </div>

          {/* Note */}
          {entry.notes && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📝 Note:</h4>
              <p className="text-sm bg-muted p-3 rounded-md border border-[#EEBA2B]/20">
                {entry.notes}
              </p>
            </div>
          )}

          {/* Lista esercizi */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">📋 Esercizi:</h4>
            <div className="space-y-2">
              {entry.exercises && entry.exercises.map((exercise: { name?: string; duration?: number; rest?: number; completed?: boolean }, index: number) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted rounded-md border border-[#EEBA2B]/10"
                >
                  <span className="font-bold text-[#EEBA2B] min-w-[24px]">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {exercise.duration}s lavoro • {exercise.rest || 0}s riposo
                    </p>
                  </div>
                  {exercise.completed && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      ✓
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metriche */}
          <div className="space-y-2 pt-4 border-t border-border">
            <h4 className="font-semibold text-sm">📈 Metriche:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Durata totale</p>
                <p className="font-medium">{totalDurationMinutes} minuti</p>
              </div>
              <div>
                <p className="text-muted-foreground">Esercizi completati</p>
                <p className="font-medium">
                  {entry.exercises ? entry.exercises.filter((ex: { completed?: boolean }) => ex.completed).length : 0}/{entry.exercises_count}
                </p>
              </div>
              {entry.completed_at && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Data completamento</p>
                  <p className="font-medium">
                    {new Date(entry.completed_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              {entry.duration_minutes && entry.duration_minutes !== totalDurationMinutes && (
                <div className="col-span-2 text-xs text-muted-foreground">
                  <p>⚠️ Durata salvata: {entry.duration_minutes} min (senza riposi)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

