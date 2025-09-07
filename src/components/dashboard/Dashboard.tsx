
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
import FeedbackWidget from '@/components/feedback/FeedbackWidget';
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
    <div className="min-h-screen bg-black pb-20">
      <Header />
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6 pt-16 sm:pt-20">
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
        <QuickActions />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <WeeklyProgress />
          <RecentActivity />
        </div>
      </div>
      <BottomNavigation />
      <FeedbackWidget />
    </div>
  );
};
