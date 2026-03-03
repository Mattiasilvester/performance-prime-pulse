import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ScheduleWorkoutItem } from './AppointmentCalendar';

interface WorkoutViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: ScheduleWorkoutItem;
  onWorkoutDeleted?: () => void;
}

const workoutTypes = [
  { id: 'cardio', name: 'Cardio', color: '#38B6FF' },
  { id: 'forza', name: 'Forza', color: '#BC1823' },
  { id: 'hiit', name: 'HIIT', color: '#FF5757' },
  { id: 'mobilita', name: 'Mobilità', color: '#8C52FF' },
  { id: 'personalizzato', name: 'Il tuo allenamento', color: '#c89116' },
];

export const WorkoutViewModal = ({ isOpen, onClose, workout, onWorkoutDeleted }: WorkoutViewModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !workout) return null;

  const workoutTypeInfo = workoutTypes.find(t => t.id === workout.workout_type);

  const handleStartWorkout = () => {
    onClose();
    navigate('/workouts', { state: { startCustomWorkout: workout.id } });
  };

  const handleDeleteWorkout = async () => {
    if (isDeleting) return; // Previeni doppi click
    
    setIsDeleting(true);
    try {
      console.log('🗑️ [DEBUG] Tentativo eliminazione allenamento:', workout.id);
      
      const { data, error } = await supabase
        .from('custom_workouts')
        .delete()
        .eq('id', workout.id)
        .select();

      console.log('🗑️ [DEBUG] Risultato eliminazione:', { data, error });

      if (error) {
        console.error('❌ [DEBUG] Errore eliminazione:', error);
        throw error;
      }

      console.log('✅ [DEBUG] Allenamento eliminato con successo');

      toast({
        title: "Allenamento eliminato",
        description: "L'allenamento è stato eliminato con successo.",
      });

      onClose();
      // Delay callback per evitare race conditions
      if (onWorkoutDeleted) {
        setTimeout(() => {
          onWorkoutDeleted();
        }, 100);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error deleting workout:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione dell'allenamento.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[45]" onClick={onClose}>
      <div className="bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#F0EDE8]">Allenamento Salvato</h3>
          <button type="button" onClick={onClose} className="text-[#8A8A96] hover:text-[#F0EDE8]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-semibold text-[#F0EDE8] mb-2">{workout.title}</h4>
          <div className="flex items-center space-x-2">
            <span
              className="px-3 py-1 rounded-full text-sm text-white"
              style={{ backgroundColor: workoutTypeInfo?.color || '#EEBA2B' }}
            >
              {workoutTypeInfo?.name || workout.workout_type}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[#8A8A96] text-sm">
            Programmato per: {new Date(workout.scheduled_date ?? '').toLocaleDateString('it-IT')}
          </p>
        </div>

        {workout.exercises && workout.exercises.length > 0 && (
          <div className="mb-6">
            <h5 className="text-[#F0EDE8] font-medium mb-3">Esercizi:</h5>
            <div className="space-y-3">
              {(workout.exercises as { name?: string; sets?: number; reps?: number; rest?: string }[]).map((exercise, index) => (
                <div key={index} className="bg-[#1E1E24] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-3">
                  <h6 className="text-[#F0EDE8] font-medium">{exercise.name}</h6>
                  <div className="flex space-x-4 mt-1 text-sm text-[#8A8A96]">
                    {exercise.sets && <span>Serie: {exercise.sets}</span>}
                    {exercise.reps && <span>Rip: {exercise.reps}</span>}
                    {exercise.rest && <span>Rec: {exercise.rest}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            onClick={handleDeleteWorkout}
            disabled={isDeleting}
            className="flex-1 bg-[#1E1E24] hover:bg-[#2a2a2e] text-[#8A8A96] font-medium border border-[rgba(255,255,255,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Eliminando...' : 'Elimina'}
          </Button>
          <Button
            onClick={handleStartWorkout}
            className="flex-1 font-medium border-0"
            style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)', color: '#0A0A0C' }}
          >
            Inizia Allenamento
          </Button>
        </div>
      </div>
    </div>
  );
};
