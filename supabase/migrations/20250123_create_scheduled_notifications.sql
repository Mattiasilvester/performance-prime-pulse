-- =============================================
-- CREAZIONE TABELLA SCHEDULED_NOTIFICATIONS
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Crea tabella per notifiche programmate
--              Permette di creare notifiche che vengono inviate in futuro
-- =============================================

-- =============================================
-- TABELLA SCHEDULED_NOTIFICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  
  -- Tipo e contenuto notifica
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'new_booking',
    'booking_confirmed',
    'booking_cancelled',
    'booking_reminder',
    'new_client',
    'new_project',
    'new_review',
    'review_response',
    'custom' -- Per notifiche personalizzate
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Programmazione
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL, -- Quando inviare la notifica
  sent_at TIMESTAMP WITH TIME ZONE, -- Quando è stata effettivamente inviata (NULL = non ancora inviata)
  
  -- Stato
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  error_message TEXT, -- Messaggio errore se fallisce
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- INDICI PER PERFORMANCE
-- =============================================

-- Indice per query notifiche da inviare (query più frequente)
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending 
  ON scheduled_notifications(professional_id, status, scheduled_for) 
  WHERE status = 'pending';

-- Indice per query per professional_id
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_professional 
  ON scheduled_notifications(professional_id);

-- Indice per query per data programmata
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for 
  ON scheduled_notifications(scheduled_for) 
  WHERE status = 'pending';

-- =============================================
-- TRIGGER PER UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_scheduled_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scheduled_notifications_updated_at
  BEFORE UPDATE ON scheduled_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_notifications_updated_at();

-- =============================================
-- RLS (ROW LEVEL SECURITY)
-- =============================================

-- Abilita RLS
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: I professionisti possono vedere solo le proprie notifiche programmate
CREATE POLICY "Professionals can view own scheduled notifications"
  ON scheduled_notifications
  FOR SELECT
  USING (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: I professionisti possono inserire solo le proprie notifiche programmate
CREATE POLICY "Professionals can insert own scheduled notifications"
  ON scheduled_notifications
  FOR INSERT
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: I professionisti possono aggiornare solo le proprie notifiche programmate
CREATE POLICY "Professionals can update own scheduled notifications"
  ON scheduled_notifications
  FOR UPDATE
  USING (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: I professionisti possono eliminare solo le proprie notifiche programmate
CREATE POLICY "Professionals can delete own scheduled notifications"
  ON scheduled_notifications
  FOR DELETE
  USING (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- COMMENTI
-- =============================================

COMMENT ON TABLE scheduled_notifications IS 
  'Notifiche programmate per professionisti. Vengono inviate automaticamente alla data/ora specificata.';

COMMENT ON COLUMN scheduled_notifications.scheduled_for IS 
  'Data e ora in cui la notifica deve essere inviata. Deve essere nel futuro.';

COMMENT ON COLUMN scheduled_notifications.status IS 
  'Stato: pending (in attesa), sent (inviata), cancelled (cancellata), failed (fallita).';

COMMENT ON COLUMN scheduled_notifications.sent_at IS 
  'Data e ora in cui la notifica è stata effettivamente inviata. NULL se non ancora inviata.';
