-- ============================================
-- MIGRAZIONE: Limitazioni Fisiche e Salute
-- Data: 2025-01-16
-- Descrizione: Aggiunge campi per limitazioni fisiche, condizioni mediche e allergie
-- ============================================

-- ============================================
-- 1. AGGIUNTA COLONNE A user_onboarding_responses
-- ============================================

ALTER TABLE user_onboarding_responses
ADD COLUMN IF NOT EXISTS ha_limitazioni BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS limitazioni_fisiche TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS zone_evitare TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS condizioni_mediche TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allergie_alimentari TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS limitazioni_compilato_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- 2. COMMENTI DOCUMENTAZIONE
-- ============================================

COMMENT ON COLUMN user_onboarding_responses.ha_limitazioni IS 
  'Flag limitazioni fisiche: NULL = mai chiesto, true = ha limitazioni, false = nessuna limitazione';

COMMENT ON COLUMN user_onboarding_responses.limitazioni_fisiche IS 
  'Descrizione libera limitazioni fisiche (es: "mal di schiena cronico", "ginocchio operato nel 2020")';

COMMENT ON COLUMN user_onboarding_responses.zone_evitare IS 
  'Array zone del corpo da evitare negli esercizi (es: ARRAY[''schiena'', ''ginocchia'', ''spalle''])';

COMMENT ON COLUMN user_onboarding_responses.condizioni_mediche IS 
  'Condizioni mediche che influenzano allenamento (campo sensibile, opzionale)';

COMMENT ON COLUMN user_onboarding_responses.allergie_alimentari IS 
  'Array allergie alimentari per futuri consigli nutrizione (es: ARRAY[''glutine'', ''lattosio'', ''noci''])';

COMMENT ON COLUMN user_onboarding_responses.limitazioni_compilato_at IS 
  'Timestamp quando utente ha compilato sezione limitazioni fisiche';

-- ============================================
-- 3. TABELLA AUDIT DISCLAIMER SALUTE
-- ============================================

CREATE TABLE IF NOT EXISTS health_disclaimer_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disclaimer_type TEXT NOT NULL CHECK (disclaimer_type IN ('workout_plan', 'onboarding', 'primebot_question')),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_health_disclaimer_user_id 
  ON health_disclaimer_acknowledgments(user_id);

CREATE INDEX IF NOT EXISTS idx_health_disclaimer_type 
  ON health_disclaimer_acknowledgments(disclaimer_type);

CREATE INDEX IF NOT EXISTS idx_health_disclaimer_acknowledged 
  ON health_disclaimer_acknowledgments(acknowledged) 
  WHERE acknowledged = true;

CREATE INDEX IF NOT EXISTS idx_user_onboarding_limitazioni_compilato 
  ON user_onboarding_responses(limitazioni_compilato_at) 
  WHERE limitazioni_compilato_at IS NOT NULL;

-- ============================================
-- 5. RLS POLICIES (SICUREZZA)
-- ============================================

ALTER TABLE health_disclaimer_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Policy: Utenti possono vedere solo i propri record
CREATE POLICY "Users can view own acknowledgments" 
  ON health_disclaimer_acknowledgments FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Utenti possono inserire solo i propri record
CREATE POLICY "Users can insert own acknowledgments" 
  ON health_disclaimer_acknowledgments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Utenti possono aggiornare solo i propri record
CREATE POLICY "Users can update own acknowledgments" 
  ON health_disclaimer_acknowledgments FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- 6. TRIGGER: Aggiorna limitazioni_compilato_at
-- ============================================

CREATE OR REPLACE FUNCTION update_limitazioni_compilato_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Aggiorna timestamp solo se uno dei campi limitazioni viene popolato per la prima volta
  IF NEW.ha_limitazioni IS NOT NULL AND OLD.ha_limitazioni IS NULL THEN
    NEW.limitazioni_compilato_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_limitazioni_compilato
  BEFORE UPDATE ON user_onboarding_responses
  FOR EACH ROW
  WHEN (
    NEW.ha_limitazioni IS DISTINCT FROM OLD.ha_limitazioni OR
    NEW.limitazioni_fisiche IS DISTINCT FROM OLD.limitazioni_fisiche OR
    NEW.zone_evitare IS DISTINCT FROM OLD.zone_evitare
  )
  EXECUTE FUNCTION update_limitazioni_compilato_timestamp();

-- Trigger anche per INSERT
CREATE TRIGGER trigger_insert_limitazioni_compilato
  BEFORE INSERT ON user_onboarding_responses
  FOR EACH ROW
  WHEN (NEW.ha_limitazioni IS NOT NULL)
  EXECUTE FUNCTION update_limitazioni_compilato_timestamp();

-- ============================================
-- 7. COMMENTI TABELLA AUDIT
-- ============================================

COMMENT ON TABLE health_disclaimer_acknowledgments IS 
  'Tabella audit per tracciare accettazione disclaimer salute da parte degli utenti';

COMMENT ON COLUMN health_disclaimer_acknowledgments.disclaimer_type IS 
  'Tipo disclaimer: workout_plan (generazione piano), onboarding (step onboarding), primebot_question (domanda PrimeBot)';

COMMENT ON COLUMN health_disclaimer_acknowledgments.acknowledged IS 
  'Flag accettazione disclaimer (true = accettato, false = non accettato)';

COMMENT ON COLUMN health_disclaimer_acknowledgments.acknowledged_at IS 
  'Timestamp accettazione disclaimer';

COMMENT ON COLUMN health_disclaimer_acknowledgments.context IS 
  'Contesto aggiuntivo JSONB (es: {"plan_id": "...", "limitazioni": ["schiena"], "workout_type": "forza"})';

-- ============================================
-- 8. FUNZIONE HELPER: Verifica se utente ha limitazioni
-- ============================================

CREATE OR REPLACE FUNCTION user_has_limitations(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_lim BOOLEAN;
BEGIN
  SELECT ha_limitazioni INTO has_lim
  FROM user_onboarding_responses
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(has_lim, false);
END;
$$;

-- ============================================
-- 9. FUNZIONE HELPER: Ottieni zone da evitare
-- ============================================

CREATE OR REPLACE FUNCTION get_user_zones_to_avoid(user_uuid UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  zones TEXT[];
BEGIN
  SELECT zone_evitare INTO zones
  FROM user_onboarding_responses
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(zones, ARRAY[]::TEXT[]);
END;
$$;

