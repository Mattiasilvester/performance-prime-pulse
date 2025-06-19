
import { StatsOverview } from './StatsOverview';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { WeeklyProgress } from './WeeklyProgress';
import { NewObjectiveCard } from '../profile/NewObjectiveCard';

export const Dashboard = () => {
  return (
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Ciao, Marco!</h2>
          <p className="text-pp-gold/80">Pronto per superare i tuoi limiti oggi?</p>
        </div>
      </div>

      <StatsOverview />
      <QuickActions />
      
      {/* New Objective Card */}
      <div className="bg-gradient-to-br from-black to-[#c89116]/10 rounded-2xl p-6 shadow-lg border-2 border-[#c89116]">
        <h3 className="text-lg font-semibold text-pp-gold mb-4">Crea il tuo Obiettivo</h3>
        <NewObjectiveCard />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyProgress />
        <RecentActivity />
      </div>
    </div>
  );
};
