// Generatore di allenamenti dinamici
interface Exercise {
  name: string;
  duration: string;
  rest: string;
  muscleGroup?: string;
  equipment?: string;
  level?: string;
  sets?: number;
}

// Regole scientificamente validate per ogni livello
const WORKOUT_RULES = {
  FORZA: {
    minExercises: { PRINCIPIANTE: 8, INTERMEDIO: 10, AVANZATO: 12 },
    maxExercises: { PRINCIPIANTE: 10, INTERMEDIO: 12, AVANZATO: 15 },
    exerciseDuration: { PRINCIPIANTE: 45, INTERMEDIO: 60, AVANZATO: 75 },
    restBetweenExercises: { PRINCIPIANTE: 60, INTERMEDIO: 45, AVANZATO: 30 },
    sets: { PRINCIPIANTE: 3, INTERMEDIO: 4, AVANZATO: 5 }
  },
  HIIT: {
    minExercises: { PRINCIPIANTE: 12, INTERMEDIO: 15, AVANZATO: 18 },
    maxExercises: { PRINCIPIANTE: 15, INTERMEDIO: 18, AVANZATO: 22 },
    exerciseDuration: { PRINCIPIANTE: 30, INTERMEDIO: 45, AVANZATO: 60 },
    restBetweenExercises: { PRINCIPIANTE: 60, INTERMEDIO: 45, AVANZATO: 30 },
    sets: { PRINCIPIANTE: 3, INTERMEDIO: 4, AVANZATO: 5 }
  },
  CARDIO: {
    minExercises: { PRINCIPIANTE: 8, INTERMEDIO: 10, AVANZATO: 12 },
    maxExercises: { PRINCIPIANTE: 10, INTERMEDIO: 12, AVANZATO: 15 },
    exerciseDuration: { PRINCIPIANTE: 180, INTERMEDIO: 240, AVANZATO: 300 },
    restBetweenExercises: { PRINCIPIANTE: 60, INTERMEDIO: 45, AVANZATO: 30 },
    sets: { PRINCIPIANTE: 1, INTERMEDIO: 1, AVANZATO: 1 }
  },
  MOBILITA: {
    minExercises: { PRINCIPIANTE: 4, INTERMEDIO: 5, AVANZATO: 6 },
    maxExercises: { PRINCIPIANTE: 5, INTERMEDIO: 6, AVANZATO: 8 },
    exerciseDuration: { PRINCIPIANTE: 30, INTERMEDIO: 45, AVANZATO: 60 },
    restBetweenExercises: { PRINCIPIANTE: 15, INTERMEDIO: 10, AVANZATO: 10 },
    sets: { PRINCIPIANTE: 1, INTERMEDIO: 1, AVANZATO: 2 }
  }
};

// Modalità QUICK ottimizzata (10 minuti totali)
const QUICK_MODE_RULES = {
  FORZA: { 
    exercises: 8,     // 8 esercizi
    duration: 40,     // 40 secondi lavoro
    rest: 20          // 20 secondi recupero
    // Totale: 8 minuti lavoro + 2.5 min recupero = ~10 min
  },
  HIIT: { 
    exercises: 12,    // 12 esercizi
    duration: 30,     // 30 secondi lavoro
    rest: 20          // 20 secondi recupero
    // Totale: 6 min lavoro + 4 min recupero = 10 min
  },
  CARDIO: { 
    exercises: 5,     // 5 esercizi
    duration: 90,     // 90 secondi lavoro
    rest: 30          // 30 secondi recupero
    // Totale: 7.5 min lavoro + 2.5 min recupero = 10 min
  },
  MOBILITA: { 
    exercises: 10,    // 10 esercizi
    duration: 40,     // 40 secondi stretching
    rest: 15          // 15 secondi transizione
    // Totale: 6.5 min lavoro + 2.5 min recupero = ~9 min
  }
};

interface WorkoutPlan {
  name: string;
  exercises: Exercise[];
}

