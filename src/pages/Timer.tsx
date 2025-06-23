
import { WorkoutTimer } from '@/components/workouts/WorkoutTimer';

const Timer = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <WorkoutTimer />
      </div>
    </div>
  );
};

export default Timer;
