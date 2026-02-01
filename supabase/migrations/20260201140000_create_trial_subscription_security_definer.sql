-- Fix registrazione professionisti: create_trial_subscription deve essere SECURITY DEFINER
-- e usare plan='business' / price_cents=5000 (CHECK constraint e prezzo corretto 50€/mese).
-- Vedi docs/FIX_REGISTRAZIONE_PROFESSIONISTI.md per contesto completo.

CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM professional_subscriptions
    WHERE professional_id = NEW.id
  ) THEN
    INSERT INTO professional_subscriptions (
      professional_id,
      plan,
      status,
      price_cents,
      trial_start,
      trial_end
    ) VALUES (
      NEW.id,
      'business',   -- CHECK prof_sub_plan_check: solo 'business' o 'prime_business'
      'trialing',
      5000,         -- 50€/mese = 5000 centesimi (3 mesi free trial)
      NOW(),
      NOW() + INTERVAL '3 months'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Default colonne per coerenza con il trigger
ALTER TABLE professional_subscriptions
  ALTER COLUMN plan SET DEFAULT 'business';

ALTER TABLE professional_subscriptions
  ALTER COLUMN price_cents SET DEFAULT 5000;
