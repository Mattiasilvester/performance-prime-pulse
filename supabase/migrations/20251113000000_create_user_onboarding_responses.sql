-- ============================================
-- TABELLA UNIFICATA RISPOSTE ONBOARDING
-- ============================================

CREATE TABLE IF NOT EXISTS user_onboarding_responses (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 1: Obiettivo
  obiettivo TEXT CHECK (obiettivo IN ('massa', 'dimagrire', 'resistenza', 'tonificare')),
  
  -- Step 2: Esperienza
  livello_esperienza TEXT CHECK (livello_esperienza IN ('principiante', 'intermedio', 'avanzato')),
  giorni_settimana INTEGER CHECK (giorni_settimana >= 1 AND giorni_settimana <= 7),
  
  -- Step 3: Preferenze
  luoghi_allenamento TEXT[] DEFAULT ARRAY[]::TEXT[],
  tempo_sessione INTEGER CHECK (tempo_sessione IN (15, 30, 45, 60)),
  
  -- Step 4: Personalizzazione
  nome TEXT,
  eta INTEGER CHECK (eta >= 1 AND eta <= 150),
  peso INTEGER CHECK (peso >= 1 AND peso <= 500),
  altezza INTEGER CHECK (altezza >= 50 AND altezza <= 250),
  consigli_nutrizionali BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_onboarding_responses_user_id 
  ON user_onboarding_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_responses_completed 
  ON user_onboarding_responses(onboarding_completed_at) 
  WHERE onboarding_completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_onboarding_responses_modified
  ON user_onboarding_responses(last_modified_at DESC);

-- ============================================
-- RLS POLICIES (SICUREZZA)
-- ============================================

ALTER TABLE user_onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Utenti possono vedere solo i propri dati
CREATE POLICY "Users can view their own onboarding responses"
  ON user_onboarding_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Utenti possono aggiornare solo i propri dati
CREATE POLICY "Users can update their own onboarding responses"
  ON user_onboarding_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Utenti possono inserire solo i propri dati
CREATE POLICY "Users can insert their own onboarding responses"
  ON user_onboarding_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Utenti possono eliminare solo i propri dati (per testing)
CREATE POLICY "Users can delete their own onboarding responses"
  ON user_onboarding_responses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNZIONE: Migrazione Dati Esistenti
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

-- Esegui migrazione dati esistenti
SELECT migrate_existing_onboarding_data();

-- ============================================
-- TRIGGER: Aggiorna last_modified_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_onboarding_modified_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_modified_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_onboarding_modified
  BEFORE UPDATE ON user_onboarding_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_modified_timestamp();

-- ============================================
-- COMMENTI DOCUMENTAZIONE
-- ============================================

COMMENT ON TABLE user_onboarding_responses IS 'Tabella unificata per risposte onboarding utenti';
COMMENT ON COLUMN user_onboarding_responses.obiettivo IS 'Obiettivo allenamento: massa, dimagrire, resistenza, tonificare';
COMMENT ON COLUMN user_onboarding_responses.livello_esperienza IS 'Livello: principiante, intermedio, avanzato';
COMMENT ON COLUMN user_onboarding_responses.luoghi_allenamento IS 'Array luoghi: casa, palestra, outdoor';
COMMENT ON COLUMN user_onboarding_responses.tempo_sessione IS 'Durata sessione in minuti: 15, 30, 45, 60';
COMMENT ON COLUMN user_onboarding_responses.onboarding_completed_at IS 'Timestamp completamento onboarding';
COMMENT ON COLUMN user_onboarding_responses.last_modified_at IS 'Timestamp ultima modifica (auto-aggiornato)';

