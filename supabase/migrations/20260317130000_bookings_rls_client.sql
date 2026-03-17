-- Abilita RLS su bookings se non già attiva
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy SELECT per il cliente (app-user)
-- Permette all'utente autenticato di leggere
-- le proprie prenotazioni come cliente
DROP POLICY IF EXISTS "client can select own bookings" ON bookings;
CREATE POLICY "client can select own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);
