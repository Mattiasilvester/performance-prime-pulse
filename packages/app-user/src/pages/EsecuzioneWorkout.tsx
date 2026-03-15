import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { WorkoutPlan } from '@/types/plan';
import { getDayExercises, parseRestTime } from '@/utils/workoutUtils';
import type { DayExercise } from '@/utils/workoutUtils';
import { completeWorkout } from '@/services/diaryService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMedalSystemContext } from '@/contexts/MedalSystemContext';
import { checkAndUnlockMedals } from '@/services/medalCheckService';

interface EsecuzioneWorkoutState {
  plan: WorkoutPlan;
  dayIndex: number;
}

function formatTimer(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function EsecuzioneWorkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as EsecuzioneWorkoutState | null;
  const isInvalid = !state?.plan || state.dayIndex === undefined;

  const plan = state?.plan;
  const dayIndex = state?.dayIndex ?? 0;
  const exercises: DayExercise[] = plan ? getDayExercises(plan, dayIndex) : [];
  const day = plan?.workouts?.[dayIndex] as { name?: string; nome?: string } | undefined;
  const dayName = day?.name ?? day?.nome ?? `Giorno ${dayIndex + 1}`;

  const [completedSets, setCompletedSets] = useState<Record<number, Set<number>>>({});
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { user } = useAuth();
  const { medalSystem, addEarnedMedals } = useMedalSystemContext();

  const isExerciseFullyCompleted = useCallback(
    (exerciseIndex: number, totalSets: number): boolean => {
      const done = completedSets[exerciseIndex];
      if (!done) return false;
      for (let i = 0; i < totalSets; i++) {
        if (!done.has(i)) return false;
      }
      return true;
    },
    [completedSets]
  );

  const startRecoveryTimer = useCallback(
    (exerciseIndex: number) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      const restSeconds = parseRestTime(exercises[exerciseIndex]?.rest ?? '60s');
      setTimerSeconds(restSeconds);
      setTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setTimerRunning(false);
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
            toast('Recupero finito — prossima serie! 💪');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [exercises]
  );

  const handleSetClick = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setCompletedSets((prev) => {
        const next = { ...prev };
        if (!next[exerciseIndex]) next[exerciseIndex] = new Set();
        next[exerciseIndex] = new Set(next[exerciseIndex]).add(setIndex);
        return next;
      });
      if ('vibrate' in navigator) navigator.vibrate(50);
      const ex = exercises[exerciseIndex];
      const totalSets = typeof ex.sets === 'number' ? ex.sets : 3;
      const isLastExercise = exerciseIndex === exercises.length - 1;
      const fullyDoneAfter =
        (completedSets[exerciseIndex]?.size ?? 0) + 1 >= totalSets;
      if (!isLastExercise || !fullyDoneAfter) {
        startRecoveryTimer(exerciseIndex);
      }
    },
    [exercises, completedSets, startRecoveryTimer]
  );

  const handleExerciseComplete = useCallback(
    (exerciseIndex: number) => {
      const ex = exercises[exerciseIndex];
      const totalSets =
        typeof ex.sets === 'string' ? parseInt(ex.sets) || 3 : (ex.sets ?? 3);
      setCompletedSets((prev) => {
        const next = { ...prev };
        next[exerciseIndex] = new Set(
          Array.from({ length: totalSets }, (_, i) => i)
        );
        return next;
      });
      setCompletedExercises((prev) => new Set(prev).add(exerciseIndex));
      const isLastExercise = exerciseIndex === exercises.length - 1;
      if (!isLastExercise) {
        if ('vibrate' in navigator) navigator.vibrate(80);
        startRecoveryTimer(exerciseIndex);
      } else {
        if ('vibrate' in navigator)
          navigator.vibrate([200, 100, 200, 100, 400]);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setTimerRunning(false);
      }
    },
    [exercises, startRecoveryTimer]
  );

  useEffect(() => {
    if (isInvalid) navigate('/i-miei-piani', { replace: true });
  }, [isInvalid, navigate]);

  useEffect(() => {
    sessionIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (sessionIntervalRef.current)
        clearInterval(sessionIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (exercises.length === 0) return;
    const toAdd: number[] = [];
    exercises.forEach((ex, i) => {
      const totalSets =
        typeof ex.sets === 'string' ? parseInt(ex.sets) || 3 : (ex.sets ?? 3);
      if (isExerciseFullyCompleted(i, totalSets) && !completedExercises.has(i)) {
        toAdd.push(i);
      }
    });
    if (toAdd.length === 0) return;
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      toAdd.forEach((idx) => next.add(idx));
      return next;
    });
    if (toAdd.includes(exercises.length - 1)) {
      if ('vibrate' in navigator)
        navigator.vibrate([200, 100, 200, 100, 400]);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerRunning(false);
    }
  }, [completedSets, exercises, isExerciseFullyCompleted, completedExercises]);

  const initialTimerSet = useRef(false);
  useEffect(() => {
    if (exercises.length > 0 && !initialTimerSet.current) {
      initialTimerSet.current = true;
      const firstRest = parseRestTime(exercises[0]?.rest ?? '60s');
      setTimerSeconds(firstRest);
    }
  }, [exercises]);

  if (isInvalid) return null;

  const completedCount = completedExercises.size;
  const totalCount = exercises.length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted =
    completedExercises.size === exercises.length && exercises.length > 0;

  const handleResetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerRunning(false);
    setTimerSeconds(90);
  };

  const handlePlayPauseTimer = () => {
    if (timerRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerRunning(false);
    } else {
      if (timerSeconds === 0) return;
      setTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setTimerRunning(false);
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
            toast('Recupero finito — prossima serie! 💪');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const completeWorkoutFlow = async () => {
    if (!user?.id || isSaving || !plan) return;
    setIsSaving(true);

    // Calcola durata stimata dal piano come fallback realistico
    const estimatedSeconds = exercises.reduce((acc, ex) => {
      const sets =
        typeof ex.sets === 'string' ? parseInt(ex.sets) || 3 : (ex.sets ?? 3);
      const restSecs = parseRestTime(ex.rest ?? '60s');
      return acc + sets * 40 + sets * restSecs;
    }, 0);
    const realisticSeconds = Math.max(elapsedSeconds, estimatedSeconds * 0.3);
    const durationMinutes = Math.max(1, Math.round(realisticSeconds / 60));

    const dayExercises = exercises;

    try {
      await completeWorkout({
        workout_id: plan.id,
        workout_source: 'workout_plans',
        workout_name: plan.name,
        workout_type:
          (plan as { plan_type?: string; workout_type?: string }).plan_type ??
          (plan as { plan_type?: string; workout_type?: string }).workout_type ??
          'strength',
        duration_minutes: durationMinutes,
        exercises_count: dayExercises.length,
        exercises: dayExercises as unknown[],
        completed_at: new Date().toISOString(),
        saved_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Errore salvataggio workout_diary:', err);
      toast.error('Errore nel salvataggio. Riprova.');
      setIsSaving(false);
      return;
    }

    if (user?.id) {
      const earnedIds = medalSystem.earnedMedals.map(m => m.id);
      checkAndUnlockMedals(user.id, earnedIds).then(newMedals => {
        if (newMedals.length > 0) addEarnedMedals(newMedals);
      });
    }

    try {
      const { error: customError } = await supabase.from('custom_workouts').insert({
        user_id: user.id,
        title: plan.name,
        workout_type:
          (plan as { plan_type?: string; workout_type?: string }).plan_type ??
          (plan as { plan_type?: string; workout_type?: string }).workout_type ??
          'strength',
        scheduled_date: new Date().toISOString().split('T')[0],
        exercises: dayExercises,
        total_duration: durationMinutes,
        completed: true,
        completed_at: new Date().toISOString(),
      });
      if (customError) throw customError;
    } catch (err) {
      console.error('Errore salvataggio custom_workouts:', err);
      toast('Allenamento salvato, statistiche potrebbero aggiornarsi in ritardo.');
    }

    window.dispatchEvent(
      new CustomEvent('workoutCompleted', {
        detail: { workoutId: plan.id, durationMinutes },
      })
    );

    toast.success('🏆 Allenamento completato! Ottimo lavoro!');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      navigate('/diary', {
        state: { justCompleted: true, workoutName: plan.name },
      });
    }, 800);
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0C]"
      style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
    >
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/7 bg-[#0A0A0C]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate('/i-miei-piani')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            aria-label="Indietro"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[#8A8A96] truncate">{plan!.name}</p>
            <h1 className="text-lg font-bold text-white truncate">{dayName}</h1>
          </div>
          <span
            className="shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold text-[#EEBA2B]"
            style={{
              background: 'rgba(238,186,43,0.15)',
              borderColor: 'rgba(238,186,43,0.25)',
            }}
          >
            {exercises.length} esercizi
          </span>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] text-[#8A8A96] mb-1">
            <span>
              {completedCount} di {totalCount} completati
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-[4px] w-full rounded-full bg-white/7 overflow-hidden transition-all duration-300">
            <div
              className="h-full rounded-full bg-[#EEBA2B] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      <main className="-mt-[20px] pt-0 pb-[120px] px-4">
        <div className="mb-3 rounded-[14px] border border-white/7 bg-[#1E1E24] p-4">
          <p className="mb-1 text-xs text-[#8A8A96]">⏱ Timer recupero</p>
          <p className="text-[28px] font-bold text-[#EEBA2B] font-variant-numeric tabular-nums">
            {formatTimer(timerSeconds)}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleResetTimer}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/7 bg-white/5 text-white"
              aria-label="Reset"
            >
              ↺
            </button>
            <button
              type="button"
              onClick={handlePlayPauseTimer}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#EEBA2B] bg-[#EEBA2B] text-black font-bold"
              aria-label={timerRunning ? 'Pausa' : 'Play'}
            >
              {timerRunning ? '⏸' : '▶'}
            </button>
          </div>
        </div>

        {exercises.map((ex, i) => {
          const setsCount = typeof ex.sets === 'number' ? ex.sets : 3;
          const doneSets = completedSets[i];
          const isCompleted = completedExercises.has(i);
          return (
            <div
              key={i}
              className={`mb-3 rounded-[14px] border p-4 transition-colors ${
                isCompleted
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-white/7 bg-[#16161A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleExerciseComplete(i)}
                  className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    isCompleted
                      ? 'border-green-500 bg-green-500/15 text-green-500'
                      : 'border-white/7 text-[#8A8A96]'
                  }`}
                  aria-label={isCompleted ? 'Esercizio completato' : 'Completa esercizio'}
                >
                  {isCompleted ? '✓' : i + 1}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{ex.name}</p>
                  <p className="text-xs text-[#8A8A96]">
                    {ex.sets} serie × {ex.reps} rip · {ex.rest} recupero
                  </p>
                </div>
                {ex.muscle && (
                  <span className="shrink-0 rounded-[10px] bg-white/5 px-2 py-0.5 text-[11px] text-[#4a4a52]">
                    {ex.muscle}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: setsCount }, (_, n) => {
                  const done = doneSets?.has(n) ?? false;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSetClick(i, n)}
                      className={`rounded-[8px] border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        done
                          ? 'border-green-500/30 bg-green-500/15 text-green-500'
                          : 'border-white/7 bg-transparent text-[#8A8A96] hover:border-white/15'
                      }`}
                    >
                      Serie {n + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      <div className="fixed left-4 right-4 bottom-[80px] z-30">
        <button
          type="button"
          disabled={!allCompleted || isSaving}
          onClick={completeWorkoutFlow}
          className={`w-full rounded-[14px] py-4 text-base font-bold transition-colors ${
            isSaving
              ? 'cursor-wait bg-white/10 text-[#4a4a52]'
              : allCompleted
                ? 'cursor-pointer bg-[#EEBA2B] text-black hover:opacity-90'
                : 'cursor-not-allowed bg-white/10 text-[#4a4a52]'
          }`}
        >
          {isSaving ? 'Salvataggio...' : '🏆 Completa allenamento'}
        </button>
      </div>
    </div>
  );
}
