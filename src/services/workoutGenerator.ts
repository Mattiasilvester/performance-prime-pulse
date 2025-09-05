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
    minExercises: { PRINCIPIANTE: 4, INTERMEDIO: 5, AVANZATO: 7 },
    maxExercises: { PRINCIPIANTE: 6, INTERMEDIO: 8, AVANZATO: 10 },
    exerciseDuration: { PRINCIPIANTE: 30, INTERMEDIO: 45, AVANZATO: 60 },
    restBetweenExercises: { PRINCIPIANTE: 60, INTERMEDIO: 45, AVANZATO: 30 },
    sets: { PRINCIPIANTE: 2, INTERMEDIO: 3, AVANZATO: 4 }
  },
  HIIT: {
    minExercises: { PRINCIPIANTE: 4, INTERMEDIO: 5, AVANZATO: 6 },
    maxExercises: { PRINCIPIANTE: 5, INTERMEDIO: 7, AVANZATO: 8 },
    exerciseDuration: { PRINCIPIANTE: 20, INTERMEDIO: 30, AVANZATO: 40 },
    restBetweenExercises: { PRINCIPIANTE: 40, INTERMEDIO: 30, AVANZATO: 20 },
    sets: { PRINCIPIANTE: 2, INTERMEDIO: 3, AVANZATO: 3 }
  },
  CARDIO: {
    minExercises: { PRINCIPIANTE: 3, INTERMEDIO: 4, AVANZATO: 5 },
    maxExercises: { PRINCIPIANTE: 4, INTERMEDIO: 5, AVANZATO: 6 },
    exerciseDuration: { PRINCIPIANTE: 120, INTERMEDIO: 180, AVANZATO: 240 },
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

// Database dettagliato degli esercizi con filtri
const detailedExerciseDatabase = {
  strength: [
    // PETTO
    { name: 'Flessioni', muscleGroup: 'Petto', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Pike Flessioni', muscleGroup: 'Petto', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Flessioni Inclinate', muscleGroup: 'Petto', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Flessioni Declinate', muscleGroup: 'Petto', equipment: 'Corpo libero', level: 'Avanzato' },
    { name: 'Panca Piana', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Panca Inclinata', muscleGroup: 'Petto', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Chest Press', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Aperture', muscleGroup: 'Petto', equipment: 'Manubri', level: 'Intermedio' },
    
    // SCHIENA
    { name: 'Superman', muscleGroup: 'Schiena', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Remata', muscleGroup: 'Schiena', equipment: 'Elastici', level: 'Intermedio' },
    { name: 'Pull-ups', muscleGroup: 'Schiena', equipment: 'Corpo libero', level: 'Avanzato' },
    { name: 'Lat Machine', muscleGroup: 'Schiena', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Remata con Manubri', muscleGroup: 'Schiena', equipment: 'Manubri', level: 'Intermedio' },
    
    // SPALLE
    { name: 'Alzate Laterali', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Alzate Frontali', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Principiante' },
    { name: 'Military Press', muscleGroup: 'Spalle', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Arnold Press', muscleGroup: 'Spalle', equipment: 'Manubri', level: 'Intermedio' },
    
    // BRACCIA
    { name: 'Tricep Dips', muscleGroup: 'Braccia', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Dip sulla Sedia', muscleGroup: 'Braccia', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Curl con Manubri', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Principiante' },
    { name: 'French Press', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Hammer Curl', muscleGroup: 'Braccia', equipment: 'Manubri', level: 'Principiante' },
    
    // GAMBE
    { name: 'Squats', muscleGroup: 'Gambe', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Affondi', muscleGroup: 'Gambe', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Squat con Manubri', muscleGroup: 'Gambe', equipment: 'Manubri', level: 'Intermedio' },
    { name: 'Stacchi', muscleGroup: 'Gambe', equipment: 'Bilanciere', level: 'Intermedio' },
    { name: 'Single Leg Deadlift', muscleGroup: 'Gambe', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Calf Raises', muscleGroup: 'Gambe', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Goblet Squat', muscleGroup: 'Gambe', equipment: 'Kettlebell', level: 'Intermedio' },
    { name: 'Swing', muscleGroup: 'Gambe', equipment: 'Kettlebell', level: 'Intermedio' },
    
    // CORE
    { name: 'Plank', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Side Plank', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Mountain Climbers', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Crunch', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Leg Raises', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Intermedio' },
    { name: 'Dead Bug', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Principiante' },
    { name: 'Glute Bridges', muscleGroup: 'Core', equipment: 'Corpo libero', level: 'Principiante' }
  ],
  
  hiit: [
    // PRINCIPIANTE
    { name: 'Jumping Jacks', level: 'Principiante', duration: '5-10 min' },
    { name: 'Saltelli Laterali', level: 'Principiante', duration: '5-10 min' },
    { name: 'Sprint sul posto', level: 'Principiante', duration: '5-10 min' },
    { name: 'Calci ai Glutei', level: 'Principiante', duration: '5-10 min' },
    { name: 'Passi Laterali', level: 'Principiante', duration: '5-10 min' },
    { name: 'Ginocchia al Petto', level: 'Principiante', duration: '5-10 min' },
    
    // INTERMEDIO
    { name: 'Jump Squats', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Burpees', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Scalatori', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Saltelli in Plank', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Saltelli al Petto', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Spinte in Squat', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Affondi Saltati', level: 'Intermedio', duration: '15-20 min' },
    { name: 'Mountain Climbers', level: 'Intermedio', duration: '15-20 min' },
    
    // AVANZATO
    { name: 'Burpees esplosivi', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Saltelli a Stella', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Pattinatori Veloce', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Power Punches', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Explosive Flessioni', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Passi Rapidi', level: 'Avanzato', duration: '25-30 min' },
    { name: 'Onde con le Braccia', level: 'Avanzato', duration: '25-30 min' }
  ]
};

const exerciseDatabase = {
  cardio: {
    exercises: [
      'Jumping Jacks', 'Saltelli Laterali', 'Burpees', 'Scalatori',
      'Sprint sul posto', 'Jump Squats', 'Saltelli in Plank', 'Saltelli da Pattinatore',
      'Movimento Incrociato', 'Calci ai Glutei', 'Passi Laterali', 'Saltelli al Petto',
      'Box Steps', 'Camminata dell\'Orso', 'Saltelli a Rana', 'Ginocchia al Petto'
    ],
    durations: {
      short: { work: '20s', rest: '10s' },
      medium: { work: '30s', rest: '10s' },
      long: { work: '45s', rest: '15s' }
    }
  },
  strength: {
    exercises: [
      'Flessioni', 'Plank', 'Pike Flessioni', 'Tricep Dips',
      'Squats', 'Affondi', 'Sedia al Muro', 'Glute Bridges',
      'Superman', 'Controllo Core', 'Russian Twists', 'Single Leg Deadlift',
      'Dip sulla Sedia', 'Calf Raises', 'Side Plank', 'Apertura Inversa'
    ],
    durations: {
      short: { work: '30s', rest: '15s' },
      medium: { work: '45s', rest: '15s' },
      long: { work: '60s', rest: '20s' }
    }
  },
  hiit: {
    exercises: [
      'Sprint sul posto', 'Jump Squats', 'Burpees esplosivi', 'Saltelli Laterali',
      'Scalatori', 'Saltelli in Plank', 'Saltelli al Petto', 'Spinte in Squat',
      'Passi Veloce', 'Explosive Flessioni', 'Affondi Saltati', 'Saltelli a Stella',
      'Pattinatori Veloce', 'Power Punches', 'Passi Rapidi', 'Onde con le Braccia'
    ],
    durations: {
      short: { work: '20s', rest: '10s' },
      medium: { work: '30s', rest: '10s' },
      long: { work: '40s', rest: '15s' }
    }
  },
  mobility: {
    exercises: [
      'Gatto e Mucca', 'Cerchi con i Fianchi', 'Rotazioni delle Spalle', 'Oscillazioni delle Gambe',
      'Cerchi con le Braccia', 'Rotazioni del Collo', 'Cerchi con le Caviglie', 'Giro del Busto',
      'Allungamento Posteriori', 'Allungamento Quadricipiti', 'Apertura del Petto', 'Flessione Laterale',
      'Piegamento in Avanti', 'Posizione del Bambino', 'Posizione del Cobra', 'Allungamento Fianchi'
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
  filters: any = {},
  userLevel: 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZATO' = 'INTERMEDIO',
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
  let numExercises;
  if (quickMode) {
    numExercises = rules.exercises;
  } else {
    const min = rules.minExercises[userLevel];
    const max = rules.maxExercises[userLevel];
    numExercises = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // Usa valori specifici per livello (scientificamente validati)
  const duration = quickMode ? rules.duration : rules.exerciseDuration[userLevel];
  const rest = quickMode ? rules.rest : rules.restBetweenExercises[userLevel];
  
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
  
  // Genera workout con nuove regole
  const selectedExercises = [];
  const shuffledExercises = shuffleArray([...availableExercises]);
  
  for (let i = 0; i < numExercises && i < shuffledExercises.length; i++) {
    const exercise = shuffledExercises[i];
    selectedExercises.push({
      name: exercise,
      duration: `${duration}s`,
      rest: `${rest}s`,
      sets: quickMode ? 1 : rules.sets[userLevel]
    });
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
  totalMinutes: number = 45
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
  
  // Assicurati che ci siano abbastanza esercizi (minimo 8, massimo disponibili)
  const exerciseCount = Math.max(8, Math.min(targetExercises, filteredExercises.length));
  
  // Seleziona esercizi casuali
  const shuffledExercises = shuffleArray(filteredExercises);
  const selectedExercises = shuffledExercises.slice(0, exerciseCount);
  
  // Crea gli esercizi con le durate appropriate
  const exercises: Exercise[] = selectedExercises.map(ex => ({
    name: ex.name,
    duration: durations.work,
    rest: durations.rest,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    level: ex.level
  }));
  
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
  totalMinutes: number = 45
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
  
  // Assicurati che ci siano abbastanza esercizi (minimo 8, massimo disponibili)
  const exerciseCount = Math.max(8, Math.min(targetExercises, filteredExercises.length));
  
  // Seleziona esercizi casuali
  const shuffledExercises = shuffleArray(filteredExercises);
  const selectedExercises = shuffledExercises.slice(0, exerciseCount);
  
  // Crea gli esercizi con le durate appropriate
  const exercises: Exercise[] = selectedExercises.map(ex => ({
    name: ex.name,
    duration: durations.work,
    rest: durations.rest,
    level: ex.level
  }));
  
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