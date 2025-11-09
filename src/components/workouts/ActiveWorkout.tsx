import { useState, useEffect, useRef } from 'react';
import { CheckCircle, X, Play, Pause, RotateCcw, ArrowRight, Clock, Zap, Dumbbell, Heart, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseGifLink } from './ExerciseGifLink';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMedalSystem } from '@/hooks/useMedalSystem';
import { trackWorkoutForChallenge } from '@/utils/challengeTracking';
import { updateWorkoutStats } from '@/services/workoutStatsService';
import { toast } from 'sonner';

// Helper function per convertire stringhe tempo in numeri
const parseTimeToSeconds = (timeStr: string | undefined | number): number => {
  if (typeof timeStr === 'number') {
    return timeStr;
  }
  
  if (!timeStr || typeof timeStr !== 'string') {
    return 30; // default se undefined o non stringa
  }
  
  const str = timeStr.toString().toLowerCase().trim();
  let totalSeconds = 0;
  
  // Match minuti e secondi
  const minutesMatch = str.match(/(\d+)\s*m/);
  const secondsMatch = str.match(/(\d+)\s*s/);
  
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1]) * 60;
  }
  
  if (secondsMatch) {
    totalSeconds += parseInt(secondsMatch[1]);
  }
  
  // Se non trova né minuti né secondi, prova a parsare come numero
  if (totalSeconds === 0) {
    const numberMatch = str.match(/(\d+)/);
    if (numberMatch) {
      totalSeconds = parseInt(numberMatch[1]);
    }
  }
  
  return totalSeconds || 30; // Default 30 secondi
};

