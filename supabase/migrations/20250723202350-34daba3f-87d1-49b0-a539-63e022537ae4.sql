-- Create table for monthly workout statistics
CREATE TABLE public.monthly_workout_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  total_workouts INTEGER NOT NULL DEFAULT 0,
  total_hours INTEGER NOT NULL DEFAULT 0, -- stored in minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.monthly_workout_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own monthly stats" 
ON public.monthly_workout_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monthly stats" 
ON public.monthly_workout_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly stats" 
ON public.monthly_workout_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate monthly records
CREATE UNIQUE INDEX idx_monthly_stats_user_month_year 
ON public.monthly_workout_stats (user_id, month, year);