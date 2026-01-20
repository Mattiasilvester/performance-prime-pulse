-- ============================================
-- VERIFICA COLONNE TIKTOK E FACEBOOK
-- Query per verificare se le colonne sono state aggiunte
-- ============================================

-- Verifica esistenza colonne in professional_settings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'professional_settings'
    AND column_name IN ('tiktok_url', 'facebook_url')
ORDER BY column_name;

-- Verifica completa di tutte le colonne social
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'professional_settings'
    AND column_name LIKE '%_url'
ORDER BY column_name;

-- Conteggio colonne social trovate (dovrebbe essere 6: instagram, linkedin, youtube, tiktok, facebook, website)
SELECT 
    COUNT(*) as total_social_columns
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'professional_settings'
    AND column_name LIKE '%_url';

