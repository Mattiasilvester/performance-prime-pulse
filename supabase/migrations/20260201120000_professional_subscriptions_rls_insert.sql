-- RLS su professional_subscriptions: permette al professionista di inserire/leggere/aggiornare
-- la propria riga di abbonamento. Risolve 403 "new row violates row-level security policy for
-- table 'professional_subscriptions'" quando un trigger (o il client) crea la subscription
-- dopo l'INSERT in professionals.

ALTER TABLE professional_subscriptions ENABLE ROW LEVEL SECURITY;

-- INSERT: l'utente autenticato può inserire solo la subscription per il proprio professional_id
DROP POLICY IF EXISTS "professional_subscriptions_insert_own" ON professional_subscriptions;
CREATE POLICY "professional_subscriptions_insert_own"
  ON professional_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

-- SELECT: l'utente può leggere solo la propria subscription
DROP POLICY IF EXISTS "professional_subscriptions_select_own" ON professional_subscriptions;
CREATE POLICY "professional_subscriptions_select_own"
  ON professional_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

-- UPDATE: l'utente può aggiornare solo la propria subscription
DROP POLICY IF EXISTS "professional_subscriptions_update_own" ON professional_subscriptions;
CREATE POLICY "professional_subscriptions_update_own"
  ON professional_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );
