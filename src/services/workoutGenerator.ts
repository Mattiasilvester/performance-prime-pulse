// Generatore di allenamenti dinamici
interface Exercise {
  name: string;
  duration: string;
  rest: string;
  muscleGroup?: string;
  equipment?: string;
  level?: string;
}

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
  totalMinutes: number
): WorkoutPlan => {
  const categoryData = exerciseDatabase[category];
  
  // Determina intensità basata sulla durata
  let intensity: 'short' | 'medium' | 'long';
  if (totalMinutes <= 15) {
    intensity = 'short';
  } else if (totalMinutes <= 30) {
    intensity = 'medium';
  } else {
    intensity = 'long';
  }

  const durations = categoryData.durations[intensity];
  
  // Calcola quanti esercizi servono
  const workTime = parseInt(durations.work);
  const restTime = parseInt(durations.rest);
  const totalTimePerExercise = workTime + restTime;
  const targetExercises = Math.floor((totalMinutes * 60) / totalTimePerExercise);
  
  // Assicurati che ci siano abbastanza esercizi (minimo 4, massimo disponibili)
  const exerciseCount = Math.max(4, Math.min(targetExercises, categoryData.exercises.length));
  
  // Seleziona esercizi casuali
  const shuffledExercises = shuffleArray(categoryData.exercises);
  const selectedExercises = shuffledExercises.slice(0, exerciseCount);
  
  // Crea gli esercizi con le durate appropriate
  const exercises: Exercise[] = selectedExercises.map(name => ({
    name,
    duration: durations.work,
    rest: durations.rest
  }));

  // Nome personalizzato basato su categoria e durata
  const categoryNames = {
    cardio: 'Cardio',
    strength: 'Forza',
    hiit: 'HIIT',
    mobility: 'Mobilità'
  };

  const intensityNames = {
    short: 'Express',
    medium: 'Standard',
    long: 'Intenso'
  };

  return {
    name: `${categoryNames[category]} ${intensityNames[intensity]} (${totalMinutes} min)`,
    exercises
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