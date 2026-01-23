-- =============================================
-- AGGIUNGI TIPO 'custom' A PROFESSIONAL_NOTIFICATIONS
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Aggiunge tipo 'custom' al CHECK constraint per supportare
--              notifiche personalizzate create tramite promemoria programmati
-- =============================================

-- Rimuovi il vecchio CHECK constraint
ALTER TABLE professional_notifications
  DROP CONSTRAINT IF EXISTS professional_notifications_type_check;

-- Aggiungi nuovo CHECK constraint con 'custom'
ALTER TABLE professional_notifications
  ADD CONSTRAINT professional_notifications_type_check 
  CHECK (type IN (
    'new_booking',
    'booking_confirmed',
    'booking_cancelled',
    'booking_reminder',
    'new_client',
    'new_project',
    'new_review',
    'review_response',
    'custom' -- Per notifiche personalizzate (promemoria programmati)
  ));

-- Aggiorna commento
COMMENT ON COLUMN professional_notifications.type IS 
  'Tipo di notifica: new_booking, booking_confirmed, booking_cancelled, booking_reminder, new_client, new_project, new_review, review_response, custom';
