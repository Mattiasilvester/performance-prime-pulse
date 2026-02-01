-- Step 8 fix: Aggiunta colonna cost_type per tabelle professional_costs già esistenti.
-- Se la tabella è stata creata con la migration precedente senza cost_type, questa la aggiunge.

ALTER TABLE public.professional_costs
  ADD COLUMN IF NOT EXISTS cost_type text NOT NULL DEFAULT 'variabile';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'professional_costs_cost_type_check'
  ) THEN
    ALTER TABLE public.professional_costs
      ADD CONSTRAINT professional_costs_cost_type_check
      CHECK (cost_type IN ('fisso', 'variabile', 'una_tantum'));
  END IF;
END $$;
