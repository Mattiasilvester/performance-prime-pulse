-- ============================================
-- TABELLA PROFESSIONAL_SETTINGS
-- Data: 2025-01-21
-- ============================================
-- 
-- Questa migrazione crea:
-- 1. Tabella professional_settings per tutte le impostazioni del professionista
-- 2. Include: notifiche, privacy, pagamenti Stripe, area copertura estesa,
--    politiche cancellazione, link social, lingue parlate
-- 3. RLS Policies per sicurezza
-- 4. Indici per performance
-- ============================================

-- ============================================
-- TABELLA PROFESSIONAL_SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS professional_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE UNIQUE,
  
  -- ============================================
  -- NOTIFICHE (Preferences email/push)
  -- ============================================
  notify_new_booking BOOLEAN DEFAULT true,
  notify_booking_cancelled BOOLEAN DEFAULT true,
  notify_booking_reminder BOOLEAN DEFAULT true,
  notify_messages BOOLEAN DEFAULT true,
  notify_reviews BOOLEAN DEFAULT false,
  notify_weekly_summary BOOLEAN DEFAULT true,
  
  -- ============================================
  -- PRIVACY (Visibilità profilo)
  -- ============================================
  profile_public BOOLEAN DEFAULT true,
  show_reviews BOOLEAN DEFAULT true,
  show_price BOOLEAN DEFAULT true,
  allow_direct_contact BOOLEAN DEFAULT true,
  
  -- ============================================
  -- PAGAMENTI (Stripe integration)
  -- ============================================
  stripe_account_id TEXT,
  stripe_connect_enabled BOOLEAN DEFAULT false,
  stripe_payout_enabled BOOLEAN DEFAULT false,
  next_payout_date DATE,
  
  -- ============================================
  -- AREA DI COPERTURA (Estesa)
  -- ============================================
  -- modalita già esiste in professionals, ma qui aggiungiamo dettagli
  coverage_address TEXT,
  coverage_city VARCHAR(100),
  coverage_postal_code VARCHAR(20),
  coverage_country VARCHAR(100) DEFAULT 'Italia',
  coverage_latitude DECIMAL(10, 8),
  coverage_longitude DECIMAL(11, 8),
  coverage_radius_km INT DEFAULT 10 CHECK (coverage_radius_km >= 0),
  
  -- ============================================
  -- POLITICHE CANCELLAZIONE
  -- ============================================
  cancellation_min_hours INT DEFAULT 24 CHECK (cancellation_min_hours >= 0),
  cancellation_penalty_percent DECIMAL(5, 2) DEFAULT 0 CHECK (cancellation_penalty_percent >= 0 AND cancellation_penalty_percent <= 100),
  no_show_penalty_percent DECIMAL(5, 2) DEFAULT 50 CHECK (no_show_penalty_percent >= 0 AND no_show_penalty_percent <= 100),
  
  -- ============================================
  -- LINK SOCIAL
  -- ============================================
  instagram_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  facebook_url TEXT,
  website_url TEXT,
  
  -- ============================================
  -- TIMESTAMPS
  -- ============================================
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELLA PROFESSIONAL_LANGUAGES
-- ============================================
-- Per gestire le lingue parlate con livello

CREATE TABLE IF NOT EXISTS professional_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL, -- es: 'it', 'en', 'fr', 'es', 'de'
  language_name VARCHAR(50) NOT NULL, -- es: 'Italiano', 'Inglese'
  proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('madrelingua', 'fluente', 'intermedio', 'base')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Un professionista può avere la stessa lingua una sola volta
  UNIQUE(professional_id, language_code)
);

-- ============================================
-- INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_professional_settings_professional ON professional_settings(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_languages_professional ON professional_languages(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_languages_code ON professional_languages(language_code);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE professional_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_languages ENABLE ROW LEVEL SECURITY;

-- Policy: professionista gestisce solo le proprie impostazioni
CREATE POLICY "Professional manages own settings" ON professional_settings
  FOR ALL 
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Policy: pubblico può vedere alcune impostazioni pubbliche (se profile_public = true)
CREATE POLICY "Public can view public settings" ON professional_settings
  FOR SELECT 
  USING (
    profile_public = true AND
    professional_id IN (
      SELECT id FROM professionals WHERE attivo = true AND approval_status = 'approved'
    )
  );

-- Policy: professionista gestisce le proprie lingue
CREATE POLICY "Professional manages own languages" ON professional_languages
  FOR ALL 
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Policy: pubblico può vedere le lingue se il profilo è pubblico
CREATE POLICY "Public can view public languages" ON professional_languages
  FOR SELECT 
  USING (
    professional_id IN (
      SELECT ps.professional_id 
      FROM professional_settings ps
      INNER JOIN professionals p ON p.id = ps.professional_id
      WHERE ps.profile_public = true 
        AND p.attivo = true 
        AND p.approval_status = 'approved'
    )
  );

-- ============================================
-- TRIGGER PER UPDATED_AT
-- ============================================

-- Trigger per professional_settings
CREATE TRIGGER update_professional_settings_updated_at
  BEFORE UPDATE ON professional_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTI
-- ============================================

COMMENT ON TABLE professional_settings IS 'Impostazioni complete del professionista: notifiche, privacy, pagamenti, area copertura, politiche cancellazione, link social';
COMMENT ON COLUMN professional_settings.stripe_account_id IS 'ID account Stripe Connect';
COMMENT ON COLUMN professional_settings.coverage_latitude IS 'Latitudine indirizzo base (per calcolo distanza)';
COMMENT ON COLUMN professional_settings.coverage_longitude IS 'Longitudine indirizzo base (per calcolo distanza)';
COMMENT ON COLUMN professional_settings.coverage_radius_km IS 'Raggio di copertura in km per servizi in presenza';
COMMENT ON COLUMN professional_settings.cancellation_min_hours IS 'Preavviso minimo in ore per cancellazione senza penale';
COMMENT ON COLUMN professional_settings.cancellation_penalty_percent IS 'Percentuale penale per cancellazione tardiva (0-100)';
COMMENT ON COLUMN professional_settings.no_show_penalty_percent IS 'Percentuale penale per no-show (0-100)';

COMMENT ON TABLE professional_languages IS 'Lingue parlate dal professionista con livello di competenza';
COMMENT ON COLUMN professional_languages.language_code IS 'Codice lingua ISO (es: it, en, fr)';
COMMENT ON COLUMN professional_languages.language_name IS 'Nome completo lingua (es: Italiano, Inglese)';
COMMENT ON COLUMN professional_languages.proficiency_level IS 'Livello: madrelingua, fluente, intermedio, base';

-- ============================================
-- INSERIMENTO RECORD INIZIALE PER PROFESSIONISTI ESISTENTI
-- ============================================
-- Crea un record di impostazioni di default per ogni professionista esistente
-- che non ha ancora un record in professional_settings

INSERT INTO professional_settings (professional_id)
SELECT id 
FROM professionals
WHERE id NOT IN (SELECT professional_id FROM professional_settings WHERE professional_id IS NOT NULL)
ON CONFLICT (professional_id) DO NOTHING;

