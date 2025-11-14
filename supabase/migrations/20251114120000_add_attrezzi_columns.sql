-- ============================================
-- AGGIUNTA COLONNE: attrezzi e altri_attrezzi
-- ============================================
-- Feature: Selezione multipla attrezzi con campo "Altro" custom
-- Visibile quando utente risponde "Sì" a "Possiedi attrezzatura?"

-- Aggiungi colonne alla tabella unificata
ALTER TABLE user_onboarding_responses
ADD COLUMN IF NOT EXISTS attrezzi TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS altri_attrezzi TEXT DEFAULT NULL;

-- Aggiungi colonne alla tabella vecchia (se esiste)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_preferenze') THEN
    ALTER TABLE onboarding_preferenze
    ADD COLUMN IF NOT EXISTS attrezzi TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS altri_attrezzi TEXT DEFAULT NULL;
  END IF;
END $$;

-- Commenti documentazione
COMMENT ON COLUMN user_onboarding_responses.attrezzi IS 
  'Array attrezzi posseduti: manubri, bilanciere, kettlebell, elastici, panca, altro';
COMMENT ON COLUMN user_onboarding_responses.altri_attrezzi IS 
  'Attrezzi custom inseriti dall\'utente quando seleziona "Altro"';

-- ============================================
-- AGGIORNA FUNZIONE MIGRAZIONE DATI ESISTENTI
-- ============================================

CREATE OR REPLACE FUNCTION migrate_existing_onboarding_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserisce dati dalle 4 tabelle esistenti nella nuova tabella unificata
  INSERT INTO user_onboarding_responses (
    user_id,
    obiettivo,
    livello_esperienza,
    giorni_settimana,
    luoghi_allenamento,
    tempo_sessione,
    possiede_attrezzatura,
    attrezzi,
    altri_attrezzi,
    nome,
    eta,
    peso,
    altezza,
    consigli_nutrizionali,
    created_at,
    onboarding_completed_at
  )
  SELECT DISTINCT ON (ob.user_id)
    ob.user_id,
    ob.obiettivo,
    es.livello_esperienza,
    es.giorni_settimana,
    pr.luoghi_allenamento,
    pr.tempo_sessione,
    pr.possiede_attrezzatura,
    pr.attrezzi,
    pr.altri_attrezzi,
    pe.nome,
    pe.eta,
    pe.peso,
    pe.altezza,
    pe.consigli_nutrizionali,
    LEAST(
      COALESCE(ob.created_at, NOW()),
      COALESCE(es.created_at, NOW()),
      COALESCE(pr.created_at, NOW()),
      COALESCE(pe.created_at, NOW())
    ) as created_at,
    GREATEST(
      COALESCE(ob.updated_at, ob.created_at, NOW()),
      COALESCE(es.updated_at, es.created_at, NOW()),
      COALESCE(pr.updated_at, pr.created_at, NOW()),
      COALESCE(pe.updated_at, pe.created_at, NOW())
    ) as onboarding_completed_at
  FROM onboarding_obiettivo_principale ob
  LEFT JOIN onboarding_esperienza es ON ob.user_id = es.user_id
  LEFT JOIN onboarding_preferenze pr ON ob.user_id = pr.user_id
  LEFT JOIN onboarding_personalizzazione pe ON ob.user_id = pe.user_id
  WHERE ob.user_id IS NOT NULL
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Migrazione completata con successo';
END;
$$;

