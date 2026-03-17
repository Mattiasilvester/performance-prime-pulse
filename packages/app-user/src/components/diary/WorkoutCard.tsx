import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Dumbbell, Play, FileText, Trash2, Repeat, Share2, BarChart3 } from "lucide-react";
import { formatDuration } from "@/services/diaryService";
import { WorkoutIcon } from "@/components/workouts/WorkoutIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const isCompleted = entry.status === 'completed';
  const isSaved = entry.status === 'saved';

  return (
    <Card className="bg-[#16161A] border border-[#2a2a2e] rounded-2xl p-4 transition-all hover:shadow-lg hover:border-[#2a2a2e]">
      <CardContent className="p-0 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <WorkoutIcon 
              type={entry.workout_type} 
              workoutName={entry.workout_name}
              size="md"
            />
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
          {isCompleted ? (
            <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-semibold text-green-500">Completato</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-[10px] font-semibold text-blue-400">Salvato</span>
            </div>
          )}
        </div>

        {/* Notes Preview */}
        {entry.notes && (
          <div className="border-l-2 border-[#EEBA2B] bg-[#0A0A0C] rounded-r-lg px-3 py-2 text-sm text-[#8A8A96] italic">
            "{entry.notes.length > 100 ? `${entry.notes.slice(0, 100)}...` : entry.notes}"
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-[#1e1e24] pt-3 mt-2">
          {isSaved ? (
            <>
              <Button
                onClick={() => onStart?.(entry.id)}
                size="sm"
                className="gap-1.5 bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black font-semibold rounded-lg px-3 py-1.5 text-[11px]"
              >
                <Play className="w-4 h-4" />
                Inizia
              </Button>
              <button
                onClick={() => onNotes?.(entry.id)}
                className="flex items-center gap-1.5 bg-[#0A0A0C] border border-[#2a2a2e] hover:border-[#EEBA2B]/50 text-[#8A8A96] hover:text-white rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                Note
              </button>
              <Button
                onClick={() => onRemove?.(entry.id)}
                variant="ghost"
                size="sm"
                className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-3 py-1.5 text-[11px] font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Rimuovi
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => onRepeat?.(entry.id)}
                className="flex items-center gap-1.5 bg-[#0A0A0C] border border-[#2a2a2e] hover:border-[#EEBA2B] text-[#EEBA2B] rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
              >
                <Repeat className="w-4 h-4" />
                Ripeti
              </button>
              <button
                onClick={() => onNotes?.(entry.id)}
                className="flex items-center gap-1.5 bg-[#0A0A0C] border border-[#2a2a2e] hover:border-[#EEBA2B]/50 text-[#8A8A96] hover:text-white rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                Note
              </button>
              <button
                onClick={() => onDetails?.(entry.id)}
                className="flex items-center gap-1.5 bg-[#0A0A0C] border border-[#2a2a2e] hover:border-[#EEBA2B]/50 text-[#8A8A96] hover:text-white rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Dettagli
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-auto bg-[#0A0A0C] border border-[#2a2a2e] rounded-lg w-8 h-8 flex items-center justify-center text-[#8A8A96] hover:text-white transition-colors"
                  >
                    ···
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#16161A] border border-[#2a2a2e] rounded-xl"
                >
                  <DropdownMenuItem
                    onClick={() => onShare?.(entry.id)}
                    className="text-[#8A8A96] text-sm cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Condividi
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onRemove?.(entry.id)}
                    className="text-red-400 text-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
