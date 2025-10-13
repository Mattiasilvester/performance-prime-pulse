-- Fix Security Definer View issue by recreating the view properly
-- 1. Drop the existing view that may have SECURITY DEFINER
DROP VIEW IF EXISTS public.users_public;

-- 2. Create the view without SECURITY DEFINER (default is SECURITY INVOKER)
CREATE VIEW public.users_public AS
SELECT
  id,
  first_name,
  last_name,
  email,
  phone,
  category,
  created_at,
  updated_at
FROM public.users;

COMMENT ON VIEW public.users_public IS 'Sanitized user view without sensitive fields - uses SECURITY INVOKER';

-- 3. Enable RLS on the view itself
ALTER VIEW public.users_public SET (security_invoker = true);

-- 4. Create RLS policy for the view
CREATE POLICY "Users can view own data in public view"
ON public.users_public
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 5. Enable RLS on the view
ALTER VIEW public.users_public ENABLE ROW LEVEL SECURITY;

-- 6. Grant appropriate permissions
GRANT SELECT ON public.users_public TO authenticated;
REVOKE ALL ON public.users_public FROM anon;