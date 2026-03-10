import { lazy, Suspense, useEffect, useRef } from 'react';
import { Flame, Bot, ChevronRight } from 'lucide-react';
const StatsOverview = lazy(() =>
  import('./StatsOverview').then((module) => ({ default: module.StatsOverview }))
);
const QuickActions = lazy(() => import('./QuickActions'));
const RecentActivity = lazy(() =>
  import('./RecentActivity').then((module) => ({ default: module.RecentActivity }))
);
const WeeklyProgress = lazy(() =>
  import('./WeeklyProgress').then((module) => ({ default: module.WeeklyProgress }))
);
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useFeedback15Days } from '@/hooks/useFeedback15Days';
import { useAuth } from '@/hooks/useAuth';
import { useTour } from '@/contexts/TourContext';
import { checkMonthlyReset } from '@/services/monthlyStatsService';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
};

export const Dashboard = () => {
  const { profile: userProfile } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { startTour } = useTour();
  useFeedback15Days(user?.id);

  const tourScheduledRef = useRef(false);
  const tourTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    tourScheduledRef.current = false;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('startTour') === 'true' && !tourScheduledRef.current) {
      tourScheduledRef.current = true;
      setSearchParams({}, { replace: true });
      // Timer in ref: non restituiamo cleanup qui, altrimenti al re-run (location.search → '')
      // React eseguirebbe clearTimeout e il tour non partirebbe
      tourTimerRef.current = setTimeout(() => {
        startTour();
        tourScheduledRef.current = false;
        tourTimerRef.current = null;
      }, 400);
    }
  }, [location.search, setSearchParams, startTour]);

  useEffect(() => {
    return () => {
      if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = () => startTour();
    window.addEventListener('primebot:startTour', handler);
    return () => window.removeEventListener('primebot:startTour', handler);
  }, [startTour]);

  useEffect(() => {
    if (user?.id) {
      checkMonthlyReset(user.id);
    }
  }, [user?.id]);

  const userName = userProfile?.name || 'Utente';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="pb-0 pt-0 dashboard-container min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-5 flex flex-col gap-6 pb-6 pt-0">
        <div data-tour="greeting" className="pt-6 pb-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-bold text-[#F0EDE8] leading-tight truncate" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              {getGreeting()}, {userName}
            </h2>
            <p className="text-sm text-[#8A8A96] mt-0.5">Pronto per superare i tuoi limiti?</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="flex items-center gap-1.5 rounded-full py-1.5 px-3 border border-[rgba(238,186,43,0.15)]"
              style={{ background: 'rgba(238,186,43,0.08)' }}
            >
              <Flame className="h-4 w-4 text-[#EEBA2B]" aria-hidden />
              <span className="text-[#EEBA2B] font-bold text-sm">0</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#5C5C66] text-xs hover:text-[#8A8A96] transition-colors py-1 px-2"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>

        <div data-tour="stats">
          <Suspense fallback={<div className="text-[#8A8A96]">Caricamento statistiche...</div>}>
            <StatsOverview />
          </Suspense>
        </div>

        <div data-tour="quick-start" className="w-full mx-0">
          <button
            onClick={() => navigate('/workout/quick')}
            className="w-full py-4 px-4 rounded-[18px] font-bold text-base text-[#0A0A0C] flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)',
              boxShadow: '0 4px 24px rgba(238,186,43,0.25)',
            }}
          >
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Avvia allenamento rapido (10')</span>
            <span
              className="rounded-full py-0.5 px-2 text-sm font-semibold"
              style={{ background: 'rgba(0,0,0,0.15)' }}
            >
              10'
            </span>
          </button>
        </div>
        
        <div data-tour="quick-actions">
          <Suspense fallback={<div className="text-[#8A8A96]">Caricamento azioni rapide...</div>}>
            <QuickActions />
          </Suspense>
        </div>

        <button
          type="button"
          onClick={() => navigate('/ai-coach')}
          className="w-full rounded-[18px] p-5 flex items-center gap-4 text-left transition-opacity hover:opacity-95 active:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #16161A 0%, rgba(16,185,129,0.05) 100%)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.1)' }}
          >
            <Bot className="w-6 h-6 shrink-0 text-[#10B981]" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#F0EDE8]">Chiedi a PrimeBot</p>
            <p className="text-[13px] text-[#8A8A96] mt-0.5">Il tuo AI coach personale è pronto</p>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0 text-[#5C5C66]" aria-hidden />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4">
          <Suspense fallback={<div className="text-white">Caricamento progressi...</div>}>
            <WeeklyProgress />
          </Suspense>
          <Suspense fallback={<div className="text-white">Caricamento attività...</div>}>
            <RecentActivity />
          </Suspense>
        </div>
      </div>
    </div>
  );
};
