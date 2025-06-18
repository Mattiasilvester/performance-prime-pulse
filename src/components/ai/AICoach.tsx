
import { ChatInterface } from './ChatInterface';
import { AIInsights } from './AIInsights';
import { PersonalizedPlans } from './PersonalizedPlans';

export const AICoach = () => {
  return (
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">AI Coach Prime</h2>
          <p className="text-white">Il tuo assistente personale per l'allenamento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChatInterface />
        </div>
        <div className="space-y-6">
          <AIInsights />
          <PersonalizedPlans />
        </div>
      </div>
    </div>
  );
};
