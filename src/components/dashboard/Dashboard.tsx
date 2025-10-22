
import { StatsOverview } from './StatsOverview';
import QuickActions from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { WeeklyProgress } from './WeeklyProgress';
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { OnboardingBot } from '@/components/OnboardingBot';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useFeedback15Days } from '@/hooks/useFeedback15Days';
import { useAuth } from '@/hooks/useAuth';
import { checkMonthlyReset } from '@/services/monthlyStatsService';

export const Dashboard = () => {
  const { profile: userProfile } = useUserProfile();
  const navigate = useNavigate();
  const { user } = useAuth();
  useFeedback15Days(user?.id);

  // Controlla reset mensile all'avvio
  useEffect(() => {
    if (user?.id) {
      checkMonthlyReset(user.id);
    }
  }, [user?.id]);

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
    <div className="pb-0 pt-0 dashboard-container min-h-screen">
      <Header />
      <div className="container mx-auto px-2 sm:px-4 py-0 space-y-1 sm:space-y-1 pt-0">
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
    </div>
  );
};
