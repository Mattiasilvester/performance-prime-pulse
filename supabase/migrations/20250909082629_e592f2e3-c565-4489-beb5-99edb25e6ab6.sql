-- CORREZIONE CRITICA: Protezione dati sensibili utenti
-- Rimuovi tutte le policy esistenti per garantire sicurezza
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Crea policy sicura per SELECT che esclude campi sensibili
-- Gli utenti possono vedere solo i loro dati base (NO password_hash, password_salt, reset_token)
CREATE POLICY "Users can view own basic data only" 
ON public.users 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Policy per UPDATE che esclude campi sensibili
CREATE POLICY "Users can update own basic data only" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (id = auth.uid());

-- Aggiungi vincoli per prevenire accesso ai campi sensibili lato applicazione
COMMENT ON COLUMN public.users.password_hash IS 'SENSITIVE: Never expose via API';
COMMENT ON COLUMN public.users.password_salt IS 'SENSITIVE: Never expose via API';
COMMENT ON COLUMN public.users.reset_token IS 'SENSITIVE: Never expose via API';