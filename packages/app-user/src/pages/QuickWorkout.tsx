/* eslint-disable react-hooks/exhaustive-deps -- dipendenze intenzionali timer/resume */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Timer, RotateCcw } from 'lucide-react';
import { PushPermissionModal } from '@/components/notifications/PushPermissionModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useMedalSystemContext } from '@/contexts/MedalSystemContext';
import { checkAndUnlockMedals } from '@/services/medalCheckService';
import { trackWorkoutForChallenge } from '@/utils/challengeTracking';
import { ChallengeNotification } from '@/components/ui/ChallengeNotification';
import { ExerciseGifLink } from '@/components/workouts/ExerciseGifLink';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { completeWorkout as saveWorkoutToDiary } from '@/services/diaryService';

// Struttura dati del circuito workout (invariata)
interface Exercise {
  id: string;
  name: string;
  instructions: string;
  duration: number;
  rest: number;
  category: 'warmup' | 'main' | 'cooldown';
}

const WORKOUT_CIRCUIT: Exercise[] = [
  { id: 'jumping-jacks', name: 'Jumping Jacks', instructions: 'Salta aprendo e chiudendo braccia e gambe', duration: 30, rest: 0, category: 'warmup' },
  { id: 'march-in-place', name: 'Marcia sul posto', instructions: 'Cammina sul posto sollevando le ginocchia', duration: 30, rest: 0, category: 'warmup' },
  { id: 'arm-circles', name: 'Rotazioni braccia', instructions: 'Ruota le braccia in cerchi ampi', duration: 30, rest: 0, category: 'warmup' },
  { id: 'dynamic-stretch', name: 'Stretch dinamico', instructions: 'Allunga muscoli con movimenti fluidi', duration: 30, rest: 0, category: 'warmup' },
  { id: 'push-ups', name: 'Push-up', instructions: 'Flessioni (sulle ginocchia se necessario)', duration: 45, rest: 15, category: 'main' },
  { id: 'squats', name: 'Squat', instructions: 'Piegati sulle gambe come per sederti', duration: 45, rest: 15, category: 'main' },
  { id: 'plank', name: 'Plank', instructions: 'Mantieni posizione a tavola', duration: 30, rest: 30, category: 'main' },
  { id: 'mountain-climbers', name: 'Scalatori', instructions: 'Corsa sul posto in posizione plank', duration: 45, rest: 15, category: 'main' },
  { id: 'burpees', name: 'Burpees Modificati', instructions: 'Squat + plank + salto', duration: 30, rest: 30, category: 'main' },
  { id: 'lunges', name: 'Affondi Alternati', instructions: 'Affondi alternando le gambe', duration: 45, rest: 15, category: 'main' },
  { id: 'quad-stretch', name: 'Stretch Quadricipiti', instructions: 'Allunga quadricipiti 30s per lato', duration: 60, rest: 0, category: 'cooldown' },
  { id: 'calf-stretch', name: 'Stretch Polpacci', instructions: 'Allunga polpacci 30s per lato', duration: 60, rest: 0, category: 'cooldown' },
  { id: 'breathing', name: 'Respirazione Profonda', instructions: 'Respira profondamente per rilassarti', duration: 60, rest: 0, category: 'cooldown' },
];

const WORKOUT_ID = 'quick-10min';
const PROGRESS_KEY = 'pp_workout_progress';
const MAX_RESUME_HOURS = 2;

interface WorkoutProgress {
  workoutId: string;
  completedExercises: number[];
  timestamp: number;
}

