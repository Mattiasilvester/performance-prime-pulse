-- CORREZIONE CRITICA: Rimuovi accesso ai dati professionisti da parte di utenti generici
-- Solo i professionisti possono accedere ai propri dati

-- Rimuovi la policy problematica che permetteva a tutti gli utenti autenticati di vedere i dati dei professionisti
DROP POLICY IF EXISTS "Authenticated users can view limited professional info" ON public.professionals;

-- Rimuovi anche eventuali policy duplicate
DROP POLICY IF EXISTS "Professionals can view their own data" ON public.professionals;
DROP POLICY IF EXISTS "Professionals can view their full data" ON public.professionals;
DROP POLICY IF EXISTS "Professionals can update their own data" ON public.professionals;

-- Crea policy sicura: SOLO i professionisti possono vedere i propri dati completi
CREATE POLICY "Professionals can view own data only" 
ON public.professionals 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Crea policy sicura: SOLO i professionisti possono aggiornare i propri dati
CREATE POLICY "Professionals can update own data only" 
ON public.professionals 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Aggiungi commenti per campi sensibili
COMMENT ON COLUMN public.professionals.password_hash IS 'SENSITIVE: Never expose via API';
COMMENT ON COLUMN public.professionals.password_salt IS 'SENSITIVE: Never expose via API';
COMMENT ON COLUMN public.professionals.reset_token IS 'SENSITIVE: Never expose via API';
COMMENT ON COLUMN public.professionals.vat_number IS 'SENSITIVE: Business critical data';
COMMENT ON COLUMN public.professionals.email IS 'SENSITIVE: Personal contact information';
COMMENT ON COLUMN public.professionals.phone IS 'SENSITIVE: Personal contact information';