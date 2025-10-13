-- Aggiungi colonna birth_place alla tabella profiles
ALTER TABLE public.profiles 
ADD COLUMN birth_place TEXT;

-- Se ci sono dati esistenti nella colonna phone che rappresentano luoghi di nascita,
-- possiamo copiarli nella nuova colonna birth_place
-- (questo è opzionale e dipende dai dati esistenti)

-- Aggiungi anche una colonna birth_date se manca
ALTER TABLE public.profiles 
ADD COLUMN birth_date DATE;