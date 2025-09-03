import { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseCard } from './ExerciseCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const workoutData = {
  cardio: {
    name: 'Cardio Brucia Grassi',
    exercises: [
      { name: 'Jumping Jacks', duration: '30s', rest: '10s' },
      { name: 'Saltelli Laterali', duration: '30s', rest: '10s' },
      { name: 'Burpees', duration: '30s', rest: '15s' },
      { name: 'Scalatori', duration: '30s', rest: '10s' },
    ],
  },
  strength: {
    name: 'Forza Upper Body',
    exercises: [
      { name: 'Flessioni', duration: '45s', rest: '15s' },
      { name: 'Plank', duration: '60s', rest: '20s' },
      { name: 'Pike Flessioni', duration: '45s', rest: '15s' },
      { name: 'Tricep Dips', duration: '45s', rest: '15s' },
    ],
  },
  recommended: {
    name: 'HIIT Total Body',
    exercises: [
      { name: 'Squat Jumps', duration: '45s', rest: '15s' },
      { name: 'Push-up to T', duration: '45s', rest: '15s' },
      { name: 'Saltelli in Plank', duration: '45s', rest: '15s' },
      { name: 'Affondi Saltati', duration: '45s', rest: '15s' },
    ],
  },
  hiit: {
    name: 'HIIT Intenso',
    exercises: [
      { name: 'Sprint sul posto', duration: '30s', rest: '10s' },
      { name: 'Jump Squats', duration: '30s', rest: '10s' },
      { name: 'Burpees esplosivi', duration: '30s', rest: '15s' },
      { name: 'Saltelli Laterali', duration: '30s', rest: '10s' },
    ],
  },
  mobility: {
    name: 'Mobilità e Stretching',
    exercises: [
      { name: 'Gatto e Mucca', duration: '60s', rest: '10s' },
      { name: 'Cerchi con i Fianchi', duration: '45s', rest: '10s' },
      { name: 'Rotazioni delle Spalle', duration: '45s', rest: '10s' },
      { name: 'Oscillazioni delle Gambe', duration: '60s', rest: '15s' },
    ],
  },
};

interface ActiveWorkoutProps {
  workoutId: string;
  generatedWorkout?: any;
  onClose: () => void;
  onStartExercise: (duration: string, restTime: string) => void;
}

export const ActiveWorkout = ({ workoutId, generatedWorkout, onClose, onStartExercise }: ActiveWorkoutProps) => {
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const { user } = useAuth();
  
  // Usa l'allenamento generato se disponibile, altrimenti usa quello statico
  const currentWorkout = generatedWorkout || workoutData[workoutId as keyof typeof workoutData];
  
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
  
  if (!currentWorkout) {
    return (
      <div className="text-white text-center">
        <p>Allenamento non trovato</p>
        <Button onClick={onClose} className="mt-4">Torna indietro</Button>
      </div>
    );
  }

  const toggleExerciseComplete = (index: number) => {
    if (completedExercises.includes(index)) {
      setCompletedExercises(completedExercises.filter(i => i !== index));
    } else {
      setCompletedExercises([...completedExercises, index]);
    }
  };

  // Funzione per completare l'allenamento e aggiornare le statistiche
  const completeWorkout = async () => {
    if (!user || !currentWorkout.exercises) return;

    try {
      // Calcola la durata totale stimata (in minuti)
      const totalMinutes = currentWorkout.exercises.reduce((total: number, exercise: any) => {
        const workTime = parseInt(exercise.duration) || 30;
        const restTime = parseInt(exercise.rest) || 10;
        return total + (workTime + restTime) / 60;
      }, 0);

      // Aggiorna le statistiche utente
      const { error } = await supabase
        .from('user_workout_stats')
        .upsert({
          user_id: user.id,
          total_workouts: 1,
          total_hours: Math.round(totalMinutes),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Errore aggiornamento statistiche:', error);
      } else {
        toast.success('Allenamento completato! Statistiche aggiornate.');
      }
    } catch (error) {
      console.error('Errore durante il completamento:', error);
    }
  };

  // Fix per il click del pulsante "TERMINA SESSIONE"
  const handleTerminateSession = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // Pattern per terminazione
    }
    
    console.log('Pulsante TERMINA SESSIONE cliccato');
    
    completeWorkout();
    onClose();
  };

  return (
    <div className="bg-black rounded-2xl shadow-sm overflow-hidden border-2 border-[#EEBA2B] animate-fade-in" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="p-6 bg-gradient-to-r from-pp-gold to-yellow-600 animate-slide-in-right">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black animate-scale-in">{currentWorkout.name}</h2>
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
            style={{ width: `${(completedExercises.length / (currentWorkout.exercises?.length || 1)) * 100}%` }}
          />
        </div>
        <p className="text-black mt-2 font-medium animate-fade-in">COMPLETA TUTTI GLI ESERCIZI • {currentWorkout.exercises?.length || 0} ESERCIZI</p>
      </div>

      <div className="p-6 space-y-4 bg-black overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        <div className="grid gap-4 pb-8">
          {currentWorkout.exercises?.map((exercise: any, index: number) => (
            <div key={`${exercise.name}-${index}`} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <ExerciseCard
                exercise={exercise}
                index={index}
                isCompleted={completedExercises.includes(index)}
                onToggleComplete={toggleExerciseComplete}
                onStart={() => onStartExercise(exercise.duration, exercise.rest)}
              />
            </div>
          )) || <p className="text-white animate-fade-in">NESSUN ESERCIZIO DISPONIBILE</p>}
        </div>

        {completedExercises.length === (currentWorkout.exercises?.length || 0) && currentWorkout.exercises?.length > 0 && (
          <div className="action-buttons-container bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center animate-scale-in">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2 animate-pulse" />
            <p className="text-green-400 font-semibold uppercase">ALLENAMENTO COMPLETATO! 🎉</p>
            <Button 
              onClick={handleTerminateSession}
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