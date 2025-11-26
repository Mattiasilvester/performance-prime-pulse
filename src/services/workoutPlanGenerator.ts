import { type UserContext } from './primebotUserContextService';

/**
 * Tipo di esercizio per determinare set/rep appropriati
 */
export type ExerciseType = 'compound' | 'compound_secondary' | 'isolation' | 'isolation_light' | 'time_based';

/**
 * Esercizio strutturato con serie/ripetizioni variate
 */
export interface StructuredExercise {
  name: string;
  sets: number;
  reps: string; // Formato: "6-8", "10-12", "15-20", "30-45 secondi"
  rest_seconds: number;
  notes?: string;
  exercise_type: ExerciseType;
}

/**
 * Piano allenamento strutturato
 */
export interface StructuredWorkoutPlan {
  name: string;
  description?: string;
  workout_type: 'forza' | 'cardio' | 'hiit' | 'mobilita' | 'personalizzato';
  duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: StructuredExercise[];
  warmup?: string;
  cooldown?: string;
}

/**
 * Categorizza un esercizio per determinare set/rep appropriati
 */
export function categorizeExercise(exerciseName: string): ExerciseType {
  const name = exerciseName.toLowerCase();
  
  // Esercizi composti principali (squat, panca, stacco)
  const compoundMainKeywords = ['squat', 'panca', 'stacco', 'deadlift', 'bench press', 'pressa'];
  if (compoundMainKeywords.some(keyword => name.includes(keyword))) {
    return 'compound';
  }
  
  // Esercizi composti secondari (rematore, military press, lento avanti)
  const compoundSecondaryKeywords = ['rematore', 'row', 'military press', 'lento avanti', 'overhead press', 'shoulder press'];
  if (compoundSecondaryKeywords.some(keyword => name.includes(keyword))) {
    return 'compound_secondary';
  }
  
  // Esercizi a tempo (plank, wall sit, hollow hold)
  const timeBasedKeywords = ['plank', 'wall sit', 'hollow hold', 'side plank', 'bridge', 'ponte'];
  if (timeBasedKeywords.some(keyword => name.includes(keyword))) {
    return 'time_based';
  }
  
  // Esercizi isolamento leggeri (crunch, polpacci, addominali)
  const isolationLightKeywords = ['crunch', 'polpacci', 'calf', 'addominali', 'sit-up', 'leg raise'];
  if (isolationLightKeywords.some(keyword => name.includes(keyword))) {
    return 'isolation_light';
  }
  
  // Default: isolamento normale (curl, tricipiti, laterali)
  return 'isolation';
}

/**
 * Determina set/rep/rest in base al tipo di esercizio
 */
export function getExerciseParameters(
  exerciseType: ExerciseType,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): { sets: number; reps: string; rest_seconds: number } {
  switch (exerciseType) {
    case 'compound':
      // Esercizi composti principali: 4x6-8, recupero 90-120 sec
      return {
        sets: 4,
        reps: difficulty === 'beginner' ? '6-8' : difficulty === 'intermediate' ? '6-8' : '8-10',
        rest_seconds: difficulty === 'beginner' ? 90 : difficulty === 'intermediate' ? 90 : 120,
      };
    
    case 'compound_secondary':
      // Esercizi composti secondari: 4x8-10, recupero 75-90 sec
      return {
        sets: 4,
        reps: difficulty === 'beginner' ? '8-10' : difficulty === 'intermediate' ? '8-10' : '10-12',
        rest_seconds: difficulty === 'beginner' ? 75 : difficulty === 'intermediate' ? 75 : 90,
      };
    
    case 'isolation':
      // Esercizi isolamento: 3x10-12, recupero 60 sec
      return {
        sets: 3,
        reps: difficulty === 'beginner' ? '10-12' : difficulty === 'intermediate' ? '10-12' : '12-15',
        rest_seconds: 60,
      };
    
    case 'isolation_light':
      // Esercizi isolamento leggeri: 3x15-20, recupero 45 sec
      return {
        sets: 3,
        reps: difficulty === 'beginner' ? '15-20' : difficulty === 'intermediate' ? '15-20' : '20-25',
        rest_seconds: 45,
      };
    
    case 'time_based':
      // Esercizi a tempo: 3x30-45 secondi, recupero 45 sec
      return {
        sets: 3,
        reps: difficulty === 'beginner' ? '30 secondi' : difficulty === 'intermediate' ? '45 secondi' : '60 secondi',
        rest_seconds: 45,
      };
    
    default:
      return {
        sets: 3,
        reps: '10-12',
        rest_seconds: 60,
      };
  }
}

/**
 * Valida che il piano abbia variazione nei set/rep
 */
