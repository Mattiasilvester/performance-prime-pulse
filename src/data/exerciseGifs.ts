// Database delle GIF per gli esercizi
// Caricato on-demand da JSON per ridurre bundle size

// Cache per i dati GIF caricati
let exerciseGifsCache: Record<string, string> | null = null;
let exerciseGifsLoadPromise: Promise<Record<string, string>> | null = null;

/**
 * Carica il database GIF da JSON esterno (lazy load)
 */
export async function getExerciseGifs(): Promise<Record<string, string>> {
  // Se già in cache, ritorna immediatamente
  if (exerciseGifsCache) {
    return exerciseGifsCache;
  }

  // Se c'è già una richiesta in corso, aspetta quella
  if (exerciseGifsLoadPromise) {
    return exerciseGifsLoadPromise;
  }

  // Carica il JSON
  exerciseGifsLoadPromise = (async () => {
    try {
      const response = await fetch('/data/exerciseGifs.json');
      if (!response.ok) {
        throw new Error(`Failed to load exercise GIFs: ${response.status}`);
      }
      exerciseGifsCache = await response.json();
      return exerciseGifsCache;
    } catch (error) {
      console.error('Error loading exercise GIFs:', error);
      // Fallback: ritorna oggetto vuoto
      exerciseGifsCache = {};
      return exerciseGifsCache;
    } finally {
      exerciseGifsLoadPromise = null;
    }
  })();

  return exerciseGifsLoadPromise;
}

/**
 * Funzione sincrona per compatibilità (ritorna fallback se non ancora caricato)
 * Usa getExerciseGifUrlAsync() per versione async
 */
export const exerciseGifs: Record<string, string> = {};

/**
 * Funzione async per ottenere l'URL della GIF di un esercizio
 */
export async function getExerciseGifUrlAsync(exerciseName: string): Promise<string> {
  const gifs = await getExerciseGifs();
  return gifs[exerciseName] || 'https://example.com/gifs/default-exercise.gif';
}

/**
 * Funzione sincrona per compatibilità (ritorna fallback se non ancora caricato)
 * @deprecated Usa getExerciseGifUrlAsync() per versione async
 */
export const getExerciseGifUrl = (exerciseName: string): string => {
  // Se il cache è già caricato, usa quello
  if (exerciseGifsCache) {
    return exerciseGifsCache[exerciseName] || 'https://example.com/gifs/default-exercise.gif';
  }
  // Altrimenti ritorna fallback (verrà aggiornato quando il JSON carica)
  return 'https://example.com/gifs/default-exercise.gif';
};

