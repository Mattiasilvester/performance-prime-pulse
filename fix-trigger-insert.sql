-- =====================================================
-- FIX TRIGGER PER INSERT - SOLUZIONE PULITA
-- =====================================================
-- Modifica il trigger per attivarsi anche su INSERT, non solo UPDATE

-- =====================================================
-- 1. RIMUOVI TRIGGER ESISTENTE
-- =====================================================
DROP TRIGGER IF EXISTS update_workout_stats_trigger ON public.custom_workouts;

-- =====================================================
-- 2. MODIFICA FUNZIONE PER GESTIRE INSERT
-- =====================================================
CREATE OR REPLACE FUNCTION update_workout_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Gestisce sia INSERT che UPDATE
  -- Per INSERT: se completed = TRUE, aggiorna stats
  -- Per UPDATE: se completed cambia da FALSE a TRUE, aggiorna stats
  
  IF TG_OP = 'INSERT' AND NEW.completed = TRUE THEN
    -- Inserimento diretto di workout completato
    INSERT INTO public.user_workout_stats (user_id, total_workouts, total_hours)
    VALUES (NEW.user_id, 1, COALESCE(NEW.total_duration, 0))
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_workouts = user_workout_stats.total_workouts + 1,
      total_hours = user_workout_stats.total_hours + COALESCE(NEW.total_duration, 0),
      updated_at = now();
      
  ELSIF TG_OP = 'UPDATE' AND NEW.completed = TRUE AND OLD.completed = FALSE THEN
    -- Aggiornamento da non completato a completato
    INSERT INTO public.user_workout_stats (user_id, total_workouts, total_hours)
    VALUES (NEW.user_id, 1, COALESCE(NEW.total_duration, 0))
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_workouts = user_workout_stats.total_workouts + 1,
      total_hours = user_workout_stats.total_hours + COALESCE(NEW.total_duration, 0),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. RICREA TRIGGER PER INSERT E UPDATE
-- =====================================================
CREATE TRIGGER update_workout_stats_trigger
  AFTER INSERT OR UPDATE ON public.custom_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_stats();

-- =====================================================
-- 4. VERIFICA TRIGGER
-- =====================================================
-- Il trigger ora si attiva su:
-- - INSERT con completed = TRUE
-- - UPDATE da completed = FALSE a completed = TRUE

-- =====================================================
-- 5. TEST RAPIDO (OPZIONALE)
-- =====================================================
-- Per testare, puoi eseguire:
-- INSERT INTO custom_workouts (user_id, title, workout_type, scheduled_date, exercises, total_duration, completed)
-- VALUES ('your-user-id', 'Test', 'cardio', CURRENT_DATE, '[]', 30, true);
-- 
-- Poi verifica:
-- SELECT * FROM user_workout_stats WHERE user_id = 'your-user-id';