function formatTimer(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

const QuickWorkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recordWorkoutCompletion, medalSystem, addEarnedMedals } = useMedalSystemContext();
  const {
    canAskPermission,
    showPermissionModal,
    modalTrigger,
    showFirstWorkoutModal,
    closeModal,
    handlePermissionGranted,
  } = usePushNotifications();

  const [view, setView] = useState<'intro' | 'resume-prompt' | 'list'>('intro');
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [challengeNotification, setChallengeNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [activeCardSeconds, setActiveCardSeconds] = useState(0);
  const [activeCardPaused, setActiveCardPaused] = useState(false);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recoveryTimerBoxRef = useRef<HTMLDivElement | null>(null);
  const [isRecoveryTimerExpandedVisible, setIsRecoveryTimerExpandedVisible] = useState(true);

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

  const exercises = WORKOUT_CIRCUIT;
  const totalCount = exercises.length;
  const completedCount = completedExercises.size;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  const saveWorkoutProgress = useCallback(() => {
    const progress: WorkoutProgress = {
      workoutId: WORKOUT_ID,
      completedExercises: Array.from(completedExercises),
      timestamp: Date.now(),
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [completedExercises]);

  const loadWorkoutProgress = useCallback((): WorkoutProgress | null => {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      if (!saved) return null;
      const progress: WorkoutProgress = JSON.parse(saved);
      const hoursAgo = (Date.now() - progress.timestamp) / (1000 * 60 * 60);
      if (progress.workoutId !== WORKOUT_ID || hoursAgo > MAX_RESUME_HOURS) {
        localStorage.removeItem(PROGRESS_KEY);
        return null;
      }
      return progress;
    } catch {
      localStorage.removeItem(PROGRESS_KEY);
      return null;
    }
  }, []);

  const clearWorkoutProgress = useCallback(() => {
    localStorage.removeItem(PROGRESS_KEY);
  }, []);

  const canResumeWorkout = useCallback((): boolean => {
    const progress = loadWorkoutProgress();
    return progress !== null && progress.completedExercises.length < totalCount;
  }, [loadWorkoutProgress, totalCount]);

  useEffect(() => {
    if (canResumeWorkout()) {
      setView('resume-prompt');
    }
  }, []);

  useEffect(() => {
    if (view !== 'list') return;
    saveWorkoutProgress();
  }, [view, completedExercises, saveWorkoutProgress]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (view === 'list' && completedExercises.size > 0 && !allCompleted) {
        saveWorkoutProgress();
        e.preventDefault();
        e.returnValue = 'Vuoi uscire? Il progresso verrà salvato.';
        return 'Vuoi uscire? Il progresso verrà salvato.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [view, completedExercises.size, allCompleted, saveWorkoutProgress]);

  const startRecoveryTimer = useCallback(
    (exerciseIndex: number) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      const ex = exercises[exerciseIndex];
      const restSeconds = ex?.rest ?? 0;
      if (restSeconds <= 0) return;
      setTimerSeconds(restSeconds);
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
            toast('Recupero finito — prossimo esercizio! 💪');
            return 0;
          }
          if (prev <= 4 && prev > 1) playBeep(950, 100);
          return prev - 1;
        });
      }, 1000);
    },
    [exercises, playBeep]
  );

  const handleExerciseComplete = useCallback(
    (exerciseIndex: number) => {
      setCompletedExercises((prev) => new Set(prev).add(exerciseIndex));
      if ('vibrate' in navigator) navigator.vibrate(50);
      const isLastExercise = exerciseIndex === exercises.length - 1;
      if (!isLastExercise) {
        startRecoveryTimer(exerciseIndex);
      } else {
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setTimerRunning(false);
      }
    },
    [exercises.length, startRecoveryTimer]
  );

  const startCardTimer = useCallback(
    (index: number) => {
      const ex = exercises[index];
      if (!ex) return;
      setActiveCardIndex(index);
      setActiveCardSeconds(ex.duration);
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
            setCompletedExercises((prevSet) => new Set(prevSet).add(index));
            startRecoveryTimer(index);
            return 0;
          }
          if (prev <= 4 && prev > 1) playBeep(950, 100);
          return prev - 1;
        });
      }, 1000);
    },
    [exercises, startRecoveryTimer, playBeep]
  );

  const pauseCardTimer = useCallback(() => {
    if (cardIntervalRef.current) {
      clearInterval(cardIntervalRef.current);
      cardIntervalRef.current = null;
    }
    setActiveCardPaused(true);
  }, []);

  const resumeCardTimer = useCallback(
    (index: number) => {
      if (activeCardIndex !== index) return;
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
            setCompletedExercises((prevSet) => new Set(prevSet).add(index));
            startRecoveryTimer(index);
            return 0;
          }
          if (prev <= 4 && prev > 1) playBeep(950, 100);
          return prev - 1;
        });
      }, 1000);
    },
    [activeCardIndex, startRecoveryTimer, playBeep]
  );

  const skipCardTimer = useCallback(
    (index: number) => {
      if (cardIntervalRef.current) {
        clearInterval(cardIntervalRef.current);
        cardIntervalRef.current = null;
      }
      setActiveCardIndex(null);
      setActiveCardSeconds(0);
      setActiveCardPaused(false);
      setCompletedExercises((prev) => new Set(prev).add(index));
      const ex = exercises[index];
      if (ex && ex.rest > 0) startRecoveryTimer(index);
    },
    [exercises, startRecoveryTimer]
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

  const initialTimerSet = useRef(false);
  useEffect(() => {
    if (view === 'list' && exercises.length > 0 && !initialTimerSet.current) {
      initialTimerSet.current = true;
      const firstRest = exercises[0]?.rest ?? 0;
      setTimerSeconds(firstRest > 0 ? firstRest : 90);
    }
  }, [view, exercises.length]);

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
            playBeep(750, 200);
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
            toast('Recupero finito — prossimo esercizio! 💪');
            return 0;
          }
          if (prev <= 4 && prev > 1) playBeep(950, 100);
          return prev - 1;
        });
      }, 1000);
    }
  };

  const completeWorkoutFlow = async () => {
    if (!user?.id || isSaving) return;
    setIsSaving(true);

    const totalSeconds = exercises.reduce((acc, ex) => acc + ex.duration + ex.rest, 0);
    const durationMinutes = Math.max(1, Math.floor(totalSeconds / 60));

    const workoutDataForDiary = {
      workout_id: null,
      workout_source: 'quick' as const,
      workout_name: 'Allenamento Rapido 10 minuti',
      workout_type: 'cardio',
      status: 'completed' as const,
      duration_minutes: durationMinutes,
      exercises_count: exercises.length,
      exercises: exercises.map((ex, index) => ({
        name: ex.name,
        duration: ex.duration,
        rest: ex.rest,
        completed: completedExercises.has(index),
      })),
      completed_at: new Date().toISOString(),
      saved_at: new Date().toISOString(),
    };

    try {
      await saveWorkoutToDiary(workoutDataForDiary);
    } catch (err) {
      console.error('Errore salvataggio diary:', err);
      toast.error('Errore nel salvataggio del diario. Riprova.');
      setIsSaving(false);
      return;
    }

    recordWorkoutCompletion();
    if (user?.id) {
      const earnedIds = medalSystem.earnedMedals.map(m => m.id);
      checkAndUnlockMedals(user.id, earnedIds).then(newMedals => {
        if (newMedals.length > 0) addEarnedMedals(newMedals);
      });
    }
    const challengeResult = trackWorkoutForChallenge();
    if (challengeResult.message) {
      const notificationType = challengeResult.isCompleted ? 'success' : challengeResult.isNewChallenge ? 'info' : 'info';
      setChallengeNotification({ message: challengeResult.message, type: notificationType });
      setTimeout(() => setChallengeNotification(null), 5000);
    }

    try {
      await supabase.from('custom_workouts').insert({
        user_id: user.id,
        title: 'Allenamento Rapido 10 minuti',
        workout_type: 'cardio',
        scheduled_date: new Date().toISOString().split('T')[0],
        exercises: WORKOUT_CIRCUIT,
        total_duration: 10,
        completed: true,
        completed_at: new Date().toISOString(),
      });

      const { updateWorkoutMetrics } = await import('@/services/updateWorkoutMetrics');
      await updateWorkoutMetrics(user.id, 10);
    } catch (err) {
      console.error('Errore salvataggio custom_workouts:', err);
      toast('Allenamento salvato; statistiche potrebbero aggiornarsi in ritardo.');
    }

    window.dispatchEvent(new CustomEvent('workoutCompleted', { detail: { workoutId: WORKOUT_ID } }));
    clearWorkoutProgress();

    const isFirstWorkout = !localStorage.getItem('firstWorkoutCompleted');
    if (isFirstWorkout) {
      localStorage.setItem('firstWorkoutCompleted', 'true');
      if (canAskPermission) {
        showFirstWorkoutModal();
      }
    }

    toast.success('🏆 Allenamento completato! Ottimo lavoro!');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      navigate('/diary', {
        state: { justCompleted: true, workoutName: 'Allenamento Rapido 10 minuti' },
      });
    }, 800);
    setIsSaving(false);
  };

  const startWorkout = () => {
    setCompletedExercises(new Set());
    clearWorkoutProgress();
    setView('list');
  };

  const resumeWorkout = () => {
    const progress = loadWorkoutProgress();
    if (progress) {
      setCompletedExercises(new Set(progress.completedExercises));
      setView('list');
    }
  };

  const restartWorkout = () => {
    clearWorkoutProgress();
    startWorkout();
  };

  // ---------- Schermata resume-prompt ----------
  if (view === 'resume-prompt') {
    const progress = loadWorkoutProgress();
    const exerciseName = progress && progress.completedExercises.length < exercises.length
      ? exercises[progress.completedExercises.length]?.name
      : '';

    return (
      <div
        className="min-h-[calc(100vh-6rem-5rem)] flex flex-col justify-center items-center px-6 bg-[#0A0A0C]"
        style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
      >
        <div className="text-center space-y-8 max-w-lg w-full">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 border-[#EEBA2B]" style={{ background: '#16161A' }}>
            <Timer className="text-[#EEBA2B]" size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Workout interrotto</h1>
            <p className="text-[#8A8A96] mb-4">Hai un workout in corso</p>
            <p className="text-sm text-[#8A8A96]">
              Prossimo esercizio: <span className="font-semibold text-white">{exerciseName}</span>
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={resumeWorkout}
              className="w-full rounded-xl py-4 px-6 text-lg font-bold text-black transition-colors"
              style={{ backgroundColor: '#EEBA2B' }}
            >
              Continua da dove hai lasciato
            </button>
            <button
              type="button"
              onClick={restartWorkout}
              className="w-full rounded-xl py-4 px-6 text-lg font-semibold text-white bg-white/10 border border-white/10 hover:bg-white/15 transition-colors"
            >
              Ricomincia da capo
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-lg py-3 px-6 text-base font-semibold text-white bg-red-600/80 hover:bg-red-600 transition-colors"
            >
              Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Schermata intro ----------
  if (view === 'intro') {
    return (
      <div
        className="min-h-[calc(100vh-6rem-5rem)] flex flex-col justify-center items-center px-6 bg-[#0A0A0C]"
        style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
      >
        <div className="text-center space-y-8 max-w-lg w-full">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="absolute top-4 left-4 text-[#8A8A96] hover:text-white text-sm"
          >
            ← Torna alla Dashboard
          </button>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 border-[#EEBA2B]" style={{ background: '#16161A' }}>
            <Timer className="text-[#EEBA2B]" size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Workout rapido</h1>
            <p className="text-[#8A8A96]">Allenamento di 10 minuti</p>
          </div>
          <div className="rounded-xl p-6 border border-[#EEBA2B]/30 text-left" style={{ background: 'rgba(238,186,43,0.1)' }}>
            <h2 className="text-lg font-bold text-[#EEBA2B] mb-4">💪 Circuito completo</h2>
            <ul className="space-y-2 text-sm text-[#8A8A96]">
              <li>🔥 Riscaldamento (2 min)</li>
              <li>⚡ Esercizi intensi (6 min)</li>
              <li>🧘 Defaticamento (2 min)</li>
              <li className="flex items-center gap-2"><Timer className="shrink-0" size={14} /> Timer recupero</li>
            </ul>
          </div>
          <div className="space-y-3 w-full">
            <button
              type="button"
              onClick={startWorkout}
              className="w-full rounded-xl py-4 px-6 text-lg font-bold text-black transition-colors"
              style={{ backgroundColor: '#EEBA2B' }}
            >
              Inizia workout
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-lg py-3 px-6 text-base font-semibold text-[#8A8A96] hover:text-white bg-white/10 transition-colors"
            >
              Torna alla Dashboard
            </button>
          </div>
        </div>

        <PushPermissionModal
          isOpen={showPermissionModal}
          onClose={closeModal}
          onPermissionGranted={handlePermissionGranted}
          trigger={modalTrigger}
        />
        {challengeNotification && (
          <ChallengeNotification
            message={challengeNotification.message}
            type={challengeNotification.type}
            onClose={() => setChallengeNotification(null)}
          />
        )}
      </div>
    );
  }

  // ---------- Lista esercizi (layout EsecuzioneWorkout) ----------
  return (
    <div
      className="min-h-screen bg-[#0A0A0C] pb-32"
      style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
    >
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/7 bg-[#0A0A0C]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            aria-label="Indietro"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[#8A8A96] truncate">Allenamento Rapido</p>
            <h1 className="text-lg font-bold text-white truncate">10 minuti</h1>
          </div>
          <span
            className="shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold text-[#EEBA2B]"
            style={{
              background: 'rgba(238,186,43,0.15)',
              borderColor: 'rgba(238,186,43,0.25)',
            }}
          >
            {totalCount} esercizi
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

      <main className="-mt-[20px] pt-0 pb-28 px-4">
        <AnimatePresence>
          {view === 'list' && !isRecoveryTimerExpandedVisible && (
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
          const durationLabel = ex.rest > 0
            ? `${ex.duration}s · ${ex.rest}s recupero`
            : `${ex.duration}s`;
          const isCardTimerActive = activeCardIndex === i;
          return (
            <div
              key={ex.id}
              className={`mb-3 rounded-[14px] border p-4 transition-colors ${
                isCompleted
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-white/7 bg-[#16161A]'
              }`}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    isCompleted
                      ? 'border-green-500 bg-green-500/15 text-green-500'
                      : 'border-white/7 text-[#8A8A96]'
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
              <p className="text-xs text-[#8A8A96] mt-1 ml-[46px]">{durationLabel}</p>
              {!isCompleted && (
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

      <PushPermissionModal
        isOpen={showPermissionModal}
        onClose={closeModal}
        onPermissionGranted={handlePermissionGranted}
        trigger={modalTrigger}
      />
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

export default QuickWorkout;
