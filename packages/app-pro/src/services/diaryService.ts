import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types per workout_diary (da aggiornare quando types.ts sarà rigenerato)
export interface WorkoutDiary {
  id: string;
  user_id: string;
  workout_id: string | null;
  workout_source: 'custom_workouts' | 'workout_plans' | 'quick';
  workout_name: string;
  workout_type: string | null;
  status: 'saved' | 'completed';
  duration_minutes: number | null;
  exercises_count: number | null;
  exercises: unknown[]; // JSONB array
  completed_at: string | null;
  saved_at: string;
  notes: string | null;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutDiaryInsert {
  user_id?: string;
  workout_id?: string | null;
  workout_source: 'custom_workouts' | 'workout_plans' | 'quick';
  workout_name: string;
  workout_type?: string | null;
  status?: 'saved' | 'completed';
  duration_minutes?: number | null;
  exercises_count?: number | null;
  exercises?: unknown[]; // JSONB array
  completed_at?: string | null;
  saved_at?: string;
  notes?: string | null;
  photo_urls?: string[];
}

export interface WorkoutDiaryUpdate {
  workout_name?: string;
  workout_type?: string | null;
  status?: 'saved' | 'completed';
  duration_minutes?: number | null;
  exercises_count?: number | null;
  exercises?: unknown[]; // JSONB array
  completed_at?: string | null;
  notes?: string | null;
  photo_urls?: string[];
}

// Types per user_workout_stats (estesi con colonne streak)
export interface UserWorkoutStats {
  id: string;
  user_id: string;
  total_workouts: number;
  total_hours: number;
  current_streak_days?: number | null;
  longest_streak_days?: number | null;
  last_workout_date?: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// DIARIO OPERATIONS
// ==========================================

/**
 * Recupera tutti gli allenamenti del diario per l'utente corrente
 * @param status - Filtra per status ('saved' | 'completed' | null = tutti)
 * @returns Array di workout diary entries
 */
export const getDiaryEntries = async (
  status?: 'saved' | 'completed'
): Promise<WorkoutDiary[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('workout_diary')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false, nullsFirst: false })
    .order('saved_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Recupera singola entry del diario per ID
 */
export const getDiaryEntry = async (id: string): Promise<WorkoutDiary | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('workout_diary')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};

/**
 * Salva workout nel diario (status: 'saved')
 */
export const saveWorkoutToDiary = async (
  workoutData: WorkoutDiaryInsert
): Promise<WorkoutDiary> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('workout_diary')
    .insert({
      ...workoutData,
      user_id: user.id,
      status: 'saved',
      saved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

/**
 * Segna workout come completato
 */
export const completeWorkout = async (
  workoutData: WorkoutDiaryInsert
): Promise<WorkoutDiary> => {
  console.log('📥 diaryService RECEIVED:', JSON.stringify(workoutData, null, 2));
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const insertData = {
    ...workoutData,
    user_id: user.id,
    status: 'completed',
    completed_at: new Date().toISOString(),
    saved_at: new Date().toISOString(),
  };

  console.log('📤 Supabase INSERT data (before):', JSON.stringify(insertData, null, 2));

  const { data, error } = await supabase
    .from('workout_diary')
    .insert(insertData)
    .select()
    .single();

  console.log('📤 Supabase INSERT data (after):', data);
  console.log('❌ Supabase INSERT error:', error);

  if (error) throw error;

  // Aggiorna metriche
  await updateWorkoutMetrics(data);

  return data;
};

/**
 * Aggiorna entry del diario (es: note, foto)
 */
export const updateDiaryEntry = async (
  id: string,
  updates: WorkoutDiaryUpdate
): Promise<WorkoutDiary> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('workout_diary')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  // Se status cambia a 'completed', aggiorna metriche
  if (updates.status === 'completed' && !updates.completed_at) {
    const updatedEntry = { ...data, completed_at: new Date().toISOString() };
    await updateWorkoutMetrics(updatedEntry);
  }

  return data;
};

/**
 * Elimina entry dal diario
 */
export const deleteDiaryEntry = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('workout_diary')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

// ==========================================
// METRICHE OPERATIONS
// ==========================================

/**
 * Recupera metriche utente corrente
 */
export const getUserMetrics = async (): Promise<UserWorkoutStats | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_workout_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Aggiorna metriche dopo completamento workout
 */
export const updateWorkoutMetrics = async (
  workout: WorkoutDiary
): Promise<void> => {
  if (workout.status !== 'completed') return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Recupera metriche attuali
  const currentMetrics = await getUserMetrics();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Calcola streak
  let currentStreak = 1;
  let longestStreak = 1;

  if (currentMetrics) {
    currentStreak = currentMetrics.current_streak_days || 0;
    longestStreak = currentMetrics.longest_streak_days || 0;

    if (currentMetrics.last_workout_date) {
      const lastDate = new Date(currentMetrics.last_workout_date);
      lastDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        // Stesso giorno, non incrementare streak
        currentStreak = currentMetrics.current_streak_days || 1;
      } else if (diffDays === 1) {
        // Giorno consecutivo
        currentStreak = (currentMetrics.current_streak_days || 0) + 1;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else {
        // Streak interrotto
        currentStreak = 1;
      }
    } else {
      // Primo workout
      currentStreak = 1;
      longestStreak = 1;
    }
  }

  // ✅ FIX: Calcola durata in ore (da minuti) e FORZA INTEGER
  // Il database si aspetta INTEGER, non FLOAT!
  const durationMinutes = workout.duration_minutes || 0;
  const durationHoursFloat = durationMinutes / 60;
  const durationHoursInteger = Math.floor(durationHoursFloat); // Arrotonda per difetto
  
  // Se ci sono minuti residui (es: 12 minuti = 0.2 ore), aggiungi 1 ora se > 0.5
  const additionalHour = durationHoursFloat - durationHoursInteger >= 0.5 ? 1 : 0;
  const finalDurationHours = durationHoursInteger + additionalHour;

  const metricsData = {
    user_id: user.id,
    total_workouts: (currentMetrics?.total_workouts || 0) + 1,
    total_hours: (currentMetrics?.total_hours || 0) + finalDurationHours, // ✅ INTEGER garantito
    current_streak_days: currentStreak,
    longest_streak_days: Math.max(longestStreak, currentStreak),
    last_workout_date: todayStr,
  };

  console.log('📊 Updating metrics:', JSON.stringify(metricsData, null, 2));
  console.log('📊 Types check:', {
    total_workouts_type: typeof metricsData.total_workouts,
    total_workouts_value: metricsData.total_workouts,
    total_hours_type: typeof metricsData.total_hours,
    total_hours_value: metricsData.total_hours,
    current_streak_type: typeof metricsData.current_streak_days,
    current_streak_value: metricsData.current_streak_days,
    longest_streak_type: typeof metricsData.longest_streak_days,
    longest_streak_value: metricsData.longest_streak_days,
    duration_minutes_input: durationMinutes,
    duration_hours_float: durationHoursFloat,
    duration_hours_integer: durationHoursInteger,
    additional_hour: additionalHour,
    final_duration_hours: finalDurationHours,
  });

  // Upsert metriche
  const { error } = await supabase
    .from('user_workout_stats')
    .upsert(metricsData, {
      onConflict: 'user_id'
    });

  console.log('❌ Metrics upsert error:', error);

  if (error) throw error;
};

/**
 * Calcola statistiche settimanali
 */
export const getWeeklyStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('workout_diary')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('completed_at', weekAgo.toISOString());

  if (error) throw error;

  const count = data?.length || 0;
  const totalTime = data?.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) || 0;

  return { count, totalTime };
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Raggruppa entries per data
 */
export const groupEntriesByDate = (entries: WorkoutDiary[]) => {
  const groups: { [key: string]: WorkoutDiary[] } = {};

  entries.forEach((entry) => {
    const date = entry.completed_at || entry.saved_at;
    const dateStr = new Date(date).toISOString().split('T')[0];

    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(entry);
  });

  return groups;
};

/**
 * Formatta durata in ore:minuti
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

/**
 * Formatta data in formato italiano
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatta data breve (GG/MM/AAAA)
 */
export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

