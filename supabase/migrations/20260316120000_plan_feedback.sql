-- Tabella feedback piani PrimeBot
CREATE TABLE IF NOT EXISTS plan_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  user_id uuid NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('workout', 'nutrition')),
  vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT plan_feedback_plan_user_unique 
    UNIQUE (plan_id, user_id)
);

-- Indice per query per utente
CREATE INDEX IF NOT EXISTS plan_feedback_user_id_idx 
  ON plan_feedback(user_id);

-- Trigger updated_at automatico
CREATE OR REPLACE FUNCTION update_plan_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_feedback_updated_at
  BEFORE UPDATE ON plan_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_feedback_updated_at();

-- RLS
ALTER TABLE plan_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utenti vedono solo i propri feedback"
  ON plan_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utenti inseriscono solo i propri feedback"
  ON plan_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utenti aggiornano solo i propri feedback"
  ON plan_feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
