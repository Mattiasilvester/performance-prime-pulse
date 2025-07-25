
import { StatsOverview } from './StatsOverview';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { WeeklyProgress } from './WeeklyProgress';
import { useState, useEffect } from 'react';
import { fetchUserProfile, UserProfile } from '@/services/userService';

export const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      const profile = await fetchUserProfile();
      setUserProfile(profile);
    };
    loadUserProfile();
  }, []);

  const userName = userProfile?.name || 'Utente';

  return (
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Ciao, {userName}!</h2>
          <p className="text-pp-gold/80">Pronto per superare i tuoi limiti oggi?</p>
        </div>
      </div>

      <StatsOverview />
      <QuickActions />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyProgress />
        <RecentActivity />
      </div>
    </div>
  );
};
