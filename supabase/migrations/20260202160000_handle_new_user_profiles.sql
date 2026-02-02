-- Creazione profilo in public.profiles quando un utente si registra (auth.users).
-- Necessario affinché Analytics e Pulse Check vedano i nuovi utenti B2C e i professionisti.
-- Esegue con SECURITY DEFINER per bypassare RLS. Se il trigger manca, i conteggi restano 0.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, meta->>'email'),
    COALESCE(meta->>'full_name', TRIM(COALESCE(meta->>'first_name', '') || ' ' || COALESCE(meta->>'last_name', ''))),
    COALESCE(meta->>'first_name', ''),
    COALESCE(meta->>'last_name', ''),
    COALESCE(meta->>'role', 'user'),
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea/aggiorna profilo in public.profiles ad ogni nuovo utente auth. Necessario per Analytics (crescita utenti B2C) e Pulse Check.';
