-- =============================================
-- CREAZIONE TABELLA PUSH_SUBSCRIPTIONS
-- =============================================
-- Data: 2025-01-23
-- Descrizione: Crea tabella per salvare subscription push dei professionisti
--              Permette notifiche push anche quando l'app è chiusa
-- =============================================

-- =============================================
-- TABELLA PUSH_SUBSCRIPTIONS
-- =============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  
  -- Dati subscription Web Push API
  endpoint TEXT NOT NULL UNIQUE, -- URL univoco del push service
  p256dh TEXT NOT NULL, -- Chiave pubblica per crittografia
  auth TEXT NOT NULL, -- Chiave di autenticazione
  
  -- Metadata
  user_agent TEXT, -- Browser/device info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE, -- Ultima volta che è stata usata
  
  -- Stato
  is_active BOOLEAN DEFAULT true, -- Se la subscription è ancora valida
  
  -- Vincolo: un professionista può avere più subscription (multi-device)
  -- ma ogni endpoint è univoco
  CONSTRAINT unique_endpoint UNIQUE(endpoint)
);

-- =============================================
-- INDICI PER PERFORMANCE
-- =============================================

-- Indice per query per professional_id (query più frequente)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_professional 
  ON push_subscriptions(professional_id);

-- Indice per query subscription attive
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
  ON push_subscriptions(professional_id, is_active) 
  WHERE is_active = true;

-- Indice per cleanup subscription vecchie/inattive
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_used 
  ON push_subscriptions(last_used_at) 
  WHERE is_active = false;

-- =============================================
-- TRIGGER PER UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- =============================================
-- RLS (ROW LEVEL SECURITY)
-- =============================================

-- Abilita RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: I professionisti possono vedere solo le proprie subscription
CREATE POLICY "Professionals can view own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: I professionisti possono inserire solo le proprie subscription
CREATE POLICY "Professionals can insert own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: I professionisti possono aggiornare solo le proprie subscription
CREATE POLICY "Professionals can update own push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  USING (
    professional_id IN (
      SELECT id FROM professionals 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: I professionisti possono eliminare solo le proprie subscription
CREATE POLICY "Professionals can delete own push subscriptions"
  ON push_subscriptions
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

COMMENT ON TABLE push_subscriptions IS 
  'Subscription push per notifiche browser dei professionisti. Supporta multi-device.';

COMMENT ON COLUMN push_subscriptions.endpoint IS 
  'URL univoco del push service (es. FCM, Mozilla Push Service). Deve essere UNIQUE.';

COMMENT ON COLUMN push_subscriptions.p256dh IS 
  'Chiave pubblica P-256 per crittografia end-to-end delle notifiche push.';

COMMENT ON COLUMN push_subscriptions.auth IS 
  'Chiave di autenticazione per le notifiche push.';

COMMENT ON COLUMN push_subscriptions.is_active IS 
  'Se false, la subscription non viene più usata (es. utente ha disattivato notifiche).';
