
import { AICoach as AICoachComponent } from '@/components/ai/AICoach';
import { AppLayout } from '@/components/layout/AppLayout';

const AICoach = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <AICoachComponent />
      </div>
    </AppLayout>
  );
};

export default AICoach;
