import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface WorkoutTimerProps {
  workoutType?: string;
  onTimerComplete?: () => void;
  autoStartTime?: { hours: number; minutes: number; seconds: number };
  autoStartRest?: { hours: number; minutes: number; seconds: number };
  onBack?: () => void;
}

export const WorkoutTimer = ({ workoutType, onTimerComplete, autoStartTime, autoStartRest, onBack }: WorkoutTimerProps) => {
  const { t } = useTranslation();
  
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputSeconds, setInputSeconds] = useState('');
  const [isCountdown, setIsCountdown] = useState(false);
  const [isRestPhase, setIsRestPhase] = useState(false);
  const [restTime, setRestTime] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const location = useLocation();

  useEffect(() => {
    const workoutPaths = ['/workouts', '/timer'];
    const isWorkoutPath = workoutPaths.some(path => location.pathname.startsWith(path));
    
    if (!isWorkoutPath) {
      setTime(0);
      setIsRunning(false);
      setInputHours('');
      setInputMinutes('');
      setInputSeconds('');
      setIsCountdown(false);
      setIsRestPhase(false);
      setRestTime(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (autoStartTime) {
      const totalSeconds = autoStartTime.hours * 3600 + autoStartTime.minutes * 60 + autoStartTime.seconds;
      setTime(totalSeconds);
      setInputHours(autoStartTime.hours.toString());
      setInputMinutes(autoStartTime.minutes.toString());
      setInputSeconds(autoStartTime.seconds.toString());
      setIsCountdown(true);
      setIsRunning(true);
      setIsRestPhase(false);
      
      if (autoStartRest) {
        setRestTime(autoStartRest);
      }
    }
  }, [autoStartTime, autoStartRest]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (isCountdown && prevTime > 0) {
            return prevTime - 1;
          } else if (isCountdown && prevTime <= 0) {
            if (!isRestPhase && restTime) {
              const totalRestSeconds = restTime.hours * 3600 + restTime.minutes * 60 + restTime.seconds;
              setIsRestPhase(true);
              return totalRestSeconds;
            } else {
              setIsRunning(false);
              setIsRestPhase(false);
              setRestTime(null);
              if (onTimerComplete) {
                onTimerComplete();
              }
              return 0;
            }
          } else {
            return prevTime + 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isCountdown, onTimerComplete, isRestPhase, restTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isRunning && (inputHours || inputMinutes || inputSeconds)) {
      const totalSeconds = (parseInt(inputHours) || 0) * 3600 + (parseInt(inputMinutes) || 0) * 60 + (parseInt(inputSeconds) || 0);
      if (totalSeconds > 0) {
        setTime(totalSeconds);
        setIsCountdown(true);
      }
    } else if (!isRunning && !inputHours && !inputMinutes && !inputSeconds) {
      setIsCountdown(false);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTime(0);
    setIsRunning(false);
    setIsCountdown(false);
    setIsRestPhase(false);
    setRestTime(null);
    setInputHours('');
    setInputMinutes('');
    setInputSeconds('');
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && parseInt(value) <= 23) {
      setInputHours(value);
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && parseInt(value) <= 59) {
      setInputMinutes(value);
    }
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && parseInt(value) <= 59) {
      setInputSeconds(value);
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col justify-between relative">
      {/* Bottone Indietro - IN ALTO */}
      <div className="w-full pt-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white hover:bg-white/10 bg-transparent border-none ml-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      {/* Numeri del timer - AL CENTRO */}
      <div className="text-center w-full">
        <div className="text-7xl lg:text-8xl font-mono font-bold text-white">
          {formatTime(time)}
        </div>
        
        {/* Tre caselle ore, min, sec - SOTTO I NUMERI */}
        <div className="flex items-center justify-center gap-2 md:gap-4 flex-nowrap mt-4">
          <input
            type="text"
            value={inputHours}
            onChange={handleHoursChange}
            placeholder={t('timer.hours') || 'ore'}
            className="w-12 md:w-16 h-12 text-center border border-gray-300 rounded px-1 md:px-2 bg-white text-black font-medium text-base md:text-base flex-shrink-0"
          />
          
          <input
            type="text"
            value={inputMinutes}
            onChange={handleMinutesChange}
            placeholder={t('timer.minutes') || 'min'}
            className="w-12 md:w-16 h-12 text-center border border-gray-300 rounded px-1 md:px-2 bg-white text-black font-medium text-base md:text-base flex-shrink-0"
          />
          
          <input
            type="text"
            value={inputSeconds}
            onChange={handleSecondsChange}
            placeholder={t('timer.seconds') || 'sec'}
            className="w-12 md:w-16 h-12 text-center border border-gray-300 rounded px-1 md:px-2 bg-white text-black font-medium text-base md:text-base flex-shrink-0"
          />
        </div>
      </div>

      {/* Contenitore dorato PICCOLO solo per i bottoni */}
      <div className="w-auto max-w-md mx-auto rounded-2xl p-4 shadow-sm border-2 border-[#EEBA2B] flex flex-col justify-center" style={{
        background: 'radial-gradient(circle at 50% 50%, #000000, #bf8b16)'
      }}>
        <div className="text-center w-full">
          {/* Layout: Play e Reset */}
          <div className="flex items-center justify-center gap-6 flex-nowrap">
            <Button
              onClick={toggleTimer}
              size="lg"
              className="bg-green-500 hover:bg-green-600 h-16 w-20 text-black flex-shrink-0"
            >
              {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>
            
            <Button 
              onClick={resetTimer} 
              size="lg"
              className="bg-[#EEBA2B] hover:bg-[#d4a61a] h-16 w-20 text-black flex-shrink-0"
            >
              <RotateCcw className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </div>

      {/* Frase motivazionale - IN BASSO */}
      <div className="text-center w-full">
        <p className="text-[#EEBA2B] text-lg font-medium italic">
          "Supera i tuoi limiti, un secondo alla volta."
        </p>
      </div>
    </div>
  );
};
