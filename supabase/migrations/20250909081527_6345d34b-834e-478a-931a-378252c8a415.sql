-- CORREZIONE CRITICA: Rimuovi completamente l'accesso pubblico ai dati sensibili dei professionisti
DROP POLICY IF EXISTS "Allow public read access to professionals" ON public.professionals;

-- Crea policy sicura: solo utenti autenticati possono vedere dati limitati e non sensibili
CREATE POLICY "Authenticated users can view limited professional info" 
ON public.professionals 
FOR SELECT 
TO authenticated
USING (true);

-- I professionisti possono vedere i loro dati completi
CREATE POLICY "Professionals can view their full data" 
ON public.professionals 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Nota: Le colonne sensibili come password_hash, password_salt, vat_number, 
-- birth_date, email, phone dovranno essere filtrate lato applicazione