
import { WorkoutCategories } from './WorkoutCategories';
import { ActiveWorkout } from './ActiveWorkout';
import { WorkoutTimer } from './WorkoutTimer';
import { CustomWorkoutDisplay } from './CustomWorkoutDisplay';
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const Workouts = () => {
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [customWorkout, setCustomWorkout] = useState<any>(null);
  const [timerAutoStart, setTimerAutoStart] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const location = useLocation();
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Se arrivato dal calendario con un workout personalizzato da iniziare
    if (location.state?.startCustomWorkout) {
      loadCustomWorkout(location.state.startCustomWorkout);
    }
  }, [location.state]);

  const loadCustomWorkout = async (workoutId: string) => {
    try {
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

  const handleStartExercise = (duration: string, restTime: string) => {
    // Parse duration (e.g., "30s" or "2min")
    let seconds = 0;
    if (duration.includes('min')) {
      seconds = parseInt(duration) * 60;
    } else if (duration.includes('s')) {
      seconds = parseInt(duration);
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    setTimerAutoStart({ hours, minutes, seconds: remainingSeconds });
  };

  const handleCloseWorkout = () => {
    setActiveWorkout(null);
    setCustomWorkout(null);
    setTimerAutoStart(null);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen border-2 border-black">
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
            onTimerComplete={() => setTimerAutoStart(null)}
          />
          <CustomWorkoutDisplay 
            workout={customWorkout} 
            onClose={handleCloseWorkout} 
          />
        </div>
      ) : activeWorkout ? (
        <div className="space-y-6">
          <WorkoutTimer 
            workoutType={activeWorkout} 
            autoStartTime={timerAutoStart}
            onTimerComplete={() => setTimerAutoStart(null)}
          />
          <ActiveWorkout 
            workoutId={activeWorkout} 
            onClose={() => setActiveWorkout(null)}
            onStartExercise={handleStartExercise}
          />
        </div>
      ) : (
        <WorkoutCategories onStartWorkout={setActiveWorkout} />
      )}
    </div>
  );
};
