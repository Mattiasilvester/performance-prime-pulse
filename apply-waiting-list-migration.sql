-- Apply waiting_list table migration
-- Execute this in Supabase SQL Editor

-- Create waiting_list table for landing page email collection
CREATE TABLE IF NOT EXISTS public.waiting_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'registered')),
  source TEXT DEFAULT 'landing_page',
  notes TEXT
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON public.waiting_list(email);
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON public.waiting_list(status);
CREATE INDEX IF NOT EXISTS idx_waiting_list_created_at ON public.waiting_list(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting new emails (anyone can add to waiting list)
CREATE POLICY "Allow insert to waiting_list" ON public.waiting_list
  FOR INSERT WITH CHECK (true);

-- Create policy for reading waiting list (only authenticated users can read)
CREATE POLICY "Allow read waiting_list for authenticated users" ON public.waiting_list
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for updating waiting list (only authenticated users can update)
CREATE POLICY "Allow update waiting_list for authenticated users" ON public.waiting_list
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at column
CREATE TRIGGER update_waiting_list_updated_at
  BEFORE UPDATE ON public.waiting_list
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.waiting_list IS 'Email addresses collected from landing page waiting list';
COMMENT ON COLUMN public.waiting_list.email IS 'User email address';
COMMENT ON COLUMN public.waiting_list.status IS 'Status: pending, contacted, registered';
COMMENT ON COLUMN public.waiting_list.source IS 'Source of the email (landing_page, etc.)';
COMMENT ON COLUMN public.waiting_list.notes IS 'Additional notes about the user';

-- Test insert to verify table works
INSERT INTO public.waiting_list (email, notes) 
VALUES ('test@example.com', 'Test migration') 
ON CONFLICT (email) DO NOTHING;

-- Show the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'waiting_list' 
AND table_schema = 'public'
ORDER BY ordinal_position; 