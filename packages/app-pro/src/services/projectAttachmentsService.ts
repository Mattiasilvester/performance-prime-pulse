/**
 * Allegati file (PDF, immagini, documenti) per progetti cliente.
 * Storage: bucket project-attachments, path {professional_id}/{client_id}/{project_id}/{filename}
 */

import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'project-attachments';
const MAX_FILES_PER_PROJECT = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx'
] as const;

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export interface ProjectAttachmentRow {
  id: string;
  project_id: string;
  professional_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export function getMaxFilesPerProject(): number {
  return MAX_FILES_PER_PROJECT;
}

export function getMaxFileSizeBytes(): number {
  return MAX_FILE_SIZE_BYTES;
}

export function isFileAccepted(file: File): { ok: boolean; error?: string } {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: 'Tipo file non supportato. Usa PDF, immagini (jpg, png, webp) o documenti (doc, docx, xls, xlsx).' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `Dimensione massima 10MB. Questo file: ${(file.size / 1024 / 1024).toFixed(1)}MB` };
  }
  return { ok: true };
}

/**
 * Elenco allegati di un progetto.
 */
export async function listByProject(projectId: string): Promise<ProjectAttachmentRow[]> {
  const { data, error } = await supabase
    .from('project_attachments')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProjectAttachmentRow[];
}

/**
 * Upload un file e crea il record in project_attachments.
 * Path: {professional_id}/{client_id}/{project_id}/{unique}_{originalName}
 */
export async function uploadAttachment(
  params: {
    projectId: string;
    clientId: string;
    professionalId: string;
    file: File;
  }
): Promise<ProjectAttachmentRow> {
  const { projectId, clientId, professionalId, file } = params;
  const check = isFileAccepted(file);
  if (!check.ok) throw new Error(check.error);

  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
  const baseName = file.name.slice(0, file.name.length - ext.length).replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}_${baseName}${ext}`;
  const filePath = `${professionalId}/${clientId}/${projectId}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data: row, error: insertError } = await supabase
    .from('project_attachments')
    .insert({
      project_id: projectId,
      professional_id: professionalId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type || 'application/octet-stream',
      file_size: file.size
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    throw insertError;
  }
  return row as ProjectAttachmentRow;
}

/**
 * Elimina un allegato (storage + record).
 */
export async function deleteAttachment(attachment: ProjectAttachmentRow): Promise<void> {
  await supabase.storage.from(BUCKET).remove([attachment.file_path]);
  const { error } = await supabase
    .from('project_attachments')
    .delete()
    .eq('id', attachment.id);
  if (error) throw error;
}

/**
 * URL firmato per download (bucket privato). Scadenza 1 ora.
 */
export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error('URL non disponibile');
  return data.signedUrl;
}
