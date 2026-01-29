-- Fix: prof_sub_plan_check blocca insert PayPal (plan = 'business')
-- 1. Rimuove il vincolo esistente
-- 2. Normalizza i valori plan esistenti (es. 'Prime Business' -> 'business')
-- 3. Aggiunge vincolo che consente 'business' e 'prime_business'

ALTER TABLE professional_subscriptions
  DROP CONSTRAINT IF EXISTS prof_sub_plan_check;

-- Porta tutte le righe con plan diverso da 'business'/'prime_business' a 'business'
UPDATE professional_subscriptions
SET plan = 'business'
WHERE plan IS NOT NULL
  AND plan NOT IN ('business', 'prime_business');

ALTER TABLE professional_subscriptions
  ADD CONSTRAINT prof_sub_plan_check
  CHECK (plan IS NULL OR plan IN ('business', 'prime_business'));
