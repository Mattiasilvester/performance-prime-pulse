import { supabase } from '@/integrations/supabase/client';

const PROJECT_ATTACHMENTS_BUCKET = 'project-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export interface AssignDocumentParams {
  professionalId: string;
  clientId: string;
  file: File;
  documentName: string;
}

export interface AssignDocumentResult {
  success: boolean;
  assignmentId?: string;
  userDocumentId?: string;
  alreadyAssigned?: boolean;
  error?: string;
}

export interface PtAssignedDocument {
  id: string;
  professional_id: string;
  client_id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getEdgeFunctionUrl(): string {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error('VITE_SUPABASE_URL non configurata');
  }
  return `${baseUrl}/functions/v1/copy-document-to-user`;
}

function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File troppo grande. Massimo 10MB consentiti, ricevuti ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new Error('Tipo file non supportato. Formati ammessi: PDF, JPEG, PNG.');
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadAndAssign(params: AssignDocumentParams): Promise<AssignDocumentResult> {
  const { professionalId, clientId, file, documentName } = params;
  validateFile(file);

  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(file.name);
  const sourceFilePath = `${professionalId}/schede/${clientId}/${timestamp}_${sanitizedName}`;

  // 1) Upload in project-attachments (PrimePro source of truth)
  const { error: uploadError } = await supabase.storage
    .from(PROJECT_ATTACHMENTS_BUCKET)
    .upload(sourceFilePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return {
      success: false,
      error: `Upload fallito: ${uploadError.message}`,
    };
  }

  // 2) Chiama edge function con bearer token sessione corrente
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    await supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).remove([sourceFilePath]);
    return {
      success: false,
      error: 'Sessione non valida. Effettua nuovamente il login.',
    };
  }

  try {
    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        professional_id: professionalId,
        client_id: clientId,
        source_file_path: sourceFilePath,
        source_file_name: documentName,
        source_file_size: file.size,
        source_file_type: file.type,
      }),
    });

    type EdgeSuccess = {
      success: true;
      assignment_id: string;
      user_document_id: string | null;
      already_assigned: boolean;
    };

    type EdgeError = {
      success: false;
      error?: { code?: string; message?: string };
    };

    const payload = (await response.json().catch(() => null)) as EdgeSuccess | EdgeError | null;

    if (!response.ok || !payload || payload.success === false) {
      // Cleanup best-effort del file sorgente appena uploadato in caso di errore edge
      await supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).remove([sourceFilePath]);
      const message =
        payload && 'error' in payload && payload.error?.message
          ? payload.error.message
          : 'Errore durante assegnazione documento.';
      return {
        success: false,
        error: message,
      };
    }

    return {
      success: true,
      assignmentId: payload.assignment_id,
      userDocumentId: payload.user_document_id ?? undefined,
      alreadyAssigned: payload.already_assigned,
    };
  } catch (error) {
    await supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).remove([sourceFilePath]);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore di rete durante assegnazione documento.',
    };
  }
}

export async function getAssignedDocuments(
  professionalId: string,
  clientId: string
): Promise<PtAssignedDocument[]> {
  const { data, error } = await supabase
    .from('pt_assigned_documents')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Errore caricamento documenti assegnati: ${error.message}`);
  }

  return (data ?? []) as PtAssignedDocument[];
}

export async function deleteAssignedDocument(
  assignmentId: string,
  _filePath: string
): Promise<void> {
  const { error } = await supabase
    .from('pt_assigned_documents')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    throw new Error(`Errore eliminazione assegnazione: ${error.message}`);
  }
}