export function validatePlanVariation(plan: StructuredWorkoutPlan): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  if (!plan.exercises || plan.exercises.length === 0) {
    return {
      isValid: false,
      warnings: ['Il piano non contiene esercizi'],
    };
  }
  
  if (plan.exercises.length < 5) {
    warnings.push(`Il piano ha solo ${plan.exercises.length} esercizi (minimo consigliato: 5)`);
  }
  
  if (plan.exercises.length > 10) {
    warnings.push(`Il piano ha ${plan.exercises.length} esercizi (massimo consigliato: 10)`);
  }
  
  // Verifica variazione nei set/rep
  const setRepCombinations = plan.exercises.map(ex => `${ex.sets}x${ex.reps}`);
  const uniqueCombinations = new Set(setRepCombinations);
  
  if (uniqueCombinations.size === 1) {
    return {
      isValid: false,
      warnings: ['⚠️ CRITICO: Tutti gli esercizi hanno lo stesso set/rep! Il piano deve avere variazione.'],
    };
  }
  
  if (uniqueCombinations.size < plan.exercises.length * 0.5) {
    warnings.push(`⚠️ Il piano ha poca variazione: solo ${uniqueCombinations.size} combinazioni diverse su ${plan.exercises.length} esercizi`);
  }
  
  // Verifica che ci siano esercizi composti E isolamento
  const hasCompound = plan.exercises.some(ex => 
    ex.exercise_type === 'compound' || ex.exercise_type === 'compound_secondary'
  );
  const hasIsolation = plan.exercises.some(ex => 
    ex.exercise_type === 'isolation' || ex.exercise_type === 'isolation_light'
  );
  
  if (!hasCompound && plan.workout_type === 'forza') {
    warnings.push('⚠️ Piano forza senza esercizi composti principali');
  }
  
  if (!hasIsolation) {
    warnings.push('⚠️ Piano senza esercizi di isolamento');
  }
  
  return {
    isValid: true,
    warnings,
  };
}

/**
 * Converte risposta AI in piano strutturato
 */
export function convertAIResponseToPlan(aiResponse: string): StructuredWorkoutPlan | null {
  try {
    // Cerca JSON nella risposta AI
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Nessun JSON trovato nella risposta AI');
      return null;
    }
    
    const jsonStr = jsonMatch[0];
    const plan = JSON.parse(jsonStr) as StructuredWorkoutPlan;
    
    // Valida struttura base
    if (!plan.name || !plan.exercises || !Array.isArray(plan.exercises)) {
      console.error('❌ Struttura piano non valida:', plan);
      return null;
    }
    
    // Categorizza esercizi e aggiusta parametri se necessario
    plan.exercises = plan.exercises.map(ex => {
      const exerciseType = categorizeExercise(ex.name);
      const params = getExerciseParameters(exerciseType, plan.difficulty);
      
      return {
        ...ex,
        exercise_type: exerciseType,
        sets: ex.sets || params.sets,
        reps: ex.reps || params.reps,
        rest_seconds: ex.rest_seconds || params.rest_seconds,
      };
    });
    
    // Valida variazione
    const validation = validatePlanVariation(plan);
    if (!validation.isValid) {
      console.warn('⚠️ Piano non valido:', validation.warnings);
      // Non bloccare, ma loggare warning
    } else if (validation.warnings.length > 0) {
      console.warn('⚠️ Warning piano:', validation.warnings);
    }
    
    return plan;
  } catch (error) {
    console.error('❌ Errore conversione piano:', error);
    return null;
  }
}

/**
 * Genera piano strutturato basato su contesto utente e richiesta
 */
export function generateStructuredPlan(
  userContext: UserContext,
  request: string
): Partial<StructuredWorkoutPlan> {
  // Determina tipo workout dalla richiesta
  let workoutType: 'forza' | 'cardio' | 'hiit' | 'mobilita' | 'personalizzato' = 'forza';
  const requestLower = request.toLowerCase();
  
  if (requestLower.includes('cardio') || requestLower.includes('resistenza')) {
    workoutType = 'cardio';
  } else if (requestLower.includes('hiit') || requestLower.includes('intervalli')) {
    workoutType = 'hiit';
  } else if (requestLower.includes('mobilità') || requestLower.includes('stretching') || requestLower.includes('flessibilità')) {
    workoutType = 'mobilita';
  } else if (requestLower.includes('forza') || requestLower.includes('massa') || requestLower.includes('muscoli')) {
    workoutType = 'forza';
  }
  
  // Determina difficoltà dal livello utente
  const difficulty: 'beginner' | 'intermediate' | 'advanced' = 
    userContext.livello_fitness === 'beginner' ? 'beginner' :
    userContext.livello_fitness === 'advanced' ? 'advanced' :
    'intermediate';
  
  // Determina durata
  const duration = userContext.tempo_allenamento || 45;
  
  return {
    workout_type: workoutType,
    difficulty,
    duration_minutes: duration,
  };
}

