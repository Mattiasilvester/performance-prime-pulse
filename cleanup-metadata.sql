-- PULIZIA METADATA GONFI - RISOLVE TOKEN 70KB
-- Esegui questo script nel Supabase SQL Editor

-- 1. ANALISI: Trova utenti con metadata grandi
SELECT 
  id,
  email,
  LENGTH(raw_user_meta_data::text) as user_metadata_size,
  LENGTH(raw_app_meta_data::text) as app_metadata_size,
  LENGTH(raw_user_meta_data::text) + LENGTH(raw_app_meta_data::text) as total_metadata_size
FROM auth.users
WHERE LENGTH(raw_user_meta_data::text) + LENGTH(raw_app_meta_data::text) > 1000
ORDER BY total_metadata_size DESC;

-- 2. BACKUP: Salva i metadata originali prima di pulire
CREATE TABLE IF NOT EXISTS public.user_metadata_backup (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  raw_user_meta_data JSONB,
  raw_app_meta_data JSONB,
  backed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.user_metadata_backup (user_id, raw_user_meta_data, raw_app_meta_data)
SELECT id, raw_user_meta_data, raw_app_meta_data
FROM auth.users
WHERE LENGTH(raw_user_meta_data::text) + LENGTH(raw_app_meta_data::text) > 1000
ON CONFLICT (id) DO NOTHING;

-- 3. PULIZIA: Mantieni solo campi essenziali in user_metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'full_name', COALESCE(raw_user_meta_data->>'full_name', ''),
  'first_name', COALESCE(raw_user_meta_data->>'first_name', ''),
  'last_name', COALESCE(raw_user_meta_data->>'last_name', ''),
  'avatar_url', COALESCE(raw_user_meta_data->>'avatar_url', '')
)
WHERE LENGTH(raw_user_meta_data::text) > 1000;

-- 4. PULIZIA: Svuota app_metadata (di solito non necessario)
UPDATE auth.users
SET raw_app_meta_data = '{}'::jsonb
WHERE LENGTH(raw_app_meta_data::text) > 100;

-- 5. VERIFICA: Controlla le dimensioni dopo la pulizia
SELECT 
  id,
  email,
  LENGTH(raw_user_meta_data::text) as user_metadata_size_after,
  LENGTH(raw_app_meta_data::text) as app_metadata_size_after,
  LENGTH(raw_user_meta_data::text) + LENGTH(raw_app_meta_data::text) as total_metadata_size_after
FROM auth.users
ORDER BY total_metadata_size_after DESC
LIMIT 10;

-- 6. REVOCA TOKEN ESISTENTI (forza re-login con token puliti)
-- ATTENZIONE: Questo farà logout tutti gli utenti!
-- Commenta queste righe se non vuoi forzare il logout

UPDATE auth.refresh_tokens 
SET revoked = true 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE LENGTH(raw_user_meta_data::text) + LENGTH(raw_app_meta_data::text) > 1000
);
