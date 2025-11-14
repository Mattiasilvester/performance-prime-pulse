-- ============================================
-- MIGRATION COMPLETA: Colonne Attrezzi
-- ============================================
-- Data: 2025-11-14
-- Descrizione: Aggiunge colonne per sistema attrezzi completo
--   - possiede_attrezzatura (BOOLEAN)
--   - attrezzi (TEXT[])
--   - altri_attrezzi (TEXT)
-- 
-- SICURO: Verifica esistenza colonne prima di aggiungere
-- ============================================

-- ============================================
-- TABELLA: user_onboarding_responses
-- ============================================

-- 1. Aggiungi possiede_attrezzatura se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_onboarding_responses' 
        AND column_name = 'possiede_attrezzatura'
    ) THEN
        ALTER TABLE user_onboarding_responses 
        ADD COLUMN possiede_attrezzatura BOOLEAN DEFAULT NULL;
        
        COMMENT ON COLUMN user_onboarding_responses.possiede_attrezzatura IS 
          'Possiede attrezzatura per allenamento (true/false/null). NULL quando non applicabile (solo Palestra)';
        
        RAISE NOTICE 'Colonna possiede_attrezzatura aggiunta a user_onboarding_responses';
    ELSE
        RAISE NOTICE 'Colonna possiede_attrezzatura già esistente in user_onboarding_responses';
    END IF;
END $$;

-- 2. Aggiungi attrezzi se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_onboarding_responses' 
        AND column_name = 'attrezzi'
    ) THEN
        ALTER TABLE user_onboarding_responses 
        ADD COLUMN attrezzi TEXT[] DEFAULT ARRAY[]::TEXT[];
        
        COMMENT ON COLUMN user_onboarding_responses.attrezzi IS 
          'Array attrezzi posseduti: manubri, bilanciere, kettlebell, elastici, panca, altro';
        
        RAISE NOTICE 'Colonna attrezzi aggiunta a user_onboarding_responses';
    ELSE
        RAISE NOTICE 'Colonna attrezzi già esistente in user_onboarding_responses';
    END IF;
END $$;

-- 3. Aggiungi altri_attrezzi se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_onboarding_responses' 
        AND column_name = 'altri_attrezzi'
    ) THEN
        ALTER TABLE user_onboarding_responses 
        ADD COLUMN altri_attrezzi TEXT DEFAULT NULL;
        
        COMMENT ON COLUMN user_onboarding_responses.altri_attrezzi IS 
          'Attrezzi custom inseriti dall''utente quando seleziona "Altro"';
        
        RAISE NOTICE 'Colonna altri_attrezzi aggiunta a user_onboarding_responses';
    ELSE
        RAISE NOTICE 'Colonna altri_attrezzi già esistente in user_onboarding_responses';
    END IF;
END $$;

-- ============================================
-- TABELLA: onboarding_preferenze (se esiste)
-- ============================================

-- 1. Aggiungi possiede_attrezzatura se tabella esiste
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'onboarding_preferenze'
    ) THEN
        -- Aggiungi possiede_attrezzatura
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'onboarding_preferenze' 
            AND column_name = 'possiede_attrezzatura'
        ) THEN
            ALTER TABLE onboarding_preferenze
            ADD COLUMN possiede_attrezzatura BOOLEAN DEFAULT NULL;
            RAISE NOTICE 'Colonna possiede_attrezzatura aggiunta a onboarding_preferenze';
        END IF;
        
        -- Aggiungi attrezzi
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'onboarding_preferenze' 
            AND column_name = 'attrezzi'
        ) THEN
            ALTER TABLE onboarding_preferenze
            ADD COLUMN attrezzi TEXT[] DEFAULT ARRAY[]::TEXT[];
            RAISE NOTICE 'Colonna attrezzi aggiunta a onboarding_preferenze';
        END IF;
        
        -- Aggiungi altri_attrezzi
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'onboarding_preferenze' 
            AND column_name = 'altri_attrezzi'
        ) THEN
            ALTER TABLE onboarding_preferenze
            ADD COLUMN altri_attrezzi TEXT DEFAULT NULL;
            RAISE NOTICE 'Colonna altri_attrezzi aggiunta a onboarding_preferenze';
        END IF;
    ELSE
        RAISE NOTICE 'Tabella onboarding_preferenze non esiste, skip';
    END IF;
END $$;

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

-- ============================================
-- VERIFICA FINALE
-- ============================================

DO $$
DECLARE
    col_count INTEGER;
BEGIN
    -- Conta colonne attrezzi in user_onboarding_responses
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_onboarding_responses'
    AND column_name IN ('possiede_attrezzatura', 'attrezzi', 'altri_attrezzi');
    
    IF col_count = 3 THEN
        RAISE NOTICE '✅ SUCCESSO: Tutte e 3 le colonne esistono in user_onboarding_responses';
    ELSE
        RAISE WARNING '⚠️ ATTENZIONE: Solo % colonne trovate su 3 in user_onboarding_responses', col_count;
    END IF;
END $$;

