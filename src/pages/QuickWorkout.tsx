/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps -- stato workout dinamico; dipendenze intenzionali timer/save */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PushPermissionModal } from '@/components/notifications/PushPermissionModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useMedalSystem } from '@/hooks/useMedalSystem';
import { trackWorkoutForChallenge } from '@/utils/challengeTracking';
import { ChallengeNotification } from '@/components/ui/ChallengeNotification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { completeWorkout as saveWorkoutToDiary } from '@/services/diaryService';

// Struttura dati del circuito workout
interface Exercise {
  id: string;
  name: string;
  instructions: string;
  duration: number; // in secondi
  rest: number; // riposo dopo esercizio
  category: 'warmup' | 'main' | 'cooldown';
}

const WORKOUT_CIRCUIT: Exercise[] = [
  // RISCALDAMENTO (2 min)
  { id: 'jumping-jacks', name: 'Jumping Jacks', instructions: 'Salta aprendo e chiudendo braccia e gambe', duration: 30, rest: 0, category: 'warmup' },
  { id: 'march-in-place', name: 'Marcia sul posto', instructions: 'Cammina sul posto sollevando le ginocchia', duration: 30, rest: 0, category: 'warmup' },
  { id: 'arm-circles', name: 'Rotazioni braccia', instructions: 'Ruota le braccia in cerchi ampi', duration: 30, rest: 0, category: 'warmup' },
  { id: 'dynamic-stretch', name: 'Stretch dinamico', instructions: 'Allunga muscoli con movimenti fluidi', duration: 30, rest: 0, category: 'warmup' },
  
  // CORPO PRINCIPALE (6 min)
  { id: 'push-ups', name: 'Push-up', instructions: 'Flessioni (sulle ginocchia se necessario)', duration: 45, rest: 15, category: 'main' },
  { id: 'squats', name: 'Squat', instructions: 'Piegati sulle gambe come per sederti', duration: 45, rest: 15, category: 'main' },
  { id: 'plank', name: 'Plank', instructions: 'Mantieni posizione a tavola', duration: 30, rest: 30, category: 'main' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', instructions: 'Corsa sul posto in posizione plank', duration: 45, rest: 15, category: 'main' },
  { id: 'burpees', name: 'Burpees Modificati', instructions: 'Squat + plank + salto', duration: 30, rest: 30, category: 'main' },
  { id: 'lunges', name: 'Affondi Alternati', instructions: 'Affondi alternando le gambe', duration: 45, rest: 15, category: 'main' },
  
  // DEFATICAMENTO (2 min)
  { id: 'quad-stretch', name: 'Stretch Quadricipiti', instructions: 'Allunga quadricipiti 30s per lato', duration: 60, rest: 0, category: 'cooldown' },
  { id: 'calf-stretch', name: 'Stretch Polpacci', instructions: 'Allunga polpacci 30s per lato', duration: 60, rest: 0, category: 'cooldown' },
  { id: 'breathing', name: 'Respirazione Profonda', instructions: 'Respira profondamente per rilassarti', duration: 60, rest: 0, category: 'cooldown' }
];

type WorkoutState = 'ready' | 'running' | 'paused' | 'rest' | 'completed' | 'resume-prompt';

interface WorkoutProgress {
  workoutId: string;
  completedExercises: number[];
  currentExercise: number;
  timeLeft: number;
  isRest: boolean;
  timestamp: number;
  totalProgress: number;
}

const WORKOUT_ID = 'quick-10min';
const PROGRESS_KEY = 'pp_workout_progress';
const MAX_RESUME_HOURS = 2;

const QuickWorkout = () => {
  const navigate = useNavigate();
  
  // Stati del workout
  const [workoutState, setWorkoutState] = useState<WorkoutState>('ready');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRest, setIsRest] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  
  // Stati sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Stati notifiche sfida
  const [challengeNotification, setChallengeNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Hook per notifiche push
  const {
    isSupported,
    isActive,
    canAskPermission,
    showPermissionModal,
    modalTrigger,
    showFirstWorkoutModal,
    closeModal,
    handlePermissionGranted
  } = usePushNotifications();

  // Hook per sistema medaglie
  const { recordWorkoutCompletion } = useMedalSystem();
  const { user } = useAuth();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Calcola progresso totale
  const totalDuration = WORKOUT_CIRCUIT.reduce((acc, ex) => acc + ex.duration + ex.rest, 0);
  const completedDuration = WORKOUT_CIRCUIT.slice(0, currentExerciseIndex).reduce((acc, ex) => acc + ex.duration + ex.rest, 0);
  const currentExercise = WORKOUT_CIRCUIT[currentExerciseIndex];

  // Funzioni per salvataggio/ripristino stato
  const saveWorkoutProgress = () => {
    const progress: WorkoutProgress = {
      workoutId: WORKOUT_ID,
      completedExercises: [], // Sarà aggiornato quando necessario
      currentExercise: currentExerciseIndex,
      timeLeft,
      isRest,
      timestamp: Date.now(),
      totalProgress
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  };

  const loadWorkoutProgress = (): WorkoutProgress | null => {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      if (!saved) return null;
      
      const progress: WorkoutProgress = JSON.parse(saved);
      
      // Controlla se è dello stesso workout e non troppo vecchio
      const hoursAgo = (Date.now() - progress.timestamp) / (1000 * 60 * 60);
      if (progress.workoutId !== WORKOUT_ID || hoursAgo > MAX_RESUME_HOURS) {
        localStorage.removeItem(PROGRESS_KEY);
        return null;
      }
      
      return progress;
    } catch (e) {
      localStorage.removeItem(PROGRESS_KEY);
      return null;
    }
  };

  const clearWorkoutProgress = () => {
    localStorage.removeItem(PROGRESS_KEY);
  };

  const canResumeWorkout = (): boolean => {
    const progress = loadWorkoutProgress();
    return progress !== null && progress.currentExercise < WORKOUT_CIRCUIT.length;
  };

  // Funzioni per navigazione sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navigateToExercise = (exerciseIndex: number) => {
    if (exerciseIndex === currentExerciseIndex) {
      closeSidebar();
      return;
    }

    // Se è un esercizio futuro, chiedi conferma
    if (exerciseIndex > currentExerciseIndex) {
      const exerciseName = WORKOUT_CIRCUIT[exerciseIndex].name;
      const confirmed = window.confirm(
        `Saltare all'esercizio ${exerciseIndex + 1}: ${exerciseName}?\n\nIl progresso attuale verrà salvato.`
      );
      if (!confirmed) return;
    }

    // Salta all'esercizio selezionato
    setCurrentExerciseIndex(exerciseIndex);
    setTimeLeft(WORKOUT_CIRCUIT[exerciseIndex].duration);
    setIsRest(false);
    saveWorkoutProgress();
    closeSidebar();
    
    // Se il workout era in pausa, riprendilo
    if (workoutState === 'paused') {
      setWorkoutState('running');
    }
  };

  const getExerciseStatus = (exerciseIndex: number) => {
    if (exerciseIndex < currentExerciseIndex) return 'completed';
    if (exerciseIndex === currentExerciseIndex) return 'current';
    return 'future';
  };

  const getExerciseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'current': return '🟡';
      case 'future': return '⚫';
      default: return '⚫';
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

  // Controlla se c'è un workout da riprendere all'avvio
  useEffect(() => {
    if (canResumeWorkout()) {
      setWorkoutState('resume-prompt');
    }
  }, []);

  // Navigazione protetta - conferma uscita durante workout
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (workoutState === 'running' || workoutState === 'paused') {
        saveWorkoutProgress(); // Salva progresso prima di uscire
        e.preventDefault();
        e.returnValue = 'Vuoi davvero uscire? Il progresso verrà salvato.';
        return 'Vuoi davvero uscire? Il progresso verrà salvato.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [workoutState]);

  // Salva progresso automaticamente ogni 30 secondi durante workout
  useEffect(() => {
    if (workoutState === 'running') {
      const interval = setInterval(() => {
        saveWorkoutProgress();
      }, 30000); // Salva ogni 30 secondi

      return () => clearInterval(interval);
    }
  }, [workoutState, currentExerciseIndex, timeLeft, isRest, totalProgress]);

  // Gestione chiusura sidebar con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        closeSidebar();
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [sidebarOpen]);

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

  // Avvia workout
  const startWorkout = () => {
    setWorkoutState('running');
    setCurrentExerciseIndex(0);
    setTimeLeft(currentExercise.duration);
    setTotalProgress(0);
    clearWorkoutProgress(); // Pulisci progress precedente
    playBeep(800, 300); // Beep di inizio
  };

  // Riprendi workout salvato
  const resumeWorkout = () => {
    const progress = loadWorkoutProgress();
    if (progress) {
      setWorkoutState('running');
      setCurrentExerciseIndex(progress.currentExercise);
      setTimeLeft(progress.timeLeft);
      setIsRest(progress.isRest);
      setTotalProgress(progress.totalProgress);
      playBeep(800, 300); // Beep di ripresa
    }
  };

  // Ricomincia da capo
  const restartWorkout = () => {
    clearWorkoutProgress();
    startWorkout();
  };

  // Pausa/Riprendi
  const togglePause = () => {
    if (workoutState === 'running') {
      setWorkoutState('paused');
      saveWorkoutProgress(); // Salva stato quando in pausa
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else if (workoutState === 'paused') {
      setWorkoutState('running');
      startTimer();
    }
  };

  // Skip esercizio
  const skipExercise = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    nextExercise();
  };

  // Prossimo esercizio
  const nextExercise = () => {
    if (currentExerciseIndex < WORKOUT_CIRCUIT.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      setTimeLeft(WORKOUT_CIRCUIT[nextIndex].duration);
      setIsRest(false);
      saveWorkoutProgress(); // Salva progresso
      playBeep(600, 200); // Beep per nuovo esercizio
    } else {
      // Workout completato
      setWorkoutState('completed');
      clearWorkoutProgress(); // Pulisci progress al completamento
      playBeep(1000, 500); // Beep di completamento
    }
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
          playBeep(1000, 300);
          
          if (currentExercise.rest > 0) {
            // Inizia riposo
            setIsRest(true);
            setTimeLeft(currentExercise.rest);
            return currentExercise.rest;
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

  // Gestione timer
  useEffect(() => {
    if (workoutState === 'running' && timeLeft > 0) {
      startTimer();
    } else if (workoutState === 'running' && timeLeft === 0 && !isRest) {
      // Esercizio finito, inizia riposo o prossimo
      if (currentExercise.rest > 0) {
        setIsRest(true);
        setTimeLeft(currentExercise.rest);
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

  // Calcola progresso
  useEffect(() => {
    const currentEx = WORKOUT_CIRCUIT[currentExerciseIndex];
    if (currentEx) {
      const exerciseProgress = ((currentEx.duration - timeLeft) / currentEx.duration) * 100;
      const totalExProgress = (currentExerciseIndex / WORKOUT_CIRCUIT.length) * 100;
      setTotalProgress(totalExProgress + (exerciseProgress / WORKOUT_CIRCUIT.length));
    }
  }, [currentExerciseIndex, timeLeft]);

  // Formatta tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Salva completamento
  const markCompleted = async () => {
    localStorage.setItem('lastWorkoutCompleted', new Date().toISOString());
    
    // Registra completamento nel sistema medaglie
    recordWorkoutCompletion();
    
    // Traccia workout per sfida 7 giorni
    const challengeResult = trackWorkoutForChallenge();
    
    // Salva nel database Supabase
    try {
      console.log('🔍 [DEBUG] QuickWorkout: Creazione record custom_workouts...');
      const { data: workoutRecord, error: createError } = await supabase
        .from('custom_workouts')
        .insert({
          user_id: user?.id,
          title: 'Allenamento Rapido 10 minuti',
          workout_type: 'cardio',
          scheduled_date: new Date().toISOString().split('T')[0],
          exercises: WORKOUT_CIRCUIT,
          total_duration: 10, // 10 minuti
          completed: true,
          completed_at: new Date().toISOString()
        })
        .select('id, title, total_duration, completed, completed_at')
        .single();

      console.log('📊 [DEBUG] QuickWorkout: Risultato inserimento:', { workoutRecord, createError });

      if (createError) {
        console.error('❌ [DEBUG] Errore creazione workout record:', createError);
      } else {
        console.log('✅ [DEBUG] QuickWorkout: Record creato con successo');
        
        // Aggiorna metriche manualmente (il trigger DB non si attiva su INSERT)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { updateWorkoutMetrics } = await import('@/services/updateWorkoutMetrics');
          await updateWorkoutMetrics(user.id, 10); // 10 minuti
          console.log('✅ [DEBUG] Metriche aggiornate manualmente');
        }
        
        // Emetti evento per aggiornare dashboard
        console.log('🚀 [DEBUG] QuickWorkout: Emetto evento workoutCompleted');
        window.dispatchEvent(new CustomEvent('workoutCompleted', {
          detail: { workoutId: workoutRecord.id }
        }));
        console.log('✅ [DEBUG] QuickWorkout: Evento workoutCompleted emesso');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Errore salvataggio workout:', error);
    }
    
    // Mostra notifica se c'è un messaggio
    if (challengeResult.message) {
      const notificationType = challengeResult.isCompleted ? 'success' : 
                              challengeResult.isNewChallenge ? 'info' : 'info';
      setChallengeNotification({
        message: challengeResult.message,
        type: notificationType
      });
      
      // Auto-close dopo 5 secondi
      setTimeout(() => {
        setChallengeNotification(null);
      }, 5000);
    }
    
    // Controlla se è il primo workout completato
    const isFirstWorkout = !localStorage.getItem('firstWorkoutCompleted');
    if (isFirstWorkout) {
      localStorage.setItem('firstWorkoutCompleted', 'true');
      // Mostra modal notifiche per primo workout
      if (canAskPermission) {
        showFirstWorkoutModal();
        return; // Non navigare subito, aspetta la scelta dell'utente
      }
    }
    
    navigate('/dashboard');
  };

  // Salva su diario - integrazione completa
  const saveToDiary = async () => {
    console.log('🚀 QuickWorkout saveToDiary chiamato!');
    
    if (!user?.id) {
      console.error('❌ Utente non autenticato');
      toast.error('Utente non autenticato');
      return;
    }

    try {
      console.log('✅ Utente autenticato, procedo con salvataggio QuickWorkout...');
      
      // Calcola durata totale in secondi
      const totalSeconds = WORKOUT_CIRCUIT.reduce((total, exercise) => {
        return total + exercise.duration + exercise.rest;
      }, 0);

      // Converti in minuti e FORZA INTEGER
      let durationMinutes = Math.floor(totalSeconds / 60);
      
      // Se 0 minuti ma ci sono esercizi, imposta almeno 1
      if (durationMinutes === 0 && WORKOUT_CIRCUIT.length > 0) {
        durationMinutes = 1;
      }

      // Assicurati che sia NUMBER INTEGER (non string)
      const finalDurationMinutes = parseInt(durationMinutes.toString(), 10);

      console.log('🔍 DEBUG QuickWorkout Duration:', {
        totalSeconds,
        durationMinutes,
        finalDurationMinutes,
        type: typeof finalDurationMinutes,
        exercisesCount: WORKOUT_CIRCUIT.length
      });

      // Prepara dati workout per QuickWorkout
      const workoutData = {
        workout_id: null,
        workout_source: 'quick' as const,
        workout_name: 'Allenamento Rapido 10 minuti',
        workout_type: 'cardio',
        status: 'completed' as const,
        duration_minutes: finalDurationMinutes,
        exercises_count: WORKOUT_CIRCUIT.length,
        exercises: WORKOUT_CIRCUIT.map((ex, index) => ({
          name: ex.name,
          duration: ex.duration,
          rest: ex.rest,
          completed: index < currentExerciseIndex, // Esercizi completati fino a currentExerciseIndex
        })),
        completed_at: new Date().toISOString(),
        saved_at: new Date().toISOString(),
      };

      console.log('🔍 FULL QuickWorkout workoutData BEFORE save:', JSON.stringify(workoutData, null, 2));

      // Salva nel diario
      await saveWorkoutToDiary(workoutData);

      console.log('✅ QuickWorkout salvato con successo');

      // Registra completamento nel sistema medaglie
      recordWorkoutCompletion();
      
      // Traccia workout per sfida 7 giorni
      const challengeResult = trackWorkoutForChallenge();
      
      // Mostra notifica se c'è un messaggio
      if (challengeResult.message) {
        const notificationType = challengeResult.isCompleted ? 'success' : 
                                challengeResult.isNewChallenge ? 'info' : 'info';
        setChallengeNotification({
          message: challengeResult.message,
          type: notificationType
        });
        
        // Auto-close dopo 5 secondi
        setTimeout(() => {
          setChallengeNotification(null);
        }, 5000);
      }

      // Toast SUCCESS
      toast.success('✅ Salvato nel Diario!', {
        description: 'Workout completato e salvato con successo',
      });

      // Navigate dopo 800ms (per vedere toast)
      setTimeout(() => {
        navigate('/diary');
      }, 800);

    } catch (error) {
      console.error('❌ Full error object:', error);
      console.error('❌ Error saving QuickWorkout to diary:', error);
      
      // Toast ERRORE solo se fallisce veramente
      toast.error('❌ Errore', {
        description: 'Impossibile salvare nel diario',
      });
    }
  };

  // Schermata di conferma ripristino
  if (workoutState === 'resume-prompt') {
    const progress = loadWorkoutProgress();
    const exerciseName = progress ? WORKOUT_CIRCUIT[progress.currentExercise]?.name : '';
    
    return (
      <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 99999 }}>
        <div className="flex-1 flex flex-col justify-center items-center px-6">
          <div className="text-center space-y-8 max-w-lg w-full">
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-pp-gold/20 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-pp-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-bold text-pp-gold mb-2">Workout Interrotto</h1>
              <p className="text-xl text-pp-gold/80 mb-4">
                Hai un workout in corso
              </p>
              <p className="text-lg text-pp-gold/60">
                Ultimo esercizio: <span className="font-semibold">{exerciseName}</span>
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={resumeWorkout}
                className="w-full bg-pp-gold hover:bg-pp-gold/90 text-black font-bold py-5 px-6 rounded-xl transition-colors duration-200 text-xl"
              >
                Continua da dove hai lasciato
              </button>
              <button
                onClick={restartWorkout}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
              >
                Ricomincia da capo
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
              >
                Torna alla Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Schermata di completamento
  if (workoutState === 'completed') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 99999 }}>
        {/* Header minimale */}
        <div className="flex-shrink-0 p-4">
          <button
            onClick={() => navigate('/dashboard')}
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
                onClick={markCompleted}
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

  // Schermata principale workout
  return (
    <div className="fixed inset-0 bg-black flex flex-col quick-workout-container" style={{ zIndex: 99999 }}>
      {workoutState === 'ready' ? (
        // Schermata di preparazione fullscreen
        <div className="min-h-screen flex flex-col">
          {/* Header minimale */}
          <div className="flex-shrink-0 p-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-pp-gold/80 hover:text-pp-gold text-sm"
            >
              ← Torna alla Dashboard
            </button>
          </div>
          
          {/* Contenuto centrato */}
          <div className="flex-1 flex flex-col justify-center items-center px-6">
            <div className="text-center space-y-8 max-w-lg w-full">
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-pp-gold/20 rounded-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-pp-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div>
                <h1 className="text-4xl font-bold text-pp-gold mb-2">Workout Rapido</h1>
                <p className="text-xl text-pp-gold/80">Allenamento di 10 minuti</p>
              </div>

              <div className="bg-pp-gold/10 border border-pp-gold/30 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-pp-gold mb-4">💪 Circuito Completo</h2>
                <div className="space-y-3 text-base text-pp-gold/80">
                  <p>🔥 Riscaldamento (2 min)</p>
                  <p>⚡ Esercizi intensi (6 min)</p>
                  <p>🧘 Defaticamento (2 min)</p>
                  <p>⏱️ Timer automatico</p>
                  <p>🔊 Feedback audio</p>
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
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
                >
                  Torna alla Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
        ) : (
          // Schermata workout attivo fullscreen immersivo
          <div className="h-full flex flex-col">
            {/* Header con progresso */}
            <div className="flex-shrink-0 p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-pp-gold/80 text-sm">
                  Esercizio {currentExerciseIndex + 1} di {WORKOUT_CIRCUIT.length}
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleSidebar}
                    className="text-pp-gold/80 hover:text-pp-gold p-2 rounded-lg hover:bg-pp-gold/10 transition-colors duration-200"
                    title="Lista esercizi"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-pp-gold/80 hover:text-pp-gold text-sm"
                  >
                    ← Esci
                  </button>
                </div>
              </div>
              
              {/* Barra progresso */}
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-pp-gold h-3 rounded-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                ></div>
              </div>

              {/* Lista esercizi con stato */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {WORKOUT_CIRCUIT.map((exercise, index) => {
                  const isCompleted = index < currentExerciseIndex;
                  const isCurrent = index === currentExerciseIndex;
                  const isFuture = index > currentExerciseIndex;
                  
                  return (
                    <div
                      key={exercise.id}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                          ? 'bg-pp-gold text-black' 
                          : 'bg-gray-600 text-gray-400'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Contenuto principale - usa tutto lo spazio disponibile */}
            <div className="flex-1 flex flex-col justify-center items-center px-6">
              <div className="text-center space-y-8 w-full max-w-2xl">
                {/* Nome esercizio */}
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-pp-gold mb-4">
                    {isRest ? 'Riposo' : currentExercise.name}
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-pp-gold/80">
                    {isRest ? 'Preparati per il prossimo esercizio' : currentExercise.instructions}
                  </p>
                </div>

                {/* Timer gigante */}
                <div className="text-center">
                  <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-mono font-bold text-pp-gold">
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>
            </div>

            {/* Controlli bottom */}
            <div className="flex-shrink-0 p-6">
              <div className="flex space-x-4 max-w-md mx-auto">
                <button
                  onClick={togglePause}
                  className="flex-1 bg-pp-gold hover:bg-pp-gold/90 text-black font-bold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
                >
                  {workoutState === 'paused' ? 'Riprendi' : 'Pausa'}
                </button>
                <button
                  onClick={skipExercise}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Navigazione Esercizi */}
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeSidebar}
            />
            
            {/* Sidebar */}
            <div className="fixed top-0 right-0 min-h-full w-64 md:w-80 bg-gray-900 border-l border-pp-gold/20 z-[45] transform transition-transform duration-300 ease-in-out">
              <div className="h-full flex flex-col overflow-y-auto">
                {/* Header Sidebar */}
                <div className="flex items-center justify-between p-4 border-b border-pp-gold/20">
                  <h3 className="text-lg font-bold text-pp-gold">
                    Esercizi ({currentExerciseIndex + 1}/{WORKOUT_CIRCUIT.length})
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
                  {WORKOUT_CIRCUIT.map((exercise, index) => {
                    const status = getExerciseStatus(index);
                    const statusIcon = getExerciseStatusIcon(status);
                    const isCurrent = index === currentExerciseIndex;
                    
                    return (
                      <button
                        key={exercise.id}
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
                                {exercise.name}
                              </span>
                            </div>
                            <div className="text-xs text-pp-gold/60 mt-1">
                              {exercise.duration}s {exercise.rest > 0 && `+ ${exercise.rest}s riposo`}
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

        {/* Modal Notifiche Push */}
        <PushPermissionModal
          isOpen={showPermissionModal}
          onClose={closeModal}
          onPermissionGranted={handlePermissionGranted}
          trigger={modalTrigger}
        />
        
        {/* Notifica Sfida */}
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
