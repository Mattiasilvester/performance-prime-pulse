-- Migrazione: Aggiungi colonna cancellation_reason a professional_subscriptions
-- Data: 27 Gennaio 2025
-- Descrizione: Aggiunge colonna per salvare il motivo di cancellazione abbonamento

-- Aggiungi colonna cancellation_reason se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'professional_subscriptions' 
        AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE professional_subscriptions
        ADD COLUMN cancellation_reason TEXT NULL;
        
        COMMENT ON COLUMN professional_subscriptions.cancellation_reason IS 
        'Motivo della cancellazione abbonamento inserito dall''utente';
    END IF;
END $$;
