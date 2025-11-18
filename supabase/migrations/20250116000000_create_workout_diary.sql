-- ==========================================
-- MIGRATION: Diario Allenamenti
-- Data: 2025-01-16
-- Descrizione: Crea tabella workout_diary e estende user_workout_stats con colonne streak
-- ==========================================

-- ==========================================
-- 1. TABELLA workout_diary
-- ==========================================
-- Salva allenamenti nel diario (salvati o completati)
-- Supporta workout da custom_workouts, workout_plans o quick workout

CREATE TABLE IF NOT EXISTS public.workout_diary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Riferimento workout originale
  workout_id UUID, -- Può essere NULL per workout custom senza ID
  workout_source TEXT CHECK (workout_source IN ('custom_workouts', 'workout_plans', 'quick')) NOT NULL,
  workout_name TEXT NOT NULL,
  workout_type TEXT, -- 'forza', 'cardio', 'hiit', 'mobilita'
  
  -- Status allenamento
  status TEXT CHECK (status IN ('saved', 'completed')) NOT NULL DEFAULT 'saved',
  
  -- Dati allenamento
  duration_minutes INT,
  exercises_count INT,
  exercises JSONB DEFAULT '[]'::jsonb, -- Array esercizi eseguiti con dettagli
  
  -- Timestamp
  completed_at TIMESTAMPTZ,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Extra
  notes TEXT,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array URL foto Supabase Storage
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. INDICI per performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_workout_diary_user_id ON public.workout_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_diary_status ON public.workout_diary(status);
CREATE INDEX IF NOT EXISTS idx_workout_diary_completed_at ON public.workout_diary(completed_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_workout_diary_saved_at ON public.workout_diary(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_diary_user_status ON public.workout_diary(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workout_diary_workout_source ON public.workout_diary(workout_source);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.workout_diary ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Utenti possono vedere solo i propri entry del diario
CREATE POLICY "Users can view own diary entries"
  ON public.workout_diary
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy INSERT: Utenti possono inserire solo i propri entry
CREATE POLICY "Users can insert own diary entries"
  ON public.workout_diary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE: Utenti possono aggiornare solo i propri entry
CREATE POLICY "Users can update own diary entries"
  ON public.workout_diary
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy DELETE: Utenti possono eliminare solo i propri entry
CREATE POLICY "Users can delete own diary entries"
  ON public.workout_diary
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 4. TRIGGER updated_at
-- ==========================================
-- Funzione per aggiornare updated_at automaticamente
-- (usa quella esistente se presente, altrimenti la crea)

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per workout_diary
CREATE TRIGGER update_workout_diary_updated_at
  BEFORE UPDATE ON public.workout_diary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. ESTENDI user_workout_stats con colonne streak
-- ==========================================
-- Verifica se la tabella esiste e aggiungi colonne streak

DO $$
BEGIN
  -- Verifica se la tabella user_workout_stats esiste
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_workout_stats'
  ) THEN
    -- Aggiungi colonne streak se non esistono già
    ALTER TABLE public.user_workout_stats 
    ADD COLUMN IF NOT EXISTS current_streak_days INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS longest_streak_days INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_workout_date DATE;
    
    RAISE NOTICE 'Colonne streak aggiunte a user_workout_stats';
  ELSE
    RAISE NOTICE 'Tabella user_workout_stats non trovata, colonne streak non aggiunte';
  END IF;
END $$;

-- ==========================================
-- 6. COMMENTI per documentazione
-- ==========================================

COMMENT ON TABLE public.workout_diary IS 'Diario allenamenti: salva allenamenti salvati o completati dall''utente';
COMMENT ON COLUMN public.workout_diary.workout_source IS 'Origine workout: custom_workouts, workout_plans, o quick';
COMMENT ON COLUMN public.workout_diary.status IS 'Status: saved (salvato per dopo) o completed (completato)';
COMMENT ON COLUMN public.workout_diary.exercises IS 'Array JSONB con dettagli esercizi eseguiti';
COMMENT ON COLUMN public.workout_diary.photo_urls IS 'Array URL foto Supabase Storage per l''allenamento';
COMMENT ON COLUMN public.user_workout_stats.current_streak_days IS 'Giorni consecutivi di allenamento attuali';
COMMENT ON COLUMN public.user_workout_stats.longest_streak_days IS 'Record giorni consecutivi di allenamento';
COMMENT ON COLUMN public.user_workout_stats.last_workout_date IS 'Data ultimo allenamento completato';

-- ==========================================
-- MIGRATION COMPLETATA
-- ==========================================

