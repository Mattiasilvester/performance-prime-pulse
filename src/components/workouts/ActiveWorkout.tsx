import { useState, useEffect } from 'react';
import { CheckCircle, X, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseCard } from './ExerciseCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Helper function per convertire stringhe tempo in numeri
const parseTimeToSeconds = (timeStr: string): number => {
  if (timeStr.includes('min')) {
    return parseInt(timeStr) * 60;
  } else if (timeStr.includes('s')) {
    return parseInt(timeStr);
  }
  return 30; // default
};

// Helper function per convertire secondi in formato MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Interface per stato timer di ogni esercizio
interface ExerciseTimerState {
  isActive: boolean;
  isResting: boolean;
  timeRemaining: number;
  totalWorkTime: number;
  totalRestTime: number;
  isCompleted: boolean;
}

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

  // Stati per i timer di ogni esercizio
  const [exerciseTimers, setExerciseTimers] = useState<Record<number, ExerciseTimerState>>({});
  
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

  // useEffect per gestire il countdown automatico dei timer
  useEffect(() => {
    const interval = setInterval(() => {
      setExerciseTimers(prev => {
        const updated = { ...prev };
        
        Object.keys(updated).forEach(key => {
          const index = parseInt(key);
          const timer = updated[index];
          
          if (timer && timer.isActive && timer.timeRemaining > 0) {
            updated[index] = {
              ...timer,
              timeRemaining: timer.timeRemaining - 1
            };
          } else if (timer && timer.isActive && timer.timeRemaining === 0) {
            if (!timer.isResting) {
              // Fine esercizio, inizia recupero
              updated[index] = {
                ...timer,
                isResting: true,
                timeRemaining: timer.totalRestTime
              };
            } else {
              // Fine recupero, esercizio completato
              updated[index] = {
                ...timer,
                isActive: false,
                isCompleted: true
              };
              // Auto-completa l'esercizio
              if (!completedExercises.includes(index)) {
                setCompletedExercises(prev => [...prev, index]);
              }
            }
          }
        });
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [completedExercises]);
  
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

  // Funzione per avviare il timer di un esercizio
  const startExerciseTimer = (index: number, exercise: any) => {
    const workTime = parseTimeToSeconds(exercise.duration);
    const restTime = parseTimeToSeconds(exercise.rest);
    
    setExerciseTimers(prev => ({
      ...prev,
      [index]: {
        isActive: true,
        isResting: false,
        timeRemaining: workTime,
        totalWorkTime: workTime,
        totalRestTime: restTime,
        isCompleted: false
      }
    }));
  };

  // Funzione per pausare/riprendere il timer
  const toggleTimer = (index: number) => {
    setExerciseTimers(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        isActive: !prev[index]?.isActive
      }
    }));
  };

  // Funzione per resettare il timer
  const resetTimer = (index: number, exercise: any) => {
    const workTime = parseTimeToSeconds(exercise.duration);
    const restTime = parseTimeToSeconds(exercise.rest);
    
    setExerciseTimers(prev => ({
      ...prev,
      [index]: {
        isActive: false,
        isResting: false,
        timeRemaining: workTime,
        totalWorkTime: workTime,
        totalRestTime: restTime,
        isCompleted: false
      }
    }));
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

      // Aggiorna le statistiche utente (non bloccante)
      try {
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
          console.warn('Errore aggiornamento statistiche (non bloccante):', error);
        } else {
          toast.success('Allenamento completato! Statistiche aggiornate.');
        }
      } catch (error) {
        console.warn('user_workout_stats table not available:', error);
        toast.success('Allenamento completato!');
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
          {currentWorkout.exercises?.map((exercise: any, index: number) => {
            const timer = exerciseTimers[index];
            const isTimerActive = timer?.isActive || false;
            const isResting = timer?.isResting || false;
            const timeRemaining = timer?.timeRemaining || 0;
            const isCompleted = timer?.isCompleted || completedExercises.includes(index);
            
            return (
              <div key={`${exercise.name}-${index}`} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                {/* Timer Display */}
                {isTimerActive && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-center">
                    <div className="text-white font-bold text-2xl mb-1">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="text-white/80 text-sm">
                      {isResting ? 'RECUPERO' : 'ESERCIZIO'}
                    </div>
                    <div className="flex justify-center gap-2 mt-2">
                      <Button
                        onClick={() => toggleTimer(index)}
                        size="sm"
                        variant="outline"
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        {timer?.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={() => resetTimer(index, exercise)}
                        size="sm"
                        variant="outline"
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <ExerciseCard
                  exercise={exercise}
                  index={index}
                  isCompleted={isCompleted}
                  onToggleComplete={toggleExerciseComplete}
                  onStart={() => startExerciseTimer(index, exercise)}
                />
              </div>
            );
          })}
          {(!currentWorkout.exercises || currentWorkout.exercises.length === 0) && (
            <p className="text-white animate-fade-in text-center py-8">NESSUN ESERCIZIO DISPONIBILE</p>
          )}
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