
import { supabase } from '@/integrations/supabase/client';

export interface WorkoutStats {
  total_workouts: number;
  total_hours: string; // Formato "39m" o "1h 30m"
  total_minutes?: number; // Minuti totali per calcoli interni
}

export const fetchWorkoutStats = async (userId?: string): Promise<WorkoutStats> => {
  try {
    let uid = userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total_workouts: 0, total_hours: '0h 0m' };
      uid = user.id;
    }

    // USA SEMPRE custom_workouts come fonte di verità (DATI REALI)
    // Calcola dai workout completati (backup/fonte di verità)
    const { data: workouts, error } = await supabase
      .from('custom_workouts')
      .select('total_duration')
      .eq('user_id', uid)
      .eq('completed', true);

    if (error) {
      return { total_workouts: 0, total_hours: '0h 0m' };
    }

    const totalWorkouts = workouts?.length || 0;
    const totalMinutes = workouts?.reduce((sum, workout) => sum + (workout.total_duration || 0), 0) || 0;
    
    // Formatta in ore e minuti (Xh Ym)
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formattedTime = `${hours}h ${minutes}m`;

    // SINCRONIZZA user_workout_stats solo se vuota o corrotta (non duplicare)
    try {
      const { error: syncError } = await supabase
        .from('user_workout_stats')
        .upsert({
          user_id: uid,
          total_workouts: totalWorkouts,
          total_hours: totalMinutes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (syncError) {
        // sync non critico, ignora
      }
    } catch {
      // sync non critico, ignora
    }

    return {
      total_workouts: totalWorkouts,
      total_hours: formattedTime,
      total_minutes: totalMinutes
    };
  } catch {
    return { total_workouts: 0, total_hours: '0m' };
  }
};

// Aggiorna le statistiche utente quando viene completato un allenamento
export const updateWorkoutStats = async (userId: string, workoutDuration: number) => {
  try {
    // Controlla se esistono statistiche esistenti
    const { data: existingStats, error: fetchError } = await supabase
      .from('user_workout_stats')
      .select('total_workouts, total_hours')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return;
    }

    if (existingStats) {
      // Aggiorna statistiche esistenti
      const newTotalWorkouts = existingStats.total_workouts + 1;
      const newTotalHours = existingStats.total_hours + workoutDuration;

      const { error: updateError } = await supabase
        .from('user_workout_stats')
        .update({
          total_workouts: newTotalWorkouts,
          total_hours: newTotalHours,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        // ignora
      }
    } else {
      // Crea nuove statistiche
      const { error: insertError } = await supabase
        .from('user_workout_stats')
        .insert({
          user_id: userId,
          total_workouts: 1,
          total_hours: workoutDuration,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        // ignora
      }
    }
  } catch {
    // ignora
  }
};

// Resetta le statistiche utente (per correggere duplicazioni)
export const resetWorkoutStats = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('user_workout_stats')
      .delete()
      .eq('user_id', userId);

    if (error) {
      // ignora
    }
  } catch {
    // ignora
  }
};
