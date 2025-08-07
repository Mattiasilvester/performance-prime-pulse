
import { useState } from 'react';
import { CheckCircle, ArrowRight, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutAttachments } from './WorkoutAttachments';

interface CustomWorkoutDisplayProps {
  workout: any;
  onClose: () => void;
}

export const CustomWorkoutDisplay = ({ workout, onClose }: CustomWorkoutDisplayProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [startTime] = useState(Date.now());
  const [showAttachments, setShowAttachments] = useState(false);
  
  const exercises = workout.exercises || [];
  
  const completeExercise = (index: number) => {
    setCompletedExercises([...completedExercises, index]);
    if (index < exercises.length - 1) {
      setCurrentExercise(index + 1);
    }
  };

  const isCompleted = (index: number) => completedExercises.includes(index);

  const handleCompleteWorkout = async () => {
    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - startTime) / 60000);

    try {
      const { error } = await supabase
        .from('custom_workouts')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          total_duration: durationMinutes
        })
        .eq('id', workout.id);

      if (error) throw error;
      
      onClose();
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const getHeaderBackground = () => {
    const colorMap: { [key: string]: string } = {
      cardio: '#38B6FF',
      forza: '#BC1823',
      hiit: '#FF5757',
      mobilita: '#8C52FF',
      personalizzato: '#c89116'
    };
    return colorMap[workout.workout_type] || '#c89116';
  };
  
  return (
    <div className="cardio-fatburn-section rounded-2xl shadow-sm overflow-hidden" style={{ border: '2px solid #EEBA2B' }}>
      <div className="p-6 text-white" style={{ background: getHeaderBackground() }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{workout.title}</h3>
            <p className="text-blue-100">
              Esercizio {currentExercise + 1} di {exercises.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowAttachments(!showAttachments)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${(completedExercises.length / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="cardio-fatburn-section__container p-6 space-y-4" style={{ backgroundColor: '#000000', border: '2px solid #EEBA2B' }}>
        {exercises.map((exercise: any, index: number) => (
          <div
            key={index}
            className="cardio-fatburn-card p-4 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: '#000000',
              border: '2px solid #EEBA2B',
              position: 'relative',
            }}
          >
            {/* Active exercise overlay */}
            {index === currentExercise && !isCompleted(index) && (
              <div 
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ backgroundColor: 'rgba(56, 182, 255, 0.3)' }}
              />
            )}
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div
                  className={`cardio-fatburn-card__bullet w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted(index)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-slate-300 text-slate-600 border-slate-300'
                  }`}
                >
                  {isCompleted(index) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-bold">{index + 1}</span>
                  )}
                </div>
                <div>
                  <h4 className="cardio-fatburn-card__title font-semibold text-white">
                    {exercise.name}
                  </h4>
                  <p className="cardio-fatburn-card__subtitle text-sm text-gray-400">
                    {exercise.sets && `${exercise.sets} serie`}
                    {exercise.reps && ` • ${exercise.reps} rip.`}
                    {exercise.rest && ` • ${exercise.rest} rec.`}
                  </p>
                </div>
              </div>
              
              {index === currentExercise && !isCompleted(index) && (
                <Button
                  onClick={() => completeExercise(index)}
                  style={{ backgroundColor: '#EEBA2B', color: '#000000' }}
                >
                  Completa
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {completedExercises.length === exercises.length && (
          <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-800 mb-2">Workout Completato!</h3>
            <p className="text-green-600 mb-4">Ottimo lavoro! Hai completato tutti gli esercizi.</p>
            <Button 
              onClick={handleCompleteWorkout}
              className="bg-green-600 hover:bg-green-700"
            >
              Termina Allenamento
            </Button>
          </div>
        )}

        {/* Sezione Allegati */}
        {showAttachments && (
          <div className="mt-6">
            <WorkoutAttachments 
              workoutId={workout.id}
              onAttachmentsChange={() => {
                // Callback per aggiornamenti degli allegati
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
