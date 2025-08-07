-- Create table for workout attachments
CREATE TABLE public.workout_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES public.custom_workouts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL, -- 'image/jpeg', 'image/png', 'application/pdf'
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.workout_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workout attachments" 
  ON public.workout_attachments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout attachments" 
  ON public.workout_attachments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout attachments" 
  ON public.workout_attachments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout attachments" 
  ON public.workout_attachments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_workout_attachments_workout_id ON public.workout_attachments(workout_id);
CREATE INDEX idx_workout_attachments_user_id ON public.workout_attachments(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workout_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_workout_attachments_updated_at_trigger
  BEFORE UPDATE ON public.workout_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_attachments_updated_at();
