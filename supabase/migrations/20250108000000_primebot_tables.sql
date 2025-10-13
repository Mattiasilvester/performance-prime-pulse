-- PrimeBot Tables Migration
-- Crea le tabelle necessarie per PrimeBot

-- Tabella per le interazioni chat
CREATE TABLE IF NOT EXISTS primebot_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  message_content TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('text', 'choice', 'system')),
  user_context JSONB,
  bot_intent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_primebot_interactions_user_id ON primebot_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_primebot_interactions_timestamp ON primebot_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_primebot_interactions_session_id ON primebot_interactions(session_id);

-- Tabella per le preferenze utente PrimeBot
CREATE TABLE IF NOT EXISTS primebot_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  communication_style TEXT DEFAULT 'motivational' CHECK (communication_style IN ('motivational', 'technical', 'casual')),
  preferred_workout_types TEXT[] DEFAULT ARRAY['cardio', 'strength'],
  reminder_frequency TEXT DEFAULT 'daily' CHECK (reminder_frequency IN ('daily', 'weekly', 'monthly')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_interaction TIMESTAMPTZ,
  total_messages INTEGER DEFAULT 0,
  favorite_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  fitness_level TEXT DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  goals TEXT[] DEFAULT ARRAY['general_fitness'],
  has_trainer BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_primebot_preferences_updated_at 
    BEFORE UPDATE ON primebot_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) per primebot_interactions
ALTER TABLE primebot_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions" ON primebot_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON primebot_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS per primebot_preferences
ALTER TABLE primebot_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON primebot_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON primebot_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON primebot_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Funzione per ottenere statistiche utente
CREATE OR REPLACE FUNCTION get_user_primebot_stats(user_uuid UUID)
RETURNS TABLE (
  total_messages BIGINT,
  favorite_topics TEXT[],
  last_interaction TIMESTAMPTZ,
  onboarding_completed BOOLEAN,
  communication_style TEXT,
  fitness_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pp.total_messages, 0)::BIGINT,
    COALESCE(pp.favorite_topics, ARRAY[]::TEXT[]),
    pp.last_interaction,
    COALESCE(pp.onboarding_completed, FALSE),
    COALESCE(pp.communication_style, 'motivational'),
    COALESCE(pp.fitness_level, 'beginner')
  FROM primebot_preferences pp
  WHERE pp.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per incrementare il contatore messaggi
CREATE OR REPLACE FUNCTION increment_message_count(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO primebot_preferences (user_id, total_messages, last_interaction)
  VALUES (user_uuid, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_messages = primebot_preferences.total_messages + 1,
    last_interaction = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
