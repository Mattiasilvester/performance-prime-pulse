-- Step 8: Tabella costi/spese professionista (Gestionale finanziario PrimePro).
-- Il professionista registra spese operative: fissi, variabili, una tantum.
-- RLS: ogni professionista vede e modifica solo i propri costi (tramite professional_id → professionals.user_id).

CREATE TABLE IF NOT EXISTS public.professional_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  description text,
  cost_date date NOT NULL,
  cost_type text NOT NULL DEFAULT 'variabile' CHECK (cost_type IN ('fisso', 'variabile', 'una_tantum')),
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence text CHECK (recurrence IS NULL OR recurrence IN ('monthly', 'yearly')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_professional_costs_professional_id ON public.professional_costs(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_costs_cost_date ON public.professional_costs(cost_date);
CREATE INDEX IF NOT EXISTS idx_professional_costs_category ON public.professional_costs(category);

COMMENT ON TABLE public.professional_costs IS 'Costi e spese del professionista (Step 8 - Costi & Spese PrimePro)';

ALTER TABLE public.professional_costs ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT solo i costi del proprio professional_id (join con professionals su user_id = auth.uid())
DROP POLICY IF EXISTS "professional_costs_select_own" ON public.professional_costs;
CREATE POLICY "professional_costs_select_own"
  ON public.professional_costs
  FOR SELECT
  TO authenticated
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

-- Policy: INSERT solo per il proprio professional_id
DROP POLICY IF EXISTS "professional_costs_insert_own" ON public.professional_costs;
CREATE POLICY "professional_costs_insert_own"
  ON public.professional_costs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

-- Policy: UPDATE solo i propri costi
DROP POLICY IF EXISTS "professional_costs_update_own" ON public.professional_costs;
CREATE POLICY "professional_costs_update_own"
  ON public.professional_costs
  FOR UPDATE
  TO authenticated
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

-- Policy: DELETE solo i propri costi
DROP POLICY IF EXISTS "professional_costs_delete_own" ON public.professional_costs;
CREATE POLICY "professional_costs_delete_own"
  ON public.professional_costs
  FOR DELETE
  TO authenticated
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_professional_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professional_costs_updated_at ON public.professional_costs;
CREATE TRIGGER professional_costs_updated_at
  BEFORE UPDATE ON public.professional_costs
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at_professional_costs();
