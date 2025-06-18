
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Workouts } from '@/components/workouts/Workouts';
import { Schedule } from '@/components/schedule/Schedule';
import { AICoach } from '@/components/ai/AICoach';
import { Profile } from '@/components/profile/Profile';

type ActiveSection = 'dashboard' | 'workouts' | 'schedule' | 'ai-coach' | 'profile';

const Index = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'workouts':
        return <Workouts />;
      case 'schedule':
        return <Schedule />;
      case 'ai-coach':
        return <AICoach />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Navigation 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
          <main className="flex-1">
            {renderActiveSection()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
