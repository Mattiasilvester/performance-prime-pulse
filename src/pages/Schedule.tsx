
import { Schedule as ScheduleComponent } from '@/components/schedule/Schedule';
import { AppLayout } from '@/components/layout/AppLayout';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';

const Schedule = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <ScheduleComponent />
      </div>
      <FeedbackWidget />
    </AppLayout>
  );
};

export default Schedule;
