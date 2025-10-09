import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Image, X, Download, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WorkoutAttachment {
  id: string;
  workout_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

interface WorkoutAttachmentsProps {
  workoutId: string;
  onAttachmentsChange?: () => void;
}

export const WorkoutAttachments = ({ workoutId, onAttachmentsChange }: WorkoutAttachmentsProps) => {
  const [attachments, setAttachments] = useState<WorkoutAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carica gli allegati esistenti
  const loadAttachments = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_attachments')
        .select('*')
        .eq('workout_id', workoutId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli allegati.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisce l'upload dei file
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user) return;

    setIsUploading(true);
    const uploadedFiles: WorkoutAttachment[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validazione file
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        if (file.size > maxSize) {
          toast({
            title: "File troppo grande",
            description: `${file.name} supera i 10MB consentiti.`,
            variant: "destructive",
          });
          continue;
        }

        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Tipo file non supportato",
            description: `${file.name} non è un file supportato. Usa JPEG, PNG o PDF.`,
            variant: "destructive",
          });
          continue;
        }

        // Upload su Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `workout-attachments/${workoutId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('workout-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Errore upload",
            description: `Impossibile caricare ${file.name}.`,
            variant: "destructive",
          });
          continue;
        }

        // Salva record nel database
        const { data: attachment, error: dbError } = await supabase
          .from('workout_attachments')
          .insert({
            workout_id: workoutId,
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            mime_type: file.type,
          })
          .select('id, workout_id, user_id, filename, file_url, file_size, mime_type, created_at')
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          // Rimuovi il file caricato se il record non è stato salvato
          await supabase.storage.from('workout-files').remove([filePath]);
          toast({
            title: "Errore salvataggio",
            description: `Impossibile salvare ${file.name}.`,
            variant: "destructive",
          });
          continue;
        }

        uploadedFiles.push(attachment);
      }

      if (uploadedFiles.length > 0) {
        setAttachments(prev => [...uploadedFiles, ...prev]);
        toast({
          title: "Upload completato",
          description: `${uploadedFiles.length} file caricati con successo.`,
        });
        onAttachmentsChange?.();
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Elimina un allegato
  const deleteAttachment = async (attachment: WorkoutAttachment) => {
    if (!user) return;

    try {
      // Rimuovi il file dallo storage
      const { error: storageError } = await supabase.storage
        .from('workout-files')
        .remove([attachment.file_path]);

      if (storageError) {
        console.error('Storage error:', storageError);
      }

      // Rimuovi il record dal database
      const { error: dbError } = await supabase
        .from('workout_attachments')
        .delete()
        .eq('id', attachment.id)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      toast({
        title: "Allegato eliminato",
        description: `${attachment.file_name} è stato rimosso.`,
      });
      onAttachmentsChange?.();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'allegato.",
        variant: "destructive",
      });
    }
  };

  // Scarica un allegato
  const downloadAttachment = async (attachment: WorkoutAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('workout-files')
        .download(attachment.file_path);

      if (error) throw error;

      // Crea un link per il download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download avviato",
        description: `${attachment.file_name} in download.`,
      });
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: "Errore",
        description: "Impossibile scaricare l'allegato.",
        variant: "destructive",
      });
    }
  };

  // Visualizza un allegato
  const viewAttachment = async (attachment: WorkoutAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('workout-files')
        .createSignedUrl(attachment.file_path, 60); // URL valido per 60 secondi

      if (error) throw error;

      // Apri in nuova scheda
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing attachment:', error);
      toast({
        title: "Errore",
        description: "Impossibile visualizzare l'allegato.",
        variant: "destructive",
      });
    }
  };

  // Formatta la dimensione del file
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ottieni l'icona per il tipo di file
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'application/pdf') return FileText;
    return FileText;
  };

  // Carica gli allegati all'avvio
  useEffect(() => {
    loadAttachments();
  }, [workoutId]);

  return (
    <Card className="bg-black border-2 border-[#EEBA2B]">
      <CardHeader>
        <CardTitle className="text-[#EEBA2B] flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Allegati Allenamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-[#EEBA2B]/50 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-[#EEBA2B] text-black hover:bg-[#EEBA2B]/80"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                Caricamento...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Carica File
              </>
            )}
          </Button>
          <p className="text-sm text-gray-400 mt-2">
            Supporta JPEG, PNG e PDF (max 10MB per file)
          </p>
        </div>

        {/* Lista Allegati */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EEBA2B] mx-auto"></div>
            <p className="text-gray-400 mt-2">Caricamento allegati...</p>
          </div>
        ) : attachments.length > 0 ? (
          <div className="space-y-3">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.mime_type);
              const isImage = attachment.mime_type.startsWith('image/');
              
              return (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileIcon className="h-5 w-5 text-[#EEBA2B] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {attachment.file_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(attachment.file_size)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {attachment.mime_type.split('/')[1].toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isImage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => viewAttachment(attachment)}
                        className="text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadAttachment(attachment)}
                      className="text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAttachment(attachment)}
                      className="text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessun allegato caricato</p>
            <p className="text-sm">Carica foto o PDF per documentare il tuo allenamento</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
