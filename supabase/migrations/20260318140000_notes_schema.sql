-- Aggiunge colonne mancanti alla tabella notes
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'generale',
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS primebot_visible BOOLEAN NOT NULL DEFAULT false;

-- Indice per query PrimeBot (performance)
CREATE INDEX IF NOT EXISTS idx_notes_primebot
  ON notes (user_id, primebot_visible, updated_at DESC);

-- RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user can select own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);
