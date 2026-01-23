-- =============================================
-- CREAZIONE TABELLA PROFESSIONAL_NOTIFICATIONS
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Crea tabella per notifiche professionisti PrimePro
--              Sistema completo notifiche con tipi, stato letto/non letto, dati JSON
-- =============================================

-- =============================================
-- TABELLA PROFESSIONAL_NOTIFICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS professional_notifications (
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
    'review_response'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Dati aggiuntivi (booking_id, client_id, project_id, ecc.)
  
  -- Stato notifica
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- INDICI PER PERFORMANCE
-- =============================================

-- Indice per query per professional_id (query più frequente)
CREATE INDEX IF NOT EXISTS idx_professional_notifications_professional 
  ON professional_notifications(professional_id);

-- Indice per query notifiche non lette (per badge contatore)
CREATE INDEX IF NOT EXISTS idx_professional_notifications_unread 
  ON professional_notifications(professional_id, is_read) 
  WHERE is_read = false;

-- Indice per ordinamento per data (mostra più recenti prima)
CREATE INDEX IF NOT EXISTS idx_professional_notifications_created_at 
  ON professional_notifications(professional_id, created_at DESC);

-- Indice per tipo notifica (per filtri futuri)
CREATE INDEX IF NOT EXISTS idx_professional_notifications_type 
  ON professional_notifications(professional_id, type);

-- Indice GIN per ricerca in data JSONB (per query su booking_id, client_id, ecc.)
CREATE INDEX IF NOT EXISTS idx_professional_notifications_data_gin 
  ON professional_notifications USING GIN (data);

-- =============================================
-- TRIGGER PER UPDATED_AT
-- =============================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_professional_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Se is_read cambia da false a true, aggiorna read_at
  IF OLD.is_read = false AND NEW.is_read = true AND NEW.read_at IS NULL THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at e read_at
CREATE TRIGGER update_professional_notifications_updated_at
  BEFORE UPDATE ON professional_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_notifications_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE professional_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Professionisti vedono solo le proprie notifiche
CREATE POLICY "Professionals can view own notifications" ON professional_notifications
  FOR SELECT
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy: Professionisti possono aggiornare solo le proprie notifiche (es. marcare come lette)
CREATE POLICY "Professionals can update own notifications" ON professional_notifications
  FOR UPDATE
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy: Sistema può inserire notifiche (usando service role key)
-- Nota: Le notifiche verranno create dal backend/frontend con service role
-- Per ora permettiamo INSERT solo se sei il professionista stesso (per test)
CREATE POLICY "Professionals can insert own notifications" ON professional_notifications
  FOR INSERT
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy: Professionisti possono eliminare solo le proprie notifiche
CREATE POLICY "Professionals can delete own notifications" ON professional_notifications
  FOR DELETE
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- COMMENTI PER DOCUMENTAZIONE
-- =============================================

COMMENT ON TABLE professional_notifications IS 'Notifiche per professionisti PrimePro. Sistema completo con tipi, stato letto/non letto e dati JSON per informazioni aggiuntive.';

COMMENT ON COLUMN professional_notifications.type IS 'Tipo di notifica: new_booking, booking_confirmed, booking_cancelled, booking_reminder, new_client, new_project, new_review, review_response';

COMMENT ON COLUMN professional_notifications.title IS 'Titolo breve della notifica (es. "Nuova prenotazione")';

COMMENT ON COLUMN professional_notifications.message IS 'Messaggio completo della notifica (es. "Mario Rossi ha prenotato per il 25 Gennaio alle 10:00")';

COMMENT ON COLUMN professional_notifications.data IS 'Dati aggiuntivi in formato JSON (es. {"booking_id": "uuid", "client_id": "uuid", "booking_date": "2025-01-25"})';

COMMENT ON COLUMN professional_notifications.is_read IS 'Stato lettura: false = non letta, true = letta';

COMMENT ON COLUMN professional_notifications.read_at IS 'Timestamp quando la notifica è stata letta (NULL se non letta)';

-- =============================================
-- VERIFICA CREAZIONE
-- =============================================

DO $$
BEGIN
  -- Verifica che la tabella esista
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'professional_notifications'
  ) THEN
    RAISE NOTICE '✅ Tabella professional_notifications creata con successo';
  ELSE
    RAISE EXCEPTION '❌ Errore: Tabella professional_notifications non creata';
  END IF;

  -- Verifica indici
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'professional_notifications' 
    AND indexname = 'idx_professional_notifications_professional'
  ) THEN
    RAISE NOTICE '✅ Indici creati con successo';
  ELSE
    RAISE WARNING '⚠️ Alcuni indici potrebbero non essere stati creati';
  END IF;

  -- Verifica RLS
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'professional_notifications'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS abilitato con successo';
  ELSE
    RAISE WARNING '⚠️ RLS potrebbe non essere abilitato';
  END IF;
END $$;
