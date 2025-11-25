import type {
  WorkoutPlan,
  WorkoutGoal,
  ExperienceLevel,
  WeeklyPlanDuration,
  WeeklyFrequency,
  Equipment,
} from '@/types/plan';
import { generateFilteredStrengthWorkout, generateWorkout } from './workoutGenerator';

interface WeeklyPlanParams {
  goal: WorkoutGoal;
  level: ExperienceLevel;
  duration: WeeklyPlanDuration;
  frequency: WeeklyFrequency;
  equipment: Equipment;
  limitations?: string;
}

/**
 * Genera un piano settimanale completo con multiple workout
 */
export async function generateWeeklyPlan(params: WeeklyPlanParams): Promise<Partial<WorkoutPlan>> {
  const { goal, level, duration, frequency, equipment, limitations } = params;

  // Parse frequency (es: "4-5" → 4, "6+" → 6)
  const frequencyNum = frequency === '6+' ? 6 : parseInt(frequency.split('-')[0]);

  // Genera nome piano
  const planName = `Piano ${goal} - ${duration} settimane`;

  // Genera workout per la settimana tipo
  const weeklyWorkouts = generateWeeklyWorkouts(goal, level, frequencyNum, equipment);

  // Crea piano
  const plan: Partial<WorkoutPlan> = {
    name: planName,
    plan_type: 'weekly',
    source: 'primebot',
    goal,
    level,
    duration_weeks: duration,
    frequency_per_week: frequencyNum,
    equipment,
    limitations,
    workouts: weeklyWorkouts,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    metadata: {
      created_via: 'plan_creation_flow',
      weekly_structure: getWeeklyStructure(goal, frequencyNum),
    },
  };

  return plan;
}

/**
 * Genera array di workout per settimana tipo
 */
function generateWeeklyWorkouts(
  goal: WorkoutGoal,
  level: ExperienceLevel,
  frequency: number,
  equipment: Equipment
): any[] {
  const workouts: any[] = [];

  // Mapping equipment per generatore
  const equipmentFilter =
    equipment === 'Corpo libero'
      ? 'Corpo libero'
      : equipment === 'Manubri/Pesi'
      ? 'Manubri'
      : 'Tutte';

  // Mapping level per generatore
  const userLevel =
    level === 'beginner'
      ? 'PRINCIPIANTE'
      : level === 'intermediate'
      ? 'INTERMEDIO'
      : 'AVANZATO';

  // Genera workout in base a goal e frequency
  if (goal === 'Aumentare massa muscolare') {
    // Split: Petto/Schiena/Gambe/Spalle
    if (frequency >= 4) {
      workouts.push(generateFilteredStrengthWorkout('Petto', equipmentFilter, 60, userLevel));
      workouts.push(generateFilteredStrengthWorkout('Schiena', equipmentFilter, 60, userLevel));
      workouts.push(generateFilteredStrengthWorkout('Gambe', equipmentFilter, 60, userLevel));
      if (frequency >= 5) {
        workouts.push(generateFilteredStrengthWorkout('Spalle', equipmentFilter, 60, userLevel));
      }
      if (frequency >= 6) {
        workouts.push(generateFilteredStrengthWorkout('Braccia', equipmentFilter, 60, userLevel));
        workouts.push(generateFilteredStrengthWorkout('Core', equipmentFilter, 60, userLevel));
      }
    } else {
      // Full body split per 2-3 giorni
      workouts.push(generateFilteredStrengthWorkout('Tutti', equipmentFilter, 60, userLevel));
      if (frequency >= 2) {
        workouts.push(generateFilteredStrengthWorkout('Gambe', equipmentFilter, 60, userLevel));
      }
      if (frequency >= 3) {
        workouts.push(generateFilteredStrengthWorkout('Petto', equipmentFilter, 60, userLevel));
      }
    }
  } else if (goal === 'Perdere peso') {
    // Mix cardio + forza
    for (let i = 0; i < frequency; i++) {
      if (i % 2 === 0) {
        workouts.push(generateWorkout('hiit', 45, {}, userLevel));
      } else {
        workouts.push(generateFilteredStrengthWorkout('Tutti', equipmentFilter, 45, userLevel));
      }
    }
  } else if (goal === 'Migliorare resistenza') {
    // Focus cardio
    for (let i = 0; i < frequency; i++) {
      workouts.push(generateWorkout('cardio', 45, {}, userLevel));
    }
  } else if (goal === 'Tonificare') {
    // Mix forza + mobilità
    for (let i = 0; i < frequency; i++) {
      if (i % 2 === 0) {
        workouts.push(generateFilteredStrengthWorkout('Tutti', equipmentFilter, 45, userLevel));
      } else {
        workouts.push(generateWorkout('mobility', 30, {}, userLevel));
      }
    }
  } else {
    // Default: Mantenersi attivo - full body variato
    for (let i = 0; i < frequency; i++) {
      workouts.push(generateFilteredStrengthWorkout('Tutti', equipmentFilter, 45, userLevel));
    }
  }

  return workouts.slice(0, frequency); // Limita al numero esatto di workout
}

/**
 * Genera struttura settimanale per metadata
 */
function getWeeklyStructure(goal: WorkoutGoal, frequency: number): string[] {
  // Esempio: ["Lun: Petto", "Mer: Schiena", "Ven: Gambe"]
  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const structure: string[] = [];

  if (frequency === 2) {
    structure.push(`${days[0]}: Workout 1`);
    structure.push(`${days[3]}: Workout 2`);
  } else if (frequency === 3) {
    structure.push(`${days[0]}: Workout 1`);
    structure.push(`${days[2]}: Workout 2`);
    structure.push(`${days[4]}: Workout 3`);
  } else if (frequency === 4) {
    structure.push(`${days[0]}: Workout 1`);
    structure.push(`${days[1]}: Workout 2`);
    structure.push(`${days[3]}: Workout 3`);
    structure.push(`${days[5]}: Workout 4`);
  } else if (frequency === 5) {
    structure.push(`${days[0]}: Workout 1`);
    structure.push(`${days[1]}: Workout 2`);
    structure.push(`${days[3]}: Workout 3`);
    structure.push(`${days[4]}: Workout 4`);
    structure.push(`${days[5]}: Workout 5`);
  } else {
    // 6+ giorni - distribuzione automatica
    for (let i = 0; i < frequency; i++) {
      structure.push(`${days[i]}: Workout ${i + 1}`);
    }
  }

  return structure;
}


