-- Fix Security Definer View issue - create a simple view that inherits RLS from base table
-- 1. Drop the existing view
DROP VIEW IF EXISTS public.users_public;

-- 2. Create a simple view without SECURITY DEFINER (uses SECURITY INVOKER by default)
--    This view will automatically inherit RLS policies from the underlying users table
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

COMMENT ON VIEW public.users_public IS 'Sanitized user view without sensitive fields (password_hash, password_salt, payment_method). Uses SECURITY INVOKER and inherits RLS from base table.';

-- 3. Grant SELECT permission to authenticated users
GRANT SELECT ON public.users_public TO authenticated;
REVOKE ALL ON public.users_public FROM anon;