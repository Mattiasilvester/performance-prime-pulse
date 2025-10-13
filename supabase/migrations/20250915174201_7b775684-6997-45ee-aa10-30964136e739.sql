-- Review and fix SECURITY DEFINER functions - only change ones that are safe to change
-- Keep handle_new_user and update_workout_stats as SECURITY DEFINER (they need elevated privileges)
-- But validate_password_strength can be made SECURITY INVOKER

-- 1. Recreate validate_password_strength as SECURITY INVOKER (safer)
CREATE OR REPLACE FUNCTION public.validate_password_strength(password_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from DEFINER to INVOKER
SET search_path = public
AS $function$
BEGIN
  -- Check minimum length
  IF length(password_text) < 8 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for lowercase letter
  IF password_text !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for uppercase letter
  IF password_text !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for digit
  IF password_text !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for special character
  IF password_text !~ '[!@#$%^&*]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

COMMENT ON FUNCTION public.validate_password_strength(text) IS 'Validates password strength - uses SECURITY INVOKER for safety';