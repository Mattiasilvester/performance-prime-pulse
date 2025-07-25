-- Phase 1: Fix critical database security issues
-- Update handle_new_user function with immutable search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Update update_workout_stats function with immutable search path
CREATE OR REPLACE FUNCTION public.update_workout_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
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