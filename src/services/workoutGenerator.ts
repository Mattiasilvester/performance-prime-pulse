// Generatore di allenamenti dinamici
interface Exercise {
  name: string;
  duration: string;
  rest: string;
}

interface WorkoutPlan {
  name: string;
  exercises: Exercise[];
}

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