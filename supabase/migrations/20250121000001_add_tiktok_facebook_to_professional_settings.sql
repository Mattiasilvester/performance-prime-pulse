-- ============================================
-- AGGIUNTA COLONNE TIKTOK E FACEBOOK
-- Data: 2025-01-21
-- ============================================
-- 
-- Questa migrazione aggiunge le colonne tiktok_url e facebook_url
-- alla tabella professional_settings per supportare più piattaforme social
-- ============================================

-- Verifica se la tabella esiste
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professional_settings') THEN
        -- Aggiungi colonna tiktok_url se non esiste
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'tiktok_url'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN tiktok_url TEXT;
            
            RAISE NOTICE 'Colonna tiktok_url aggiunta a professional_settings';
        ELSE
            RAISE NOTICE 'Colonna tiktok_url già esistente in professional_settings';
        END IF;

        -- Aggiungi colonna facebook_url se non esiste
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'facebook_url'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN facebook_url TEXT;
            
            RAISE NOTICE 'Colonna facebook_url aggiunta a professional_settings';
        ELSE
            RAISE NOTICE 'Colonna facebook_url già esistente in professional_settings';
        END IF;
    ELSE
        RAISE NOTICE 'Tabella professional_settings non trovata. Esegui prima la migrazione principale.';
    END IF;
END $$;

-- Commenti sulle colonne
COMMENT ON COLUMN professional_settings.tiktok_url IS 'URL o handle TikTok del professionista (es: @username)';
COMMENT ON COLUMN professional_settings.facebook_url IS 'URL pagina Facebook del professionista';

