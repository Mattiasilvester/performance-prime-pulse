
-- Create table for custom workouts
CREATE TABLE public.custom_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  workout_type TEXT NOT NULL, -- 'cardio', 'forza', 'hiit', 'mobilita', 'personalizzato'
  scheduled_date DATE NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]', -- Array of exercises with details
  total_duration INTEGER, -- in minutes
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.custom_workouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workouts" 
  ON public.custom_workouts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts" 
  ON public.custom_workouts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" 
  ON public.custom_workouts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" 
  ON public.custom_workouts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create table for user workout stats
CREATE TABLE public.user_workout_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  total_workouts INTEGER DEFAULT 0,
  total_hours INTEGER DEFAULT 0, -- total time in hours
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security for stats
ALTER TABLE public.user_workout_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" 
  ON public.user_workout_stats 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" 
  ON public.user_workout_stats 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats" 
  ON public.user_workout_stats 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Function to update workout stats when a workout is completed
CREATE OR REPLACE FUNCTION update_workout_stats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_workout_stats_trigger
  AFTER UPDATE ON public.custom_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_stats();
