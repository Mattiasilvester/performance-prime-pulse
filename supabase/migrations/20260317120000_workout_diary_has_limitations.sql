-- Aggiunge tracciamento limitazioni fisiche
-- al completamento workout per medaglie
-- pain_fighter e no_limits
ALTER TABLE workout_diary
  ADD COLUMN IF NOT EXISTS
  has_limitations BOOLEAN NOT NULL DEFAULT false;
