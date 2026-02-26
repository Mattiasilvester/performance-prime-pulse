/**
 * Servizio per aggiornare manualmente le metriche workout
 * Usato quando si completa un workout con INSERT (invece di UPDATE)
 * perché il trigger DB si attiva solo su UPDATE
 */

import { supabase } from '@/integrations/supabase/client';

export async function updateWorkoutMetrics(userId: string, workoutDuration: number): Promise<void> {
  try {
    console.log('📊 Aggiornamento metriche workout:', { userId, workoutDuration });
    
    // Incrementa statistiche utente
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_workout_stats')
      .select('total_workouts, total_hours')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('❌ Errore lettura stats attuali:', fetchError);
      throw fetchError;
    }
    
    if (currentStats) {
      // Utente ha già statistiche - aggiorna
      const { error: updateError } = await supabase
        .from('user_workout_stats')
        .update({
          total_workouts: (currentStats.total_workouts || 0) + 1,
          total_hours: (currentStats.total_hours || 0) + workoutDuration,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('❌ Errore aggiornamento stats:', updateError);
        throw updateError;
      }
      
      console.log('✅ Statistiche aggiornate:', {
        total_workouts: currentStats.total_workouts + 1,
        total_hours: currentStats.total_hours + workoutDuration
      });
    } else {
      // Prima volta - crea record
      const { error: insertError } = await supabase
        .from('user_workout_stats')
        .insert({
          user_id: userId,
          total_workouts: 1,
          total_hours: workoutDuration,
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Errore creazione stats:', insertError);
        throw insertError;
      }
      
      console.log('✅ Statistiche create:', {
        total_workouts: 1,
        total_hours: workoutDuration
      });
    }
  } catch (error) {
    console.error('❌ Errore updateWorkoutMetrics:', error);
    // Non bloccare il flusso - le metriche si aggiorneranno comunque al prossimo refresh
  }
}





