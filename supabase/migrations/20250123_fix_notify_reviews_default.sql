-- =============================================
-- FIX DEFAULT notify_reviews A true (SICURA)
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Cambia SOLO il default di notify_reviews da false a true
--              per i nuovi professionisti. NON tocca i record esistenti
--              per rispettare le scelte degli utenti.
-- =============================================

-- Cambia SOLO il default della colonna notify_reviews
-- I record esistenti NON vengono modificati (rispetta le scelte degli utenti)
ALTER TABLE professional_settings
  ALTER COLUMN notify_reviews SET DEFAULT true;

-- Commento per documentazione
COMMENT ON COLUMN professional_settings.notify_reviews IS 
  'Notifiche per nuove recensioni. Default: true (abilitato) per nuovi professionisti. Gli utenti esistenti mantengono le loro preferenze.';
