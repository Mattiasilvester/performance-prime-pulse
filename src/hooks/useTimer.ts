import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerState {
  time: number;
  isRunning: boolean;
  isCountdown: boolean;
  isRestPhase: boolean;
  restTime: number;
  totalTime: number;
  totalRestTime: number;
}

export interface TimerConfig {
  initialTime?: number;
  restTime?: number;
  isCountdown?: boolean;
  autoStart?: boolean;
  onComplete?: () => void;
  onRestComplete?: () => void;
}

export interface TimerControls {
  start: () => void;
  pause: () => void;
  reset: () => void;
  setTime: (time: number) => void;
  setRestTime: (time: number) => void;
  toggleCountdown: () => void;
  skipRest: () => void;
}

export const useTimer = (config: TimerConfig = {}): [TimerState, TimerControls] => {
  const {
    initialTime = 0,
    restTime = 0,
    isCountdown = false,
    autoStart = false,
    onComplete,
    onRestComplete
  } = config;

  const [state, setState] = useState<TimerState>({
    time: initialTime,
    isRunning: autoStart,
    isCountdown,
    isRestPhase: false,
    restTime: 0,
    totalTime: initialTime,
    totalRestTime: restTime
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onRestCompleteRef = useRef(onRestComplete);

  // Aggiorna le ref per i callback
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onRestCompleteRef.current = onRestComplete;
  }, [onComplete, onRestComplete]);

  // Funzione per formattare il tempo
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Funzione per avviare il timer
  const start = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: true }));
  }, []);

  // Funzione per mettere in pausa il timer
  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  // Funzione per resettare il timer
  const reset = useCallback(() => {
    setState({
      time: initialTime,
      isRunning: false,
      isCountdown,
      isRestPhase: false,
      restTime: 0,
      totalTime: initialTime,
      totalRestTime: restTime
    });
  }, [initialTime, isCountdown, restTime]);

  // Funzione per impostare il tempo
  const setTime = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      time,
      totalTime: time,
      isRestPhase: false
    }));
  }, []);

  // Funzione per impostare il tempo di riposo
  const setRestTime = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      totalRestTime: time
    }));
  }, []);

  // Funzione per alternare tra countdown e timer normale
  const toggleCountdown = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCountdown: !prev.isCountdown
    }));
  }, []);

  // Funzione per saltare il riposo
  const skipRest = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRestPhase: false,
      restTime: 0
    }));
    if (onRestCompleteRef.current) {
      onRestCompleteRef.current();
    }
  }, []);

  // Effetto principale per il timer
  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.isCountdown) {
          // Timer countdown
          if (prev.isRestPhase) {
            // Fase di riposo
            if (prev.restTime <= 1) {
              // Riposo finito
              if (onRestCompleteRef.current) {
                onRestCompleteRef.current();
              }
              return {
                ...prev,
                isRestPhase: false,
                restTime: 0,
                isRunning: false
              };
            }
            return {
              ...prev,
              restTime: prev.restTime - 1
            };
          } else {
            // Fase di lavoro
            if (prev.time <= 1) {
              // Lavoro finito, inizia riposo se disponibile
              if (prev.totalRestTime > 0) {
                return {
                  ...prev,
                  isRestPhase: true,
                  restTime: prev.totalRestTime,
                  time: 0
                };
              } else {
                // Nessun riposo, workout completato
                if (onCompleteRef.current) {
                  onCompleteRef.current();
                }
                return {
                  ...prev,
                  time: 0,
                  isRunning: false
                };
              }
            }
            return {
              ...prev,
              time: prev.time - 1
            };
          }
        } else {
          // Timer normale (cronometro)
          if (prev.isRestPhase) {
            return {
              ...prev,
              restTime: prev.restTime + 1
            };
          } else {
            return {
              ...prev,
              time: prev.time + 1
            };
          }
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, state.isCountdown, state.isRestPhase, state.time, state.restTime, state.totalRestTime]);

  // Cleanup al dismount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const controls: TimerControls = {
    start,
    pause,
    reset,
    setTime,
    setRestTime,
    toggleCountdown,
    skipRest
  };

  return [state, controls];
};

// Hook semplificato per timer di esercizi
export const useExerciseTimer = (
  workTime: number,
  restTime: number = 0,
  onWorkComplete?: () => void,
  onRestComplete?: () => void
) => {
  const [state, controls] = useTimer({
    initialTime: workTime,
    restTime,
    isCountdown: true,
    autoStart: false,
    onComplete: onWorkComplete,
    onRestComplete: onRestComplete
  });

  return {
    ...state,
    ...controls,
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };
};