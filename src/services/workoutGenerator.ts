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
      'Jumping Jacks', 'High Knees', 'Burpees', 'Mountain Climbers',
      'Sprint sul posto', 'Jump Squats', 'Plank Jacks', 'Skater Hops',
      'Cross Trainers', 'Butt Kickers', 'Lateral Shuffles', 'Tuck Jumps',
      'Box Steps', 'Bear Crawl', 'Frog Jumps', 'Power Knees'
    ],
    durations: {
      short: { work: '20s', rest: '10s' },
      medium: { work: '30s', rest: '10s' },
      long: { work: '45s', rest: '15s' }
    }
  },
  strength: {
    exercises: [
      'Push-ups', 'Plank', 'Pike Push-ups', 'Tricep Dips',
      'Squats', 'Lunges', 'Wall Sit', 'Glute Bridges',
      'Superman', 'Dead Bug', 'Russian Twists', 'Single Leg Deadlift',
      'Chair Dip', 'Calf Raises', 'Side Plank', 'Reverse Fly'
    ],
    durations: {
      short: { work: '30s', rest: '15s' },
      medium: { work: '45s', rest: '15s' },
      long: { work: '60s', rest: '20s' }
    }
  },
  hiit: {
    exercises: [
      'Sprint sul posto', 'Jump Squats', 'Burpees esplosivi', 'High Knees',
      'Mountain Climbers', 'Plank Jacks', 'Tuck Jumps', 'Squat Thrusts',
      'Fast Feet', 'Explosive Push-ups', 'Jump Lunges', 'Star Jumps',
      'Speed Skaters', 'Power Punches', 'Quick Steps', 'Battle Ropes Motion'
    ],
    durations: {
      short: { work: '20s', rest: '10s' },
      medium: { work: '30s', rest: '10s' },
      long: { work: '40s', rest: '15s' }
    }
  },
  mobility: {
    exercises: [
      'Cat-Cow Stretch', 'Hip Circles', 'Shoulder Rolls', 'Leg Swings',
      'Arm Circles', 'Neck Rotations', 'Ankle Circles', 'Spinal Twist',
      'Hamstring Stretch', 'Quad Stretch', 'Chest Opener', 'Side Bend',
      'Forward Fold', 'Child\'s Pose', 'Cobra Stretch', 'Pigeon Pose'
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