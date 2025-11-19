import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteCard } from "@/components/diary/NoteCard";
import { CreateNoteModal } from "@/components/diary/CreateNoteModal";
import {
  getDiaryNotes,
  saveDiaryNote,
  deleteDiaryNote,
  toggleNoteHighlight,
  initializeDiaryNotes,
  type DiaryNote,
  type NoteCategory,
} from "@/lib/diaryNotesStorage";
import { toast } from "sonner";
import { Search, Plus } from "lucide-react";
import { subDays } from "date-fns";

type FilterMode = "7days" | "30days" | "highlighted";

export default function DiaryNotesPage() {
  const [notes, setNotes] = useState<DiaryNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("7days");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize notes on mount
  useEffect(() => {
    initializeDiaryNotes();
    loadNotes();
  }, []);

  const loadNotes = () => {
    const loadedNotes = getDiaryNotes();
    setNotes(loadedNotes);
  };

  const handleCreateNote = (noteData: {
    content: string;
    category: NoteCategory;
    isPinned: boolean;
  }) => {
    try {
      saveDiaryNote(noteData.content, noteData.category, noteData.isPinned);
      loadNotes();
      toast.success("Nota creata!", {
        description: "La tua nota è stata salvata con successo.",
      });
    } catch (error) {
      toast.error("Errore", {
        description: error instanceof Error ? error.message : "Impossibile creare la nota",
      });
    }
  };

  const handleToggleHighlight = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      toggleNoteHighlight(id);
      loadNotes();
      toast.success(
        note.isHighlighted ? "Rimossa da evidenza" : "Aggiunta a evidenza",
        {
          description: note.isHighlighted
            ? "La nota non è più in evidenza"
            : "La nota è ora in evidenza",
        }
      );
    }
  };

  const handleDeleteNote = (id: string) => {
    deleteDiaryNote(id);
    loadNotes();
    toast.success("Nota eliminata", {
      description: "La nota è stata rimossa definitivamente.",
    });
  };

  // Filter notes based on search and filter mode
  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((note) =>
        note.content.toLowerCase().includes(query)
      );
    }

    // Date/mode filter
    const now = new Date();
    switch (filterMode) {
      case "7days":
        const sevenDaysAgo = subDays(now, 7);
        filtered = filtered.filter(
          (note) => new Date(note.createdAt) >= sevenDaysAgo
        );
        break;
      case "30days":
        const thirtyDaysAgo = subDays(now, 30);
        filtered = filtered.filter(
          (note) => new Date(note.createdAt) >= thirtyDaysAgo
        );
        break;
      case "highlighted":
        filtered = filtered.filter((note) => note.isHighlighted);
        break;
    }

    return filtered;
  }, [notes, searchQuery, filterMode]);

  // Group notes into sections
  const pinnedNotes = filteredNotes.filter((note) => note.isPinned);
  const highlightedNotes = filteredNotes.filter(
    (note) => note.isHighlighted && !note.isPinned
  );
  const regularNotes = filteredNotes.filter(
    (note) => !note.isPinned && !note.isHighlighted
  );

  // Calcola altezza header Note per padding-top dinamico
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(180); // Default 180px

  useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      setHeaderHeight(height);
    }
  }, [filterMode, searchQuery]); // Ricalcola se cambiano filtri/search

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - FIXED sotto Header App (top-16 = 64px) */}
      {/* IMPORTANTE: fixed è FUORI dal wrapper con padding */}
      {/* Classe notes-header-fixed protegge da script che rimuove fixed */}
      <div 
        ref={headerRef}
        className="notes-header-fixed border-b border-border/20 bg-black/20 backdrop-blur-xl fixed top-16 left-0 right-0 z-50"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              📝 Note
            </h1>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuova Nota
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Tabs */}
            <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap px-1 py-2">
                <TabsTrigger value="7days" className="data-[state=active]:rounded-full">
                  Ultimi 7 giorni
                </TabsTrigger>
                <TabsTrigger value="30days" className="data-[state=active]:rounded-full">
                  Ultimi 30 giorni
                </TabsTrigger>
                <TabsTrigger value="highlighted" className="data-[state=active]:rounded-full">
                  ⭐ In evidenza
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca nelle note..."
                  className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Padding-top per Header App (pt-24) + Header Note (dinamico) */}
      <div className="pt-24">
        <div className="container mx-auto px-4 py-8" style={{ paddingTop: `${headerHeight + 32}px` }}>
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                📌 Note Fissate
              </h2>
              <div className="space-y-3">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onToggleHighlight={handleToggleHighlight}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Highlighted Notes Section */}
          {highlightedNotes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                ⭐ In Evidenza
              </h2>
              <div className="space-y-3">
                {highlightedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onToggleHighlight={handleToggleHighlight}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes Section */}
          {regularNotes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                📅 Note del periodo
              </h2>
              <div className="space-y-3">
                {regularNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onToggleHighlight={handleToggleHighlight}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredNotes.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-foreground">
                Nessuna nota trovata
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? "Prova a modificare la ricerca o i filtri"
                  : "Inizia a registrare i tuoi pensieri e progressi!"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 mt-4">
                  <Plus className="w-4 h-4" />
                  Crea Prima Nota
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Create Note Modal */}
      <CreateNoteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleCreateNote}
      />
    </div>
  );
}

