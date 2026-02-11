/**
 * Area upload allegati per progetto: sotto il campo Note.
 * Drag & drop, max 5 file, 10MB ciascuno. Preview immagini / icona file.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip, FileText, X } from 'lucide-react';
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
            {/* DX: icona elimina */}
            {onDeleteExisting && (
              <button
                type="button"
                onClick={() => onDeleteExisting(att)}
                disabled={disabled}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                aria-label="Rimuovi allegato"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
    </div>
  );
}
