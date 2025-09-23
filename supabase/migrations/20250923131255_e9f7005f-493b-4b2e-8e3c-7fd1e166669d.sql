-- Set security_invoker on views to avoid definer-rights behavior
ALTER VIEW public.users_public SET (security_invoker = true);