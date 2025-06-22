
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkoutTimerProps {
  workoutType?: string;
  onTimerComplete?: () => void;
  autoStartTime?: { hours: number; minutes: number; seconds: number };
  autoStartRest?: number;
}

export const WorkoutTimer = ({ workoutType, onTimerComplete, autoStartTime, autoStartRest }: WorkoutTimerProps) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputSeconds, setInputSeconds] = useState('');
  const [isCountdown, setIsCountdown] = useState(false);
  const [isRestPhase, setIsRestPhase] = useState(false);
  const [restTime, setRestTime] = useState(0);

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
            // Exercise phase completed, start rest phase if available
            if (!isRestPhase && restTime > 0) {
              setIsRestPhase(true);
              return restTime;
            } else {
              // All phases completed
              setIsRunning(false);
              setIsRestPhase(false);
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
  }, [isRunning, isCountdown, isRestPhase, restTime, onTimerComplete]);

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
        setIsRestPhase(false);
      }
    } else if (!isRunning && !inputHours && !inputMinutes && !inputSeconds) {
      setIsCountdown(false);
      setIsRestPhase(false);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTime(0);
    setIsRunning(false);
    setIsCountdown(false);
    setIsRestPhase(false);
    setInputHours('');
    setInputMinutes('');
    setInputSeconds('');
    setRestTime(0);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && (value === '' || parseInt(value) <= 23)) {
      setInputHours(value);
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && (value === '' || parseInt(value) <= 59)) {
      setInputMinutes(value);
    }
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && (value === '' || parseInt(value) <= 59)) {
      setInputSeconds(value);
    }
  };

  const getCardStyle = () => {
    if (workoutType === 'cardio' || workoutType === 'hiit') {
      return {
        background: 'radial-gradient(circle at 50% 50%, #000000, #bf8b16)'
      };
    }
    return {};
  };

  return (
    <div className="cardio-card rounded-2xl p-6 shadow-sm border-2" style={getCardStyle()}>
      <div className="cardio-card__timer rounded-2xl p-6 border-2">
        <div className="text-center">
          <div className="mb-4">
            <div className="cardio-card__timer-display text-4xl font-mono font-bold mb-2">
              {formatTime(time)}
            </div>
            <p className="cardio-card__timer-label">
              {isRestPhase ? 'Tempo di riposo' : 'Tempo di allenamento'}
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 lg:space-x-3 flex-wrap lg:flex-nowrap">
            <Button
              onClick={toggleTimer}
              size="lg"
              className={`cardio-card__play-btn ${isRunning ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"} lg:h-11 h-9`}
            >
              {isRunning ? <Pause className="h-4 w-4 lg:h-5 lg:w-5" /> : <Play className="h-4 w-4 lg:h-5 lg:w-5" />}
            </Button>
            
            <input
              type="text"
              value={inputHours}
              onChange={handleHoursChange}
              placeholder="ore"
              className="cardio-card__input-hours w-10 lg:w-12 h-9 lg:h-11 text-xs lg:text-sm text-center"
            />
            
            <input
              type="text"
              value={inputMinutes}
              onChange={handleMinutesChange}
              placeholder="min"
              className="cardio-card__input-min w-10 lg:w-12 h-9 lg:h-11 text-xs lg:text-sm text-center"
            />
            
            <input
              type="text"
              value={inputSeconds}
              onChange={handleSecondsChange}
              placeholder="sec"
              className="cardio-card__input-sec w-10 lg:w-12 h-9 lg:h-11 text-xs lg:text-sm text-center"
            />
            
            <Button 
              onClick={resetTimer} 
              variant="outline" 
              size="lg"
              className="cardio-card__reset-btn lg:h-11 h-9"
            >
              <RotateCcw className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
