-- Tabella feedback landing page professionisti
CREATE TABLE IF NOT EXISTS landing_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL CHECK (char_length(comment) <= 500),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  source VARCHAR(50) DEFAULT 'landing_page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indici
CREATE INDEX idx_landing_feedbacks_approved ON landing_feedbacks (is_approved) WHERE is_approved = true;
CREATE INDEX idx_landing_feedbacks_rating ON landing_feedbacks (rating DESC);

-- RLS
ALTER TABLE landing_feedbacks ENABLE ROW LEVEL SECURITY;

-- Chiunque può inserire un feedback (la landing è pubblica, non serve auth)
CREATE POLICY "Chiunque può inserire feedback"
  ON landing_feedbacks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Solo lettura dei feedback approvati (per futuro caricamento dinamico)
CREATE POLICY "Feedback approvati visibili a tutti"
  ON landing_feedbacks
  FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);
