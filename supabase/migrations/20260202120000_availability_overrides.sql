-- Blocchi orari su date specifiche (override sulla disponibilità settimanale)
-- Es: "martedì 4 febbraio dalle 10 alle 13 non disponibile"
CREATE TABLE IF NOT EXISTS availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_override_time CHECK (end_time > start_time),
  CONSTRAINT uq_override_slot UNIQUE (professional_id, override_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_overrides_professional
  ON availability_overrides(professional_id);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_date
  ON availability_overrides(override_date);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_lookup
  ON availability_overrides(professional_id, override_date)
  WHERE is_blocked = true;

ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional manages own overrides" ON availability_overrides;
CREATE POLICY "Professional manages own overrides"
  ON availability_overrides FOR ALL
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can view blocked slots" ON availability_overrides;
CREATE POLICY "Public can view blocked slots"
  ON availability_overrides FOR SELECT
  USING (is_blocked = true);

COMMENT ON TABLE availability_overrides IS 'Blocchi orari su date specifiche (es. 4 feb 10:00-13:00 non disponibile)';
