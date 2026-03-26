ALTER TABLE public.user_documents
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS parsed_at timestamptz,
  ADD COLUMN IF NOT EXISTS parsing_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS parse_error text,
  ADD COLUMN IF NOT EXISTS workout_json jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_documents_source_check'
  ) THEN
    ALTER TABLE public.user_documents
      ADD CONSTRAINT user_documents_source_check
      CHECK (source IN ('user', 'pt'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_documents_parsing_status_check'
  ) THEN
    ALTER TABLE public.user_documents
      ADD CONSTRAINT user_documents_parsing_status_check
      CHECK (parsing_status IN ('pending', 'processing', 'done', 'error'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_documents_source
  ON public.user_documents(source);
CREATE INDEX IF NOT EXISTS idx_user_documents_parsing_status
  ON public.user_documents(parsing_status);
