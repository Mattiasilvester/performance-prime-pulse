/**
 * Storage Layer per Note Diario Personali
 * 
 * Gestisce persistenza locale (localStorage) per note personali quotidiane
 * Separate dal sistema workout diary (che usa Supabase)
 */

import { safeLocalStorage } from '@pp/shared/utils/domHelpers';

// ==========================================
// TYPES & INTERFACES
// ==========================================

/**
 * Categorie disponibili per le note
 */
export type NoteCategory = 
  | 'thoughts'      // 💭 Pensieri
  | 'physical'      // 💪 Fisiche
  | 'goals'         // 🎯 Obiettivi
  | 'post-workout'  // 📊 Post-workout
  | 'nutrition'     // 🍎 Alimentazione
  | 'sleep';        // 😴 Sonno

/**
 * Interfaccia per una nota del diario
 */
export interface DiaryNote {
  id: string;                    // UUID univoco
  content: string;               // Contenuto nota (10-500 caratteri)
  category: NoteCategory;        // Categoria obbligatoria
  isPinned: boolean;             // Fissa in cima
  isHighlighted: boolean;        // In evidenza (⭐)
  createdAt: string;             // ISO timestamp creazione
  updatedAt?: string;            // ISO timestamp ultimo aggiornamento (opzionale)
}

// ==========================================
// CONSTANTS
// ==========================================

/**
 * Key localStorage per le note
 */
const STORAGE_KEY = 'diary-notes';

/**
 * Mapping categoria → emoji icona
 */
export const categoryIcons: Record<NoteCategory, string> = {
  'thoughts': '💭',
  'physical': '💪',
  'goals': '🎯',
  'post-workout': '📊',
  'nutrition': '🍎',
  'sleep': '😴',
};

/**
 * Mapping categoria → label italiana
 */
export const categoryLabels: Record<NoteCategory, string> = {
  'thoughts': 'Pensieri',
  'physical': 'Fisiche',
  'goals': 'Obiettivi',
  'post-workout': 'Post-workout',
  'nutrition': 'Alimentazione',
  'sleep': 'Sonno',
};

/**
 * Note di esempio per inizializzazione (7 note)
 */
export const mockNotes: DiaryNote[] = [
  {
    id: 'mock-1',
    content: 'Oggi ho completato il mio primo allenamento HIIT completo! Mi sento energico e motivato. 💪',
    category: 'post-workout',
    isPinned: false,
    isHighlighted: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 giorno fa
  },
  {
    id: 'mock-2',
    content: 'Ho notato che dormendo almeno 7 ore mi sento molto più riposato e performante durante gli allenamenti.',
    category: 'sleep',
    isPinned: false,
    isHighlighted: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 giorni fa
  },
  {
    id: 'mock-3',
    content: 'Obiettivo settimanale: completare almeno 4 allenamenti questa settimana. Sono già a 2! 🎯',
    category: 'goals',
    isPinned: true,
    isHighlighted: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 giorni fa
  },
  {
    id: 'mock-4',
    content: 'Ho iniziato a mangiare più proteine a colazione e ho notato un aumento di energia durante la giornata.',
    category: 'nutrition',
    isPinned: false,
    isHighlighted: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 giorni fa
  },
  {
    id: 'mock-5',
    content: 'Mi sento più forte nelle flessioni rispetto alla settimana scorsa. Il progresso è tangibile!',
    category: 'physical',
    isPinned: false,
    isHighlighted: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 giorni fa
  },
  {
    id: 'mock-6',
    content: 'Riflessione: la costanza è più importante della perfezione. Un allenamento fatto è meglio di uno perfetto non fatto.',
    category: 'thoughts',
    isPinned: false,
    isHighlighted: false,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 giorni fa
  },
  {
    id: 'mock-7',
    content: 'Allenamento mattutino completato! Mi sento pronto per affrontare la giornata con energia positiva.',
    category: 'post-workout',
    isPinned: false,
    isHighlighted: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 giorni fa
  },
];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Genera un ID univoco per una nuova nota
 */
function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Salva le note nel localStorage con gestione errori
 */
function saveToStorage(notes: DiaryNote[]): void {
  try {
    const serialized = JSON.stringify(notes);
    const success = safeLocalStorage.setItem(STORAGE_KEY, serialized);
    if (!success) {
      throw new Error('Impossibile salvare le note: localStorage non disponibile');
    }
  } catch (error) {
    console.error('Errore nel salvataggio note nel localStorage:', error);
    throw new Error('Impossibile salvare le note');
  }
}

/**
 * Carica le note dal localStorage con gestione errori
 */
function loadFromStorage(): DiaryNote[] | null {
  try {
    const serialized = safeLocalStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    return JSON.parse(serialized) as DiaryNote[];
  } catch (error) {
    console.error('Errore nel caricamento note dal localStorage:', error);
    return null;
  }
}

// ==========================================
// PUBLIC API FUNCTIONS
// ==========================================

