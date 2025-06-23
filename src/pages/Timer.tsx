import { WorkoutTimer } from '@/components/workouts/WorkoutTimer';

const Timer = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Keep existing header/navigation from AppLayout but inline here */}
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <WorkoutTimer />
        </div>
        <div className="mt-8 text-center">
          <p className="text-[#EEBA2B] text-lg font-medium italic">
            "Supera i tuoi limiti, un secondo alla volta."
          </p>
        </div>
      </div>
    </div>
  );
};

export default Timer;
