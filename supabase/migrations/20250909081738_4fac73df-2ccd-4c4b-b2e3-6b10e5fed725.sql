-- Abilita protezione password compromesse e rinforza validazione
-- Questa impostazione viene gestita a livello di configurazione Supabase

-- Aggiungi constraint per validazione password più rigorosa sui professionisti
ALTER TABLE public.professionals 
ADD CONSTRAINT professionals_password_strength_check 
CHECK (validate_password_strength(password_hash));

-- Aggiungi constraint per validazione password più rigorosa sugli utenti
ALTER TABLE public.users 
ADD CONSTRAINT users_password_strength_check 
CHECK (validate_password_strength(password_hash));

-- Nota: La protezione dalle password compromesse deve essere abilitata 
-- manualmente nel dashboard di Supabase sotto Auth > Settings