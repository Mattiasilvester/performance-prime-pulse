
import { Schedule as ScheduleComponent } from '@/components/schedule/Schedule';
import { AppLayout } from '@/components/layout/AppLayout';

const Schedule = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <ScheduleComponent />
      </div>
    </AppLayout>
  );
};

export default Schedule;
