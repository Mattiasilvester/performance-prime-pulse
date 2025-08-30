
import { StatsOverview } from './StatsOverview';
import QuickActions from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { WeeklyProgress } from './WeeklyProgress';
import { useState, useEffect } from 'react';
import { fetchUserProfile, UserProfile } from '@/services/userService';
import { OnboardingBot } from '@/components/OnboardingBot';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserProfile = async () => {
      const profile = await fetchUserProfile();
      setUserProfile(profile);
    };
    loadUserProfile();
  }, []);

  const userName = userProfile?.name || 'Utente';

  const handleSendMessage = (message: string) => {
    // Funzione per inviare messaggi al bot (da implementare se necessario)
    console.log('Messaggio da inviare al bot:', message);
  };

  const handleFocusChat = () => {
    // Funzione per portare focus alla chat (da implementare se necessario)
    console.log('Focus alla chat');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Ciao, {userName}!</h2>
          <p className="text-pp-gold/80">Pronto per superare i tuoi limiti oggi?</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Onboarding Bot per nuovi utenti */}
      <OnboardingBot 
        userName={userName}
        onSendMessage={handleSendMessage}
        onFocusChat={handleFocusChat}
      />

      <StatsOverview />
      <QuickActions />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyProgress />
        <RecentActivity />
      </div>
    </div>
  );
};
