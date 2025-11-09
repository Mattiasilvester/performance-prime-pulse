import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

// Interfaccia per le note
export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Interfaccia per il context
interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  loadNotes: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<Note | null>;
  updateNote: (id: string, title: string, content: string) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  getNoteById: (id: string) => Note | undefined;
}

// Context
const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Hook per usare il context
export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

// Provider component
export const NotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carica le note dal database
  const loadNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading notes:', error);
        toast({
          title: "Errore",
          description: "Impossibile caricare le note.",
          variant: "destructive",
        });
        return;
      }

      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le note.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Crea una nuova nota
  const createNote = useCallback(async (title: string, content: string): Promise<Note | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            content,
            user_id: user.id,
          }
        ])
        .select('id, user_id, workout_id, content, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error creating note:', error);
        toast({
          title: "Errore",
          description: "Impossibile creare la nota.",
          variant: "destructive",
        });
        return null;
      }

      const newNote = data as unknown as Note;
      setNotes(prev => [newNote, ...prev]);
      
      toast({
        title: "Nota creata",
        description: "La nota è stata salvata con successo.",
      });

      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare la nota.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  // Aggiorna una nota esistente
  const updateNote = useCallback(async (id: string, title: string, content: string): Promise<Note | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, user_id, workout_id, content, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error updating note:', error);
        toast({
          title: "Errore",
          description: "Impossibile aggiornare la nota.",
          variant: "destructive",
        });
        return null;
      }

      const updatedNote = data as unknown as Note;
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
      
      toast({
        title: "Nota aggiornata",
        description: "La nota è stata salvata con successo.",
      });

      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la nota.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  // Elimina una nota
  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting note:', error);
        toast({
          title: "Errore",
          description: "Impossibile eliminare la nota.",
          variant: "destructive",
        });
        return false;
      }

      // Rimuovi la nota dallo stato locale
      setNotes(prev => prev.filter(note => note.id !== id));
      
      toast({
        title: "Nota eliminata",
        description: "La nota è stata eliminata definitivamente.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la nota.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  // Ottieni una nota per ID
  const getNoteById = useCallback((id: string): Note | undefined => {
    return notes.find(note => note.id === id);
  }, [notes]);

  // Carica le note quando cambia l'utente
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const value: NotesContextType = {
    notes,
    isLoading,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};
