import type { WorkoutPlan } from '@/types/plan';

export interface DayExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscle?: string;
}

/**
 * Restituisce gli esercizi del giorno per un piano (normalizza exercises/esercizi, name/nome, etc.)
 */
export function getDayExercises(
  plan: WorkoutPlan,
  dayIndex: number
): DayExercise[] {
  const day = plan.workouts?.[dayIndex] as { exercises?: unknown[]; esercizi?: unknown[] } | undefined;
  if (!day) return [];
  const exs = day.exercises ?? day.esercizi ?? [];
  return exs.map((ex: unknown) => {
    const e = ex as Record<string, unknown>;
    return {
      name: (e.name ?? e.nome ?? 'Esercizio') as string,
      sets: (e.sets ?? e.serie ?? 3) as number,
      reps: String(e.reps ?? e.ripetizioni ?? ''),
      rest: (e.rest ?? e.riposo ?? '60s') as string,
      muscle: (e.muscle ?? e.muscolo ?? undefined) as string | undefined,
    };
  });
}

/**
 * Helper per convertire stringhe tempo in secondi (es. "90s", "1min", "60")
 */
export function parseTimeToSeconds(timeStr: string | undefined | number): number {
  if (typeof timeStr === 'number') {
    return timeStr;
  }

  if (!timeStr || typeof timeStr !== 'string') {
    return 30;
  }

  const str = timeStr.toString().toLowerCase().trim();
  let totalSeconds = 0;

  const minutesMatch = str.match(/(\d+)\s*m/);
  const secondsMatch = str.match(/(\d+)\s*s/);

  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1]) * 60;
  }

  if (secondsMatch) {
    totalSeconds += parseInt(secondsMatch[1]);
  }

  if (totalSeconds === 0) {
    const numberMatch = str.match(/(\d+)/);
    if (numberMatch) {
      totalSeconds = parseInt(numberMatch[1]);
    }
  }

  return totalSeconds || 30;
}

/**
 * Converte rest (es. "90s", "1min", 60) in secondi numerici.
 */
export function parseRestTime(rest: string | number | undefined): number {
  if (rest === undefined || rest === null) return 60;
  if (typeof rest === 'number') return rest;
  const restLower = rest.toLowerCase().trim();
  if (restLower.includes('s') || restLower.includes('sec')) {
    const match = restLower.match(/(\d+)/);
    return match ? parseInt(match[1]) : 60;
  }
  if (restLower.includes('min')) {
    const match = restLower.match(/(\d+\.?\d*)/);
    if (match) {
      const minutes = parseFloat(match[1]);
      return Math.round(minutes * 60);
    }
  }
  const numMatch = restLower.match(/^(\d+)$/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }
  return 60;
}
