
import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteEditor } from './NoteEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const createNewNote = () => {
    setSelectedNote(null);
    setIsCreating(true);
  };

  const handleNoteSaved = (note: Note) => {
    setNotes(prev => {
      const existing = prev.find(n => n.id === note.id);
      if (existing) {
        return prev.map(n => n.id === note.id ? note : n);
      } else {
        return [note, ...prev];
      }
    });
    setSelectedNote(note);
    setIsCreating(false);
  };

  const handleNoteDeleted = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    setSelectedNote(null);
    setIsCreating(false);
  };

  const handleDeleteNote = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Sei sicuro di voler eliminare questa nota?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      
      handleNoteDeleted(noteId);
      toast({
        title: "Eliminata",
        description: "La nota è stata eliminata con successo.",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la nota.",
        variant: "destructive",
      });
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupNotesByDate = (notes: Note[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const groups = {
      today: [] as Note[],
      yesterday: [] as Note[],
      last30Days: [] as Note[],
      older: [] as Note[]
    };

    notes.forEach(note => {
      const noteDate = new Date(note.updated_at);
      const isToday = noteDate.toDateString() === today.toDateString();
      const isYesterday = noteDate.toDateString() === yesterday.toDateString();
      const isLast30Days = noteDate > thirtyDaysAgo;

      if (isToday) {
        groups.today.push(note);
      } else if (isYesterday) {
        groups.yesterday.push(note);
      } else if (isLast30Days) {
        groups.last30Days.push(note);
      } else {
        groups.older.push(note);
      }
    });

    return groups;
  };

  const groupedNotes = groupNotesByDate(filteredNotes);

  const renderNoteGroup = (title: string, notes: Note[]) => {
    if (notes.length === 0) return null;

    return (
      <div key={title} className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">{title}</h3>
        <div className="space-y-2">
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => {
                setSelectedNote(note);
                setIsCreating(false);
              }}
              className={`p-3 rounded-lg cursor-pointer transition-colors border group relative ${
                selectedNote?.id === note.id
                  ? 'bg-[#EEBA2B]/10 border-[#EEBA2B]'
                  : 'bg-[#333333] border-gray-600 hover:bg-[#444444]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">
                    {note.title || 'Nota senza titolo'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {note.content.replace(/\n/g, ' ').substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(note.updated_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <Button
                  onClick={(e) => handleDeleteNote(note.id, e)}
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto w-auto text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar - Reduced padding further */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <div className="p-1 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#EEBA2B]">Note</h2>
            <Button
              onClick={createNewNote}
              size="sm"
              className="bg-[#EEBA2B] hover:bg-[#EEBA2B]/80 text-black"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca nelle note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#333333] border-gray-600 text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1">
          {renderNoteGroup('OGGI', groupedNotes.today)}
          {renderNoteGroup('Ieri', groupedNotes.yesterday)}
          {renderNoteGroup('ULTIMI 30 GIORNI', groupedNotes.last30Days)}
          {renderNoteGroup('Più vecchie', groupedNotes.older)}
          
          {filteredNotes.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Nessuna nota trovata</p>
              <Button
                onClick={createNewNote}
                variant="outline"
                className="mt-4 border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B] hover:text-black"
              >
                Crea la tua prima nota
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        {(selectedNote || isCreating) ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleNoteSaved}
            onDelete={handleNoteDeleted}
            onCancel={() => {
              setSelectedNote(null);
              setIsCreating(false);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-2">Seleziona una nota</p>
              <p className="text-gray-500">Scegli una nota dalla lista o creane una nuova</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Notes };
