import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Dumbbell, Sparkles, Play, Pause, Timer, RotateCcw } from 'lucide-react';
import { ExerciseGifLink } from './ExerciseGifLink';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMedalSystemContext } from '@/contexts/MedalSystemContext';
import { trackWorkoutForChallenge } from '@/utils/challengeTracking';
import { updateWorkoutStats } from '@/services/workoutStatsService';
import { completeWorkout as saveWorkoutToDiary } from '@/services/diaryService';
import { toast } from 'sonner';
import { parseTimeToSeconds, parseRestTime } from '@/utils/workoutUtils';
import { ChallengeNotification } from '@/components/ui/ChallengeNotification';
import { Button } from '@/components/ui/button';

function formatTimer(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

const workoutData = {
  cardio: {
    name: 'Cardio Brucia Grassi',
    exercises: [
      { name: 'Jumping Jacks', duration: '30s', rest: '10s' },
      { name: 'Saltelli Laterali', duration: '30s', rest: '10s' },
      { name: 'Burpees', duration: '30s', rest: '15s' },
      { name: 'Scalatori', duration: '30s', rest: '10s' },
    ],
  },
  strength: {
    name: 'Forza Upper Body',
    exercises: [
      { name: 'Flessioni', duration: '45s', rest: '15s' },
      { name: 'Plank', duration: '60s', rest: '20s' },
      { name: 'Pike Flessioni', duration: '45s', rest: '15s' },
      { name: 'Tricep Dips', duration: '45s', rest: '15s' },
    ],
  },
  recommended: {
    name: 'HIIT Total Body',
    exercises: [
      { name: 'Squat Jumps', duration: '45s', rest: '15s' },
      { name: 'Push-up to T', duration: '45s', rest: '15s' },
      { name: 'Saltelli in Plank', duration: '45s', rest: '15s' },
      { name: 'Affondi Saltati', duration: '45s', rest: '15s' },
    ],
  },
  hiit: {
    name: 'HIIT Intenso',
    exercises: [
      { name: 'Sprint sul posto', duration: '30s', rest: '10s' },
      { name: 'Jump Squats', duration: '30s', rest: '10s' },
      { name: 'Burpees esplosivi', duration: '30s', rest: '15s' },
      { name: 'Saltelli Laterali', duration: '30s', rest: '10s' },
    ],
  },
  mobility: {
    name: 'Mobilità e Stretching',
    exercises: [
      { name: 'Gatto e Mucca', duration: '60s', rest: '10s' },
      { name: 'Cerchi con i Fianchi', duration: '45s', rest: '10s' },
      { name: 'Rotazioni delle Spalle', duration: '45s', rest: '10s' },
      { name: 'Oscillazioni delle Gambe', duration: '60s', rest: '15s' },
    ],
  },
};

interface WorkoutExerciseShape {
  name: string;
  duration?: string | number;
  rest?: string | number;
  instructions?: string;
  sets?: number | string;
}

interface GeneratedWorkoutShape {
  name?: string;
  title?: string;
  exercises?: WorkoutExerciseShape[];
  meta?: { workoutTitle?: string; workoutType?: string; duration?: number | string; startCustomWorkout?: string };
  workout_type?: string;
  tipo?: string;
  type?: string;
  duration?: number | string;
  total_duration?: number;
}

type CurrentWorkoutDisplay = {
  name?: string;
  title?: string;
  workout_type?: string;
  tipo?: string;
  type?: string;
  duration?: number | string;
  total_duration?: number;
  exercises?: WorkoutExerciseShape[];
};

interface ActiveWorkoutProps {
  workoutId: string;
  generatedWorkout?: GeneratedWorkoutShape | null;
  customWorkout?: GeneratedWorkoutShape | null;
  onClose: () => void;
}

function isTimedExercise(exercise: WorkoutExerciseShape | undefined): boolean {
  const raw = exercise?.duration;
  const duration = typeof raw === 'string' ? raw.toLowerCase() : raw !== undefined ? String(raw) : '';
  return duration.includes('s') || duration.includes('sec');
}

function getSetsCount(ex: WorkoutExerciseShape | undefined): number {
  if (ex == null) return 3;
  const s = (ex as WorkoutExerciseShape).sets;
  if (typeof s === 'number') return s;
  if (s == null) return 3;
  const n = parseInt(String(s), 10);
  return Number.isNaN(n) ? 3 : n;
}

export const ActiveWorkout = ({ workoutId, generatedWorkout, customWorkout, onClose }: ActiveWorkoutProps) => {
  const { user } = useAuth();
  const { recordWorkoutCompletion } = useMedalSystemContext();
  const navigate = useNavigate();

  const currentWorkout = customWorkout || generatedWorkout || workoutData[workoutId as keyof typeof workoutData];
  const personalizedMeta = customWorkout?.meta ?? generatedWorkout?.meta ?? null;
  const currentDisplay = currentWorkout as CurrentWorkoutDisplay | null | undefined;
  const workoutTitle = personalizedMeta?.workoutTitle || currentDisplay?.title || currentDisplay?.name || 'Workout personalizzato';
  const workoutType = personalizedMeta?.workoutType || currentDisplay?.workout_type || currentDisplay?.tipo || (currentDisplay as GeneratedWorkoutShape)?.type || 'Allenamento personalizzato';
  const workoutDuration = personalizedMeta?.duration || currentDisplay?.duration || (currentDisplay as GeneratedWorkoutShape)?.total_duration;
  const workoutExerciseCount = currentWorkout?.exercises?.length || 0;
  const exercises = currentWorkout?.exercises ?? [];

  const [view, setView] = useState<'ready' | 'list'>('ready');
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [completedSets, setCompletedSets] = useState<Record<number, Set<number>>>({});
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [challengeNotification, setChallengeNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [activeCardSeconds, setActiveCardSeconds] = useState(0);
  const [activeCardPaused, setActiveCardPaused] = useState(false);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recoveryTimerBoxRef = useRef<HTMLDivElement | null>(null);
  const [isRecoveryTimerExpandedVisible, setIsRecoveryTimerExpandedVisible] = useState(true);

  const totalCount = exercises.length;
  const completedCount = completedExercises.size;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  const playBeep = useCallback((frequency: number = 800, duration: number = 200) => {
    if (!audioContextRef.current) return;
    try {
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      } catch {
        // ignore
      }
    };
    const handleInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const startRecoveryTimer = useCallback(
    (exerciseIndex: number) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      const ex = exercises[exerciseIndex];
      const restSecs = ex ? parseRestTime(ex.rest) : 60;
      setTimerSeconds(restSecs);
      setTimerRunning(true);
      playBeep(750, 150);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setTimerRunning(false);
            playBeep(750, 200);
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
            toast('Recupero finito — prossimo! 💪');
            return 0;
          }
          if (prev <= 4 && prev > 1) playBeep(950, 100);
          return prev - 1;
        });
      }, 1000);
    },
    [exercises, playBeep]
  );

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (cardIntervalRef.current) clearInterval(cardIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (view !== 'list' || !recoveryTimerBoxRef.current) return;
    const el = recoveryTimerBoxRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => setIsRecoveryTimerExpandedVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: '0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [view]);

  const startCardTimer = useCallback((index: number) => {
    const ex = exercises[index];
    if (!ex || !isTimedExercise(ex)) return;
    const secs = parseTimeToSeconds(ex.duration);
    setActiveCardIndex(index);
    setActiveCardSeconds(secs);
    setActiveCardPaused(false);
    playBeep(800, 200);
    if (cardIntervalRef.current) clearInterval(cardIntervalRef.current);
    cardIntervalRef.current = setInterval(() => {
      setActiveCardSeconds((prev) => {
        if (prev <= 1) {
          if (cardIntervalRef.current) {
            clearInterval(cardIntervalRef.current);
            cardIntervalRef.current = null;
          }
          setActiveCardIndex(null);
          setActiveCardSeconds(0);
          playBeep(1000, 150);
          if ('vibrate' in navigator) navigator.vibrate(50);
          setCompletedExercises((s) => new Set(s).add(index));
          startRecoveryTimer(index);
          return 0;
        }
        if (prev <= 4 && prev > 1) playBeep(950, 100);
        return prev - 1;
      });
    }, 1000);
  }, [exercises, startRecoveryTimer, playBeep]);

  const pauseCardTimer = useCallback(() => {
    if (cardIntervalRef.current) {
      clearInterval(cardIntervalRef.current);
      cardIntervalRef.current = null;
    }
    setActiveCardPaused(true);
  }, []);

  const resumeCardTimer = useCallback((index: number) => {
    const ex = exercises[index];
    if (!ex || activeCardIndex !== index) return;
    setActiveCardPaused(false);
    cardIntervalRef.current = setInterval(() => {
      setActiveCardSeconds((prev) => {
        if (prev <= 1) {
          if (cardIntervalRef.current) {
            clearInterval(cardIntervalRef.current);
            cardIntervalRef.current = null;
          }
          setActiveCardIndex(null);
          setActiveCardSeconds(0);
          playBeep(1000, 150);
          if ('vibrate' in navigator) navigator.vibrate(50);
          setCompletedExercises((s) => new Set(s).add(index));
          startRecoveryTimer(index);
          return 0;
        }
        if (prev <= 4 && prev > 1) playBeep(950, 100);
        return prev - 1;
      });
    }, 1000);
  }, [exercises, activeCardIndex, startRecoveryTimer, playBeep]);

  const skipCardTimer = useCallback((index: number) => {
    if (cardIntervalRef.current) {
      clearInterval(cardIntervalRef.current);
      cardIntervalRef.current = null;
    }
    setActiveCardIndex(null);
    setActiveCardSeconds(0);
    setActiveCardPaused(false);
    setCompletedExercises((s) => new Set(s).add(index));
    const ex = exercises[index];
    if (ex) startRecoveryTimer(index);
  }, [exercises, startRecoveryTimer]);

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
      const totalSets = getSetsCount(ex as WorkoutExerciseShape);
      const doneCount = (completedSets[exerciseIndex]?.size ?? 0) + 1;
      const allSetsDone = doneCount >= totalSets;
      if (allSetsDone) {
        setCompletedExercises((prev) => new Set(prev).add(exerciseIndex));
      }
      startRecoveryTimer(exerciseIndex);
    },
    [exercises, completedSets, startRecoveryTimer]
  );

  const handleExerciseComplete = useCallback(
    (exerciseIndex: number) => {
      const ex = exercises[exerciseIndex];
      const totalSets = getSetsCount(ex as WorkoutExerciseShape);
      setCompletedSets((prev) => {
        const next = { ...prev };
        next[exerciseIndex] = new Set(Array.from({ length: totalSets }, (_, idx) => idx));
        return next;
      });
      setCompletedExercises((prev) => new Set(prev).add(exerciseIndex));
      if ('vibrate' in navigator) navigator.vibrate(80);
      startRecoveryTimer(exerciseIndex);
    },
    [exercises, startRecoveryTimer]
  );

  useEffect(() => {
    exercises.forEach((ex, i) => {
      const totalSets = getSetsCount(ex as WorkoutExerciseShape);
      const done = completedSets[i];
      if (done && done.size >= totalSets && !completedExercises.has(i)) {
        setCompletedExercises((prev) => new Set(prev).add(i));
      }
    });
  }, [completedSets, exercises, completedExercises]);

  const handleResetTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerRunning(false);
    setTimerSeconds(90);
  }, []);

  const handlePlayPauseTimer = useCallback(() => {
    if (timerRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerRunning(false);
    } else {
      if (timerSeconds <= 0) return;
      setTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setTimerRunning(false);
            playBeep(750, 200);
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
            toast('Recupero finito — prossimo! 💪');
            return 0;
          }
          if (prev <= 4 && prev > 1) playBeep(950, 100);
          return prev - 1;
        });
      }, 1000);
    }
  }, [timerRunning, timerSeconds, playBeep]);

  const getPresetWorkoutDuration = (workoutName: string | undefined): number => {
    if (!workoutName || typeof workoutName !== 'string') return 30;
    const name = workoutName.toLowerCase();
    if (name.includes('cardio')) return 20;
    if (name.includes('forza') || name.includes('strength')) return 45;
    if (name.includes('hiit')) return 45;
    if (name.includes('mobilità') || name.includes('mobility')) return 15;
    return 30;
  };

  const completeWorkoutFlow = useCallback(async () => {
    if (!user?.id || !currentWorkout?.exercises || isSaving) return;
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
    setIsSaving(true);

    const totalSeconds = currentWorkout.exercises.reduce((acc, ex) => acc + parseTimeToSeconds(ex.duration), 0);
    let durationMinutes = Math.max(1, Math.floor(totalSeconds / 60));
    const workoutTitleForSave = (currentWorkout as CurrentWorkoutDisplay)?.title || currentWorkout?.name || 'Allenamento';
    const fallbackMinutes = getPresetWorkoutDuration(currentWorkout?.name);
    if (durationMinutes <= 0) durationMinutes = fallbackMinutes;

    let workoutSource: 'custom_workouts' | 'workout_plans' | 'quick' = 'quick';
    if (customWorkout) workoutSource = 'custom_workouts';
    else if (generatedWorkout) workoutSource = 'workout_plans';

    try {
      await saveWorkoutToDiary({
        workout_id: null,
        workout_source: workoutSource,
        workout_name: workoutTitle || workoutTitleForSave,
        workout_type: workoutType?.toLowerCase() || 'personalizzato',
        status: 'completed',
        duration_minutes: durationMinutes,
        exercises_count: currentWorkout.exercises.length,
        exercises: currentWorkout.exercises.map((ex, index) => ({
          name: ex.name,
          duration: ex.duration,
          rest: ex.rest,
          completed: completedExercises.has(index),
        })),
        completed_at: new Date().toISOString(),
        saved_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Errore salvataggio diary:', err);
      toast.error('Errore nel salvataggio del diario. Riprova.');
      setIsSaving(false);
      return;
    }

    recordWorkoutCompletion();
    const challengeResult = trackWorkoutForChallenge();
    if (challengeResult.message) {
      const notifType = challengeResult.isCompleted ? 'success' : challengeResult.isNewChallenge ? 'info' : 'info';
      setChallengeNotification({ message: challengeResult.message, type: notifType });
      setTimeout(() => setChallengeNotification(null), 5000);
    }

    try {
      await supabase.from('custom_workouts').insert({
        user_id: user.id,
        title: workoutTitleForSave,
        workout_type: 'personalizzato',
        scheduled_date: new Date().toISOString().split('T')[0],
        exercises: currentWorkout.exercises,
        total_duration: durationMinutes,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Errore custom_workouts:', err);
      toast('Allenamento salvato; statistiche potrebbero aggiornarsi in ritardo.');
    }

    try {
      const { updateWorkoutMetrics } = await import('@/services/updateWorkoutMetrics');
      await updateWorkoutMetrics(user.id, durationMinutes);
    } catch {
      // ignore
    }
    updateWorkoutStats(user.id, durationMinutes);
    window.dispatchEvent(new CustomEvent('workoutCompleted', { detail: { workoutId: workoutId, durationMinutes } }));

    toast.success('🏆 Allenamento completato! Ottimo lavoro!');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      navigate('/diary', { state: { justCompleted: true, workoutName: workoutTitle || workoutTitleForSave } });
    }, 800);
    setIsSaving(false);
  }, [user, currentWorkout, customWorkout, generatedWorkout, workoutTitle, workoutType, workoutId, completedExercises, isSaving, recordWorkoutCompletion, navigate]);

  if (!currentWorkout) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center px-4" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
        <div className="text-white text-center">
          <p>Allenamento non trovato</p>
          <Button onClick={onClose} className="mt-4 bg-[#EEBA2B] text-black hover:opacity-90">Torna indietro</Button>
        </div>
      </div>
    );
  }

  if (view === 'ready') {
    return (
      <div
        className="relative min-h-[calc(100vh-6rem-5rem)] flex flex-col justify-center items-center px-6 bg-[#0A0A0C]"
        style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
      >
        <div className="text-center space-y-6 max-w-lg w-full">
          <button type="button" onClick={onClose} className="text-[#8A8A96] hover:text-white text-sm absolute top-4 left-4 z-10">
            ← Torna indietro
          </button>
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'rgba(238,186,43,0.2)' }}>
              <Clock className="w-16 h-16 text-[#EEBA2B]" />
            </div>
          </div>
          {(personalizedMeta as { startCustomWorkout?: string } | null)?.startCustomWorkout === 'personalized' && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#EEBA2B]/40" style={{ background: 'rgba(238,186,43,0.2)' }}>
                <Sparkles className="w-4 h-4 text-[#EEBA2B]" />
                <span className="text-[#EEBA2B] font-semibold text-sm">Piano Personalizzato</span>
              </div>
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{workoutTitle}</h1>
            <p className="text-xl text-[#8A8A96]">{workoutType}</p>
          </div>
          <div className="rounded-xl p-5 border border-[#EEBA2B]/30" style={{ background: 'rgba(238,186,43,0.1)' }}>
            <h2 className="text-2xl font-bold text-[#EEBA2B] mb-3">💪 Circuito Completo</h2>
            <div className="space-y-2 text-base text-[#8A8A96]">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#EEBA2B]" />
                <span>{workoutExerciseCount} esercizi</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#EEBA2B]" />
                <span>{workoutDuration ? `~${workoutDuration} minuti` : 'Durata variabile'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#EEBA2B]">🔥</span>
                <span>Timer in card e recupero in alto</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#EEBA2B]">🎧</span>
                <span>Feedback audio e notifiche</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setView('list')}
              className="w-full rounded-xl py-5 px-6 text-xl font-bold text-black transition-colors"
              style={{ backgroundColor: '#EEBA2B' }}
            >
              Inizia Workout
            </button>
            <button type="button" onClick={onClose} className="w-full rounded-lg py-4 px-6 text-lg font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors">
              Torna indietro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] pb-32" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/7 bg-[#0A0A0C]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            aria-label="Indietro"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[#8A8A96] truncate">{workoutTitle}</p>
            <h1 className="text-lg font-bold text-white truncate">{workoutType}</h1>
          </div>
          <span
            className="shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold text-[#EEBA2B]"
            style={{ background: 'rgba(238,186,43,0.15)', borderColor: 'rgba(238,186,43,0.25)' }}
          >
            {totalCount} esercizi
          </span>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] text-[#8A8A96] mb-1">
            <span>{completedCount} di {totalCount} completati</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-[4px] w-full rounded-full bg-white/7 overflow-hidden transition-all duration-300">
            <div className="h-full rounded-full bg-[#EEBA2B] transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </header>

      <main className="-mt-[20px] pt-0 pb-28 px-4">
        <AnimatePresence>
          {!isRecoveryTimerExpandedVisible && (
            <motion.div
              key="recovery-timer-pill"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed left-0 right-0 top-[100px] z-50 flex justify-center px-4 tabular-nums"
            >
              <div
                className="flex items-center gap-3 rounded-full"
                style={{
                  fontFamily: 'Outfit, system-ui, sans-serif',
                  background: '#1E1E24',
                  border: '1px solid rgba(238,186,43,0.5)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  padding: '12px 22px',
                  minHeight: 52,
                  borderRadius: 9999,
                }}
              >
                <span className="text-[14px] font-semibold text-[#8A8A96]">Recupero</span>
                <span className="text-[20px] font-semibold text-[#EEBA2B] tabular-nums" style={{ fontWeight: 600 }}>{formatTimer(timerSeconds)}</span>
                <button
                  type="button"
                  onClick={handlePlayPauseTimer}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#16161A] text-[#EEBA2B] transition-colors hover:bg-white/10"
                  aria-label={timerRunning ? 'Pausa' : 'Play'}
                >
                  {timerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={recoveryTimerBoxRef} className="mb-3 rounded-[14px] border border-white/7 bg-[#1E1E24] p-4">
          <p className="mb-1 text-xs text-[#8A8A96] flex items-center gap-1.5"><Timer size={12} /> Timer recupero</p>
          <p className="text-[28px] font-bold text-[#EEBA2B] font-variant-numeric tabular-nums">{formatTimer(timerSeconds)}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleResetTimer}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/7 bg-white/5 text-white"
              aria-label="Reset"
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              onClick={handlePlayPauseTimer}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#EEBA2B] bg-[#EEBA2B] text-black font-bold"
              aria-label={timerRunning ? 'Pausa' : 'Play'}
            >
              {timerRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>

        {exercises.map((ex, i) => {
          const isCompleted = completedExercises.has(i);
          const timed = isTimedExercise(ex);
          const setsCount = getSetsCount(ex as WorkoutExerciseShape);
          const doneSets = completedSets[i];
          const isCardTimerActive = activeCardIndex === i;

          return (
            <div
              key={ex.name + i}
              className={`mb-3 rounded-[14px] border p-4 transition-colors ${
                isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-white/7 bg-[#16161A]'
              }`}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    isCompleted ? 'border-green-500 bg-green-500/15 text-green-500' : 'border-white/7 text-[#8A8A96]'
                  }`}
                >
                  {isCompleted ? '✓' : i + 1}
                </div>
                <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white">{ex.name}</p>
                  <ExerciseGifLink
                    exerciseName={ex.name}
                    buttonClassName="text-[#EEBA2B] hover:text-[#EEBA2B]/80 hover:bg-[#EEBA2B]/10 p-1.5 h-auto min-w-0 rounded-lg text-xs font-medium flex items-center"
                  />
                </div>
              </div>
              {timed ? (
                <p className="text-xs text-[#8A8A96] mt-1 ml-[46px]">
                  {String(ex.duration ?? '30s')} · {String(ex.rest ?? '0')} recupero
                </p>
              ) : (
                <p className="text-xs text-[#8A8A96] mt-1 ml-[46px]">
                  {setsCount} serie × {String(ex.duration ?? '10-12')} rip · {String(ex.rest ?? '60s')} recupero
                </p>
              )}

              {!isCompleted && timed && (
                <div className="mt-3 ml-0">
                  {!isCardTimerActive ? (
                    <button
                      type="button"
                      onClick={() => startCardTimer(i)}
                      className="rounded-[8px] border border-[#EEBA2B]/50 bg-[#EEBA2B]/10 text-[#EEBA2B] px-3 py-2 text-[11px] font-semibold transition-colors hover:bg-[#EEBA2B]/20"
                    >
                      Inizia
                    </button>
                  ) : (
                    <div className="rounded-[10px] border border-[#EEBA2B]/30 bg-[#16161A] p-3 space-y-2">
                      <p className="text-[22px] font-bold text-[#EEBA2B] font-variant-numeric tabular-nums">{formatTimer(activeCardSeconds)}</p>
                      <div className="flex gap-2">
                        {activeCardPaused ? (
                          <button
                            type="button"
                            onClick={() => resumeCardTimer(i)}
                            className="flex-1 rounded-[8px] border border-[#EEBA2B] bg-[#EEBA2B] text-black py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1"
                          >
                            <Play className="w-4 h-4" /> Riprendi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={pauseCardTimer}
                            className="flex-1 rounded-[8px] border border-white/7 bg-white/5 text-white py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1"
                          >
                            <Pause className="w-4 h-4" /> Pausa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => skipCardTimer(i)}
                          className="flex-1 rounded-[8px] border border-red-500/50 text-red-400 py-1.5 text-[11px] font-semibold"
                        >
                          Salta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isCompleted && !timed && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: setsCount }, (_, n) => {
                    const done = doneSets?.has(n) ?? false;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleSetClick(i, n)}
                        className={`rounded-[8px] border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                          done ? 'border-green-500/30 bg-green-500/15 text-green-500' : 'border-white/7 bg-transparent text-[#8A8A96] hover:border-white/15'
                        }`}
                      >
                        Serie {n + 1}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleExerciseComplete(i)}
                    className="rounded-[8px] border border-white/7 bg-transparent text-[#8A8A96] hover:border-white/15 px-3 py-1.5 text-[11px] font-semibold transition-colors"
                  >
                    Completato
                  </button>
                </div>
              )}
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
            isSaving ? 'cursor-wait bg-white/10 text-[#4a4a52]' : allCompleted ? 'cursor-pointer bg-[#EEBA2B] text-black hover:opacity-90' : 'cursor-not-allowed bg-white/10 text-[#4a4a52]'
          }`}
        >
          {isSaving ? 'Salvataggio...' : '🏆 Completa allenamento'}
        </button>
      </div>

      {challengeNotification && (
        <ChallengeNotification
          message={challengeNotification.message}
          type={challengeNotification.type}
          onClose={() => setChallengeNotification(null)}
        />
      )}
    </div>
  );
};