interface FilterOptions {
  muscleGroup?: string;
  equipment?: string;
  duration?: string;
  level?: string;
}

type UserLevel = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZATO';
interface WorkoutRulesEntry {
  minExercises: Record<UserLevel, number>;
  maxExercises: Record<UserLevel, number>;
  exerciseDuration: Record<UserLevel, number>;
  restBetweenExercises: Record<UserLevel, number>;
  sets: Record<UserLevel, number>;
}

// Database dettagliato degli esercizi con filtri
const detailedExerciseDatabase = {
  strength: [
    // PETTO
    { name: 'Flessioni', muscleGroup: 'Petto', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Pike Push-up', muscleGroup: 'Petto', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Flessioni Inclinate', muscleGroup: 'Petto', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Flessioni Declinate', muscleGroup: 'Petto', equipment: 'Corpo libero', level: 'Avanzato' },
    { name: 'Panca Piana', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Panca Inclinata', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Panca Declinata', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Bench Press', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Incline Bench Press', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Decline Bench Press', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Dumbbell Chest Press', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Cable Crossover', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Chest Press', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Aperture con Manubri', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Chest Press Inclinato', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Chest Press Declinato', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Aperture Inclinate', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Aperture Declinate', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Pullover', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Chest Fly', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    
    // SCHIENA
    { name: 'Superman', muscleGroup: 'Schiena', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Rematore con Manubri', muscleGroup: 'Schiena', equipment: 'Elastici', level: 'Intermedio' },
    { name: 'Pull-up', muscleGroup: 'Schiena', equipment: 'Corpo libero', level: 'Avanzato' },
    { name: 'Lat Machine', muscleGroup: 'Schiena', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Rematore con Bilanciere', muscleGroup: 'Schiena', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Bent-over Row', muscleGroup: 'Schiena', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'T-Bar Row', muscleGroup: 'Schiena', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Cable Pulldown', muscleGroup: 'Schiena', equipment: 'Bilanciere', level: 'Principiante' },
    { name: 'Seated Cable Row', muscleGroup: 'Schiena', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Deadlift', muscleGroup: 'Schiena', equipment: 'Bilanciere', level: 'Avanzato' },
    { name: 'Bent-over Row', muscleGroup: 'Schiena', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Rematore con Manubri', muscleGroup: 'Schiena', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Bent-over Row', muscleGroup: 'Schiena', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Rematore con Manubri', muscleGroup: 'Schiena', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Bent-over Row', muscleGroup: 'Schiena', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Reverse Fly', muscleGroup: 'Schiena', equipment: 'Manubri', level: 'Principiante' },
    { name: 'T-Raises', muscleGroup: 'Schiena', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'W-Raises', muscleGroup: 'Schiena', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Remata Alta', muscleGroup: 'Schiena', equipment: 'Manubri', level: 'Intermedio' },
    
    // SPALLE
    { name: 'Alzate Laterali', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Alzate Frontali', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Military Press', muscleGroup: 'Spalle', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Arnold Press', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Shoulder Press', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Alzate Laterali Inclinate', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Alzate Posteriori', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Lateral Raises', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Front Raises', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Upright Row', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Shrugs', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Principiante' },
    
    // BRACCIA
    { name: 'Dip alle Parallele', muscleGroup: 'Braccia', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Dip alla Sedia', muscleGroup: 'Braccia', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Curl con Manubri', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Principiante' },
    { name: 'French Press', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Hammer Curl', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Curl Concentrato', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Curl a Martello', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Curl Alternato', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Curl 21', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Tricep Extension', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Tricep Kickback', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Overhead Tricep Extension', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Intermedio' },
    
    // GAMBE
    { name: 'Squat', muscleGroup: 'Gambe', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Affondi', muscleGroup: 'Gambe', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Squat con Manubri', muscleGroup: 'Gambe', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Stacco da Terra', muscleGroup: 'Gambe', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Squat con Bilanciere', muscleGroup: 'Gambe', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Front Squat', muscleGroup: 'Gambe', equipment: 'Bilanciere', level: 'Avanzato' },
    { name: 'Overhead Squat', muscleGroup: 'Gambe', equipment: 'Bilanciere', level: 'Avanzato' },
    { name: 'Sumo Deadlift', muscleGroup: 'Gambe', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Romanian Deadlift', muscleGroup: 'Gambe', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Affondi con Bilanciere', muscleGroup: 'Gambe', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Bulgarian Split Squat', muscleGroup: 'Gambe', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Stacco su Una Gamba', muscleGroup: 'Gambe', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Calf Raises', muscleGroup: 'Gambe', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Goblet Squat', muscleGroup: 'Gambe', equipment: 'Kettlebell', level: 'Intermedio' },
    { name: 'Kettlebell Swing', muscleGroup: 'Gambe', equipment: 'Kettlebell', level: 'Intermedio' },
    { name: 'Affondi con Manubri', muscleGroup: 'Gambe', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Affondi Laterali', muscleGroup: 'Gambe', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Affondi Camminati', muscleGroup: 'Gambe', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Romanian Deadlift', muscleGroup: 'Gambe', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Step-up con Manubri', muscleGroup: 'Gambe', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Bulgarian Split Squat', muscleGroup: 'Gambe', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Calf Raises con Manubri', muscleGroup: 'Gambe', equipment: 'Manubri', level: 'Principiante' },
    
    // CORE
    { name: 'Plank', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Side Plank', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Russian Twist', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Mountain Climbers', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Crunch', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Leg Raises', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Dead Bug', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Glute Bridge', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Principiante' }
  ],
  
  hiit: [
    // PRINCIPIANTE
    { name: 'Jumping Jacks', level: 'Principiante', duration: '5-10 min' },
    { name: 'Saltelli Laterali', level: 'Principiante', duration: '5-10 min' },
    { name: 'Corsa sul Posto', level: 'Principiante', duration: '5-10 min' },
    { name: 'Calci ai Glutei', level: 'Principiante', duration: '5-10 min' },
    { name: 'Passi Laterali', level: 'Principiante', duration: '5-10 min' },
    { name: 'High Knees', level: 'Principiante', duration: '5-10 min' },
    
    // INTERMEDIO
    { name: 'Jump Squats', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Burpees', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Mountain Climbers', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Plank Jacks', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Jump Squats', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Thrusters', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Jump Lunges', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Mountain Climbers', level: 'Intermedio', duration: '15-20 min' },
    
    // AVANZATO
    { name: 'Burpees Esplosivi', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Star Jumps', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Skater Veloci', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Power Punches', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Explosive Push-up', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Quick Feet', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Arm Circles', level: 'Avanzato', duration: '25-30 min' }
  ]
};

const exerciseDatabase = {
  cardio: {
    exercises: [
      'Jumping Jacks', 'Saltelli Laterali', 'Burpees', 'Mountain Climbers',
      'Corsa sul Posto', 'Jump Squats', 'Plank Jacks', 'Saltelli da Pattinatore',
      'Movimento Incrociato', 'Calci ai Glutei', 'Passi Laterali', 'Jump Squats',
      'Box Steps', 'Camminata dell\'Orso', 'Saltelli a Rana', 'High Knees'
    ],
    durations: {
      short: { work: '20s', rest: '10s' },
      medium: { work: '30s', rest: '10s' },
      long: { work: '45s', rest: '15s' }
    }
  },
  strength: {
    exercises: [
      'Flessioni', 'Plank', 'Pike Push-up', 'Dip alle Parallele',
      'Squat', 'Affondi', 'Sedia al Muro', 'Glute Bridge',
      'Superman', 'Controllo Core', 'Russian Twist', 'Stacco su Una Gamba',
      'Dip alla Sedia', 'Calf Raises', 'Side Plank', 'Apertura Inversa'
    ],
    durations: {
      short: { work: '30s', rest: '15s' },
      medium: { work: '45s', rest: '15s' },
      long: { work: '60s', rest: '20s' }
    }
  },
  hiit: {
    exercises: [
      'Corsa sul Posto', 'Jump Squats', 'Burpees Esplosivi', 'Saltelli Laterali',
      'Mountain Climbers', 'Plank Jacks', 'Jump Squats', 'Thrusters',
      'Passi Veloce', 'Explosive Push-up', 'Jump Lunges', 'Star Jumps',
      'Skater Veloci', 'Power Punches', 'Quick Feet', 'Arm Circles'
    ],
    durations: {
      short: { work: '20s', rest: '10s' },
      medium: { work: '30s', rest: '10s' },
      long: { work: '40s', rest: '15s' }
    }
  },
  mobility: {
    exercises: [
      'Cat-Cow', 'Hip Circles', 'Shoulder Rolls', 'Leg Swings',
      'Arm Circles', 'Neck Rotations', 'Ankle Circles', 'Torso Twists',
      'Forward Fold', 'Stretch Quadricipiti', 'Chest Opener', 'Side Bend Stretch',
      'Forward Fold', 'Child\'s Pose', 'Cobra Pose', 'Hip Flexor Stretch'
    ],
    durations: {
      short: { work: '45s', rest: '10s' },
      medium: { work: '60s', rest: '10s' },
      long: { work: '90s', rest: '15s' }
    }
  }
};

// Funzione per mescolare array (Fisher-Yates shuffle)
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Genera un allenamento basato su categoria e durata
export const generateWorkout = (
  category: 'cardio' | 'strength' | 'hiit' | 'mobility', 
  totalMinutes: number,
  filters: FilterOptions = {},
  userLevel: UserLevel = 'INTERMEDIO',
  quickMode: boolean = false
): WorkoutPlan => {
  // Mappa corretta delle categorie
  const categoryMap = {
    'cardio': 'CARDIO',
    'strength': 'FORZA', 
    'hiit': 'HIIT',
    'mobility': 'MOBILITA'
  };
  const categoryUpper = categoryMap[category] as keyof typeof WORKOUT_RULES;
  const rules = quickMode ? QUICK_MODE_RULES[categoryUpper] : WORKOUT_RULES[categoryUpper];
  
  // Calcola numero esercizi
  let numExercises: number;
  if (quickMode) {
    numExercises = QUICK_MODE_RULES[categoryUpper].exercises;
  } else {
    const levelRules = rules as WorkoutRulesEntry;
    const min = levelRules.minExercises[userLevel];
    const max = levelRules.maxExercises[userLevel];
    numExercises = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // Usa valori specifici per livello (scientificamente validati)
  const duration = quickMode ? QUICK_MODE_RULES[categoryUpper].duration : (rules as WorkoutRulesEntry).exerciseDuration[userLevel];
  const rest = quickMode ? QUICK_MODE_RULES[categoryUpper].rest : (rules as WorkoutRulesEntry).restBetweenExercises[userLevel];
  
  // Applica filtri esistenti per selezione esercizi
  let availableExercises = exerciseDatabase[category].exercises || [];
  if (filters.muscleGroup) {
    // Per forza, usa il database dettagliato
    if (category === 'strength') {
      availableExercises = detailedExerciseDatabase.strength
        .filter(e => e.muscleGroup === filters.muscleGroup)
        .map(e => e.name);
    }
  }
  if (filters.equipment) {
    // Per forza, usa il database dettagliato
    if (category === 'strength') {
      availableExercises = detailedExerciseDatabase.strength
        .filter(e => e.equipment === filters.equipment)
        .map(e => e.name);
    }
  }
  
  // Genera workout con nuove regole e varietà
  const shuffledExercises = shuffleArray([...availableExercises]);
  const selectedExercises = [];
  let currentIndex = 0;
  let repetitionCount = 0;
  const maxRepetitionsPerExercise = 2; // Massimo 2 ripetizioni dello stesso esercizio
  
  for (let i = 0; i < numExercises && i < shuffledExercises.length; i++) {
    if (currentIndex >= shuffledExercises.length) {
      currentIndex = 0; // Ricomincia dall'inizio se abbiamo finito gli esercizi
      repetitionCount++;
    }
    
    // Se abbiamo ripetuto troppo lo stesso esercizio, passa al successivo
    if (repetitionCount >= maxRepetitionsPerExercise && shuffledExercises.length > 1) {
      currentIndex = (currentIndex + 1) % shuffledExercises.length;
      repetitionCount = 0;
    }
    
    const exercise = shuffledExercises[currentIndex];
    selectedExercises.push({
      name: exercise,
      duration: `${duration}s`,
      rest: `${rest}s`,
      sets: quickMode ? 1 : (rules as WorkoutRulesEntry).sets[userLevel]
    });
    
    currentIndex++;
  }
  
  // Nome personalizzato basato su categoria e durata
  const categoryNames = {
    cardio: 'Cardio',
    strength: 'Forza',
    hiit: 'HIIT',
    mobility: 'Mobilità'
  };

  const levelNames = {
    PRINCIPIANTE: 'Principiante',
    INTERMEDIO: 'Intermedio',
    AVANZATO: 'Avanzato'
  };

  const modeSuffix = quickMode ? ' (Quick 10min)' : ` (${totalMinutes} min)`;
  const levelSuffix = userLevel !== 'INTERMEDIO' ? ` - ${levelNames[userLevel]}` : '';

  return {
    name: `${categoryNames[category]}${levelSuffix}${modeSuffix}`,
    exercises: selectedExercises
  };
};

// Genera allenamento FORZA basato sui filtri
export const generateFilteredStrengthWorkout = (
  muscleGroup: string,
  equipment: string,
  totalMinutes: number = 45,
  userLevel: 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZATO' = 'INTERMEDIO'
): WorkoutPlan => {
  let filteredExercises = detailedExerciseDatabase.strength;
  
  // Filtra per gruppo muscolare
  if (muscleGroup !== 'Tutti') {
    filteredExercises = filteredExercises.filter(ex => ex.muscleGroup === muscleGroup);
  }
  
  // Filtra per attrezzatura
  if (equipment !== 'Tutte') {
    filteredExercises = filteredExercises.filter(ex => ex.equipment === equipment);
  }
  
  // Se non ci sono esercizi che corrispondono ai filtri, usa tutti gli esercizi
  if (filteredExercises.length === 0) {
    filteredExercises = detailedExerciseDatabase.strength;
  }
  
  // Determina intensità basata sulla durata
  let intensity: 'short' | 'medium' | 'long';
  if (totalMinutes <= 15) {
    intensity = 'short';
  } else if (totalMinutes <= 30) {
    intensity = 'medium';
  } else {
    intensity = 'long';
  }
  
  const durations = exerciseDatabase.strength.durations[intensity];
  
  // Calcola quanti esercizi servono
  const workTime = parseInt(durations.work);
  const restTime = parseInt(durations.rest);
  const totalTimePerExercise = workTime + restTime;
  const targetExercises = Math.floor((totalMinutes * 60) / totalTimePerExercise);
  
  // Calcola il numero di esercizi basato sul livello utente e durata
  // Limita il numero massimo di esercizi per evitare allenamenti troppo lunghi
  const maxExercisesByLevel = {
    PRINCIPIANTE: Math.min(8, Math.ceil(totalMinutes / 6)),   // Max 8, ~1 ogni 6 min
    INTERMEDIO: Math.min(12, Math.ceil(totalMinutes / 4)),    // Max 12, ~1 ogni 4 min  
    AVANZATO: Math.min(15, Math.ceil(totalMinutes / 3))       // Max 15, ~1 ogni 3 min
  };
  
  const maxExercises = maxExercisesByLevel[userLevel] || 10;
  const targetExercisesLimited = Math.min(targetExercises, maxExercises);
  
  let exerciseCount;
  if (filteredExercises.length >= targetExercisesLimited) {
    // Abbastanza esercizi disponibili
    exerciseCount = Math.min(targetExercisesLimited, filteredExercises.length);
  } else {
    // Pochi esercizi disponibili - limita le ripetizioni
    const maxRepetitions = Math.min(3, Math.ceil(targetExercisesLimited / filteredExercises.length));
    exerciseCount = Math.min(maxRepetitions * filteredExercises.length, targetExercisesLimited);
  }
  
  // Assicurati di avere almeno 1 esercizio
  exerciseCount = Math.max(1, exerciseCount);
  
  // Seleziona esercizi casuali
  const shuffledExercises = shuffleArray(filteredExercises);
  const selectedExercises = shuffledExercises.slice(0, exerciseCount);
  
  // Se ci sono meno esercizi di quelli necessari, ripetili in modo intelligente
  const finalExercises = [];
  let currentIndex = 0;
  let repetitionCount = 0;
  const maxRepetitionsPerExercise = 2; // Massimo 2 ripetizioni dello stesso esercizio
  
  for (let i = 0; i < exerciseCount; i++) {
    if (currentIndex >= selectedExercises.length) {
      currentIndex = 0; // Ricomincia dall'inizio se abbiamo finito gli esercizi
      repetitionCount++;
    }
    
    // Se abbiamo ripetuto troppo lo stesso esercizio, passa al successivo
    if (repetitionCount >= maxRepetitionsPerExercise && selectedExercises.length > 1) {
      currentIndex = (currentIndex + 1) % selectedExercises.length;
      repetitionCount = 0;
    }
    
    const exercise = selectedExercises[currentIndex];
    finalExercises.push({
      name: exercise.name,
      duration: durations.work,
      rest: durations.rest,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      level: exercise.level
    });
    
    currentIndex++;
  }
  
  // Crea gli esercizi con le durate appropriate
  const exercises: Exercise[] = finalExercises;
  
  // Nome personalizzato basato sui filtri
  const muscleGroupName = muscleGroup === 'Tutti' ? 'Total Body' : muscleGroup;
  const equipmentName = equipment === 'Tutte' ? 'Misto' : equipment;
  
  return {
    name: `Forza ${muscleGroupName} - ${equipmentName} (${totalMinutes} min)`,
    exercises
  };
};

// Genera allenamento HIIT basato sui filtri
export const generateFilteredHIITWorkout = (
  duration: string,
  level: string,
  totalMinutes: number = 45,
  userLevel: 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZATO' = 'INTERMEDIO'
): WorkoutPlan => {
  let filteredExercises = detailedExerciseDatabase.hiit;
  
  // Filtra per durata
  if (duration !== 'Tutte') {
    filteredExercises = filteredExercises.filter(ex => ex.duration === duration);
  }
  
  // Filtra per livello
  if (level !== 'Tutti') {
    filteredExercises = filteredExercises.filter(ex => ex.level === level);
  }
  
  // Se non ci sono esercizi che corrispondono ai filtri, usa tutti gli esercizi
  if (filteredExercises.length === 0) {
    filteredExercises = detailedExerciseDatabase.hiit;
  }
  
  // Determina intensità basata sulla durata
  let intensity: 'short' | 'medium' | 'long';
  if (totalMinutes <= 15) {
    intensity = 'short';
  } else if (totalMinutes <= 30) {
    intensity = 'medium';
  } else {
    intensity = 'long';
  }
  
  const durations = exerciseDatabase.hiit.durations[intensity];
  
  // Calcola quanti esercizi servono
  const workTime = parseInt(durations.work);
  const restTime = parseInt(durations.rest);
  const totalTimePerExercise = workTime + restTime;
  const targetExercises = Math.floor((totalMinutes * 60) / totalTimePerExercise);
  
  // Calcola il numero di esercizi basato sul livello utente e durata
  // Limita il numero massimo di esercizi per evitare allenamenti troppo lunghi
  const maxExercisesByLevel = {
    PRINCIPIANTE: Math.min(6, Math.ceil(totalMinutes / 8)),   // Max 6, ~1 ogni 8 min
    INTERMEDIO: Math.min(8, Math.ceil(totalMinutes / 6)),     // Max 8, ~1 ogni 6 min  
    AVANZATO: Math.min(10, Math.ceil(totalMinutes / 4))       // Max 10, ~1 ogni 4 min
  };
  
  const maxExercises = maxExercisesByLevel[userLevel] || 8;
  const targetExercisesLimited = Math.min(targetExercises, maxExercises);
  
  let exerciseCount;
  if (filteredExercises.length >= targetExercisesLimited) {
    // Abbastanza esercizi disponibili
    exerciseCount = Math.min(targetExercisesLimited, filteredExercises.length);
  } else {
    // Pochi esercizi disponibili - limita le ripetizioni
    const maxRepetitions = Math.min(3, Math.ceil(targetExercisesLimited / filteredExercises.length));
    exerciseCount = Math.min(maxRepetitions * filteredExercises.length, targetExercisesLimited);
  }
  
  // Assicurati di avere almeno 1 esercizio
  exerciseCount = Math.max(1, exerciseCount);
  
  // Seleziona esercizi casuali
  const shuffledExercises = shuffleArray(filteredExercises);
  const selectedExercises = shuffledExercises.slice(0, exerciseCount);
  
  // Se ci sono meno esercizi di quelli necessari, ripetili in modo intelligente
  const finalExercises = [];
  let currentIndex = 0;
  let repetitionCount = 0;
  const maxRepetitionsPerExercise = 2; // Massimo 2 ripetizioni dello stesso esercizio
  
  for (let i = 0; i < exerciseCount; i++) {
    if (currentIndex >= selectedExercises.length) {
      currentIndex = 0; // Ricomincia dall'inizio se abbiamo finito gli esercizi
      repetitionCount++;
    }
    
    // Se abbiamo ripetuto troppo lo stesso esercizio, passa al successivo
    if (repetitionCount >= maxRepetitionsPerExercise && selectedExercises.length > 1) {
      currentIndex = (currentIndex + 1) % selectedExercises.length;
      repetitionCount = 0;
    }
    
    const exercise = selectedExercises[currentIndex];
    finalExercises.push({
      name: exercise.name,
      duration: durations.work,
      rest: durations.rest,
      level: exercise.level
    });
    
    currentIndex++;
  }
  
  // Crea gli esercizi con le durate appropriate
  const exercises: Exercise[] = finalExercises;
  
  // Nome personalizzato basato sui filtri
  const levelName = level === 'Tutti' ? 'Misto' : level;
  const durationName = duration === 'Tutte' ? 'Personalizzato' : duration;
  
  return {
    name: `HIIT ${levelName} - ${durationName} (${totalMinutes} min)`,
    exercises
  };
};

// Genera nomi casuali per allenamenti consigliati
export const generateRecommendedWorkout = (): WorkoutPlan => {
  const recommendations = [
    { category: 'hiit' as const, duration: 20, name: 'HIIT Total Body' },
    { category: 'cardio' as const, duration: 25, name: 'Cardio Brucia Grassi' },
    { category: 'strength' as const, duration: 30, name: 'Forza Completa' },
    { category: 'mobility' as const, duration: 15, name: 'Mobilità Dinamica' },
  ];

  const random = recommendations[Math.floor(Math.random() * recommendations.length)];
  const workout = generateWorkout(random.category, random.duration);
  
  return {
    ...workout,
    name: random.name
  };
};