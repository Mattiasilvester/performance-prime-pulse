import { Calendar, Clock, Bot, Home, Dumbbell, TreePine, Target, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { NewObjectiveCard } from '@/components/profile/NewObjectiveCard';

type QuickAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  textColor: string;
  onClick: () => void;
  accessible: boolean;
  disabled?: boolean;
};

const QuickActions = () => {
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadSavedPlans = async () => {
      try {
        setIsLoadingPlans(true);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          setSavedPlans([]);
          setIsLoadingPlans(false);
          return;
        }

        const { data, error } = await supabase
          .from('workout_plans')
          .select('id, nome, tipo, luogo, obiettivo, durata, esercizi, is_active, saved_for_later, created_at, updated_at')
          .eq('user_id', currentUser.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Errore caricamento piani:', error);
          setSavedPlans([]);
        } else {
          console.log('Piani caricati:', data);
          setSavedPlans(data || []);
        }
      } catch (error) {
        console.error('Errore:', error);
        setSavedPlans([]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    loadSavedPlans();
  }, []);

  const handleNewObjectiveClick = () => {
    setIsObjectiveModalOpen(true);
  };

  const handleObjectiveModalClose = () => {
    setIsObjectiveModalOpen(false);
  };

  const handleTimerClick = () => {
    navigate('/timer');
  };

  const handleScheduleClick = () => {
    navigate('/schedule');
  };

  const handlePrimeBotClick = () => {
    navigate('/ai-coach');
  };

  const getPlanIcon = (luogo: string) => {
    const l = luogo?.toLowerCase?.() || '';
    if (l.includes('casa') || l.includes('home')) return Home;
    if (l.includes('palestra') || l.includes('gym')) return Dumbbell;
    if (l.includes('outdoor') || l.includes('aperto')) return TreePine;
    return Dumbbell;
  };

  const handleStartPlan = (plan: any) => {
    console.log('Avvio piano:', plan);
    setShowPlanModal(false);

    const exercisesFormatted = (plan?.esercizi || []).map((ex: any) => ({
      name: ex?.nome || ex?.name,
      duration: ex?.ripetizioni || ex?.duration,
      rest: ex?.riposo || ex?.rest,
      sets: ex?.serie || ex?.sets,
      instructions: ex?.note || ex?.instructions,
      muscleGroup: plan?.obiettivo
    }));

    navigate('/workouts', {
      state: {
        startCustomWorkout: 'personalized',
        customExercises: exercisesFormatted,
        workoutTitle: plan?.nome,
        workoutType: plan?.tipo,
        duration: plan?.durata
      }
    });
  };

  const handlePlanCardClick = () => {
    console.log('Click su Piano Personalizzato. Piani:', savedPlans.length);
    if (savedPlans.length === 1) {
      handleStartPlan(savedPlans[0]);
    } else if (savedPlans.length >= 2) {
      setShowPlanModal(true);
    }
  };

  const planCountLabel = savedPlans.length === 1
    ? '1 piano attivo'
    : `${savedPlans.length} piani attivi`;

  // Azioni rapide aggiornate con Timer, Calendario e PrimeBot
  const actions: QuickAction[] = [
    {
      label: 'Timer',
      description: 'Timer per allenamenti',
      icon: Clock,
      color: 'bg-gradient-to-r from-[#c89116] to-black hover:from-black hover:to-[#c89116] border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: handleTimerClick,
      accessible: true,
      disabled: false,
    },
    {
      label: 'Calendario',
      description: 'Prenota appuntamenti',
      icon: Calendar,
      color: 'bg-gradient-to-r from-black to-[#c89116] hover:from-[#c89116] hover:to-black border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: handleScheduleClick,
      accessible: true,
      disabled: false,
    },
    {
      label: 'PrimeBot',
      description: 'AI Coach personale',
      icon: Bot,
      color: 'bg-gradient-to-r from-[#c89116] to-black hover:from-black hover:to-[#c89116] border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: handlePrimeBotClick,
      accessible: true,
      disabled: false,
    },
  ];

  const renderPlanCard = () => {
    const baseClasses = 'bg-gradient-to-r from-black to-[#c89116] hover:from-[#c89116] hover:to-black border-2 border-[#c89116] text-white h-auto p-2 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:scale-105 transition-all duration-200';

    if (isLoadingPlans) {
      return (
        <Button
          key="plan-loading"
          disabled
          className={`${baseClasses} opacity-50 cursor-wait`}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
          <div className="text-center">
            <p className="font-medium text-xs sm:text-sm">Caricamento...</p>
            <p className="text-xs opacity-90 hidden sm:block">Recupero piani</p>
          </div>
        </Button>
      );
    }

    return (
      <Button
        key="plan-card"
        onClick={handlePlanCardClick}
        className={baseClasses}
      >
        <Target className="h-4 w-4 sm:h-6 sm:w-6" />
        <div className="text-center">
          <p className="font-medium text-xs sm:text-sm">Piano Personalizzato</p>
          <p className="text-xs sm:text-sm text-white/80 mt-1">
            {planCountLabel}
          </p>
        </div>
      </Button>
    );
  };

  return (
    <>
      <div className="bg-gradient-to-br from-black to-[#c89116]/10 rounded-2xl p-3 sm:p-6 shadow-lg">

        <h3 className="text-base sm:text-lg font-semibold text-pp-gold mb-3 sm:mb-4">Azioni Rapide</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {renderPlanCard()}
          {actions.map((action) => {
            const Icon = action.icon;
            
            if (action.accessible) {
              return (
                <Button
                  key={action.label}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`${action.color} ${action.textColor} h-auto p-2 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:scale-105 transition-all duration-200`}
                >
                  <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                  <div className="text-center">
                    <p className="font-medium text-xs sm:text-sm">{action.label}</p>
                    <p className="text-xs opacity-90 hidden sm:block">{action.description}</p>
                  </div>
                </Button>
              );
            } else {
              return (
                <div key={action.label} className="relative">
                  <Button
                    disabled
                    className={`${action.color} ${action.textColor} h-auto p-2 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 opacity-50`}
                  >
                    <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                    <div className="text-center">
                      <p className="font-medium text-xs sm:text-sm">{action.label}</p>
                      <p className="text-xs opacity-90 hidden sm:block">{action.description}</p>
                    </div>
                  </Button>
                  
                  {/* Overlay individuale per azioni bloccate */}
                  <div className="absolute inset-0 bg-gray-600/40 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔒</div>
                      <p className="text-xs text-gray-200">Prossimamente</p>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Modal per nuovo obiettivo */}
      {isObjectiveModalOpen && (
        <NewObjectiveCard onClose={handleObjectiveModalClose} />
      )}

      {/* Modal Selezione Piani */}
      {showPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowPlanModal(false)}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-black border-2 border-[#EEBA2B] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Scegli il tuo piano</h2>
              <button
                onClick={() => setShowPlanModal(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              {savedPlans.map((plan) => {
                const Icon = getPlanIcon(plan.luogo);
                return (
                  <div
                    key={plan.id}
                    className="bg-gradient-to-br from-[#1a1a1a] to-black border-2 border-[#EEBA2B]/30 rounded-xl p-6 hover:border-[#EEBA2B] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-[#EEBA2B]/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[#EEBA2B]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.nome}</h3>
                        <p className="text-sm text-gray-400">{plan.obiettivo}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                      <span>💪 {plan.esercizi?.length || 0} esercizi</span>
                      <span>⏱️ ~{plan.durata} min</span>
                    </div>

                    <button
                      onClick={() => handleStartPlan(plan)}
                      className="w-full bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black font-bold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Inizia Allenamento
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowPlanModal(false)}
              className="w-full mt-6 border-2 border-white/20 text-white hover:bg-white/10 font-bold py-3 px-4 rounded-xl transition-colors duration-200"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickActions;
