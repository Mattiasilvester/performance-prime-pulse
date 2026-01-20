-- ============================================
-- AGGIUNTA COLONNE METODI DI PAGAMENTO
-- Data: 2025-01-22
-- ============================================
-- 
-- Questa migrazione aggiunge le colonne per i metodi di pagamento
-- accettati dal professionista nella tabella professional_settings
-- ============================================

-- Verifica se la tabella esiste
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professional_settings') THEN
        -- Aggiungi colonne per metodi di pagamento
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'accept_cash'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN accept_cash BOOLEAN DEFAULT TRUE;
            
            RAISE NOTICE 'Colonna accept_cash aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'accept_card'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN accept_card BOOLEAN DEFAULT FALSE;
            
            RAISE NOTICE 'Colonna accept_card aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'accept_bank_transfer'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN accept_bank_transfer BOOLEAN DEFAULT FALSE;
            
            RAISE NOTICE 'Colonna accept_bank_transfer aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'bank_iban'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN bank_iban VARCHAR(34);
            
            RAISE NOTICE 'Colonna bank_iban aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'bank_account_holder'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN bank_account_holder VARCHAR(200);
            
            RAISE NOTICE 'Colonna bank_account_holder aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'accept_paypal'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN accept_paypal BOOLEAN DEFAULT FALSE;
            
            RAISE NOTICE 'Colonna accept_paypal aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'paypal_email'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN paypal_email VARCHAR(255);
            
            RAISE NOTICE 'Colonna paypal_email aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'accept_satispay'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN accept_satispay BOOLEAN DEFAULT FALSE;
            
            RAISE NOTICE 'Colonna accept_satispay aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'satispay_phone'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN satispay_phone VARCHAR(20);
            
            RAISE NOTICE 'Colonna satispay_phone aggiunta a professional_settings';
        END IF;
    ELSE
        RAISE NOTICE 'Tabella professional_settings non trovata. Esegui prima la migrazione principale.';
    END IF;
END $$;

-- Commenti per documentazione
COMMENT ON COLUMN professional_settings.accept_cash IS 'Accetta pagamenti in contanti';
COMMENT ON COLUMN professional_settings.accept_card IS 'Accetta carte di credito/debito';
COMMENT ON COLUMN professional_settings.accept_bank_transfer IS 'Accetta bonifici bancari';
COMMENT ON COLUMN professional_settings.bank_iban IS 'IBAN per bonifici bancari (max 34 caratteri)';
COMMENT ON COLUMN professional_settings.bank_account_holder IS 'Intestatario del conto bancario';
COMMENT ON COLUMN professional_settings.accept_paypal IS 'Accetta pagamenti PayPal';
COMMENT ON COLUMN professional_settings.paypal_email IS 'Email PayPal per pagamenti';
COMMENT ON COLUMN professional_settings.accept_satispay IS 'Accetta pagamenti Satispay';
COMMENT ON COLUMN professional_settings.satispay_phone IS 'Numero di telefono Satispay';
