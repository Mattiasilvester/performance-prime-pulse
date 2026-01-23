-- =============================================
-- ABILITA REALTIME PER PROFESSIONAL_NOTIFICATIONS
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Abilita Realtime subscription per la tabella professional_notifications
--              per aggiornamenti in tempo reale senza ricaricare la pagina
-- =============================================

-- Abilita Realtime per la tabella professional_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE professional_notifications;

-- Verifica che Realtime sia abilitato
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'professional_notifications'
  ) THEN
    RAISE NOTICE '✅ Realtime abilitato per professional_notifications';
  ELSE
    RAISE WARNING '⚠️ Realtime potrebbe non essere abilitato';
  END IF;
END $$;
