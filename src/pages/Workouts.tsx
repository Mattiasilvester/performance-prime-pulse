
import { Workouts as WorkoutsComponent } from '@/components/workouts/Workouts';
import { AppLayout } from '@/components/layout/AppLayout';

const Workouts = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <WorkoutsComponent />
      </div>
    </AppLayout>
  );
};

export default Workouts;
