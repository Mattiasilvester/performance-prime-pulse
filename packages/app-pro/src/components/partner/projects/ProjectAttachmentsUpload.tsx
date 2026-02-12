/**
 * Area upload allegati per progetto: sotto il campo Note.
 * Drag & drop, max 5 file, 10MB ciascuno. Preview immagini / icona file.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip, FileText, X, Eye, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMaxFilesPerProject,
  isFileAccepted,
  getSignedUrl,
  type ProjectAttachmentRow
} from '@/services/projectAttachmentsService';

const MAX = getMaxFilesPerProject();

interface ProjectAttachmentsUploadProps {
  professionalId: string;
  clientId: string;
  projectId: string | null;
  existingAttachments: ProjectAttachmentRow[];
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
  onDeleteExisting?: (attachment: ProjectAttachmentRow) => void;
  disabled?: boolean;
}

export default function ProjectAttachmentsUpload({
  existingAttachments,
  pendingFiles,
  onPendingFilesChange,
  onDeleteExisting,
  disabled = false
}: ProjectAttachmentsUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [existingImageUrls, setExistingImageUrls] = useState<Record<string, string>>({});
  const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewFileType, setPreviewFileType] = useState('');
  const totalCount = existingAttachments.length + pendingFiles.length;
  const canAdd = totalCount < MAX;

  // Signed URLs per miniature immagini (allegati esistenti)
  useEffect(() => {
    let cancelled = false;
    const imageAttachments = existingAttachments.filter((a) => (a.file_type || '').startsWith('image/'));
    if (imageAttachments.length === 0) {
      setExistingImageUrls({});
      return;
    }
    Promise.all(
      imageAttachments.map(async (att) => {
        try {
          const url = await getSignedUrl(att.file_path);
          return { id: att.id, url };
        } catch {
          return { id: att.id, url: '' };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      results.forEach(({ id, url }) => {
        if (url) map[id] = url;
      });
      setExistingImageUrls(map);
    });
    return () => {
      cancelled = true;
    };
  }, [existingAttachments]);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const list = Array.isArray(newFiles) ? newFiles : Array.from(newFiles);
      const toAdd: File[] = [];
      for (const file of list) {
        if (existingAttachments.length + pendingFiles.length + toAdd.length >= MAX) break;
        const result = isFileAccepted(file);
        if (result.ok) toAdd.push(file);
      }
      if (toAdd.length) onPendingFilesChange([...pendingFiles, ...toAdd]);
    },
    [existingAttachments.length, pendingFiles, onPendingFilesChange]
  );

  const removePending = useCallback(
    (index: number) => {
      onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
    },
    [pendingFiles, onPendingFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled || !canAdd || !e.dataTransfer.files.length) return;
      addFiles(e.dataTransfer.files);
    },
    [disabled, canAdd, addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) addFiles(files);
      e.target.value = '';
    },
    [addFiles]
  );

  const isImage = (file: File) => file.type.startsWith('image/');
  const isImageRow = (row: ProjectAttachmentRow) =>
    (row.file_type || '').startsWith('image/');

  const handleOpenExisting = useCallback(async (att: ProjectAttachmentRow) => {
    setOpeningAttachmentId(att.id);
    try {
      const url = await getSignedUrl(att.file_path);
      setPreviewUrl(url);
      setPreviewFileName(att.file_name);
      setPreviewFileType(att.file_type || 'application/octet-stream');
    } catch {
      toast.error('Impossibile aprire il file');
    } finally {
      setOpeningAttachmentId(null);
    }
  }, []);

  const closePreview = useCallback(() => {
    setPreviewUrl(null);
    setPreviewFileName('');
    setPreviewFileType('');
  }, []);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Allegati <span className="text-gray-400 font-normal">(max {MAX} file, 10MB ciascuno)</span>
      </label>

      {/* Area upload: tratteggiata, hover oro */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed rounded-xl p-4 transition-colors
          ${disabled || !canAdd ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-[#EEBA2B] bg-gray-50/50 hover:bg-amber-50/30 cursor-pointer'}
        `}
        onClick={() => canAdd && !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled || !canAdd}
        />
        <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
          <Paperclip className="w-8 h-8" />
          <span className="text-sm font-medium">Allega file</span>
          <span className="text-xs">PDF, immagini, documenti (doc, docx, xls, xlsx)</span>
          {!canAdd && (
            <span className="text-xs text-amber-600">Raggiunto il massimo di {MAX} file</span>
          )}
        </div>
      </div>

      {/* Lista existing + pending — card orizzontali: [miniatura SX] [nome+dimensione centro] [icone DX] */}
      <div className="space-y-2">
        {existingAttachments.map((att) => (
          <div
            key={att.id}
            className="flex flex-row items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white"
          >
            {/* SX: miniatura 60x60 o icona */}
            <div className="w-[60px] h-[60px] flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
              {isImageRow(att) && existingImageUrls[att.id] ? (
                <img
                  src={existingImageUrls[att.id]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-6 h-6 text-gray-500" />
              )}
            </div>
            {/* Centro: nome + dimensione */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" title={att.file_name}>
                {att.file_name}
              </p>
              <p className="text-sm text-gray-500">
                {(att.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
            {/* DX: azioni Apri + Elimina */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => void handleOpenExisting(att)}
                disabled={openingAttachmentId === att.id}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 text-[#EEBA2B] transition-colors disabled:opacity-50"
                aria-label="Apri allegato"
              >
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium">Apri</span>
              </button>
              {onDeleteExisting && (
                <button
                  type="button"
                  onClick={() => onDeleteExisting(att)}
                  disabled={disabled}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                  aria-label="Rimuovi allegato"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
        ))}

        {pendingFiles.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex flex-row items-center gap-3 p-3 rounded-xl border border-gray-200 bg-amber-50/50"
          >
            {/* SX: miniatura 60x60 o icona */}
            <div className="w-[60px] h-[60px] flex-shrink-0 rounded-lg bg-amber-100 overflow-hidden flex items-center justify-center">
              {isImage(file) ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-6 h-6 text-amber-700" />
              )}
            </div>
            {/* Centro: nome + dimensione */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {/* DX: rimuovi */}
            <button
              type="button"
              onClick={() => removePending(index)}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
              aria-label="Rimuovi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-[10001] bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/10">
            <span className="text-white text-sm truncate max-w-[70%]" title={previewFileName}>
              {previewFileName}
            </span>
            <button
              onClick={closePreview}
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Chiudi anteprima allegato"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            {previewFileType.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt={previewFileName}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : previewFileType === 'application/pdf' || previewFileName.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg bg-white"
                title={previewFileName}
              />
            ) : (
              <div className="text-center text-white max-w-md">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-60" />
                <p className="mb-2 break-words">{previewFileName}</p>
                <p className="text-sm text-gray-300 mb-5">
                  Anteprima non disponibile per questo tipo di file
                </p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEBA2B] text-black rounded-lg font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Apri nel browser
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
