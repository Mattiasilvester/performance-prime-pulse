-- ==========================================
-- MIGRATION: Aggiunge colonna status a workout_plans
-- Data: 2025-01-16
-- Descrizione: Aggiunge colonna status per gestire 3 stati del piano: pending (da fare), active (attivo), completed (completato)
-- ==========================================

-- Add status column to workout_plans table
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed'));

-- Add index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_workout_plans_status ON workout_plans(status);

-- Add composite index for user + status queries
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_status ON workout_plans(user_id, status);

-- Add comment for documentation
COMMENT ON COLUMN workout_plans.status IS 'Status of the workout plan: pending (default/da fare), active (in progress/attivo), completed (finished/completato)';

-- ==========================================
-- MIGRATION COMPLETATA
-- ==========================================

