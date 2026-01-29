-- RLS su professionals: permette a un utente autenticato di inserire il proprio record (registrazione)
-- e di leggere/aggiornare solo il proprio record.
-- Risolve 403 su INSERT durante la registrazione partner.
-- Idempotente: DROP IF EXISTS evita errori se rieseguita o policy già presenti.

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "professionals_insert_own" ON professionals;
CREATE POLICY "professionals_insert_own"
  ON professionals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "professionals_select_own" ON professionals;
CREATE POLICY "professionals_select_own"
  ON professionals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "professionals_update_own" ON professionals;
CREATE POLICY "professionals_update_own"
  ON professionals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
