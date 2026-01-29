/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps -- tipi entry diary; loadEntries stabile */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isSameDay, format } from "date-fns";
import { it } from "date-fns/locale";

// Componenti diario
import { WorkoutCard } from "@/components/diary/WorkoutCard";
import { NotesModal } from "@/components/diary/NotesModal";
import { WorkoutDetailsModal } from "@/components/diary/WorkoutDetailsModal";
import { DiaryFilters } from "@/components/diary/DiaryFilters";
import { StatsWidget } from "@/components/diary/StatsWidget";

// Service
import {
  getDiaryEntries,
  getDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  type WorkoutDiary,
} from "@/services/diaryService";

type FilterType = 'all' | 'saved' | 'completed';

const DiaryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [filter, setFilter] = useState<FilterType>('all');
  const [entries, setEntries] = useState<WorkoutDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WorkoutDiary | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<WorkoutDiary | null>(null);

  // Load entries
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await getDiaryEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error loading diary:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare il diario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (filter === 'saved') {
      filtered = entries.filter(e => e.status === 'saved');
    } else if (filter === 'completed') {
      filtered = entries.filter(e => e.status === 'completed');
    }
    return filtered.sort((a, b) => {
      const dateA = new Date(a.completed_at || a.saved_at);
      const dateB = new Date(b.completed_at || b.saved_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [entries, filter]);

  // Group by date
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: WorkoutDiary[] } = {};

    filteredEntries.forEach(entry => {
      const date = new Date(entry.completed_at || entry.saved_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label: string;
      if (isSameDay(date, today)) {
        label = `📅 Oggi - ${format(date, 'd MMMM yyyy', { locale: it })}`;
      } else if (isSameDay(date, yesterday)) {
        label = `📅 Ieri - ${format(date, 'd MMMM yyyy', { locale: it })}`;
      } else {
        label = `📅 ${format(date, 'd MMMM yyyy', { locale: it })}`;
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(entry);
    });

    return groups;
  }, [filteredEntries]);

  // Handlers
  const handleStart = (id: string) => {
    // TODO: Navigate to workout execution page
    toast({
      title: "Inizia allenamento",
      description: "Funzionalità in arrivo!",
    });
  };

  const handleRepeat = async (id: string) => {
    try {
      // Carica entry completa dal database (include exercises)
      const entry = await getDiaryEntry(id);
      if (!entry || !entry.exercises || entry.exercises.length === 0) {
        toast({
          title: "Errore",
          description: "Impossibile caricare il workout",
          variant: "destructive",
        });
        return;
      }

      // Converti formato diary → formato ActiveWorkout
      const customExercises = entry.exercises.map((ex: any) => ({
        name: ex.name,
        duration: ex.duration,
        rest: ex.rest || 0,
      }));

      // Naviga a /workouts con state per aprire ActiveWorkout
      navigate('/workouts', {
        state: {
          startCustomWorkout: true,
          customExercises: customExercises,
          workoutTitle: entry.workout_name,
          workoutType: entry.workout_type || 'personalizzato',
        }
      });
    } catch (error) {
      console.error('Error repeating workout:', error);
      toast({
        title: "Errore",
        description: "Impossibile ripetere l'allenamento",
        variant: "destructive",
      });
    }
  };

  const handleNotes = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      setSelectedEntry(entry);
      setNotesModalOpen(true);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!selectedEntry) return;

    try {
      // 1. Aggiorna database e ottieni entry aggiornata
      const updatedEntry = await updateDiaryEntry(selectedEntry.id, { notes });
      
      // 2. Aggiorna solo l'entry modificata nello state (ottimistico)
      setEntries(prev => prev.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      ));
      
      // 3. Chiudi modal e aggiorna selectedEntry
      setNotesModalOpen(false);
      setSelectedEntry(null);
      
      // 4. Toast successo
      toast({
        title: "✅ Note salvate",
        description: "Le tue note sono state salvate",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      // In caso di errore, ricarica per sincronizzare
      await loadEntries();
      toast({
        title: "Errore",
        description: "Impossibile salvare le note",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      // 1. Rimuovi immediatamente dallo state (ottimistico)
      setEntries(prev => prev.filter(entry => entry.id !== id));
      
      // 2. Elimina dal database (backend)
      await deleteDiaryEntry(id);
      
      // 3. Toast successo
      toast({
        title: "🗑️ Rimosso",
        description: "Allenamento rimosso dal diario",
      });
    } catch (error) {
      console.error('Error removing entry:', error);
      // In caso di errore, ricarica per sincronizzare
      await loadEntries();
      toast({
        title: "Errore",
        description: "Impossibile rimuovere l'allenamento",
        variant: "destructive",
      });
    }
  };

  const handleDetails = async (id: string) => {
    try {
      // Carica entry completa con exercises
      const entry = await getDiaryEntry(id);
      if (!entry) {
        toast({
          title: "Errore",
          description: "Impossibile caricare i dettagli",
          variant: "destructive",
        });
        return;
      }
      setSelectedEntryForDetails(entry);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error('Error loading details:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dettagli",
        variant: "destructive",
      });
    }
  };

  const handleShare = (id: string) => {
    toast({
      title: "Condividi",
      description: "Funzionalità in arrivo!",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            📔 Il Mio Diario
          </h1>
          <p className="text-muted-foreground mt-2">Track your fitness journey</p>
        </div>
      </div>

      {/* Stats Widget */}
      <div className="container mx-auto px-4 py-6">
        <StatsWidget />
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <DiaryFilters
            activeFilter={filter}
            onFilterChange={setFilter}
          />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {Object.keys(groupedEntries).length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Dumbbell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              📔 Diario Vuoto
            </h2>
            <p className="text-muted-foreground mb-6">
              Non hai ancora salvato allenamenti.<br />
              Inizia il tuo primo workout!
            </p>
            <Button
              size="lg"
              className="gap-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold"
              onClick={() => navigate('/workouts')}
            >
              <Dumbbell className="w-5 h-5" />
              Vai agli Allenamenti
            </Button>
          </div>
        ) : (
          // Diary entries grouped by date
          <div className="space-y-8">
            {Object.entries(groupedEntries).map(([date, dayEntries]) => (
              <div key={date} className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground sticky top-[140px] bg-background py-2 z-5">
                  {date}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dayEntries.map(entry => (
                    <WorkoutCard
                      key={entry.id}
                      entry={entry}
                      onStart={handleStart}
                      onNotes={handleNotes}
                      onRemove={handleRemove}
                      onRepeat={handleRepeat}
                      onDetails={handleDetails}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Modal */}
      <NotesModal
        open={notesModalOpen}
        onOpenChange={setNotesModalOpen}
        initialNotes={selectedEntry?.notes || ""}
        onSave={handleSaveNotes}
        workoutName={selectedEntry?.workout_name}
      />

      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        entry={selectedEntryForDetails}
        open={detailsModalOpen}
        onOpenChange={(open) => {
          setDetailsModalOpen(open);
          if (!open) setSelectedEntryForDetails(null);
        }}
      />
    </div>
  );
};

export default DiaryPage;

