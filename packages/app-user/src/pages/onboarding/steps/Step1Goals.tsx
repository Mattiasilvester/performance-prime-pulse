/* eslint-disable @typescript-eslint/no-explicit-any -- tipi store onboarding */
import { useEffect, useRef, useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { 
  Dumbbell, 
  Flame, 
  Zap, 
  Target,
  CheckCircle
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';

interface Goal {
  id: 'massa' | 'dimagrire' | 'resistenza' | 'tonificare';
  icon: any;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
}

const goals: Goal[] = [
  {
    id: 'massa',
    icon: Dumbbell,
    title: 'Aumentare massa muscolare',
    description: 'Costruisci muscoli definiti e aumenta la tua forza',
    benefits: ['Muscoli più grandi', 'Forza incrementata', 'Metabolismo accelerato'],
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'dimagrire',
    icon: Flame,
    title: 'Dimagrire e definirmi',
    description: 'Perdi peso in modo sano e scolpisci il tuo fisico',
    benefits: ['Perdita di grasso', 'Definizione muscolare', 'Energia aumentata'],
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    gradient: 'from-red-500 to-orange-500'
  },
  {
    id: 'resistenza',
    icon: Zap,
    title: 'Migliorare resistenza',
    description: 'Aumenta energia e performance cardiovascolare',
    benefits: ['Più fiato', 'Recupero veloce', 'Cuore più sano'],
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    gradient: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'tonificare',
    icon: Target,
    title: 'Tonificare il corpo',
    description: 'Rassoda e definisci la tua silhouette',
    benefits: ['Corpo tonico', 'Postura migliorata', 'Agilità aumentata'],
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    gradient: 'from-green-500 to-teal-500'
  }
];

interface Step1GoalsProps {
  isEditMode?: boolean;
}

export function Step1Goals({ isEditMode = false }: Step1GoalsProps) {
  const { data, updateData } = useOnboardingStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(data.obiettivo || null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { saveAndContinue, trackStepStarted } = useOnboardingNavigation(isEditMode);
  const isMountedRef = useRef(true);
  // ✅ FIX CRITICO: Ref per prevenire loop infinito - traccia se trackStepStarted è già stato chiamato
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // ✅ FIX: Non trackare in edit mode e solo UNA VOLTA
    if (!isEditMode && !hasTrackedRef.current) {
      trackStepStarted(1);
      hasTrackedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]); // ✅ RIMOSSO trackStepStarted dalle dipendenze per evitare loop

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSelectGoal = async (goalId: Goal['id']) => {
    if (isTransitioning) return;
    
    setSelectedGoal(goalId);
    setIsTransitioning(true);

    // Haptic feedback se disponibile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Track selection
    trackOnboarding.stepCompleted(1, { obiettivo: goalId });

    // Aggiorna lo store immediatamente
    updateData({ obiettivo: goalId });

    // Breve delay per permettere alle animazioni di completarsi
    await new Promise((resolve) => setTimeout(resolve, 300));

    await saveAndContinue(1, { obiettivo: goalId });

    if (isMountedRef.current) {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-slide-up" style={{ animationDelay: '0.05s' }}>
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="text-5xl mb-4 animate-scale-in" style={{ animationDelay: '0.15s' }}>
          🎯
        </div>
        
        <h2
          className="text-3xl md:text-4xl font-bold text-white mb-3 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          Ciao! Sono PrimeBot 🤖
        </h2>
        
        <p
          className="text-lg text-gray-400 animate-slide-up"
          style={{ animationDelay: '0.25s' }}
        >
          Qual è il tuo obiettivo principale?
        </p>
        
        <p
          className="text-sm text-gray-500 mt-2 animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          Non preoccuparti, potrai sempre modificarlo in seguito
        </p>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;
          
          return (
            <button
              key={goal.id}
              onClick={() => handleSelectGoal(goal.id)}
              disabled={isTransitioning && !isSelected}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300
                text-left group cursor-pointer
                ${isSelected 
                  ? `${goal.bgColor} ${goal.borderColor} border-2 shadow-lg`
                  : 'bg-white/5 border-white/10 hover:border-white/20 backdrop-blur-sm'}
                ${isTransitioning && !isSelected ? 'opacity-50' : ''}
              `}
            >
              {/* Icon */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`
                    p-3 rounded-xl transition-colors ${isSelected ? 'animate-spin-once' : ''}
                    ${isSelected 
                      ? `bg-gradient-to-br ${goal.gradient}` 
                      : goal.bgColor}
                  `}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : goal.color}`} />
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 animate-scale-in">
                    <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-5 h-5 text-black" />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {goal.title}
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  {goal.description}
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap gap-2">
                  {goal.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className={`
                        text-xs px-2 py-1 rounded-full transition-all
                        ${isSelected 
                          ? 'bg-white/20 text-white animate-fade-in' 
                          : 'bg-white/5 text-gray-500'}
                      `}
                      style={
                        isSelected
                          ? { animationDelay: `${index * 0.1}s` }
                          : undefined
                      }
                      data-animated={isSelected}
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hover effect gradient */}
              {!isSelected && (
                <div className={`
                  absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none
                  bg-gradient-to-r ${goal.gradient}
                `} />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <p className="text-sm text-gray-500">
          Seleziona un obiettivo per continuare →
        </p>
      </div>
    </div>
  );
}



