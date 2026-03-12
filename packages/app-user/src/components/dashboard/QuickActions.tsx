import { Calendar, Clock, Bot, Home, Dumbbell, TreePine, Target, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NewObjectiveCard } from '@/components/profile/NewObjectiveCard';
import { countUserPlans, fetchUserPlans } from '@/services/planService';
import { toast } from 'sonner';

type QuickAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string; // hex per icon box
  textColor: string;
  onClick: () => void;
  accessible: boolean;
  disabled?: boolean;
};

type SavedPlan = {
  id: string;
  nome: string | null;
  tipo: string | null;
  luogo: string | null;
  obiettivo: string | null;
  durata: number | null;
  esercizi: unknown;
  is_active: boolean | null;
  saved_for_later: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type CustomExercisePayload = {
  name: string;
  duration?: number | string;
  rest?: number | string;
  sets?: number | string;
  instructions?: string;
  muscleGroup?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pickString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const pickNumberOrString = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  return undefined;
};

const QuickActions = () => {
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSavedPlans = async () => {
      try {
        setIsLoadingPlans(true);

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
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

        if (error || !data) {
          console.error('Errore caricamento piani:', error);
          setSavedPlans([]);
        } else {
          setSavedPlans(data);
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

  const getPlanIcon = (luogo?: string | null) => {
    const normalized = luogo?.toLowerCase?.() ?? '';
    if (normalized.includes('casa') || normalized.includes('home')) return Home;
    if (normalized.includes('palestra') || normalized.includes('gym')) return Dumbbell;
    if (normalized.includes('outdoor') || normalized.includes('aperto')) return TreePine;
    return Dumbbell;
  };

  const toCustomExercisePayload = (exercise: unknown, fallbackName: string, muscleGroup: string | null): CustomExercisePayload => {
    if (!isRecord(exercise)) {
      return {
        name: fallbackName,
        muscleGroup,
      };
    }

    const name =
      pickString(exercise.nome) ??
      pickString(exercise.name) ??
      fallbackName;

    const duration =
      pickNumberOrString(exercise.ripetizioni) ??
      pickNumberOrString(exercise.duration);

    const rest =
      pickNumberOrString(exercise.riposo) ??
      pickNumberOrString(exercise.rest);

    const sets =
      pickNumberOrString(exercise.serie) ??
      pickNumberOrString(exercise.sets);

    const instructions =
      pickString(exercise.note) ??
      pickString(exercise.instructions);

    return {
      name,
      duration,
      rest,
      sets,
      instructions,
      muscleGroup,
    };
  };

  const handleStartPlan = (plan: SavedPlan) => {
    setShowPlanModal(false);

    const exercises = Array.isArray(plan.esercizi) ? plan.esercizi : [];
    const exercisesFormatted: CustomExercisePayload[] = exercises.map((exercise) =>
      toCustomExercisePayload(exercise, plan.nome ?? 'Esercizio personalizzato', plan.obiettivo)
    );

    navigate('/workouts', {
      state: {
        startCustomWorkout: 'personalized',
        customExercises: exercisesFormatted,
        workoutTitle: plan.nome,
        workoutType: plan.tipo,
        duration: plan.durata,
      },
    });
  };

  const handlePlanCardClick = async () => {
    navigate('/i-miei-piani');
  };

  const planCountLabel =
    savedPlans.length === 1 ? '1 piano attivo' : `${savedPlans.length} piani attivi`;

  // Azioni rapide aggiornate con Timer, Calendario e PrimeBot
  const actions: QuickAction[] = [
    {
      label: 'Timer',
      description: 'Timer per allenamenti',
      icon: Clock,
      color: '#3B82F6',
      textColor: 'text-white',
      onClick: handleTimerClick,
      accessible: true,
      disabled: false,
    },
    {
      label: 'Calendario',
      description: 'Prenota appuntamenti',
      icon: Calendar,
      color: '#3B82F6',
      textColor: 'text-white',
      onClick: handleScheduleClick,
      accessible: true,
      disabled: false,
    },
    {
      label: 'PrimeBot',
      description: 'AI Coach personale',
      icon: Bot,
      color: '#10B981',
      textColor: 'text-white',
      onClick: handlePrimeBotClick,
      accessible: true,
      disabled: false,
    },
  ];

  const quickCardBase = 'bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[14px] py-4 px-3 flex flex-col items-center gap-2 w-full min-w-0 overflow-hidden transition-opacity hover:opacity-90 active:opacity-80';
  const iconBoxBase = 'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0';

  const renderPlanCard = () => {
    const iconColor = '#EEBA2B';
    const iconBg = 'rgba(238,186,43,0.08)';

    if (isLoadingPlans) {
      return (
        <div key="plan-loading" className={`${quickCardBase} opacity-60 cursor-wait`}>
          <div className={iconBoxBase} style={{ background: iconBg }}>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#EEBA2B]/30 border-t-[#EEBA2B]" />
          </div>
          <p className="text-[9px] font-semibold text-[#8A8A96] uppercase tracking-[0.3px] text-center truncate w-full min-w-0">Caricamento...</p>
        </div>
      );
    }

    return (
      <Button
        key="plan-card"
        onClick={handlePlanCardClick}
        variant="ghost"
        className={`${quickCardBase} h-auto min-h-0`}
      >
        <div className={iconBoxBase} style={{ background: iconBg }}>
          <Target className="w-5 h-5 shrink-0" style={{ color: iconColor }} />
        </div>
        <div className="text-center w-full min-w-0">
          <p className="text-[9px] font-semibold text-[#8A8A96] uppercase tracking-[0.3px] truncate w-full">I miei piani</p>
          <p className="text-[9px] text-[#8A8A96]/80 mt-0.5 truncate w-full">{planCountLabel}</p>
        </div>
      </Button>
    );
  };

  const getIconBgRgba = (hex: string) => {
    if (hex === '#3B82F6') return 'rgba(59,130,246,0.1)';
    if (hex === '#10B981') return 'rgba(16,185,129,0.1)';
    return 'rgba(238,186,43,0.08)';
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {renderPlanCard()}
        {actions.map((action) => {
          const Icon = action.icon;
          const iconBgRgba = getIconBgRgba(action.color);
          
          if (action.accessible) {
            return (
              <Button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                variant="ghost"
                className={`${quickCardBase} h-auto min-h-0`}
              >
                <div className={iconBoxBase} style={{ background: iconBgRgba }}>
                  <Icon className="w-5 h-5 shrink-0" style={{ color: action.color }} />
                </div>
                <p className="text-[9px] font-semibold text-[#8A8A96] uppercase tracking-[0.3px] text-center truncate w-full min-w-0">{action.label}</p>
              </Button>
            );
          } else {
            return (
              <div key={action.label} className="relative min-w-0">
                <div className={`${quickCardBase} opacity-50 pointer-events-none`}>
                  <div className={iconBoxBase} style={{ background: iconBgRgba }}>
                    <Icon className="w-5 h-5 shrink-0" style={{ color: action.color }} />
                  </div>
                  <p className="text-[9px] font-semibold text-[#8A8A96] uppercase tracking-[0.3px] text-center truncate w-full min-w-0">{action.label}</p>
                </div>
                <div className="absolute inset-0 bg-gray-600/40 backdrop-blur-sm rounded-[14px] z-10 flex items-center justify-center">
                  <p className="text-[9px] text-gray-200">Prossimamente</p>
                </div>
              </div>
            );
          }
        })}
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
                const exerciseCount = Array.isArray(plan.esercizi) ? plan.esercizi.length : 0;
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
                      <span>💪 {exerciseCount} esercizi</span>
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
