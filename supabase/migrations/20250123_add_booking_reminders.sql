-- =============================================
-- SISTEMA PROMEMORIA PRENOTAZIONI AUTOMATICI
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Aggiunge supporto per promemoria automatici prenotazioni
--              con configurazione tempi e tracking per evitare duplicati
-- =============================================

-- =============================================
-- STEP 1: AGGIUNGI COLONNE A professional_settings
-- =============================================

-- Tempi promemoria configurabili (in ore prima dell'appuntamento)
ALTER TABLE professional_settings
  ADD COLUMN IF NOT EXISTS reminder_hours_before INTEGER[] DEFAULT ARRAY[24, 2]::INTEGER[];

-- Commento per documentazione
COMMENT ON COLUMN professional_settings.reminder_hours_before IS 
  'Array di ore prima dell''appuntamento per inviare promemoria. Es: [24, 2] = promemoria 24h e 2h prima. Default: [24, 2]';

-- =============================================
-- STEP 2: CREA TABELLA TRACKING PROMEMORIA
-- =============================================

-- Tabella per tracciare quali promemoria sono stati inviati (evita duplicati)
CREATE TABLE IF NOT EXISTS booking_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  hours_before INTEGER NOT NULL, -- Quante ore prima è stato inviato (es. 24, 2)
  notification_id UUID REFERENCES professional_notifications(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Unico: un promemoria per booking + hours_before
  UNIQUE(booking_id, hours_before)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking 
  ON booking_reminders(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_reminders_professional 
  ON booking_reminders(professional_id);

CREATE INDEX IF NOT EXISTS idx_booking_reminders_sent_at 
  ON booking_reminders(sent_at);

-- RLS Policies
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: professionisti possono vedere solo i propri promemoria
CREATE POLICY "Professionals can view own reminders" ON booking_reminders
  FOR SELECT
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy: solo sistema può inserire promemoria (via service role)
-- Le Edge Functions useranno service role key

-- Commenti
COMMENT ON TABLE booking_reminders IS 
  'Traccia quali promemoria sono stati inviati per evitare duplicati. Un record per ogni promemoria inviato (booking + hours_before).';

COMMENT ON COLUMN booking_reminders.hours_before IS 
  'Quante ore prima dell''appuntamento è stato inviato questo promemoria (es. 24, 2, 0.5)';

COMMENT ON COLUMN booking_reminders.notification_id IS 
  'Riferimento alla notifica creata (per tracciamento e possibile eliminazione)';
