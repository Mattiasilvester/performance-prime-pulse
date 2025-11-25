-- ==========================================
-- MIGRATION: Aggiunge colonna description a workout_plans
-- Data: 2025-01-16
-- Descrizione: Aggiunge colonna description per permettere agli utenti di aggiungere una descrizione al piano personalizzato
-- ==========================================

-- Add description column to workout_plans table
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment
COMMENT ON COLUMN workout_plans.description IS 'User-provided description of the workout plan';

-- ==========================================
-- MIGRATION COMPLETATA
-- ==========================================

