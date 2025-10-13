-- Secure the public.users table by enforcing least privilege and preventing exposure of sensitive columns
-- 1) Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2) Tighten SELECT policy to ensure users can access only their own row
--    Replace any existing SELECT policy with a clear one
DROP POLICY IF EXISTS "Users can view own basic data only" ON public.users;
CREATE POLICY "Users can select own row only"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 3) Keep existing UPDATE policy (if exists) to allow users to update their own basic data
--    Re-create defensively to ensure it exists and is correct
DROP POLICY IF EXISTS "Users can update own basic data only" ON public.users;
CREATE POLICY "Users can update own row only"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4) Revoke direct access on sensitive base table for app roles
REVOKE SELECT, INSERT, DELETE, UPDATE ON TABLE public.users FROM anon;
REVOKE SELECT, INSERT, DELETE ON TABLE public.users FROM authenticated;
-- Prevent updates to sensitive columns even if table UPDATE is granted in future
REVOKE UPDATE(password_hash, password_salt, payment_method) ON public.users FROM authenticated;

-- 5) Create a sanitized view that exposes only non-sensitive fields
CREATE OR REPLACE VIEW public.users_public AS
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

COMMENT ON VIEW public.users_public IS 'Sanitized user view without sensitive fields (password_hash, password_salt, payment_method)';

-- 6) Grant read access to the sanitized view to authenticated users only
GRANT SELECT ON public.users_public TO authenticated;
REVOKE ALL ON public.users_public FROM anon;

-- 7) Verification queries (no-op in migration, but useful for SQL editor runs)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
-- SELECT * FROM public.users_public LIMIT 1;