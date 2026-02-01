-- Verifica trigger e RLS su professional_subscriptions (da eseguire nel SQL Editor Supabase).
-- Condivisi i risultati con Cloud per decidere se basta la migrazione RLS o serve SECURITY DEFINER sul trigger.

-- 1. Trovare il trigger che scrive in professional_subscriptions (su tabella professionals)
SELECT tgname, tgrelid::regclass AS tabella, proname AS funzione_trigger, prosrc
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.professionals'::regclass
  AND tgenabled != 'D';

-- 2. RLS policies attuali su professional_subscriptions
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'professional_subscriptions';

-- 3. SECURITY DEFINER (true) vs INVOKER (false) per funzioni trigger subscription/professional
SELECT proname AS nome_funzione, prosecdef AS security_definer
FROM pg_proc
WHERE proname LIKE '%subscription%' OR proname LIKE '%professional%';
