
import { supabase } from '@/integrations/supabase/client';

export interface WorkoutStats {
  total_workouts: number;
  total_hours: number;
}

export const fetchWorkoutStats = async (): Promise<WorkoutStats> => {
  try {
    console.log('Fetching workout stats...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { total_workouts: 0, total_hours: 0 };

    // Prima controlla se esistono statistiche nella tabella user_workout_stats
    const { data: stats, error: statsError } = await supabase
      .from('user_workout_stats')
      .select('total_workouts, total_hours')
      .eq('user_id', user.id)
      .single();

    if (!statsError && stats) {
      return {
        total_workouts: stats.total_workouts || 0,
        total_hours: Math.round((stats.total_hours || 0) / 60 * 10) / 10
      };
    }

    // Se non ci sono statistiche, calcola dai workout completati
    const { data: workouts, error } = await supabase
      .from('custom_workouts')
      .select('total_duration')
      .eq('user_id', user.id)
      .eq('completed', true);

    if (error) {
      console.error('Error fetching workout stats:', error);
      return { total_workouts: 0, total_hours: 0 };
    }

    const totalWorkouts = workouts?.length || 0;
    const totalMinutes = workouts?.reduce((sum, workout) => sum + (workout.total_duration || 0), 0) || 0;
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    console.log('Real stats calculated:', { totalWorkouts, totalHours });
    return {
      total_workouts: totalWorkouts,
      total_hours: totalHours
    };
  } catch (error) {
    console.error('Error in fetchWorkoutStats:', error);
    return { total_workouts: 0, total_hours: 0 };
  }
};
