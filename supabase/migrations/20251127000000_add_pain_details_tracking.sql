-- =====================================================
-- MIGRAZIONE: Sistema Dolori Dettagliato per PrimeBot
-- Data: 27 Novembre 2025
-- Descrizione: Aggiunge colonna JSONB per tracciare dolori con date e dettagli
-- =====================================================

-- Aggiungi nuova colonna per dolori dettagliati
ALTER TABLE user_onboarding_responses
ADD COLUMN IF NOT EXISTS zone_dolori_dettagli JSONB DEFAULT '[]'::jsonb;

-- Commento descrittivo
COMMENT ON COLUMN user_onboarding_responses.zone_dolori_dettagli IS 
'Array JSON con dettagli dolori: [{zona, aggiunto_il, descrizione, fonte}]. Fonte può essere "onboarding" o "chat".';

-- Migra dati esistenti da zone_evitare a zone_dolori_dettagli (se zone_evitare ha valori)
UPDATE user_onboarding_responses
SET zone_dolori_dettagli = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'zona', zona,
        'aggiunto_il', COALESCE(limitazioni_compilato_at, created_at)::date::text,
        'descrizione', limitazioni_fisiche,
        'fonte', 'onboarding'
      )
    ),
    '[]'::jsonb
  )
  FROM unnest(zone_evitare) AS zona
)
WHERE zone_evitare IS NOT NULL 
  AND array_length(zone_evitare, 1) > 0
  AND (zone_dolori_dettagli IS NULL OR zone_dolori_dettagli = '[]'::jsonb);

-- Index per query veloci
CREATE INDEX IF NOT EXISTS idx_user_onboarding_dolori_dettagli 
ON user_onboarding_responses USING GIN (zone_dolori_dettagli);

