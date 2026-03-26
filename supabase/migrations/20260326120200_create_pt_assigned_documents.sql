CREATE TABLE IF NOT EXISTS public.pt_assigned_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id)
    ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id)
    ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id)
    ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL DEFAULT 'application/pdf',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pt_assigned_docs_professional_id
  ON public.pt_assigned_documents(professional_id);
CREATE INDEX IF NOT EXISTS idx_pt_assigned_docs_client_id
  ON public.pt_assigned_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_pt_assigned_docs_user_id
  ON public.pt_assigned_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_pt_assigned_docs_created_at
  ON public.pt_assigned_documents(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pt_assigned_documents
  ON public.pt_assigned_documents
  (professional_id, client_id, user_id, file_path);

ALTER TABLE public.pt_assigned_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pt_assigned_select_professional" ON public.pt_assigned_documents;
CREATE POLICY "pt_assigned_select_professional"
  ON public.pt_assigned_documents FOR SELECT
  USING (
    professional_id IN (
      SELECT id FROM public.professionals WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pt_assigned_insert_professional" ON public.pt_assigned_documents;
CREATE POLICY "pt_assigned_insert_professional"
  ON public.pt_assigned_documents FOR INSERT
  WITH CHECK (
    professional_id IN (
      SELECT id FROM public.professionals WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pt_assigned_select_user" ON public.pt_assigned_documents;
CREATE POLICY "pt_assigned_select_user"
  ON public.pt_assigned_documents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pt_assigned_delete_professional" ON public.pt_assigned_documents;
CREATE POLICY "pt_assigned_delete_professional"
  ON public.pt_assigned_documents FOR DELETE
  USING (
    professional_id IN (
      SELECT id FROM public.professionals WHERE user_id = auth.uid()
    )
  );
