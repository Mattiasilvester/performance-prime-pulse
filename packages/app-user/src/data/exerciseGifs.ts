/**
 * Sistema GIF esercizi da Supabase Storage.
 * URL base: {VITE_SUPABASE_URL}/storage/v1/object/public/exercise-gifs/{categoria}/{slug}.gif
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const GIF_BASE_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/exercise-gifs`
  : '';

/** Mappa nome esercizio → cartella nel bucket (forza | cardio | hiit | mobilita) */
export const EXERCISE_CATEGORY: Record<string, string> = (() => {
  const forza = [
    'Flessioni',
    'Flessioni Inclinate',
    'Flessioni Declinate',
    'Flessioni Esplosive',
    'Pike Push-up',
    'Panca Piana',
    'Panca Inclinata',
    'Panca Declinata',
    'Chest Press',
    'Chest Press Inclinato',
    'Chest Press Declinato',
    'Cable Crossover',
    'Aperture con Manubri',
    'Aperture Inclinate',
    'Aperture Declinate',
    'Chest Fly',
    'Pullover',
    'Dip alle Parallele',
    'Dip alla Sedia',
    'Pull-up',
    'Lat Machine',
    'Cable Pulldown',
    'Rematore con Manubri',
    'Rematore con Bilanciere',
    'Rematore Inclinato',
    'Rematore Unilaterale',
    'Remata Alta',
    'Seated Cable Row',
    'T-Bar Row',
    'Stacco da Terra',
    'Stacco Rumeno',
    'Stacco su Una Gamba',
    'Sumo Deadlift',
    'Superman',
    'Reverse Fly',
    'Military Press',
    'Arnold Press',
    'Shoulder Press',
    'Alzate Laterali',
    'Alzate Frontali',
    'Alzate Posteriori',
    'Alzate Laterali Inclinate',
    'Upright Row',
    'Shrugs',
    'T-Raises',
    'W-Raises',
    'Curl con Manubri',
    'Curl Alternato',
    'Curl a Martello',
    'Curl Concentrato',
    'Curl 21',
    'French Press',
    'Tricep Extension',
    'Overhead Tricep Extension',
    'Tricep Kickback',
    'Squat',
    'Squat con Bilanciere',
    'Squat con Manubri',
    'Front Squat',
    'Overhead Squat',
    'Goblet Squat',
    'Bulgarian Split Squat',
    'Sumo Squat',
    'Affondi',
    'Affondi Camminati',
    'Affondi con Manubri',
    'Affondi Laterali',
    'Affondi con Bilanciere',
    'Calf Raises',
    'Calf Raises con Manubri',
    'Step-up con Manubri',
    'Kettlebell Swing',
    'Sedia al Muro',
    'Glute Bridge',
    'Plank',
    'Side Plank',
    'Crunch',
    'Reverse Crunch',
    'Sit-up',
    'Russian Twist',
    'Leg Raises',
    'Dead Bug',
    'Bird Dog',
    'Scalatori',
    'Hollow Body Hold',
    'V-Up',
    'Ab Wheel Rollout',
    'Core Hold',
  ];
  const cardio = [
    'Jumping Jacks',
    'Saltelli Laterali',
    'Burpees',
    'Corsa sul Posto',
    'High Knees',
    'Calci ai Glutei',
    'Passi Laterali',
    'Box Steps',
    "Camminata dell'Orso",
    'Saltelli a Rana',
    'Movimento Incrociato',
    'Saltelli da Pattinatore',
    'Arm Circles',
    'Onde con le Braccia',
  ];
  const hiit = [
    'Jump Squats',
    'Burpees Esplosivi',
    'Plank Jacks',
    'Thrusters',
    'Affondi Saltati',
    'Star Jumps',
    'Power Punches',
    'Quick Feet',
    'Saltelli a Stella',
  ];
  const mobilita = [
    'Cat-Cow',
    'Hip Circles',
    'Rotazioni delle Spalle',
    'Rotazioni del Collo',
    'Oscillazioni delle Gambe',
    'Cerchi con le Caviglie',
    'Giro del Busto',
    'Allungamento Quadricipiti',
    'Allungamento Posteriori',
    'Allungamento Fianchi',
    'Apertura del Petto',
    'Flessione Laterale',
    'Piegamento in Avanti',
    'Posizione del Bambino',
    'Posizione del Cobra',
    'Hip Flexor Stretch',
  ];
  const map: Record<string, string> = {};
  forza.forEach((name) => {
    map[name] = 'forza';
  });
  cardio.forEach((name) => {
    map[name] = 'cardio';
  });
  hiit.forEach((name) => {
    map[name] = 'hiit';
  });
  mobilita.forEach((name) => {
    map[name] = 'mobilita';
  });
  return map;
})();

/**
 * Converte il nome esercizio in slug per path/URL.
 * lowercase, spazi → trattini, rimuove apostrofi e caratteri speciali.
 * es: "Curl a Martello" → "curl-a-martello"
 * es: "Camminata dell'Orso" → "camminata-dell-orso"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '-')
    .replace(/[^a-z0-9\u00c0-\u024f\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Restituisce l'URL dell'immagine dell'esercizio (prova .png, il browser può usare onError per fallback).
 * Se VITE_SUPABASE_URL non è definito restituisce stringa vuota.
 */
export function getExerciseImageUrl(exerciseName: string): string {
  if (!GIF_BASE_URL) {
    return '';
  }
  const category = EXERCISE_CATEGORY[exerciseName] ?? 'forza';
  const slug = slugify(exerciseName);
  const base = `${GIF_BASE_URL}/${category}/${slug}`;
  return `${base}.png`;
}

/**
 * Restituisce l'URL della GIF/immagine dell'esercizio da Supabase Storage.
 * Usa getExerciseImageUrl (estensione .png); per fallback .gif il componente può usare onError.
 */
export function getExerciseGifUrl(exerciseName: string): string {
  return getExerciseImageUrl(exerciseName);
}

/** Alias di getExerciseGifUrl per retrocompatibilità */
export const getExerciseGif = getExerciseGifUrl;

/**
 * Versione async per compatibilità con componenti che usano getExerciseGifUrlAsync.
 */
export async function getExerciseGifUrlAsync(exerciseName: string): Promise<string> {
  return getExerciseGifUrl(exerciseName);
}

/**
 * Restituisce un Record nome → URL per tutti gli esercizi in EXERCISE_CATEGORY.
 * Utile per iterazioni o prefetch.
 */
export async function getExerciseGifs(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const name of Object.keys(EXERCISE_CATEGORY)) {
    out[name] = getExerciseGifUrl(name);
  }
  return out;
}

/** Oggetto vuoto per retrocompatibilità; gli URL si ottengono da getExerciseGifUrl / getExerciseGifs */
export const exerciseGifs: Record<string, string> = {};
