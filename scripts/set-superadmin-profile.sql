-- Imposta un profilo come Super Admin (per login Nexus Control).
-- Esegui in Supabase → SQL Editor. Sostituisci l'email con la tua.

-- Opzione 1: Aggiorna un profilo esistente (email già in profiles)
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'Mattiasilvester@gmail.com';

-- Verifica: deve restituire 1 riga se l'email esiste
-- SELECT id, email, role FROM profiles WHERE email = 'Mattiasilvester@gmail.com';

-- Se la query sopra ha aggiornato 0 righe, l'email non è in profiles.
-- In quel caso: usa un'email con cui ti sei già registrato nell'app,
-- oppure crea prima l'utente da Auth (registrazione) e poi riesegui l'UPDATE.
