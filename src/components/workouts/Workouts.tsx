
import { WorkoutCategories } from './WorkoutCategories';
import { ActiveWorkout } from './ActiveWorkout';
import { WorkoutTimer } from './WorkoutTimer';
import { CustomWorkoutDisplay } from './CustomWorkoutDisplay';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateWorkout, generateRecommendedWorkout } from '@/services/workoutGenerator';

export const Workouts = () => {
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [customWorkout, setCustomWorkout] = useState<any>(null);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [timerAutoStart, setTimerAutoStart] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [timerAutoRest, setTimerAutoRest] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.startCustomWorkout) {
      loadCustomWorkout(location.state.startCustomWorkout);
    }
  }, [location.state]);

  const loadCustomWorkout = async (workoutId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping custom workout load');
        return;
      }

      const { data, error } = await supabase
        .from('custom_workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (data && !error) {
        setCustomWorkout(data);
        setActiveWorkout('custom');
      }
    } catch (error) {
      console.error('Error loading custom workout:', error);
    }
  };

  const parseTimeString = (timeStr: string) => {
    let seconds = 0;
    if (timeStr.includes('min')) {
      seconds = parseInt(timeStr) * 60;
    } else if (timeStr.includes('s')) {
      seconds = parseInt(timeStr);
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return { hours, minutes, seconds: remainingSeconds };
  };

  const handleStartExercise = (duration: string, restTime: string) => {
    const exerciseTime = parseTimeString(duration);
    const restTimeObj = parseTimeString(restTime);
    
    setTimerAutoStart(exerciseTime);
    setTimerAutoRest(restTimeObj);
  };

  const handleCloseWorkout = () => {
    setActiveWorkout(null);
    setCustomWorkout(null);
    setGeneratedWorkout(null);
    setTimerAutoStart(null);
    setTimerAutoRest(null);
  };

  const handleStartWorkout = (workoutId: string, duration?: number, generatedWorkout?: any, userLevel?: string, quickMode?: boolean) => {
    if (generatedWorkout) {
      // Se viene passato un allenamento generato (con filtri), usalo direttamente
      setGeneratedWorkout(generatedWorkout);
      setActiveWorkout('generated');
    } else if (workoutId === 'recommended') {
      const workout = generateRecommendedWorkout();
      setGeneratedWorkout(workout);
      setActiveWorkout('generated');
    } else if (duration && ['cardio', 'strength', 'hiit', 'mobility'].includes(workoutId)) {
      const workout = generateWorkout(workoutId as any, duration, {}, userLevel || 'INTERMEDIO', quickMode || false);
      setGeneratedWorkout(workout);
      setActiveWorkout('generated');
    } else {
      setActiveWorkout(workoutId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Allenamenti</h2>
          <p className="text-white">Scegli il tuo workout perfetto</p>
        </div>
      </div>

      {activeWorkout === 'custom' && customWorkout ? (
        <div className="space-y-6">
          <WorkoutTimer 
            workoutType={customWorkout.workout_type} 
            autoStartTime={timerAutoStart}
            autoStartRest={timerAutoRest}
            onTimerComplete={() => {
              setTimerAutoStart(null);
              setTimerAutoRest(null);
            }}
          />
          <CustomWorkoutDisplay 
            workout={customWorkout} 
            onClose={handleCloseWorkout} 
          />
        </div>
      ) : activeWorkout === 'generated' && generatedWorkout ? (
        <div className="space-y-6">
          <WorkoutTimer 
            workoutType="generated" 
            autoStartTime={timerAutoStart}
            autoStartRest={timerAutoRest}
            onTimerComplete={() => {
              setTimerAutoStart(null);
              setTimerAutoRest(null);
            }}
          />
          <ActiveWorkout 
            workoutId="generated"
            generatedWorkout={generatedWorkout}
            onClose={handleCloseWorkout}
            onStartExercise={handleStartExercise}
          />
        </div>
      ) : activeWorkout ? (
        <div className="space-y-6">
          <WorkoutTimer 
            workoutType={activeWorkout} 
            autoStartTime={timerAutoStart}
            autoStartRest={timerAutoRest}
            onTimerComplete={() => {
              setTimerAutoStart(null);
              setTimerAutoRest(null);
            }}
          />
          <ActiveWorkout 
            workoutId={activeWorkout} 
            onClose={() => setActiveWorkout(null)}
            onStartExercise={handleStartExercise}
          />
        </div>
              ) : (
          <WorkoutCategories onStartWorkout={handleStartWorkout} />
        )}
    </div>
  );
};
