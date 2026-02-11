-- Aggiunge la colonna source a landing_feedbacks se non esiste (retrocompatibilità).
-- La migrazione 20260205_landing_feedbacks.sql già definisce source; questo script
-- è per ambienti che avessero la tabella senza source.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'landing_feedbacks'
      AND column_name = 'source'
  ) THEN
    ALTER TABLE landing_feedbacks ADD COLUMN source VARCHAR(50) DEFAULT 'landing_page';
    UPDATE landing_feedbacks SET source = 'landing_page' WHERE source IS NULL;
  END IF;
END $$;
