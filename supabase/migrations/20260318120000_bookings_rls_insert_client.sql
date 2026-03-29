-- Policy INSERT per il cliente (app-user)
-- Permette all'utente autenticato di inserire una prenotazione
-- solo con il proprio user_id
CREATE POLICY "client can insert own bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
