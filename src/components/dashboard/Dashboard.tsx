
import { StatsOverview } from './StatsOverview';
import { QuickActionsTest } from './QuickActionsTest';
import { RecentActivity } from './RecentActivity';
import { WeeklyProgress } from './WeeklyProgress';
import { useState, useEffect } from 'react';
import { fetchUserProfile, UserProfile } from '@/services/userService';

export const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        console.log('Caricamento profilo utente...');
        const profile = await fetchUserProfile();
        console.log('Profilo caricato:', profile);
        setUserProfile(profile);
      } catch (error) {
        console.log('Errore nel caricamento del profilo utente:', error);
        // Fallback senza Supabase
        setUserProfile({ 
          id: '1',
          name: 'Utente', 
          surname: 'Test',
          email: 'user@example.com',
          birth_place: '',
          phone: '',
          bio: 'Appassionato di fitness e benessere',
          avatarUrl: '👨‍💼'
        });
      } finally {
        setLoading(false);
      }
    };
    loadUserProfile();
  }, []);

  const userName = userProfile?.name || 'Utente';

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-pp-gold text-xl">Caricamento dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6 bg-black min-h-screen p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Ciao, {userName}!</h2>
          <p className="text-pp-gold/80">Pronto per superare i tuoi limiti oggi?</p>
        </div>
      </div>

      <StatsOverview />
      <QuickActionsTest />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyProgress />
        <RecentActivity />
      </div>
    </div>
  );
};
