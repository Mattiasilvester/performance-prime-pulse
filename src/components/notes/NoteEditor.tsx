import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateInput, sanitizeText } from '@/lib/security';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface NoteEditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onDelete,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Errore",
        description: "Il contenuto della nota non può essere vuoto.",
        variant: "destructive",
      });
      return;
    }

    // Input validation
    if (!validateInput.textLength(title, 200)) {
      toast({
        title: "Errore",
        description: "Il titolo deve essere massimo 200 caratteri.",
        variant: "destructive",
      });
      return;
    }

    if (!validateInput.textLength(content, 10000)) {
      toast({
        title: "Errore",
        description: "Il contenuto deve essere massimo 10.000 caratteri.",
        variant: "destructive",
      });
      return;
    }

    if (!validateInput.noScriptTags(content) || !validateInput.noScriptTags(title)) {
      toast({
        title: "Errore",
        description: "Contenuto non consentito rilevato.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Sanitize inputs
      const sanitizedTitle = sanitizeText(title.trim());
      const sanitizedContent = sanitizeText(content.trim());
      
      const finalTitle = sanitizedTitle || sanitizedContent.split('\n')[0].substring(0, 50) || 'Nota senza titolo';

      if (note) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update({
            title: finalTitle,
            content: sanitizedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', note.id)
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert({
            title: finalTitle,
            content: sanitizedContent,
            user_id: user.id
          })
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      }

      toast({
        title: "Salvato!",
        description: "La nota è stata salvata con successo.",
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare la nota.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    if (!confirm('Sei sicuro di voler eliminare questa nota?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Note deleted successfully from database');
      onDelete(note.id);
      
      toast({
        title: "Nota eliminata",
        description: "La nota è stata eliminata definitivamente.",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la nota.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            size="sm"
            className="bg-[#EEBA2B] hover:bg-[#EEBA2B]/80 text-black py-1.5 px-3 text-xs"
          >
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? 'Salvando...' : 'Salva'}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="border-border-primary text-text-primary hover:bg-surface-secondary hover:text-text-primary py-1.5 px-2 text-xs"
          >
            Annulla
          </Button>
        </div>
        {note && (
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="outline"
            size="sm"
            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white py-1.5 px-2 text-xs"
          >
            <Trash2 className="h-3 w-3" />
            {isDeleting ? '...' : ''}
          </Button>
        )}
      </div>

      <div className="flex-1 p-4 space-y-4">
        <Input
          placeholder="Titolo della nota..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent border-none text-xl font-medium text-white placeholder:text-gray-500 focus:ring-0 px-0"
        />
        <Textarea
          placeholder="Inizia a scrivere la tua nota..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 px-0 min-h-[400px] resize-none"
        />
      </div>
    </div>
  );
};
