/**
 * Utility per calcolare parametri allenamento dinamici
 * in base al livello ed obiettivo dell'utente.
 */

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutGoal = 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss';
export type ExerciseType = 'compound' | 'isolation';

interface WorkoutParameters {
  sets: number;
  reps: string;
  rest: string;
}

type ExperienceInput = number | string | undefined | null;

const EXPERIENCE_KEYWORD_MAP: Record<string, UserLevel> = {
  principiante: 'beginner',
  beginner: 'beginner',
  base: 'beginner',
  intermedio: 'intermediate',
  intermediate: 'intermediate',
  medio: 'intermediate',
  avanzato: 'advanced',
  advanced: 'advanced',
  pro: 'advanced'
};

/**
 * Mappa un valore numerico (1-10) o testuale a UserLevel.
 */
export function mapExperienceLevel(level: ExperienceInput): UserLevel {
  if (typeof level === 'number' && !Number.isNaN(level)) {
    if (level <= 3) return 'beginner';
    if (level <= 6) return 'intermediate';
    return 'advanced';
  }

  if (typeof level === 'string') {
    const normalized = level.toLowerCase().trim();
    const matched = EXPERIENCE_KEYWORD_MAP[normalized];
    if (matched) {
      return matched;
    }
  }

  return 'intermediate';
}

/**
 * Converte la stringa obiettivo in WorkoutGoal.
 */
export function mapGoalToType(goal: string | undefined | null): WorkoutGoal {
  if (!goal) return 'hypertrophy';

  const goalLower = goal.toLowerCase();

  if (goalLower.includes('forza') || goalLower.includes('strength')) {
    return 'strength';
  }
  if (
    goalLower.includes('massa') ||
    goalLower.includes('ipertrofia') ||
    goalLower.includes('muscle')
  ) {
    return 'hypertrophy';
  }
  if (
    goalLower.includes('resistenza') ||
    goalLower.includes('endurance') ||
    goalLower.includes('cardio')
  ) {
    return 'endurance';
  }
  if (
    goalLower.includes('peso') ||
    goalLower.includes('dimagr') ||
    goalLower.includes('weight')
  ) {
    return 'weight_loss';
  }

  return 'hypertrophy';
}

/**
 * Determina se l'esercizio è composto o di isolamento.
 */
export function determineExerciseType(exerciseName: string): ExerciseType {
  const name = exerciseName.toLowerCase();

  const compoundKeywords = [
    'squat',
    'panca',
    'stacco',
    'deadlift',
    'bench press',
    'military press',
    'overhead press',
    'pull-up',
    'chin-up',
    'row',
    'rematore',
    'dip',
    'affondi',
    'lunge',
    'step-up',
    'push-up',
    'piegamenti',
    'trazioni',
    'hip thrust',
    'clean',
    'snatch'
  ];

  const isCompound = compoundKeywords.some((keyword) => name.includes(keyword));

  return isCompound ? 'compound' : 'isolation';
}

function getBaseParameters(level: UserLevel, goal: WorkoutGoal): WorkoutParameters {
  const parameters: Record<UserLevel, Record<WorkoutGoal, WorkoutParameters>> = {
    beginner: {
      strength: { sets: 3, reps: '6-8', rest: '120s' },
      hypertrophy: { sets: 3, reps: '8-10', rest: '90s' },
      endurance: { sets: 3, reps: '12-15', rest: '60s' },
      weight_loss: { sets: 3, reps: '10-12', rest: '45s' }
    },
    intermediate: {
      strength: { sets: 4, reps: '5-6', rest: '120s' },
      hypertrophy: { sets: 4, reps: '10-12', rest: '75s' },
      endurance: { sets: 3, reps: '15-18', rest: '45s' },
      weight_loss: { sets: 3, reps: '12-15', rest: '40s' }
    },
    advanced: {
      strength: { sets: 5, reps: '4-6', rest: '150s' },
      hypertrophy: { sets: 4, reps: '12-15', rest: '60s' },
      endurance: { sets: 4, reps: '18-20', rest: '45s' },
      weight_loss: { sets: 4, reps: '15-18', rest: '30s' }
    }
  };

  return parameters[level][goal];
}

/**
 * Calcola parametri per un esercizio a partire da livello e obiettivo utente.
 */
export function calculateWorkoutParameters(
  exerciseName: string,
  userLevel: number | string | undefined | null,
  userGoal: string | undefined | null
): WorkoutParameters {
  const level = mapExperienceLevel(userLevel);
  const goal = mapGoalToType(userGoal || undefined);
  const exerciseType = determineExerciseType(exerciseName);

  const baseParams = getBaseParameters(level, goal);

  let { sets, reps, rest } = baseParams;

  if (exerciseType === 'compound') {
    const restSeconds = parseInt(rest, 10);
    const bonusRest =
      level === 'beginner' ? 15 : level === 'intermediate' ? 20 : 30;
    const totalRest = Number.isNaN(restSeconds) ? 0 : restSeconds + bonusRest;
    rest = `${totalRest}s`;
  }

  console.log('Parametri calcolati:', {
    exercise: exerciseName,
    userLevel: level,
    userGoal: goal,
    type: exerciseType,
    result: { sets, reps, rest }
  });

  return { sets, reps, rest };
}


