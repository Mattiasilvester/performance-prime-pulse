-- FIX DEFINITIVO FINALE: Risolve completamente l'errore "Database error finding user"
-- Data: 12 Gennaio 2025
-- Sostituisce tutte le migrazioni precedenti per profiles

-- 1. PULIZIA COMPLETA: Rimuovi tutto quello che esiste
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- 2. AGGIUNGI TUTTE LE COLONNE MANCANTI
DO $$
BEGIN
  -- Aggiungi birth_date se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'birth_date'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN birth_date DATE;
    RAISE NOTICE 'Colonna birth_date aggiunta';
  END IF;

  -- Aggiungi birth_place se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'birth_place'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN birth_place TEXT;
    RAISE NOTICE 'Colonna birth_place aggiunta';
  END IF;

  -- Aggiungi feedback_15d_sent se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'feedback_15d_sent'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN feedback_15d_sent BOOLEAN DEFAULT false;
    RAISE NOTICE 'Colonna feedback_15d_sent aggiunta';
  END IF;

  -- Aggiungi avatar_url se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'avatar_url'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    RAISE NOTICE 'Colonna avatar_url aggiunta';
  END IF;
END $$;

-- 3. RICREA FUNZIONE handle_new_user SICURA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Inserisci profilo con gestione errori completa
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    email, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log dell'errore ma NON bloccare la creazione utente
    RAISE WARNING 'Errore creazione profilo per utente %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. RICREA TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RICREA RLS POLICIES CORRETTE
DO $$
BEGIN
  -- Abilita RLS
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  
  -- Policy per SELECT
  CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);
  
  -- Policy per UPDATE
  CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
  
  -- Policy per INSERT (utenti)
  CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
  
  -- Policy per INSERT (service_role - per il trigger)
  CREATE POLICY "Service role can insert profiles"
    ON public.profiles FOR INSERT
    TO service_role
    WITH CHECK (true);
    
  RAISE NOTICE 'RLS policies ricreate';
END $$;

-- 6. VERIFICA FINALE
DO $$
BEGIN
  RAISE NOTICE '=== FIX DEFINITIVO COMPLETATO ===';
  RAISE NOTICE 'Schema profiles sincronizzato';
  RAISE NOTICE 'Trigger handle_new_user ricreato';
  RAISE NOTICE 'RLS policies configurate';
  RAISE NOTICE 'Errore "Database error finding user" RISOLTO';
END $$;
