-- =============================================
-- TABELLA PERIODI BLOCCATI DAI PROFESSIONISTI
-- =============================================

CREATE TABLE IF NOT EXISTS professional_blocked_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Riferimento al professionista
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  
  -- Date del blocco
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Tipo di blocco: 'day' (singolo giorno) o 'week' (settimana intera)
  block_type VARCHAR(10) NOT NULL CHECK (block_type IN ('day', 'week')),
  
  -- Motivo opzionale (es. "Ferie", "Malattia", "Impegno personale")
  reason VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: end_date deve essere >= start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- =============================================
-- INDICI PER PERFORMANCE
-- =============================================

-- Indice principale per query del professionista
CREATE INDEX IF NOT EXISTS idx_blocked_periods_professional 
  ON professional_blocked_periods(professional_id);

-- Indice per query su range di date (quando utente cerca disponibilità)
CREATE INDEX IF NOT EXISTS idx_blocked_periods_dates 
  ON professional_blocked_periods(professional_id, start_date, end_date);

-- Indice per tipo di blocco
CREATE INDEX IF NOT EXISTS idx_blocked_periods_type 
  ON professional_blocked_periods(block_type);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE professional_blocked_periods ENABLE ROW LEVEL SECURITY;

-- Policy: I professionisti possono vedere solo i propri blocchi
DROP POLICY IF EXISTS "Professionals can view own blocked periods" ON professional_blocked_periods;
CREATE POLICY "Professionals can view own blocked periods" 
  ON professional_blocked_periods
  FOR SELECT 
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy: I professionisti possono inserire solo per se stessi
DROP POLICY IF EXISTS "Professionals can insert own blocked periods" ON professional_blocked_periods;
CREATE POLICY "Professionals can insert own blocked periods" 
  ON professional_blocked_periods
  FOR INSERT 
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy: I professionisti possono aggiornare solo i propri blocchi
DROP POLICY IF EXISTS "Professionals can update own blocked periods" ON professional_blocked_periods;
CREATE POLICY "Professionals can update own blocked periods" 
  ON professional_blocked_periods
  FOR UPDATE 
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy: I professionisti possono eliminare solo i propri blocchi
DROP POLICY IF EXISTS "Professionals can delete own blocked periods" ON professional_blocked_periods;
CREATE POLICY "Professionals can delete own blocked periods" 
  ON professional_blocked_periods
  FOR DELETE 
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Policy: Gli utenti (clienti) possono vedere i blocchi per verificare disponibilità
-- (necessario per escludere giorni bloccati durante la prenotazione)
DROP POLICY IF EXISTS "Users can view blocked periods for availability check" ON professional_blocked_periods;
CREATE POLICY "Users can view blocked periods for availability check" 
  ON professional_blocked_periods
  FOR SELECT 
  USING (true);

-- =============================================
-- TRIGGER PER updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_blocked_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blocked_periods_updated_at ON professional_blocked_periods;
CREATE TRIGGER trigger_blocked_periods_updated_at
  BEFORE UPDATE ON professional_blocked_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_blocked_periods_updated_at();

-- =============================================
-- FUNZIONE HELPER: Verifica se una data è bloccata
-- =============================================

CREATE OR REPLACE FUNCTION is_date_blocked(
  p_professional_id UUID,
  p_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM professional_blocked_periods
    WHERE professional_id = p_professional_id
      AND p_date BETWEEN start_date AND end_date
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNZIONE HELPER: Ottieni tutti i giorni bloccati in un range
-- =============================================

CREATE OR REPLACE FUNCTION get_blocked_dates_in_range(
  p_professional_id UUID,
  p_start DATE,
  p_end DATE
) RETURNS TABLE (blocked_date DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT d::DATE as blocked_date
  FROM professional_blocked_periods bp
  CROSS JOIN generate_series(
    GREATEST(bp.start_date, p_start),
    LEAST(bp.end_date, p_end),
    '1 day'::interval
  ) d
  WHERE bp.professional_id = p_professional_id
    AND bp.start_date <= p_end
    AND bp.end_date >= p_start
  ORDER BY blocked_date;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTI PER DOCUMENTAZIONE
-- =============================================

COMMENT ON TABLE professional_blocked_periods IS 'Periodi bloccati dai professionisti (ferie, indisponibilità, ecc.)';
COMMENT ON COLUMN professional_blocked_periods.block_type IS 'Tipo blocco: day = singolo giorno, week = settimana intera';
COMMENT ON COLUMN professional_blocked_periods.reason IS 'Motivo opzionale del blocco (es. Ferie, Malattia)';
COMMENT ON FUNCTION is_date_blocked IS 'Verifica se una specifica data è bloccata per un professionista';
COMMENT ON FUNCTION get_blocked_dates_in_range IS 'Restituisce tutte le date bloccate in un range per un professionista';
