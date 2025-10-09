-- =====================================================
-- FIX USER_WORKOUT_STATS - AGGIORNA STATISTICHE
-- =====================================================
-- Forza l'aggiornamento delle statistiche per sincronizzare con custom_workouts

-- 1. Calcola statistiche corrette da custom_workouts
WITH correct_stats AS (
  SELECT 
    user_id,
    COUNT(*) as total_workouts,
    SUM(total_duration) as total_minutes
  FROM custom_workouts 
  WHERE completed = true
  GROUP BY user_id
)

-- 2. Aggiorna user_workout_stats con i valori corretti
UPDATE user_workout_stats 
SET 
  total_workouts = correct_stats.total_workouts,
  total_hours = correct_stats.total_minutes,
  updated_at = now()
FROM correct_stats
WHERE user_workout_stats.user_id = correct_stats.user_id;

-- 3. Verifica il risultato
SELECT 
  'STATISTICHE AGGIORNATE' as sezione,
  user_id,
  total_workouts,
  total_hours,
  updated_at
FROM user_workout_stats
ORDER BY updated_at DESC;
