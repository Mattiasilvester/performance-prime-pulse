-- Create storage bucket for workout files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-files',
  'workout-files',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
);

-- Create storage policies for workout files
CREATE POLICY "Users can upload their own workout files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workout-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own workout files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'workout-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own workout files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workout-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own workout files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workout-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
