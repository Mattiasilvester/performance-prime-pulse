
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkoutTimerProps {
  workoutType?: string;
}

export const WorkoutTimer = ({ workoutType }: WorkoutTimerProps) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputSeconds, setInputSeconds] = useState('');
  const [isCountdown, setIsCountdown] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (isCountdown && prevTime > 0) {
            return prevTime - 1;
          } else if (isCountdown && prevTime <= 0) {
            setIsRunning(false);
            return 0;
          } else {
            return prevTime + 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isCountdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isRunning && (inputMinutes || inputSeconds)) {
      const totalSeconds = (parseInt(inputMinutes) || 0) * 60 + (parseInt(inputSeconds) || 0);
      if (totalSeconds > 0) {
        setTime(totalSeconds);
        setIsCountdown(true);
      }
    } else if (!isRunning && !inputMinutes && !inputSeconds) {
      setIsCountdown(false);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTime(0);
    setIsRunning(false);
    setIsCountdown(false);
    setInputMinutes('');
    setInputSeconds('');
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

  // Get the inverted gradient for cardio and hiit sections
  const getCardStyle = () => {
    if (workoutType === 'cardio' || workoutType === 'hiit') {
      return {
        background: 'linear-gradient(135deg, #EEBA2B 0%, #000000 100%)'
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
            <p className="cardio-card__timer-label">Tempo di allenamento</p>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={toggleTimer}
              size="lg"
              className={`cardio-card__play-btn ${isRunning ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"}`}
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <input
              type="text"
              value={inputMinutes}
              onChange={handleMinutesChange}
              placeholder="min"
              className="cardio-card__input-min"
            />
            
            <input
              type="text"
              value={inputSeconds}
              onChange={handleSecondsChange}
              placeholder="sec"
              className="cardio-card__input-sec"
            />
            
            <Button 
              onClick={resetTimer} 
              variant="outline" 
              size="lg"
              className="cardio-card__reset-btn"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
