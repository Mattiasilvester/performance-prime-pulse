-- Fix critical database security issues identified in security review

-- 1. Fix Function Search Path - Update existing functions to use immutable search_path
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- Recreate the trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Fix update_workout_stats function search_path
DROP FUNCTION IF EXISTS public.update_workout_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.update_workout_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update stats when workout is marked as completed
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    INSERT INTO public.user_workout_stats (user_id, total_workouts, total_hours)
    VALUES (NEW.user_id, 1, COALESCE(NEW.total_duration, 0))
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_workouts = user_workout_stats.total_workouts + 1,
      total_hours = user_workout_stats.total_hours + COALESCE(NEW.total_duration, 0),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Fix update_updated_at_column function search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 4. Add password strength validation function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password_text text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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