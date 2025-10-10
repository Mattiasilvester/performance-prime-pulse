-- Fix trigger workout stats per supportare INSERT e UPDATE
-- Problema: Il trigger originale si attivava solo su UPDATE, 
-- quindi workout completati direttamente con INSERT non aggiornavano le metriche

-- 1. DROP trigger esistente
DROP TRIGGER IF EXISTS update_workout_stats_trigger ON public.custom_workouts;

-- 2. Ricrea function con supporto INSERT e UPDATE
CREATE OR REPLACE FUNCTION update_workout_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna stats quando workout è completato
  -- Supporta sia INSERT (workout completato direttamente) che UPDATE (workout salvato poi completato)
  
  IF NEW.completed = TRUE THEN
    -- Per UPDATE: verifica che OLD.completed fosse FALSE (evita doppi conteggi)
    -- Per INSERT: OLD non esiste, quindi il check fallisce e procede comunque
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND (OLD.completed IS NULL OR OLD.completed = FALSE)) THEN
      
      -- Insert o update nella tabella user_workout_stats
      INSERT INTO public.user_workout_stats (user_id, total_workouts, total_hours, updated_at)
      VALUES (NEW.user_id, 1, COALESCE(NEW.total_duration, 0), now())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        total_workouts = user_workout_stats.total_workouts + 1,
        total_hours = user_workout_stats.total_hours + COALESCE(NEW.total_duration, 0),
        updated_at = now();
        
      -- Log per debug (opzionale)
      RAISE NOTICE 'Workout stats updated for user % (operation: %)', NEW.user_id, TG_OP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ricrea trigger con supporto INSERT e UPDATE
CREATE TRIGGER update_workout_stats_trigger
  AFTER INSERT OR UPDATE ON public.custom_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_stats();

-- Commento: Ora il trigger si attiva sia quando:
-- - INSERT di workout già completato (ActiveWorkout, QuickWorkout)
-- - UPDATE da completed=false a completed=true (CustomWorkoutDisplay)

