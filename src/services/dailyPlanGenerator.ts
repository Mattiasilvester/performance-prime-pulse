import { generateWorkout, generateFilteredStrengthWorkout } from './workoutGenerator';
import type { DailyPlanGoal, DailyPlanDuration, Equipment, WorkoutPlan } from '@/types/plan';

/**
 * Genera un workout giornaliero basato su goal, duration e equipment
 */
export function generateDailyWorkout(
  goal: DailyPlanGoal,
  duration: DailyPlanDuration,
  equipment: Equipment
): WorkoutPlan {
  // Mappa duration a minuti
  const durationMap: Record<DailyPlanDuration, number> = {
    '15-20': 20,
    '30-45': 45,
    '60+': 60,
  };
  const totalMinutes = durationMap[duration];

  // Mappa equipment a filtri per generateFilteredStrengthWorkout
  // Nota: generateFilteredStrengthWorkout accetta 'Tutte' per tutte le attrezzature
  const equipmentMap: Record<Equipment, string> = {
    'Corpo libero': 'Corpo libero',
    'Manubri/Pesi': 'Manubri',
    'Palestra completa': 'Tutte', // Usa tutte le attrezzature disponibili
  };
  const equipmentFilter = equipmentMap[equipment];

  // Mappa goal a category e filtri
  let workoutData: { name: string; exercises: any[] };

  switch (goal) {
    case 'Full Body':
      // Usa generateFilteredStrengthWorkout con 'Tutti' per tutti i gruppi muscolari
      workoutData = generateFilteredStrengthWorkout(
        'Tutti', // muscleGroup - 'Tutti' significa tutti i gruppi muscolari
        equipmentFilter,
        totalMinutes,
        'INTERMEDIO' // userLevel default
      );
      break;

    case 'Upper Body':
      // Per upper body, usa 'Petto' come gruppo principale (include anche spalle e braccia)
      // generateFilteredStrengthWorkout selezionerà esercizi principalmente per petto
      workoutData = generateFilteredStrengthWorkout(
        'Petto', // muscleGroup
        equipmentFilter,
        totalMinutes,
        'INTERMEDIO'
      );
      break;

    case 'Lower Body':
      // Usa generateFilteredStrengthWorkout con filtri lower body
      workoutData = generateFilteredStrengthWorkout(
        'Gambe', // muscleGroup
        equipmentFilter,
        totalMinutes,
        'INTERMEDIO'
      );
      break;

    case 'Core':
      // Per Core, usa generateFilteredStrengthWorkout con gruppo 'Core'
      workoutData = generateFilteredStrengthWorkout(
        'Core', // muscleGroup
        equipmentFilter,
        totalMinutes,
        'INTERMEDIO'
      );
      break;

    case 'Cardio':
      // Usa generateWorkout con category 'cardio'
      workoutData = generateWorkout(
        'cardio',
        totalMinutes,
        {},
        'INTERMEDIO'
      );
      break;

    default:
      // Fallback a Full Body
      workoutData = generateFilteredStrengthWorkout(
        'Tutti',
        equipmentFilter,
        totalMinutes,
        'INTERMEDIO'
      );
  }

  // Personalizza il nome del workout
  const goalNames: Record<DailyPlanGoal, string> = {
    'Full Body': 'Full Body',
    'Upper Body': 'Upper Body',
    'Lower Body': 'Lower Body',
    'Core': 'Core',
    'Cardio': 'Cardio',
  };

  const workoutName = `${goalNames[goal]} - ${duration} min`;

  // Costruisci WorkoutPlan completo con tutte le proprietà obbligatorie
  const workout: WorkoutPlan = {
    id: '', // Sarà generato dal database al salvataggio
    user_id: '', // Sarà impostato al salvataggio
    name: workoutName,
    plan_type: 'daily',
    source: 'primebot',
    goal: goal,
    equipment: equipment,
    workouts: [workoutData], // Array con singolo workout contenente name e exercises
    status: 'pending',
    created_at: new Date().toISOString(),
    is_active: true,
  };

  return workout;
}

