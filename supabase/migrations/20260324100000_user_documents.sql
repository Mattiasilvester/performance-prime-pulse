CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  category TEXT NOT NULL DEFAULT 'altro',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON user_documents(created_at DESC);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_documents_select_own" ON user_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_documents_insert_own" ON user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_documents_update_own" ON user_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_documents_delete_own" ON user_documents
  FOR DELETE USING (auth.uid() = user_id);
