-- Fix trigger handle_new_professional_signup: prezzo_seduta vuoto non deve far fallire l'INSERT.
-- NULLIF(TRIM(...), '') evita errore su ''::numeric quando prezzo_seduta è stringa vuota nei metadata.

CREATE OR REPLACE FUNCTION public.handle_new_professional_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  arr_cert text[];
BEGIN
  IF (NEW.raw_user_meta_data->>'role') IS DISTINCT FROM 'professional' THEN
    RETURN NEW;
  END IF;

  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  IF meta ? 'certificazioni' AND jsonb_typeof(meta->'certificazioni') = 'array' THEN
    SELECT array_agg(x) INTO arr_cert
    FROM jsonb_array_elements_text(meta->'certificazioni') AS x;
  END IF;
  arr_cert := COALESCE(arr_cert, '{}');

  INSERT INTO public.professionals (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    category,
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
    (CASE WHEN (meta->>'category') IN ('pt','nutrizionista','fisioterapista','mental_coach','osteopata') THEN (meta->>'category') WHEN (meta->>'category') = 'altro' THEN 'pt' ELSE 'pt' END)::public.professional_category,
    COALESCE(meta->>'city', ''),
    meta->>'bio',
    COALESCE(meta->>'company_name', COALESCE(meta->>'first_name', '') || ' ' || COALESCE(meta->>'last_name', '')),
    meta->>'titolo_studio',
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
