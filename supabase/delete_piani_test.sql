-- Elimina i piani di test (seed) dal database
-- Esegui in Supabase Dashboard → SQL Editor

DELETE FROM public.nutrition_plans
WHERE name = 'Piano Test Nutrizione 3 giorni';

DELETE FROM public.workout_plans
WHERE nome = 'Piano Test Forza 3 giorni';

-- Opzione: se hai eseguito il seed più volte e vuoi rimuovere TUTTI i piani con quel nome,
-- le query sopra li rimuovono già (DELETE senza LIMIT elimina tutte le righe che matchano).
