
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

    // USA SEMPRE custom_workouts come fonte di verità (DATI REALI)
    console.log('🔍 [DEBUG] fetchWorkoutStats: SEMPRE dati reali da custom_workouts');

    // Calcola dai workout completati (backup/fonte di verità)
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

    console.log('✅ [DEBUG] fetchWorkoutStats: Risultato finale DA custom_workouts:', { totalWorkouts, totalMinutes, formattedTime });

    // SINCRONIZZA user_workout_stats solo se vuota o corrotta (non duplicare)
    console.log('🔄 [DEBUG] fetchWorkoutStats: Sincronizzazione user_workout_stats...');
    try {
      const { error: syncError } = await supabase
        .from('user_workout_stats')
        .upsert({
          user_id: user.id,
          total_workouts: totalWorkouts,
          total_hours: totalMinutes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (syncError) {
        console.error('❌ [DEBUG] Errore sincronizzazione user_workout_stats:', syncError);
      } else {
        console.log('✅ [DEBUG] user_workout_stats sincronizzata:', { totalWorkouts, totalMinutes });
      }
    } catch (syncError) {
      console.error('❌ [DEBUG] Errore durante sincronizzazione:', syncError);
    }

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

// Aggiorna le statistiche utente quando viene completato un allenamento
export const updateWorkoutStats = async (userId: string, workoutDuration: number) => {
  try {
    console.log('📈 [DEBUG] updateWorkoutStats: Aggiornamento statistiche per:', userId);
    
    // Controlla se esistono statistiche esistenti
    const { data: existingStats, error: fetchError } = await supabase
      .from('user_workout_stats')
      .select('total_workouts, total_hours')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [DEBUG] Errore fetch statistiche:', fetchError);
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
        console.error('❌ [DEBUG] Errore aggiornamento statistiche:', updateError);
      } else {
        console.log('✅ [DEBUG] Statistiche aggiornate:', { newTotalWorkouts, newTotalHours });
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
        console.error('❌ [DEBUG] Errore creazione statistiche:', insertError);
      } else {
        console.log('✅ [DEBUG] Nuove statistiche create:', { total_workouts: 1, total_hours: workoutDuration });
      }
    }
  } catch (error) {
    console.error('❌ [DEBUG] Errore generale updateWorkoutStats:', error);
  }
};

// Resetta le statistiche utente (per correggere duplicazioni)
export const resetWorkoutStats = async (userId: string) => {
  try {
    console.log('🔄 [DEBUG] resetWorkoutStats: Reset statistiche per:', userId);
    
    const { error } = await supabase
      .from('user_workout_stats')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [DEBUG] Errore reset statistiche:', error);
    } else {
      console.log('✅ [DEBUG] Statistiche resettate con successo');
    }
  } catch (error) {
    console.error('❌ [DEBUG] Errore generale resetWorkoutStats:', error);
  }
};