/**
 * Inizializza il localStorage con note di esempio se vuoto
 * Chiamare questa funzione al primo caricamento dell'app
 */
export function initializeDiaryNotes(): void {
  const existing = loadFromStorage();
  
  // Se non ci sono note salvate, inizializza con mock data
  if (!existing || existing.length === 0) {
    saveToStorage(mockNotes);
  }
}

/**
 * Recupera tutte le note dal localStorage
 * @returns Array di note ordinate per data (più recenti prima)
 */
export function getDiaryNotes(): DiaryNote[] {
  const notes = loadFromStorage();
  
  if (!notes || notes.length === 0) {
    return [];
  }
  
  // Ordina per data creazione (più recenti prima)
  return notes.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Decrescente (più recenti prima)
  });
}

/**
 * Crea una nuova nota e la salva nel localStorage
 * @param content Contenuto della nota (10-500 caratteri)
 * @param category Categoria obbligatoria
 * @param isPinned Se true, fissa la nota in cima
 * @returns La nota creata con ID e timestamp
 */
export function saveDiaryNote(
  content: string,
  category: NoteCategory,
  isPinned: boolean = false
): DiaryNote {
  // Validazione
  if (!content || content.trim().length < 10) {
    throw new Error('Il contenuto deve essere di almeno 10 caratteri');
  }
  
  if (content.length > 500) {
    throw new Error('Il contenuto non può superare i 500 caratteri');
  }
  
  if (!category) {
    throw new Error('La categoria è obbligatoria');
  }
  
  // Crea nuova nota
  const now = new Date().toISOString();
  const newNote: DiaryNote = {
    id: generateNoteId(),
    content: content.trim(),
    category,
    isPinned,
    isHighlighted: false,
    createdAt: now,
    updatedAt: now,
  };
  
  // Carica note esistenti
  const existingNotes = loadFromStorage() || [];
  
  // Aggiungi nuova nota
  const updatedNotes = [...existingNotes, newNote];
  
  // Salva
  saveToStorage(updatedNotes);
  
  return newNote;
}

/**
 * Aggiorna una nota esistente
 * @param noteId ID della nota da aggiornare
 * @param updates Campi da aggiornare (parziale)
 * @returns La nota aggiornata o null se non trovata
 */
export function updateDiaryNote(
  noteId: string,
  updates: Partial<Pick<DiaryNote, 'content' | 'category' | 'isPinned' | 'isHighlighted'>>
): DiaryNote | null {
  const notes = loadFromStorage() || [];
  
  // Trova indice nota
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) {
    return null; // Nota non trovata
  }
  
  // Validazione content se presente
  if (updates.content !== undefined) {
    if (updates.content.trim().length < 10) {
      throw new Error('Il contenuto deve essere di almeno 10 caratteri');
    }
    if (updates.content.length > 500) {
      throw new Error('Il contenuto non può superare i 500 caratteri');
    }
  }
  
  // Aggiorna nota
  const updatedNote: DiaryNote = {
    ...notes[noteIndex],
    ...updates,
    content: updates.content !== undefined ? updates.content.trim() : notes[noteIndex].content,
    updatedAt: new Date().toISOString(),
  };
  
  // Aggiorna array
  const updatedNotes = [...notes];
  updatedNotes[noteIndex] = updatedNote;
  
  // Salva
  saveToStorage(updatedNotes);
  
  return updatedNote;
}

/**
 * Elimina una nota dal localStorage
 * @param noteId ID della nota da eliminare
 * @returns true se eliminata con successo, false se non trovata
 */
export function deleteDiaryNote(noteId: string): boolean {
  const notes = loadFromStorage() || [];
  
  // Filtra note rimuovendo quella con ID specificato
  const filteredNotes = notes.filter(note => note.id !== noteId);
  
  // Se la lunghezza è uguale, la nota non esisteva
  if (filteredNotes.length === notes.length) {
    return false;
  }
  
  // Salva note aggiornate
  saveToStorage(filteredNotes);
  
  return true;
}

/**
 * Toggle stato "In Evidenza" di una nota
 * @param noteId ID della nota
 * @returns La nota aggiornata o null se non trovata
 */
export function toggleNoteHighlight(noteId: string): DiaryNote | null {
  const notes = loadFromStorage() || [];
  const note = notes.find(n => n.id === noteId);
  
  if (!note) {
    return null;
  }
  
  return updateDiaryNote(noteId, {
    isHighlighted: !note.isHighlighted,
  });
}

/**
 * Toggle stato "Fissa in cima" di una nota
 * @param noteId ID della nota
 * @returns La nota aggiornata o null se non trovata
 */
export function toggleNotePin(noteId: string): DiaryNote | null {
  const notes = loadFromStorage() || [];
  const note = notes.find(n => n.id === noteId);
  
  if (!note) {
    return null;
  }
  
  return updateDiaryNote(noteId, {
    isPinned: !note.isPinned,
  });
}

