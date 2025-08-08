
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExerciseExplanation } from './ExerciseExplanation';
import { useEffect, useState } from 'react';

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
}

export const ExerciseCard = ({ exercise, onStart, onToggleComplete, isCompleted, index }: ExerciseCardProps) => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isSticky, setIsSticky] = useState(false);
  
  useEffect(() => {
    // Fix per viewport height su mobile
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    
    // Gestione scroll per sticky behavior
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsSticky(scrolled);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('orientationchange', handleResize);
    
    // Initial setup
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Fix per il click che non funziona
  const handleStartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Vibration feedback su mobile (se supportato)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Log per debug
    console.log('Pulsante AVVIA cliccato per esercizio:', exercise.name);
    
    // Chiama la funzione solo se definita
    if (typeof onStart === 'function') {
      onStart();
    } else {
      console.error('onStart non è una funzione valida');
    }
  };
  
  const handleCompleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]); // Pattern per completamento
    }
    
    console.log('Pulsante COMPLETA cliccato per esercizio:', exercise.name);
    
    if (typeof onToggleComplete === 'function') {
      onToggleComplete(index);
    }
  };

  return (
    <Card className="bg-black border-2 border-[#EEBA2B] relative">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 min-h-[80px]">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="font-bold text-white text-lg leading-tight truncate mb-1">
                {exercise.name}
              </h4>
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
              className="btn-avvia animate-scale-in hover-scale min-h-[44px] px-4 py-2 text-sm font-semibold"
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
                  : ''
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
