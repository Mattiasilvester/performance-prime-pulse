
import { supabase } from '@/integrations/supabase/client';

export interface WorkoutStats {
  total_workouts: number;
  total_hours: number;
}

export const fetchWorkoutStats = async (): Promise<WorkoutStats> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { total_workouts: 0, total_hours: 0 };

    // Calcola statistiche dai workout completati
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

    return {
      total_workouts: totalWorkouts,
      total_hours: totalHours
    };
  } catch (error) {
    console.error('Error in fetchWorkoutStats:', error);
    return { total_workouts: 0, total_hours: 0 };
  }
};
