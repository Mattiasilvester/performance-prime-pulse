
import { supabase } from '@/integrations/supabase/client';

export interface WorkoutStats {
  total_workouts: number;
  total_hours: string; // Formato "39m" o "1h 30m"
  total_minutes?: number; // Minuti totali per calcoli interni
}

export const fetchWorkoutStats = async (): Promise<WorkoutStats> => {
  try {
    console.log('🔍 [DEBUG] fetchWorkoutStats: Inizio');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ [DEBUG] fetchWorkoutStats: Nessun utente autenticato');
      return { total_workouts: 0, total_hours: '0h 0m' };
    }
    
    console.log('✅ [DEBUG] fetchWorkoutStats: Utente autenticato:', user.id);

    // Prima controlla se esistono statistiche nella tabella user_workout_stats
    try {
      console.log('🔍 [DEBUG] fetchWorkoutStats: Controllo user_workout_stats...');
      const { data: stats, error: statsError } = await supabase
        .from('user_workout_stats')
        .select('total_workouts, total_hours')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('📊 [DEBUG] fetchWorkoutStats: user_workout_stats result:', { stats, statsError });

      if (!statsError && stats) {
        console.log('✅ [DEBUG] fetchWorkoutStats: Usando statistiche pre-calcolate');
        
        // Formatta in ore e minuti (Xh Ym)
        const totalMinutes = stats.total_hours || 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const formattedTime = `${hours}h ${minutes}m`;
        
        return {
          total_workouts: stats.total_workouts || 0,
          total_hours: formattedTime,
          total_minutes: totalMinutes
        };
      }
    } catch (error) {
      // Se la tabella non esiste o non ci sono dati, continua con il calcolo dai workout
      console.warn('⚠️ [DEBUG] user_workout_stats table not available, calculating from workouts:', error);
    }

    // Se non ci sono statistiche, calcola dai workout completati
    console.log('🔍 [DEBUG] fetchWorkoutStats: Calcolo da custom_workouts...');
    const { data: workouts, error } = await supabase
      .from('custom_workouts')
      .select('total_duration')
      .eq('user_id', user.id)
      .eq('completed', true);

    console.log('📊 [DEBUG] fetchWorkoutStats: custom_workouts result:', { workouts, error });

    if (error) {
      console.error('❌ [DEBUG] Error fetching workout stats:', error);
      return { total_workouts: 0, total_hours: '0h 0m' };
    }

    const totalWorkouts = workouts?.length || 0;
    const totalMinutes = workouts?.reduce((sum, workout) => sum + (workout.total_duration || 0), 0) || 0;
    
    // Formatta in ore e minuti (Xh Ym)
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formattedTime = `${hours}h ${minutes}m`;

    console.log('✅ [DEBUG] fetchWorkoutStats: Risultato finale:', { totalWorkouts, totalMinutes, formattedTime });

    return {
      total_workouts: totalWorkouts,
      total_hours: formattedTime,
      total_minutes: totalMinutes
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error in fetchWorkoutStats:', error);
    return { total_workouts: 0, total_hours: '0m' };
  }
};
