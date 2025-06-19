
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WorkoutTimer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [customTime, setCustomTime] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setTime(0);
    setIsRunning(false);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCustomTime(value);
      if (value) {
        setTime(parseInt(value) * 60);
      }
    }
  };

  return (
    <div className="cardio-card rounded-2xl p-6 shadow-sm border-2">
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
              value={customTime}
              onChange={handleCustomTimeChange}
              placeholder="min"
              className="cardio-card__time-input"
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
