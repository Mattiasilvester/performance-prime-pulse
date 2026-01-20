-- ============================================
-- AGGIUNTA COLONNA CANCELLATION_POLICY_ENABLED
-- Data: 2025-01-22
-- ============================================
-- 
-- Questa migrazione aggiunge la colonna cancellation_policy_enabled
-- alla tabella professional_settings per permettere al professionista
-- di attivare/disattivare le politiche di cancellazione
-- ============================================

-- Verifica se la tabella esiste
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professional_settings') THEN
        -- Aggiungi colonna cancellation_policy_enabled se non esiste
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'cancellation_policy_enabled'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN cancellation_policy_enabled BOOLEAN DEFAULT false;
            
            RAISE NOTICE 'Colonna cancellation_policy_enabled aggiunta a professional_settings';
        ELSE
            RAISE NOTICE 'Colonna cancellation_policy_enabled già esistente in professional_settings';
        END IF;
    ELSE
        RAISE NOTICE 'Tabella professional_settings non trovata. Esegui prima la migrazione principale.';
    END IF;
END $$;

-- Commento sulla colonna
COMMENT ON COLUMN professional_settings.cancellation_policy_enabled IS 'Indica se le politiche di cancellazione sono attive o disattive per il professionista (default: false)';
