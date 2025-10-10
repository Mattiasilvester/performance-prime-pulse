
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkoutViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: any;
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

  if (!isOpen || !workout) return null;

  const workoutTypeInfo = workoutTypes.find(t => t.id === workout.workout_type);

  const handleStartWorkout = () => {
    onClose();
    navigate('/workouts', { state: { startCustomWorkout: workout.id } });
  };

  const handleDeleteWorkout = async () => {
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
      if (onWorkoutDeleted) {
        onWorkoutDeleted();
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error deleting workout:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione dell'allenamento.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[45]" onClick={onClose}>
      <div className="bg-black border-2 border-[#c89116] rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-pp-gold">Allenamento Salvato</h3>
          <button onClick={onClose} className="text-white hover:text-pp-gold">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Titolo allenamento */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white mb-2">{workout.title}</h4>
          <div className="flex items-center space-x-2">
            <span 
              className="px-3 py-1 rounded-full text-sm text-white"
              style={{ backgroundColor: workoutTypeInfo?.color || '#c89116' }}
            >
              {workoutTypeInfo?.name || workout.workout_type}
            </span>
            {workout.total_duration && (
              <span className="text-white/70 text-sm">
                {workout.total_duration} min
              </span>
            )}
          </div>
        </div>

        {/* Data programmata */}
        <div className="mb-4">
          <p className="text-white/70 text-sm">
            Programmato per: {new Date(workout.scheduled_date).toLocaleDateString('it-IT')}
          </p>
        </div>

        {/* Esercizi */}
        {workout.exercises && workout.exercises.length > 0 && (
          <div className="mb-6">
            <h5 className="text-white font-medium mb-3">Esercizi:</h5>
            <div className="space-y-3">
              {workout.exercises.map((exercise: any, index: number) => (
                <div key={index} className="bg-white/10 rounded-lg p-3">
                  <h6 className="text-white font-medium">{exercise.name}</h6>
                  <div className="flex space-x-4 mt-1 text-sm text-white/70">
                    {exercise.sets && <span>Serie: {exercise.sets}</span>}
                    {exercise.reps && <span>Rip: {exercise.reps}</span>}
                    {exercise.rest && <span>Rec: {exercise.rest}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottoni */}
        <div className="flex space-x-3">
          <Button
            onClick={handleDeleteWorkout}
            className="flex-1 bg-red-600 hover:bg-red-700 text-black font-medium"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Elimina
          </Button>
          <Button
            onClick={handleStartWorkout}
            className="flex-1 bg-[#c89116] hover:bg-[#c89116]/80 text-black font-medium"
          >
            Inizia Allenamento
          </Button>
        </div>
      </div>
    </div>
  );
};
