-- Step 3 onboarding: selezione multipla professione.
-- Aggiunge colonna professions TEXT[] (retrocompat: category resta la prima professione).

-- 1. Aggiungi colonna professions (nullable per retrocompatibilità)
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS professions TEXT[];

-- 2. Backfill: record esistenti hanno professions = ARRAY[category]
UPDATE public.professionals
  SET professions = ARRAY[category::text]
  WHERE professions IS NULL AND category IS NOT NULL;

-- 3. Trigger: legge categories (array) da metadata; altrimenti category (stringa)
CREATE OR REPLACE FUNCTION public.handle_new_professional_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  arr_cert text[];
  arr_titolo text[];
  arr_professions text[];
  cat_single public.professional_category;
BEGIN
  IF (NEW.raw_user_meta_data->>'role') IS DISTINCT FROM 'professional' THEN
    RETURN NEW;
  END IF;

  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  -- Certificazioni (array)
  IF meta ? 'certificazioni' AND jsonb_typeof(meta->'certificazioni') = 'array' THEN
    SELECT array_agg(x) INTO arr_cert
    FROM jsonb_array_elements_text(meta->'certificazioni') AS x;
  END IF;
  arr_cert := COALESCE(arr_cert, '{}');

  -- Titolo studio: array JSON o stringa (legacy)
  IF meta ? 'titolo_studio' AND jsonb_typeof(meta->'titolo_studio') = 'array' THEN
    SELECT array_agg(x) INTO arr_titolo
    FROM jsonb_array_elements_text(meta->'titolo_studio') AS x
    WHERE x IS NOT NULL AND TRIM(x) != '';
  ELSIF meta ? 'titolo_studio' AND meta->>'titolo_studio' IS NOT NULL AND TRIM(meta->>'titolo_studio') != '' THEN
    arr_titolo := ARRAY[TRIM(meta->>'titolo_studio')];
  END IF;

  -- Professioni: array JSON (categories) o singola category (legacy)
  IF meta ? 'categories' AND jsonb_typeof(meta->'categories') = 'array' THEN
    SELECT array_agg(x) INTO arr_professions
    FROM jsonb_array_elements_text(meta->'categories') AS x
    WHERE x IS NOT NULL AND TRIM(x) != '';
  END IF;
  IF arr_professions IS NULL OR array_length(arr_professions, 1) IS NULL THEN
    IF meta ? 'category' AND meta->>'category' IS NOT NULL AND TRIM(meta->>'category') != '' THEN
      arr_professions := ARRAY[TRIM(meta->>'category')];
    ELSE
      arr_professions := ARRAY['pt'];
    END IF;
  END IF;
  -- Prima professione per colonna category (retrocompat)
  cat_single := (CASE
    WHEN arr_professions[1] IN ('pt','nutrizionista','fisioterapista','mental_coach','osteopata') THEN arr_professions[1]
    WHEN arr_professions[1] = 'altro' THEN 'pt'
    ELSE 'pt'
  END)::public.professional_category;

  INSERT INTO public.professionals (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    category,
    professions,
    zona,
    bio,
    company_name,
    titolo_studio,
    specializzazioni,
    approval_status,
    approved_at,
    attivo,
    is_partner,
    modalita,
    prezzo_seduta,
    prezzo_fascia,
    rating,
    reviews_count,
    birth_date,
    birth_place,
    vat_number,
    vat_address,
    vat_postal_code,
    vat_city
  ) VALUES (
    NEW.id,
    COALESCE(meta->>'first_name', ''),
    COALESCE(meta->>'last_name', ''),
    COALESCE(LOWER(NEW.email), LOWER(meta->>'email'), ''),
    COALESCE(meta->>'phone', ''),
    cat_single,
    arr_professions,
    COALESCE(meta->>'city', ''),
    meta->>'bio',
    COALESCE(meta->>'company_name', COALESCE(meta->>'first_name', '') || ' ' || COALESCE(meta->>'last_name', '')),
    arr_titolo,
    arr_cert,
    'approved',
    now(),
    true,
    false,
    COALESCE(meta->>'modalita', 'entrambi'),
    (NULLIF(TRIM(meta->>'prezzo_seduta'), '')::numeric),
    COALESCE(meta->>'prezzo_fascia', '€€'),
    0,
    0,
    COALESCE(meta->>'birth_date', '1990-01-01'),
    COALESCE(meta->>'city', ''),
    COALESCE(meta->>'vat_number', 'PENDING'),
    COALESCE(meta->>'vat_address', 'Da completare'),
    COALESCE(meta->>'vat_postal_code', '00000'),
    COALESCE(meta->>'vat_city', meta->>'city', '')
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_professional_signup: %', SQLERRM;
    RETURN NEW;
END;
$$;
