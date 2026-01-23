-- =============================================
-- AGGIUNGI PREFERENZE SUONI E VIBRAZIONI
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Aggiunge colonne per preferenze suoni e vibrazioni notifiche
--              Default: true (abilitato)
-- =============================================

-- Aggiungi colonne per suoni e vibrazioni
ALTER TABLE professional_settings
  ADD COLUMN IF NOT EXISTS notification_sound_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_vibration_enabled BOOLEAN DEFAULT true;

-- Commenti per documentazione
COMMENT ON COLUMN professional_settings.notification_sound_enabled IS 
  'Abilita/disabilita suoni per notifiche. Default: true (abilitato).';

COMMENT ON COLUMN professional_settings.notification_vibration_enabled IS 
  'Abilita/disabilita vibrazioni per notifiche (solo mobile). Default: true (abilitato).';
