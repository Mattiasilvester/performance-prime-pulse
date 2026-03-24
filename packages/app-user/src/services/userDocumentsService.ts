import { supabase } from '@/integrations/supabase/client';

export type DocumentCategory =
  | 'scheda_pt'
  | 'piano_nutrizione'
  | 'documento_medico'
  | 'altro';

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  scheda_pt: 'Scheda PT',
  piano_nutrizione: 'Piano nutrizione',
  documento_medico: 'Documento medico',
  altro: 'Altro',
};

export interface UserDocument {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: DocumentCategory;
  created_at: string;
  updated_at: string;
}

const BUCKET = 'user-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const userDocumentsService = {
  async getDocuments(): Promise<UserDocument[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Utente non autenticato');
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as UserDocument[];
  },

  async uploadDocument(
    file: File,
    name: string,
    category: DocumentCategory
  ): Promise<UserDocument> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Utente non autenticato');
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File troppo grande. Massimo 10MB consentiti.');
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato non supportato. Usa PDF, JPG o PNG.');
    }
    const ext = file.name.split('.').pop() ?? 'pdf';
    const filePath = `${user.id}/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data, error: dbError } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        name: name.trim(),
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category,
      })
      .select()
      .maybeSingle();
    if (dbError) {
      await supabase.storage.from(BUCKET).remove([filePath]);
      throw dbError;
    }
    if (!data) throw new Error('Errore salvataggio documento');
    return data as UserDocument;
  },

  async getSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  },

  async deleteDocument(doc: UserDocument): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([doc.file_path]);
    if (storageError) throw storageError;
    const { error: dbError } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', doc.id);
    if (dbError) throw dbError;
  },

  async renameDocument(id: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('user_documents')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
};