// Helper function per convertire secondi in formato MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Interface per stato timer di ogni esercizio
interface ExerciseTimerState {
  isActive: boolean;
  isResting: boolean;
  timeRemaining: number;
  totalWorkTime: number;
  totalRestTime: number;
  isCompleted: boolean;
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

interface ActiveWorkoutProps {
  workoutId: string;
  generatedWorkout?: any;
  customWorkout?: any;
  onClose: () => void;
}

export const ActiveWorkout = ({ workoutId, generatedWorkout, customWorkout, onClose }: ActiveWorkoutProps) => {
  const { user } = useAuth();
  const { recordWorkoutCompletion } = useMedalSystem();
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  // Stati per la logica del Quick Workout
  const [workoutState, setWorkoutState] = useState<'ready' | 'running' | 'paused' | 'rest' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRest, setIsRest] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isRestTimerPaused, setIsRestTimerPaused] = useState(false);

  // Refs per timer e audio
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Stati per i timer di ogni esercizio
  const [exerciseTimers, setExerciseTimers] = useState<Record<number, ExerciseTimerState>>({});
  
  // Usa l'allenamento custom se disponibile, poi generato, altrimenti quello statico
  const currentWorkout = customWorkout || generatedWorkout || workoutData[workoutId as keyof typeof workoutData];
  const personalizedMeta = (customWorkout as any)?.meta || (generatedWorkout as any)?.meta || null;
  const workoutTitle = personalizedMeta?.workoutTitle || currentWorkout?.title || currentWorkout?.name || 'Workout personalizzato';
  const workoutType = personalizedMeta?.workoutType || currentWorkout?.workout_type || currentWorkout?.tipo || currentWorkout?.type || 'Allenamento personalizzato';
  const workoutDuration = personalizedMeta?.duration || currentWorkout?.duration || currentWorkout?.total_duration;
  const workoutExerciseCount = currentWorkout?.exercises?.length || 0;

  // Funzione per suonare beep con gestione errori
  const playBeep = (frequency: number = 800, duration: number = 200) => {
    if (!audioContextRef.current) {
      // Fallback: flash visivo
      document.body.style.backgroundColor = '#ffd700';
      setTimeout(() => {
        document.body.style.backgroundColor = '';
      }, 100);
      return;
    }

    try {
      // Resume audio context se sospeso
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

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
    } catch (error) {
      console.log('Errore riproduzione audio:', error);
      // Fallback: flash visivo
      document.body.style.backgroundColor = '#ffd700';
      setTimeout(() => {
        document.body.style.backgroundColor = '';
      }, 100);
    }
  };

  // Inizializza audio context con user interaction
  useEffect(() => {
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('Audio context inizializzato');
      } catch (error) {
        console.log('Audio non supportato, useremo feedback visivo');
      }
    };

    // Inizializza audio al primo user interaction
    const handleUserInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Nascondi header/footer/feedback quando la schermata di completamento è attiva
  useEffect(() => {
    if (workoutState !== 'completed') {
      return;
    }

    const hideElements = () => {
      const header = document.querySelector('header') as HTMLElement | null;
      const footer = document.querySelector('.bottom-navigation') as HTMLElement | null;
      const feedback = document.querySelector('.feedback-widget') as HTMLElement | null;
      
      if (header) {
        header.style.display = 'none !important';
        header.style.visibility = 'hidden !important';
        header.style.opacity = '0 !important';
        header.style.zIndex = '-999999 !important';
      }
      if (footer) {
        footer.style.display = 'none !important';
        footer.style.visibility = 'hidden !important';
        footer.style.opacity = '0 !important';
        footer.style.zIndex = '-999999 !important';
      }
      if (feedback) {
        feedback.style.display = 'none !important';
        feedback.style.visibility = 'hidden !important';
        feedback.style.opacity = '0 !important';
        feedback.style.zIndex = '-999999 !important';
      }
    };

    hideElements();
    const interval = setInterval(hideElements, 100);

    return () => {
      clearInterval(interval);
      const header = document.querySelector('header') as HTMLElement | null;
      const footer = document.querySelector('.bottom-navigation') as HTMLElement | null;
      const feedback = document.querySelector('.feedback-widget') as HTMLElement | null;
      
      if (header) {
        header.style.display = '';
        header.style.visibility = '';
        header.style.opacity = '';
        header.style.zIndex = '';
      }
      if (footer) {
        footer.style.display = '';
        footer.style.visibility = '';
        footer.style.opacity = '';
        footer.style.zIndex = '';
      }
      if (feedback) {
        feedback.style.display = '';
        feedback.style.visibility = '';
        feedback.style.opacity = '';
        feedback.style.zIndex = '';
      }
    };
  }, [workoutState]);

  // Funzioni per gestione workout (copiate dal Quick Workout)
  const startWorkout = () => {
    setWorkoutState('running');
    setCurrentExerciseIndex(0);
    const firstExercise = currentWorkout.exercises?.[0];
    if (firstExercise) {
      setTimeLeft(parseTimeToSeconds(firstExercise.duration));
    }
    setTotalProgress(0);
    setIsRest(false);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < (currentWorkout.exercises?.length || 0) - 1) {
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      const nextExercise = currentWorkout.exercises?.[nextIndex];
      if (nextExercise) {
        setTimeLeft(parseTimeToSeconds(nextExercise.duration));
      }
      setIsRest(false);
    } else {
      // Workout completato
      setWorkoutState('completed');
      setCompletedExercises([...currentWorkout.exercises?.map((_, i) => i) || []]);
      
      // Aggiorna statistiche utente
      if (user?.id) {
        const workoutDuration = currentWorkout.exercises?.reduce((total, exercise) => {
          return total + parseTimeToSeconds(exercise.duration);
        }, 0) || 0;
        
        updateWorkoutStats(user.id, Math.round(workoutDuration / 60)); // Converti in minuti
      }
    }
  };

  const togglePause = () => {
    if (workoutState === 'running') {
      setWorkoutState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else if (workoutState === 'paused') {
      setWorkoutState('running');
      startTimer();
    }
  };

  const skipExercise = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    nextExercise();
  };

  // Timer principale
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Esercizio finito
          
          const currentExercise = currentWorkout.exercises?.[currentExerciseIndex];
          const restTime = currentExercise?.rest ? parseTimeToSeconds(currentExercise.rest) : 0;
          
          if (restTime > 0) {
            // Inizia riposo
            setIsRest(true);
            setTimeLeft(restTime);
            return restTime;
          } else {
            // Vai al prossimo esercizio
            setTimeout(() => nextExercise(), 1000);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Formatta tempo per display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Funzioni per gestire la sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navigateToExercise = (index: number) => {
    if (index < (currentWorkout.exercises?.length || 0)) {
      setCurrentExerciseIndex(index);
      const exercise = currentWorkout.exercises?.[index];
      if (exercise) {
        setTimeLeft(parseTimeToSeconds(exercise.duration));
      }
      setIsRest(false);
      closeSidebar();
    }
  };

  const getExerciseStatus = (index: number) => {
    if (index < currentExerciseIndex) return 'completed';
    if (index === currentExerciseIndex) return 'current';
    return 'future';
  };

  const getExerciseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'current': return '●';
      default: return '○';
    }
  };


  // Gestione timer automatico
  useEffect(() => {
    if (workoutState === 'running' && timeLeft > 0) {
      startTimer();
    } else if (workoutState === 'running' && timeLeft === 0 && !isRest) {
      // Esercizio finito, inizia riposo o prossimo
      const currentExercise = currentWorkout.exercises?.[currentExerciseIndex];
      const restTime = currentExercise?.rest ? parseTimeToSeconds(currentExercise.rest) : 0;
      if (restTime > 0) {
        setIsRest(true);
        setTimeLeft(restTime);
      } else {
        nextExercise();
      }
    } else if (workoutState === 'running' && timeLeft === 0 && isRest) {
      // Riposo finito, prossimo esercizio
      nextExercise();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [workoutState, timeLeft, isRest, currentExerciseIndex]);

  useEffect(() => {
    // Fix per viewport height su mobile
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Initial setup
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // useEffect per gestire il countdown automatico dei timer
  useEffect(() => {
    const interval = setInterval(() => {
      setExerciseTimers(prev => {
        const updated = { ...prev };
        
        Object.keys(updated).forEach(key => {
          const index = parseInt(key);
          const timer = updated[index];
          
          if (timer && timer.isActive && timer.timeRemaining > 0) {
            updated[index] = {
              ...timer,
              timeRemaining: timer.timeRemaining - 1
            };
          } else if (timer && timer.isActive && timer.timeRemaining === 0) {
            if (!timer.isResting) {
              // Fine esercizio, inizia recupero
              updated[index] = {
                ...timer,
                isResting: true,
                timeRemaining: timer.totalRestTime
              };
            } else {
              // Fine recupero, esercizio completato
              updated[index] = {
                ...timer,
                isActive: false,
                isCompleted: true
              };
              // Auto-completa l'esercizio
              if (!completedExercises.includes(index)) {
                setCompletedExercises(prev => [...prev, index]);
              }
            }
          }
        });
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [completedExercises]);
  
  if (!currentWorkout) {
    return (
      <div className="text-white text-center">
        <p>Allenamento non trovato</p>
        <Button onClick={onClose} className="mt-4">Torna indietro</Button>
      </div>
    );
  }

  // Funzione per avviare il timer di un esercizio
  const startExerciseTimer = (index: number, exercise: any) => {
    const workTime = parseTimeToSeconds(exercise.duration);
    const restTime = parseTimeToSeconds(exercise.rest);
    
    setExerciseTimers(prev => ({
      ...prev,
      [index]: {
        isActive: true,
        isResting: false,
        timeRemaining: workTime,
        totalWorkTime: workTime,
        totalRestTime: restTime,
        isCompleted: false
      }
    }));
  };

  // Funzione per pausare/riprendere il timer
  const toggleTimer = (index: number) => {
    setExerciseTimers(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        isActive: !prev[index]?.isActive
      }
    }));
  };

  // Funzione per resettare il timer
  const resetTimer = (index: number, exercise: any) => {
    const workTime = parseTimeToSeconds(exercise.duration);
    const restTime = parseTimeToSeconds(exercise.rest);
    
    setExerciseTimers(prev => ({
      ...prev,
      [index]: {
        isActive: false,
        isResting: false,
        timeRemaining: workTime,
        totalWorkTime: workTime,
        totalRestTime: restTime,
        isCompleted: false
      }
    }));
  };

  // Funzione per completare l'allenamento e aggiornare le statistiche
  const completeWorkout = async () => {
    if (!user || !currentWorkout.exercises) return;

    try {
      // Ottieni utente corrente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Utente non autenticato');
        return;
      }
      
      // Calcola la durata totale per allenamenti preimpostati (tempi fissi)
      const getPresetWorkoutDuration = (workoutName: string | undefined): number => {
        if (!workoutName || typeof workoutName !== 'string') {
          return 30; // Default se undefined o non stringa
        }
        
        const name = workoutName.toLowerCase();
        if (name.includes('cardio')) return 20;
        if (name.includes('forza') || name.includes('strength')) return 45;
        if (name.includes('hiit')) return 45;
        if (name.includes('mobilità') || name.includes('mobility')) return 15;
        // Fallback per altri allenamenti preimpostati
        return 30;
      };
      
      const totalMinutes = getPresetWorkoutDuration(currentWorkout?.name);

      // Crea un record in custom_workouts per attivare il trigger
      console.log('🔍 [DEBUG] completeWorkout: Creazione record custom_workouts...');
      // Usa title se disponibile, altrimenti name, altrimenti fallback
      const workoutTitle = currentWorkout?.title || currentWorkout?.name || 'Allenamento da File';
      
      console.log('📊 [DEBUG] completeWorkout: Dati da inserire:', {
            user_id: user.id,
        title: workoutTitle,
        total_duration: Math.round(totalMinutes),
        completed: true
      });

      const { data: workoutRecord, error: createError } = await supabase
        .from('custom_workouts')
        .insert({
          user_id: user.id,
          title: workoutTitle,
          workout_type: 'personalizzato',
          scheduled_date: new Date().toISOString().split('T')[0],
          exercises: currentWorkout.exercises,
          total_duration: Math.round(totalMinutes),
          completed: true,
          completed_at: new Date().toISOString()
        })
        .select('id, title, total_duration, completed, completed_at')
        .single();

      console.log('📊 [DEBUG] completeWorkout: Risultato inserimento:', { workoutRecord, createError });

      if (createError) {
        console.error('❌ [DEBUG] Errore creazione workout record:', createError);
        toast.error('Errore nel salvataggio dell\'allenamento');
        return;
      }

      console.log('✅ [DEBUG] completeWorkout: Record creato con successo');
      
      // Aggiorna metriche manualmente (il trigger DB non si attiva su INSERT)
      const { updateWorkoutMetrics } = await import('@/services/updateWorkoutMetrics');
      await updateWorkoutMetrics(user.id, Math.round(totalMinutes));
      console.log('✅ [DEBUG] Metriche aggiornate manualmente');
      
      // Emetti evento per refresh dashboard
      console.log('🚀 [DEBUG] completeWorkout: Emetto evento workoutCompleted');
      window.dispatchEvent(new CustomEvent('workoutCompleted', {
        detail: { workoutId: workoutRecord.id }
      }));
      console.log('✅ [DEBUG] completeWorkout: Evento workoutCompleted emesso');
      
      toast.success('Allenamento completato! Statistiche aggiornate.');
    } catch (error) {
      console.error('Errore durante il completamento:', error);
    }
  };

  // Fix per il click del pulsante "TERMINA SESSIONE"
  const handleTerminateSession = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // Pattern per terminazione
    }

    completeWorkout();
    onClose();
  };

  // Salva su diario - pop-up placeholder
  const saveToDiary = () => {
    toast.success("Funzionalità diario in arrivo! Workout salvato.");
  };

  // Se tutti gli esercizi sono completati, mostra la schermata di completamento

  // Se il workout è in esecuzione, mostra la schermata di esecuzione (layout Quick Workout)
  const currentExercise = currentWorkout.exercises?.[currentExerciseIndex];
  const isTimedExercise = (exercise: any) => {
    const duration = exercise?.duration?.toLowerCase?.() || '';
    const hasSeconds = duration.includes('s') || duration.includes('sec');
    console.log(`isTimedExercise("${exercise?.name || 'sconosciuto'}"): duration="${duration}", isTimed=${hasSeconds}`);
    return hasSeconds;
  };
  const isTimed = isTimedExercise(currentExercise);
  console.log('Esercizio corrente:', currentExercise?.name);
  console.log('È esercizio a tempo?', isTimed);

  const parseRestTime = (rest: string | undefined): number => {
    if (!rest) return 60;
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
  };

  const playRestStartSound = () => {
    playBeep(750, 220);
  };

  const playRestTickSound = () => {
    playBeep(950, 120);
  };

  const playRestEndSound = () => {
    playBeep(1100, 220);
    setTimeout(() => playBeep(1100, 220), 260);
    setTimeout(() => playBeep(1300, 260), 520);
  };

  const handleStartRest = () => {
    const restSeconds = parseRestTime(currentExercise?.rest);
    console.log('Avvio recupero:', restSeconds, 'secondi');
    setRestTimeLeft(restSeconds);
    setIsRestTimerActive(true);
    setIsRestTimerPaused(false);
    playRestStartSound();
  };

  const toggleRestTimer = () => {
    setIsRestTimerPaused(prev => !prev);
  };

  const handleSkipRest = () => {
    setIsRestTimerActive(false);
    setRestTimeLeft(0);
    setIsRestTimerPaused(false);
  };

  const formatRestTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `0:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isRestTimerActive || isRestTimerPaused || restTimeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 3 && prev > 1) {
          playRestTickSound();
        }
        if (prev <= 1) {
          setIsRestTimerActive(false);
          setIsRestTimerPaused(false);
          playRestEndSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRestTimerActive, isRestTimerPaused, restTimeLeft]);

  useEffect(() => {
    setIsRestTimerActive(false);
    setRestTimeLeft(0);
    setIsRestTimerPaused(false);
  }, [currentExerciseIndex]);

  if (workoutState === 'running' || workoutState === 'paused' || workoutState === 'rest') {
    const totalProgress = ((currentExerciseIndex + 1) / (currentWorkout.exercises?.length || 1)) * 100;
    
    return (
      <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 99999 }}>
        {/* Header con progresso */}
        <div className="flex-shrink-0 px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-pp-gold/80 text-sm font-medium">
              Esercizio {currentExerciseIndex + 1} di {currentWorkout.exercises?.length || 0}
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // Ferma il timer
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                  // Reset degli stati
                  setWorkoutState('ready');
                  setWorkoutStarted(false);
                  setCurrentExerciseIndex(0);
                  setTimeLeft(0);
                  setIsRest(false);
                  setTotalProgress(0);
                }}
                className="text-pp-gold/80 hover:text-pp-gold text-sm font-medium transition-colors duration-200"
              >
                ← Indietro
              </button>
              <button
                onClick={toggleSidebar}
                className="text-pp-gold/80 hover:text-pp-gold p-2 rounded-lg hover:bg-pp-gold/10 transition-colors duration-200"
                title="Lista esercizi"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
      </div>

          {/* Barra progresso */}
          <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
            <div 
              className="bg-pp-gold h-3 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>

          {/* Lista esercizi con stato */}
          <div className="flex flex-wrap gap-1 justify-center max-w-full overflow-x-auto px-2">
          {currentWorkout.exercises?.map((exercise: any, index: number) => {
              const isCompleted = index < currentExerciseIndex;
              const isCurrent = index === currentExerciseIndex;
            
            return (
                <div
                  key={exercise.name}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                      ? 'bg-pp-gold text-black' 
                      : 'bg-gray-600 text-gray-400'
                  }`}
                  title={`${index + 1}. ${exercise.name}`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Contenuto principale - usa tutto lo spazio disponibile */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-4">
          <div className="text-center space-y-12 w-full max-w-md mx-auto">
            {/* Nome esercizio */}
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pp-gold leading-tight text-center px-4">
                  {currentExercise?.name || 'Esercizio'}
                </h2>
                <ExerciseGifLink 
                  exerciseName={currentExercise?.name || 'Esercizio'}
                  buttonClassName="bg-pp-gold hover:bg-pp-gold/80 text-black px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center"
                />
              </div>
              <p className="text-lg sm:text-xl md:text-2xl text-pp-gold/80 leading-relaxed">
                {currentExercise?.instructions || 'Esegui l\'esercizio'}
              </p>
            </div>

            {/* Timer gigante */}
            <div className="text-center py-8">
              {isTimed ? (
                <div className="text-7xl sm:text-8xl md:text-9xl font-mono font-bold text-pp-gold">
                  {isRest ? 'RIPOSO' : formatTime(timeLeft)}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-pp-gold/10 border-2 border-pp-gold/30 rounded-xl px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-between gap-2 sm:gap-4 text-center">
                      <div className="flex-1">
                        <div className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-1">
                          Serie
                        </div>
                        <div className="text-pp-gold text-2xl sm:text-3xl font-bold">
                          {currentExercise?.sets || 4}
                        </div>
                      </div>
                      <div className="w-px h-10 sm:h-12 bg-pp-gold/30" />
                      <div className="flex-1">
                        <div className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-1">
                          Ripetizioni
                        </div>
                        <div className="text-pp-gold text-2xl sm:text-3xl font-bold">
                          {currentExercise?.duration || '10-12'}
                        </div>
                      </div>
                      <div className="w-px h-10 sm:h-12 bg-pp-gold/30" />
                      <div className="flex-1">
                        <div className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-1">
                          Riposo
                        </div>
                        <div className="text-pp-gold text-2xl sm:text-3xl font-bold">
                          {currentExercise?.rest || '60s'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isRestTimerActive ? (
                    <Button
                      onClick={handleStartRest}
                      className="w-full bg-pp-gold hover:bg-pp-gold/90 text-black font-bold h-16 text-lg rounded-xl flex items-center justify-center gap-3"
                    >
                      <Clock className="w-6 h-6" />
                      Avvia Recupero
                    </Button>
                  ) : (
                    <div className="bg-black/50 border-2 border-pp-gold rounded-2xl p-6">
                      <div className="text-center mb-4">
                        <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                          Recupero
                        </div>
                        <div className="text-pp-gold text-6xl font-bold tabular-nums">
                          {formatRestTime(restTimeLeft)}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={toggleRestTimer}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 h-12 rounded-xl"
                        >
                          {isRestTimerPaused ? (
                            <>
                              <Play className="w-5 h-5 mr-2" />
                              Riprendi
                            </>
                          ) : (
                            <>
                              <Pause className="w-5 h-5 mr-2" />
                              Pausa
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleSkipRest}
                          variant="outline"
                          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 h-12 rounded-xl"
                        >
                          <X className="w-5 h-5 mr-2" />
                          Salta Recupero
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controlli bottom */}
        <div className="flex-shrink-0 px-4 py-4">
          <div className="flex gap-3 max-w-md mx-auto">
            {isTimed ? (
              <>
                <button
                  onClick={togglePause}
                  className="flex-1 bg-pp-gold hover:bg-pp-gold/90 text-black font-bold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
                >
                  {workoutState === 'paused' ? 'Riprendi' : 'Pausa'}
                </button>
                <button
                  onClick={skipExercise}
                  className="flex-1 bg-white hover:bg-white/90 text-black font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg"
                >
                  Successivo
                </button>
              </>
            ) : (
              <button
                onClick={skipExercise}
                className="w-full bg-white hover:bg-white/90 text-black font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg"
              >
                Successivo
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={closeSidebar}
            />
            
            {/* Sidebar */}
            <div className="fixed top-0 right-0 min-h-full w-64 md:w-80 bg-gray-900 border-l border-pp-gold/20 z-[70] transform transition-transform duration-300 ease-in-out">
              <div className="h-full flex flex-col overflow-y-auto">
                {/* Header Sidebar */}
                <div className="flex items-center justify-between p-4 border-b border-pp-gold/20">
                  <h3 className="text-lg font-bold text-pp-gold">
                    Esercizi ({currentExerciseIndex + 1}/{currentWorkout.exercises?.length || 0})
                  </h3>
                  <button
                    onClick={closeSidebar}
                    className="text-pp-gold/80 hover:text-pp-gold p-1 rounded-lg hover:bg-pp-gold/10 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Lista Esercizi */}
                <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-2">
                  {currentWorkout.exercises?.map((exercise: any, index: number) => {
                    const status = getExerciseStatus(index);
                    const statusIcon = getExerciseStatusIcon(status);
                    const isCurrent = index === currentExerciseIndex;
                    
                    return (
                      <button
                        key={exercise.name || index}
                        onClick={() => navigateToExercise(index)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          isCurrent
                            ? 'bg-pp-gold/20 border border-pp-gold/40 text-pp-gold'
                            : status === 'completed'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                            : 'bg-gray-700/50 border border-gray-600/30 text-gray-300 hover:bg-gray-700/70'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{statusIcon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-pp-gold/60">
                                {index + 1}.
                              </span>
                              <span className="font-semibold truncate">
                                {exercise.name || `Esercizio ${index + 1}`}
                              </span>
                            </div>
                            <div className="text-xs text-pp-gold/60 mt-1">
                              {exercise.duration || '30s'} {exercise.rest && `+ ${exercise.rest}s riposo`}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                    </div>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-pp-gold/20">
                  <div className="text-xs text-pp-gold/60 text-center">
                    Tocca un esercizio per saltarci
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
              </div>
            );
  }

  // Se il workout è completato, mostra la schermata di completamento
  if (workoutState === 'completed') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 99999 }}>
        {/* Header minimale */}
        <div className="flex-shrink-0 p-4">
          <button
            onClick={onClose}
            className="text-pp-gold/80 hover:text-pp-gold text-sm"
          >
            ← Torna alla Dashboard
          </button>
        </div>

        {/* Contenuto centrato */}
        <div className="flex-1 flex flex-col justify-center items-center px-6">
          <div className="text-center space-y-8 max-w-md w-full">
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-pp-gold mb-2">Complimenti!</h1>
              <p className="text-xl text-pp-gold/80">Workout completato con successo</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleTerminateSession}
                className="w-full bg-pp-gold hover:bg-pp-gold/90 text-black font-bold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
              >
                Segna Completato
              </button>
              <button
                onClick={saveToDiary}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
              >
                Salva su Diario
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout identico al Quick Workout (schermata di preparazione)
  // Mostra solo quando workoutState è 'ready' e workoutStarted è false
  if (workoutState === 'ready' && !workoutStarted) {
    return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 99999 }}>
      {/* Header minimale */}
      <div className="flex-shrink-0 p-4">
        <button
          onClick={onClose}
          className="text-pp-gold/80 hover:text-pp-gold text-sm mt-1"
        >
          ← Torna indietro
        </button>
      </div>
      
      {/* Contenuto centrato */}
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        <div className="text-center space-y-6 max-w-lg w-full">
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-pp-gold/20 rounded-full flex items-center justify-center">
              <Clock className="w-16 h-16 text-pp-gold" />
            </div>
          </div>

          {personalizedMeta?.startCustomWorkout === 'personalized' && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-pp-gold/20 px-4 py-2 rounded-full border border-pp-gold/40">
                <Sparkles className="w-4 h-4 text-pp-gold" />
                <span className="text-pp-gold font-semibold text-sm">Piano Personalizzato</span>
              </div>
            </div>
          )}

          <div>
            <h1 className="text-4xl font-bold text-pp-gold mb-2">{workoutTitle}</h1>
            <p className="text-xl text-pp-gold/80">{workoutType}</p>
          </div>

          <div className="bg-pp-gold/10 border border-pp-gold/30 rounded-xl p-5">
            <h2 className="text-2xl font-bold text-pp-gold mb-3">💪 Circuito Completo</h2>
            <div className="space-y-2 text-base text-pp-gold/80">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-pp-gold" />
                <span>{workoutExerciseCount} esercizi personalizzati</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-pp-gold" />
                <span>{workoutDuration ? `~${workoutDuration} minuti` : 'Durata variabile'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pp-gold">🔥</span>
                <span>Riscaldamento guidato</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pp-gold">⚡</span>
                <span>Esercizi intensi con timer automatico</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pp-gold">🎧</span>
                <span>Feedback audio e notifiche</span>
              </div>
            </div>
          </div>

              <div className="space-y-4">
                <button
                  onClick={startWorkout}
                  className="w-full bg-pp-gold hover:bg-pp-gold/90 text-black font-bold py-5 px-6 rounded-xl transition-colors duration-200 text-xl"
                >
                  Inizia Workout
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg mt-2"
                >
                  Torna indietro
                </button>
              </div>
        </div>
      </div>
    </div>
    );
  }

  // Fallback - non dovrebbe mai arrivare qui
  return (
    <div className="h-full bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Errore</h2>
        <p>Stato del workout non riconosciuto</p>
      </div>
    </div>
  );
};