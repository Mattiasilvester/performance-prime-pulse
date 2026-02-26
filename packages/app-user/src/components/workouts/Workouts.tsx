
import { WorkoutCategories } from './WorkoutCategories';
import { ActiveWorkout } from './ActiveWorkout';
import { CustomWorkoutDisplay } from './CustomWorkoutDisplay';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateWorkout, generateRecommendedWorkout } from '@/services/workoutGenerator';
import { Sparkles, Clock, Dumbbell } from 'lucide-react';

/** Esercizio come usato nei workout (name, duration, rest) */
interface WorkoutExerciseShape {
  name: string;
  duration?: string | number;
  rest?: string | number;
}

/** Workout generato/custom con meta opzionale */
interface GeneratedWorkoutShape {
  id?: string;
  name?: string;
  title?: string;
  exercises?: WorkoutExerciseShape[];
  meta?: { workoutTitle?: string; workoutType?: string; duration?: number };
  workout_type?: string;
  total_duration?: number;
  completed?: boolean;
  scheduled_date?: string;
  created_at?: string;
}

/** Stato location per workout personalizzato */
interface LocationWorkoutState {
  startCustomWorkout?: string;
  customExercises?: WorkoutExerciseShape[];
  workoutTitle?: string;
  workoutType?: string;
  duration?: number;
}

export const Workouts = () => {
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [customWorkout, setCustomWorkout] = useState<GeneratedWorkoutShape | null>(null);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkoutShape | null>(null);
  const [personalizedWorkout, setPersonalizedWorkout] = useState<LocationWorkoutState | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      setPersonalizedWorkout(location.state as LocationWorkoutState);
      console.log('Custom workout data:', location.state);
    } else {
      setPersonalizedWorkout(null);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.startCustomWorkout) {
      // Se abbiamo esercizi estratti dal file, usali direttamente
      if (location.state?.customExercises && location.state.customExercises.length > 0) {
        console.log('✅ [DEBUG] Usando esercizi estratti dal file:', location.state.customExercises);
        const customWorkoutData = {
          id: location.state.startCustomWorkout,
          title: location.state.workoutTitle || 'Allenamento da File',
          workout_type: 'personalizzato',
          exercises: location.state.customExercises,
          total_duration: 0,
          completed: false,
          scheduled_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          meta: {
            workoutTitle: location.state.workoutTitle,
            workoutType: location.state.workoutType,
            duration: location.state.duration,
            startCustomWorkout: location.state.startCustomWorkout,
          }
        };
        setCustomWorkout(customWorkoutData);
        setActiveWorkout('custom');
      } else {
        // Altrimenti carica dal database
        loadCustomWorkout(location.state.startCustomWorkout);
      }
    }
  }, [location.state]);

  const loadCustomWorkout = async (workoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_workouts')
        .select('id, title, workout_type, scheduled_date, total_duration, completed, completed_at, created_at, exercises')
        .eq('id', workoutId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setCustomWorkout(data as GeneratedWorkoutShape);
        setActiveWorkout('custom');
      }
    } catch (error) {
      console.error('Error loading custom workout:', error);
    }
  };

  const handleCloseWorkout = () => {
    setActiveWorkout(null);
    setCustomWorkout(null);
    setGeneratedWorkout(null);
    setPersonalizedWorkout(null);
  };

  const handleStartWorkout = (workoutId: string, duration?: number, generatedWorkout?: GeneratedWorkoutShape | null, userLevel?: string, quickMode?: boolean) => {
    if (generatedWorkout) {
      // Se viene passato un allenamento generato (con filtri), usalo direttamente
      setGeneratedWorkout(generatedWorkout);
      setActiveWorkout('generated');
    } else if (workoutId === 'recommended') {
      const workout = generateRecommendedWorkout();
      setGeneratedWorkout(workout);
      setActiveWorkout('generated');
    } else if (duration && ['cardio', 'strength', 'hiit', 'mobility'].includes(workoutId)) {
      // Converte userLevel a tipo valido con fallback sicuro
      const validUserLevel = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZATO'].includes(userLevel || '') 
        ? (userLevel as 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZATO')
        : 'INTERMEDIO';
      const workout = generateWorkout(workoutId as 'cardio' | 'strength' | 'hiit' | 'mobility', duration, {}, validUserLevel, quickMode || false);
      setGeneratedWorkout(workout);
      setActiveWorkout('generated');
    } else {
      setActiveWorkout(workoutId);
    }
  };

  // Se c'è un allenamento attivo, renderizza senza container limitante
  if (activeWorkout) {
    return (
      <>
        {activeWorkout === 'custom' && customWorkout ? (
          // Se gli esercizi vengono da un file, usa ActiveWorkout (esecuzione attiva)
          customWorkout.exercises && customWorkout.exercises.length > 0 ? (
            <ActiveWorkout 
              workoutId="custom"
              customWorkout={customWorkout}
              onClose={handleCloseWorkout}
            />
          ) : (
            <CustomWorkoutDisplay 
              workout={customWorkout} 
              onClose={handleCloseWorkout} 
            />
          )
        ) : activeWorkout === 'generated' && generatedWorkout ? (
          <ActiveWorkout 
            workoutId="generated"
            generatedWorkout={generatedWorkout}
            onClose={handleCloseWorkout}
          />
        ) : (
          <ActiveWorkout 
            workoutId={activeWorkout} 
            generatedWorkout={generatedWorkout}
            customWorkout={customWorkout || (personalizedWorkout?.customExercises ? {
              title: personalizedWorkout?.workoutTitle,
              workout_type: personalizedWorkout?.workoutType,
              exercises: personalizedWorkout?.customExercises,
              duration: personalizedWorkout?.duration,
              meta: personalizedWorkout
            } : undefined)}
            onClose={() => {
              setActiveWorkout(null);
            }}
          />
        )}
      </>
    );
  }

  // Se non c'è allenamento attivo, mostra il layout normale
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Allenamenti</h2>
          <p className="text-white">Scegli il tuo workout perfetto</p>
        </div>
      </div>

      <WorkoutCategories onStartWorkout={handleStartWorkout} />
    </div>
  );
};
