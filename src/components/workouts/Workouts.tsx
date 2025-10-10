
import { WorkoutCategories } from './WorkoutCategories';
import { ActiveWorkout } from './ActiveWorkout';
import { CustomWorkoutDisplay } from './CustomWorkoutDisplay';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateWorkout, generateRecommendedWorkout } from '@/services/workoutGenerator';

export const Workouts = () => {
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [customWorkout, setCustomWorkout] = useState<any>(null);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.startCustomWorkout) {
      loadCustomWorkout(location.state.startCustomWorkout);
    }
  }, [location.state]);

  const loadCustomWorkout = async (workoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_workouts')
        .select('id, title, workout_type, scheduled_date, total_duration, completed, completed_at, created_at, exercises')
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

  const handleCloseWorkout = () => {
    setActiveWorkout(null);
    setCustomWorkout(null);
    setGeneratedWorkout(null);
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

  // Se c'è un allenamento attivo, renderizza senza container limitante
  if (activeWorkout) {
    return (
      <>
        {activeWorkout === 'custom' && customWorkout ? (
          <CustomWorkoutDisplay 
            workout={customWorkout} 
            onClose={handleCloseWorkout} 
          />
        ) : activeWorkout === 'generated' && generatedWorkout ? (
          <ActiveWorkout 
            workoutId="generated"
            generatedWorkout={generatedWorkout}
            onClose={handleCloseWorkout}
          />
        ) : (
          <ActiveWorkout 
            workoutId={activeWorkout} 
            onClose={() => setActiveWorkout(null)}
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
