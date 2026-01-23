-- =============================================
-- AGGIUNGI COLONNA notify_push A PROFESSIONAL_SETTINGS
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Aggiunge colonna per preferenza notifiche push
--              Default: false (l'utente deve attivare esplicitamente)
-- =============================================

-- Aggiungi colonna notify_push
ALTER TABLE professional_settings
  ADD COLUMN IF NOT EXISTS notify_push BOOLEAN DEFAULT false;

-- Commento per documentazione
COMMENT ON COLUMN professional_settings.notify_push IS 
  'Preferenza per notifiche push browser. Default: false (l''utente deve attivare esplicitamente).';
