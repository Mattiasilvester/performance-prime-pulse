-- =====================================================
-- OPENAI USAGE LOGS TABLE
-- Data: 18 Settembre 2025
-- Descrizione: Tabella per tracciare uso OpenAI e costi
-- =====================================================

-- Crea tabella per tracking OpenAI usage
CREATE TABLE IF NOT EXISTS openai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tokens_prompt INTEGER NOT NULL DEFAULT 0,
  tokens_completion INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
  message TEXT, -- Messaggio utente (troncato a 500 char)
  response TEXT, -- Risposta AI (troncata a 500 char)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita Row Level Security
ALTER TABLE openai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo i propri log
CREATE POLICY "Users can view own OpenAI usage" ON openai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: utenti possono inserire solo i propri log
CREATE POLICY "Users can insert own OpenAI usage" ON openai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: super_admin può vedere tutti i log
CREATE POLICY "Super admins can view all OpenAI usage" ON openai_usage_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  );

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_openai_usage_logs_user_id ON openai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_openai_usage_logs_created_at ON openai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_openai_usage_logs_cost ON openai_usage_logs(cost_usd);

-- Funzione per calcolare costi mensili per utente
CREATE OR REPLACE FUNCTION get_monthly_openai_cost(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  monthly_cost DECIMAL;
BEGIN
  SELECT COALESCE(SUM(cost_usd), 0)
  INTO monthly_cost
  FROM openai_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  RETURN monthly_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per calcolare uso mensile per utente
CREATE OR REPLACE FUNCTION get_monthly_openai_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  monthly_usage INTEGER;
BEGIN
  SELECT COALESCE(COUNT(*), 0)
  INTO monthly_usage
  FROM openai_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  RETURN monthly_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commenti per documentazione
COMMENT ON TABLE openai_usage_logs IS 'Log dell''utilizzo di OpenAI per tracking costi e limiti';
COMMENT ON FUNCTION get_monthly_openai_cost IS 'Calcola il costo mensile OpenAI per un utente';
COMMENT ON FUNCTION get_monthly_openai_usage IS 'Calcola l''uso mensile OpenAI per un utente';

-- =====================================================
-- MIGRATION COMPLETATA
-- =====================================================
