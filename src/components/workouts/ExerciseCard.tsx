
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExerciseExplanation } from './ExerciseExplanation';
import { ExerciseGifLink } from './ExerciseGifLink';
import { useEffect, useState } from 'react';

interface ExerciseTimerState {
  isActive: boolean;
  isResting: boolean;
  timeRemaining: number;
  totalWorkTime: number;
  totalRestTime: number;
  isCompleted: boolean;
}

interface ExerciseCardProps {
  exercise: {
    name: string;
    duration: string;
    rest: string;
    sets?: string;
    reps?: string;
    completed?: boolean;
  };
  onStart: () => void;
  onToggleComplete: (index: number) => void;
  isCompleted: boolean;
  index: number;
  timer?: ExerciseTimerState;
}

export const ExerciseCard = ({ exercise, onStart, onToggleComplete, isCompleted, index, timer }: ExerciseCardProps) => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [showTimer, setShowTimer] = useState(false);
  const [timerTime, setTimerTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
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

  // Funzioni per i suoni
  const playSound = (type: 'start' | 'pause' | 'finish' | 'tick') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'start':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case 'pause':
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'finish':
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        case 'tick':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
      }
    } catch (error) {
      console.log('Audio non supportato');
    }
  };

  // Funzione per convertire tempo di riposo in secondi
  const parseRestTime = (restStr: string): number => {
    if (restStr.includes('min')) {
      return parseInt(restStr) * 60;
    } else if (restStr.includes('s')) {
      return parseInt(restStr);
    }
    return 30; // default 30 secondi
  };

  // Funzione per formattare il tempo in MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gestione del timer
  const startTimer = () => {
    if (isTimerRunning) {
      // Pausa timer
      setIsTimerRunning(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      playSound('pause');
    } else {
      // Avvia timer
      setIsTimerRunning(true);
      playSound('start');
      
      const interval = setInterval(() => {
        setTimerTime(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            clearInterval(interval);
            setTimerInterval(null);
            playSound('finish');
            // Reset al tempo di riposo originale
            const restSeconds = parseRestTime(exercise.rest);
            setTimerTime(restSeconds);
            return restSeconds;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimerInterval(interval);
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    const restSeconds = parseRestTime(exercise.rest);
    setTimerTime(restSeconds);
  };

  // Cleanup del timer quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Fix per il click che non funziona
  const handleStartClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Vibration feedback su mobile (se supportato)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Mostra il timer e imposta il tempo di riposo
    if (!showTimer) {
      const restSeconds = parseRestTime(exercise.rest);
      setTimerTime(restSeconds);
      setShowTimer(true);
    }
    
    // Chiama la funzione solo se definita
    if (typeof onStart === 'function') {
      onStart();
    } else {
      console.error('onStart non è una funzione valida');
    }
  };
  
  const handleCompleteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]); // Pattern per completamento
    }

    if (typeof onToggleComplete === 'function') {
      onToggleComplete(index);
    }
  };

  return (
    <Card className="bg-black border-2 border-[#EEBA2B] rounded-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 min-h-[80px]">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-white text-lg leading-tight truncate">
                  {exercise.name}
                </h4>
                <div className="flex items-center self-center">
                  <ExerciseGifLink exerciseName={exercise.name} />
                </div>
              </div>
              {/* Mostra Serie e Ripetizioni se disponibili */}
              {exercise.sets && exercise.reps && (
                <p className="text-sm text-white/70 truncate mt-2 mb-2">
                  {exercise.sets} serie x {exercise.reps} rip
                </p>
              )}
              <p className="text-sm text-white/70 truncate mb-2">
                {exercise.duration}
              </p>
              <p className="text-sm text-white/70 truncate">
                Riposo: {exercise.rest}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-2 flex-shrink-0">
            <Button
              onClick={handleStartClick}
              onTouchEnd={handleStartClick} // Fallback per touch devices
              size="sm"
              className="btn-avvia animate-scale-in hover-scale min-h-[44px] px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white"
              type="button"
              aria-label={`Avvia ${exercise.name}`}
            >
              AVVIA
            </Button>
            <Button
              onClick={handleCompleteClick}
              onTouchEnd={handleCompleteClick}
              size="sm"
              className={`btn-completato animate-scale-in hover-scale min-h-[44px] px-4 py-2 text-sm font-semibold ${
                isCompleted 
                  ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              type="button"
              aria-label={`Completa ${exercise.name}`}
            >
              {isCompleted ? '✓ FATTO' : 'COMPLETA →'}
            </Button>
          </div>
        </div>
      </CardContent>
      
      {/* Timer per il riposo */}
      {showTimer && (
        <div className="bg-gray-800 border-t border-[#EEBA2B] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {formatTime(timerTime)}
                </div>
                <div className="text-xs text-gray-400">Riposo</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={startTimer}
                size="sm"
                className={`min-h-[36px] px-3 py-2 text-sm font-semibold ${
                  isTimerRunning 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isTimerRunning ? '⏸️ PAUSA' : '▶️ AVVIA'}
              </Button>
              
              <Button
                onClick={resetTimer}
                size="sm"
                className="min-h-[36px] px-3 py-2 text-sm font-semibold bg-gray-600 hover:bg-gray-700 text-white"
              >
                🔄 RESET
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
