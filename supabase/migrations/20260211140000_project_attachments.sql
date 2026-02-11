-- FEATURE 2: Allegati file (foto, PDF, documenti) nel progetto cliente.
-- Tabella project_attachments + RLS. Bucket storage: creare da Dashboard o via client (vedi sotto).

-- 1. Tabella project_attachments
CREATE TABLE IF NOT EXISTS public.project_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON public.project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_professional_id ON public.project_attachments(professional_id);

COMMENT ON TABLE public.project_attachments IS 'Allegati file (PDF, immagini, documenti) associati ai progetti cliente. Storage path: project-attachments/{professional_id}/{client_id}/{project_id}/{filename}';

-- 2. RLS su project_attachments (solo il professionista proprietario)
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_attachments_select_own" ON public.project_attachments;
CREATE POLICY "project_attachments_select_own"
  ON public.project_attachments FOR SELECT
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "project_attachments_insert_own" ON public.project_attachments;
CREATE POLICY "project_attachments_insert_own"
  ON public.project_attachments FOR INSERT
  WITH CHECK (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "project_attachments_delete_own" ON public.project_attachments;
CREATE POLICY "project_attachments_delete_own"
  ON public.project_attachments FOR DELETE
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

-- 3. Bucket Storage "project-attachments" (se storage.buckets è disponibile)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'project-attachments',
      'project-attachments',
      false,
      10485760,
      ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']::text[]
    )
    ON CONFLICT (id) DO UPDATE SET
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;

-- 4. RLS su storage.objects per bucket project-attachments (path: professional_id/client_id/project_id/filename)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DROP POLICY IF EXISTS "project_attachments_storage_select" ON storage.objects;
    CREATE POLICY "project_attachments_storage_select"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'project-attachments'
        AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.professionals WHERE user_id = auth.uid())
      );

    DROP POLICY IF EXISTS "project_attachments_storage_insert" ON storage.objects;
    CREATE POLICY "project_attachments_storage_insert"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'project-attachments'
        AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.professionals WHERE user_id = auth.uid())
      );

    DROP POLICY IF EXISTS "project_attachments_storage_delete" ON storage.objects;
    CREATE POLICY "project_attachments_storage_delete"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'project-attachments'
        AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.professionals WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- Se il bucket non esiste dopo la migrazione: crearlo da Dashboard Supabase → Storage → New bucket
-- id = project-attachments, Private, file size limit 10MB, allowed MIME types come sopra.
