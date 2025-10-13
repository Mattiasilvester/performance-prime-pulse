
import { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseCard } from './ExerciseCard';
import { supabase } from '@/integrations/supabase/client';

interface CustomWorkoutDisplayProps {
  workout: any;
  onClose: () => void;
}

export const CustomWorkoutDisplay = ({ workout, onClose }: CustomWorkoutDisplayProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [startTime] = useState(Date.now());
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  const exercises = workout.exercises || [];
  
  useEffect(() => {
    // Fix per viewport height su mobile
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Initial setup
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
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

  // Fix per il click del pulsante "Completa"
  const handleCompleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    completeExercise(currentExercise);
  };

  // Fix per il touch del pulsante "Completa"
  const handleCompleteTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    completeExercise(currentExercise);
  };

  // Fix per il click del pulsante "Termina Allenamento"
  const handleTerminateWorkout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // Pattern per terminazione
    }
    
    handleCompleteWorkout();
  };

  // Fix per il touch del pulsante "Termina Allenamento"
  const handleTerminateTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // Pattern per terminazione
    }
    
    handleCompleteWorkout();
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
    <div className="bg-black rounded-2xl shadow-sm overflow-hidden border-2 border-[#EEBA2B] animate-fade-in" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="p-6 bg-gradient-to-r from-pp-gold to-yellow-600 animate-slide-in-right">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black animate-scale-in">{workout.title}</h2>
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="sm"
            className="text-black hover:text-pp-gold hover:bg-black/10 hover-scale"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-4 bg-black/20 rounded-full h-2 animate-fade-in">
          <div 
            className="bg-black rounded-full h-2 transition-all duration-500 animate-scale-in"
            style={{ width: `${(completedExercises.length / (exercises.length || 1)) * 100}%` }}
          />
        </div>
        <p className="text-black mt-2 font-medium animate-fade-in">COMPLETA TUTTI GLI ESERCIZI • {exercises.length || 0} ESERCIZI</p>
      </div>

      <div className="p-6 space-y-4 bg-black overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        <div className="grid gap-4 pb-8">
          {exercises.map((exercise: any, index: number) => (
            <div key={`${exercise.name}-${index}`} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <ExerciseCard
                exercise={exercise}
                index={index}
                isCompleted={isCompleted(index)}
                onToggleComplete={completeExercise}
                onStart={() => {
                  // Logica per avviare esercizio se necessario
                }}
              />
            </div>
          ))}
          {(!exercises || exercises.length === 0) && (
            <p className="text-white animate-fade-in text-center py-8">NESSUN ESERCIZIO DISPONIBILE</p>
          )}
        </div>

        {completedExercises.length === exercises.length && exercises.length > 0 && (
          <div className="action-buttons-container bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center animate-scale-in">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2 animate-pulse" />
            <p className="text-green-400 font-semibold uppercase">ALLENAMENTO COMPLETATO! 🎉</p>
            <Button 
              onClick={handleTerminateWorkout}
              className="btn-termina-sessione mt-3 animate-fade-in min-h-[48px] px-6 py-3 text-base font-semibold"
              type="button"
              aria-label="Termina sessione allenamento"
            >
              TERMINA SESSIONE
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
