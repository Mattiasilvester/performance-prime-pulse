
import { WorkoutCategories } from './WorkoutCategories';
import { ActiveWorkout } from './ActiveWorkout';
import { WorkoutTimer } from './WorkoutTimer';
import { useState } from 'react';

export const Workouts = () => {
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen border-2 border-black">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Allenamenti</h2>
          <p className="text-white">Scegli il tuo workout perfetto</p>
        </div>
      </div>

      {activeWorkout ? (
        <div className="space-y-6">
          <WorkoutTimer workoutType={activeWorkout} />
          <ActiveWorkout workoutId={activeWorkout} onClose={() => setActiveWorkout(null)} />
        </div>
      ) : (
        <WorkoutCategories onStartWorkout={setActiveWorkout} />
      )}
    </div>
  );
};
