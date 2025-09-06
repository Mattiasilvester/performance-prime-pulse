
import { Workouts as WorkoutsComponent } from '@/components/workouts/Workouts';
import { AppLayout } from '@/components/layout/AppLayout';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';

const Workouts = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 pb-24">
        <WorkoutsComponent />
      </div>
      <FeedbackWidget />
    </AppLayout>
  );
};

export default Workouts;
