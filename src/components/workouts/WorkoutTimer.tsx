
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface WorkoutTimerProps {
  workoutType?: string;
  onTimerComplete?: () => void;
  autoStartTime?: { hours: number; minutes: number; seconds: number };
  autoStartRest?: { hours: number; minutes: number; seconds: number };
}

export const WorkoutTimer = ({ workoutType, onTimerComplete, autoStartTime, autoStartRest }: WorkoutTimerProps) => {
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

  // Reset timer when navigating away from workout screens
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
            // Exercise finished, start rest if available
            if (!isRestPhase && restTime) {
              const totalRestSeconds = restTime.hours * 3600 + restTime.minutes * 60 + restTime.seconds;
              setIsRestPhase(true);
              return totalRestSeconds;
            } else {
              // Rest finished or no rest phase
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
    <div className="w-full rounded-2xl p-8 shadow-sm border-2 border-[#EEBA2B]" style={{
      background: 'radial-gradient(circle at 50% 50%, #000000, #bf8b16)'
    }}>
      <div className="text-center w-full">
        <div className="mb-6">
          <div className="text-5xl lg:text-6xl font-mono font-bold mb-4 text-white">
            {formatTime(time)}
          </div>
          <p className="text-white/80 text-lg">
            {isRestPhase ? t('timer.restTime') : t('timer.workoutTime')}
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-4 flex-wrap gap-4">
          <Button
            onClick={toggleTimer}
            size="lg"
            className="bg-green-500 hover:bg-green-600 h-12 w-16 text-black order-1"
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          
          <div className="flex items-center space-x-3 order-2">
            <input
              type="text"
              value={inputHours}
              onChange={handleHoursChange}
              placeholder={t('timer.hours') || 'ore'}
              className="w-16 h-12 text-center border border-gray-300 rounded px-2 bg-white text-black font-medium"
            />
            
            <input
              type="text"
              value={inputMinutes}
              onChange={handleMinutesChange}
              placeholder={t('timer.minutes') || 'min'}
              className="w-16 h-12 text-center border border-gray-300 rounded px-2 bg-white text-black font-medium"
            />
            
            <input
              type="text"
              value={inputSeconds}
              onChange={handleSecondsChange}
              placeholder={t('timer.seconds') || 'sec'}
              className="w-16 h-12 text-center border border-gray-300 rounded px-2 bg-white text-black font-medium"
            />
          </div>
          
          <Button 
            onClick={resetTimer} 
            size="lg"
            className="bg-[#EEBA2B] hover:bg-[#d4a61a] h-12 w-16 text-black order-3"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};
