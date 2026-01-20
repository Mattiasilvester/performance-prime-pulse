-- ============================================
-- AGGIUNTA COLONNE TIKTOK E FACEBOOK
-- Query diretta da eseguire nel SQL Editor di Supabase
-- ============================================

-- Aggiungi colonna tiktok_url
ALTER TABLE professional_settings 
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Aggiungi colonna facebook_url
ALTER TABLE professional_settings 
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Verifica che siano state aggiunte
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'professional_settings'
    AND column_name IN ('tiktok_url', 'facebook_url');

