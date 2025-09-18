
import { StatsOverview } from './StatsOverview';
import QuickActions from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { WeeklyProgress } from './WeeklyProgress';
import { useState, useEffect } from 'react';
import { fetchUserProfile, UserProfile } from '@/services/userService';
import { OnboardingBot } from '@/components/OnboardingBot';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useFeedback15Days } from '@/hooks/useFeedback15Days';
import { useAuth } from '@/hooks/useAuth';

export const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  useFeedback15Days(user?.id);

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
  };

  const handleFocusChat = () => {
    // Funzione per portare focus alla chat (da implementare se necessario)
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-20 pt-24 dashboard-container">
      <Header />
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-pp-gold">Ciao, {userName}!</h2>
            <p className="text-sm sm:text-base text-pp-gold/80">Pronto per superare i tuoi limiti oggi?</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm"
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
        
        {/* Bottone Workout Rapido - CTA Principale */}
        <div className="w-full mb-4">
          <button
            onClick={() => navigate('/workout/quick')}
            className="w-full bg-gradient-to-r from-pp-gold to-yellow-500 hover:from-pp-gold/90 hover:to-yellow-500/90 text-black font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg">Avvia allenamento rapido (10')</span>
          </button>
        </div>
        
        <QuickActions />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <WeeklyProgress />
          <RecentActivity />
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};
