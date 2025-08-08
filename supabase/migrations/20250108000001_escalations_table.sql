-- Tabella per tracciare le escalation da Voiceflow a Make/Slack
-- Questa tabella è opzionale per il tracking delle escalation

CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  escalation_type TEXT NOT NULL CHECK (escalation_type IN ('human_support', 'technical_issue', 'billing', 'feature_request')),
  user_message TEXT NOT NULL,
  bot_response TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  assigned_to TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  notes TEXT
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_escalations_user_id ON escalations(user_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_created_at ON escalations(created_at);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_escalations_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_escalations_updated_at 
  BEFORE UPDATE ON escalations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_escalations_updated_at();

-- RLS (Row Level Security)
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- Policy per permettere agli utenti di vedere solo le loro escalation
CREATE POLICY "Users can view their own escalations" ON escalations 
  FOR SELECT USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di creare escalation
CREATE POLICY "Users can create escalations" ON escalations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy per admin (solo se necessario)
-- CREATE POLICY "Admins can manage all escalations" ON escalations 
--   FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Funzione per creare escalation
CREATE OR REPLACE FUNCTION create_escalation(
  p_user_id UUID,
  p_session_id TEXT,
  p_escalation_type TEXT,
  p_user_message TEXT,
  p_bot_response TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  escalation_id UUID;
BEGIN
  INSERT INTO escalations (
    user_id, 
    session_id, 
    escalation_type, 
    user_message, 
    bot_response
  ) VALUES (
    p_user_id,
    p_session_id,
    p_escalation_type,
    p_user_message,
    p_bot_response
  ) RETURNING id INTO escalation_id;
  
  RETURN escalation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere statistiche escalation
CREATE OR REPLACE FUNCTION get_escalation_stats(p_user_id UUID) 
RETURNS TABLE (
  total_escalations BIGINT,
  pending_count BIGINT,
  resolved_count BIGINT,
  avg_resolution_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_escalations,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    AVG(resolved_at - created_at) FILTER (WHERE status = 'resolved') as avg_resolution_time
  FROM escalations 
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
