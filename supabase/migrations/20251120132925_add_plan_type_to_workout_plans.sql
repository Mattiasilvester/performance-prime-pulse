-- ==========================================
-- MIGRATION: Aggiunge campo plan_type a workout_plans
-- Data: 2025-11-20
-- Descrizione: Aggiunge campo plan_type per distinguere piani giornalieri (daily) da settimanali (weekly)
-- ==========================================

-- Aggiunge campo plan_type per distinguere piani giornalieri da settimanali
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS plan_type TEXT 
CHECK (plan_type IN ('daily', 'weekly')) 
DEFAULT 'weekly';

-- Aggiorna piani esistenti (tutti sono settimanali per default)
UPDATE workout_plans 
SET plan_type = 'weekly' 
WHERE plan_type IS NULL;

-- Commento per documentazione
COMMENT ON COLUMN workout_plans.plan_type IS 'Tipo di piano: daily (workout singolo) o weekly (piano multi-settimana)';

-- ==========================================
-- MIGRATION COMPLETATA
-- ==========================================


