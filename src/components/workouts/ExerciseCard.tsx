
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

  // Fix per il click che non funziona
  const handleStartClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Vibration feedback su mobile (se supportato)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Log per debug
    
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
                <ExerciseGifLink exerciseName={exercise.name} />
              </div>
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
    </Card>
  );
};
