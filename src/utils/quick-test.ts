// Test rapido per verificare Supabase
import { supabase } from '@/integrations/supabase/client';

export async function quickSupabaseTest() {
  console.log('🔍 TEST RAPIDO SUPABASE');
  console.log('========================');
  
  try {
    // Test 1: Connessione base
    console.log('1️⃣ Test connessione...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Errore connessione:', error);
      return false;
    }
    console.log('✅ Connessione OK');
    
    // Test 2: Accesso tabella profiles
    console.log('2️⃣ Test tabella profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Errore profiles:', profilesError);
      return false;
    }
    console.log('✅ Tabella profiles accessibile');
    
    // Test 3: Accesso tabella custom_workouts
    console.log('3️⃣ Test tabella custom_workouts...');
    const { data: workouts, error: workoutsError } = await supabase
      .from('custom_workouts')
      .select('id')
      .limit(1);
    
    if (workoutsError) {
      console.error('❌ Errore custom_workouts:', workoutsError);
      return false;
    }
    console.log('✅ Tabella custom_workouts accessibile');
    
    // Test 4: Accesso tabella user_workout_stats
    console.log('4️⃣ Test tabella user_workout_stats...');
    const { data: stats, error: statsError } = await supabase
      .from('user_workout_stats')
      .select('id')
      .limit(1);
    
    if (statsError) {
      console.error('❌ Errore user_workout_stats:', statsError);
      return false;
    }
    console.log('✅ Tabella user_workout_stats accessibile');
    
    console.log('🎉 TUTTI I TEST SUPABASE PASSATI!');
    return true;
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
    return false;
  }
}

// Auto-esegui in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    quickSupabaseTest();
  }, 2000);
}
