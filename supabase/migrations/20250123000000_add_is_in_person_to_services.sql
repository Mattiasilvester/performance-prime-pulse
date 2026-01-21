-- ============================================
-- AGGIUNTA COLONNA is_in_person A PROFESSIONAL_SERVICES
-- Data: 2025-01-23
-- ============================================
-- 
-- Questa migrazione aggiunge la colonna is_in_person
-- per permettere servizi che possono essere sia in presenza che online
-- ============================================

-- Verifica se la tabella esiste
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professional_services') THEN
        -- Aggiungi colonna is_in_person se non esiste
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_services' 
            AND column_name = 'is_in_person'
        ) THEN
            ALTER TABLE professional_services 
            ADD COLUMN is_in_person BOOLEAN DEFAULT TRUE;
            
            -- Imposta is_in_person = true per tutti i servizi esistenti dove is_online = false
            -- e is_in_person = false per quelli dove is_online = true (solo online)
            UPDATE professional_services
            SET is_in_person = CASE 
                WHEN is_online = false THEN true 
                ELSE false 
            END;
            
            RAISE NOTICE 'Colonna is_in_person aggiunta a professional_services';
        ELSE
            RAISE NOTICE 'Colonna is_in_person già esistente in professional_services';
        END IF;
    ELSE
        RAISE NOTICE 'Tabella professional_services non trovata. Esegui prima la migrazione principale.';
    END IF;
END $$;

-- Commento sulla colonna
COMMENT ON COLUMN professional_services.is_in_person IS 'Indica se il servizio è disponibile in presenza. Può essere true insieme a is_online per servizi disponibili in entrambe le modalità.';
