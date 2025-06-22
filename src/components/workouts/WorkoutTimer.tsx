import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkoutTimerProps {
  workoutType?: string;
  onTimerComplete?: () => void;
  autoStartTime?: { hours: number; minutes: number; seconds: number };
  autoStartRest?: { hours: number; minutes: number; seconds: number };
}

export const WorkoutTimer = ({ workoutType, onTimerComplete, autoStartTime, autoStartRest }: WorkoutTimerProps) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputSeconds, setInputSeconds] = useState('');
  const [isCountdown, setIsCountdown] = useState(false);
  const [isRestPhase, setIsRestPhase] = useState(false);
  const [restTime, setRestTime] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

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
    <div className="rounded-2xl p-6 shadow-sm border-2 border-[#EEBA2B]" style={{
      background: 'radial-gradient(circle at 50% 50%, #000000, #bf8b16)'
    }}>
      <div className="text-center">
        <div className="mb-4">
          <div className="text-4xl font-mono font-bold mb-2 text-white">
            {formatTime(time)}
          </div>
          <p className="text-white/80">
            {isRestPhase ? 'Tempo di riposo' : 'Tempo di allenamento'}
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-2 lg:space-x-3">
          <Button
            onClick={toggleTimer}
            size="sm"
            className="bg-green-500 hover:bg-green-600 h-9 w-12 text-black"
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <input
            type="text"
            value={inputHours}
            onChange={handleHoursChange}
            placeholder="ore"
            className="w-12 h-9 text-sm text-center border border-gray-300 rounded px-1 bg-white text-black"
          />
          
          <input
            type="text"
            value={inputMinutes}
            onChange={handleMinutesChange}
            placeholder="min"
            className="w-12 h-9 text-sm text-center border border-gray-300 rounded px-1 bg-white text-black"
          />
          
          <input
            type="text"
            value={inputSeconds}
            onChange={handleSecondsChange}
            placeholder="sec"
            className="w-12 h-9 text-sm text-center border border-gray-300 rounded px-1 bg-white text-black"
          />
          
          <Button 
            onClick={resetTimer} 
            size="sm"
            className="bg-[#EEBA2B] hover:bg-[#d4a61a] h-9 w-12 text-black"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
