/* eslint-disable @typescript-eslint/no-explicit-any -- tipi store onboarding */
import { useEffect, useRef, useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { motion } from 'framer-motion';
import { Bot, Flame, Timer, Zap, Heart, Check } from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';

interface Goal {
  id: 'massa' | 'dimagrire' | 'resistenza' | 'tonificare';
  icon: any;
  title: string;
  description: string;
  tags: string[];
  pillBg: string;
  iconColor: string;
}

const goals: Goal[] = [
  {
    id: 'massa',
    icon: Flame,
    title: 'Aumentare massa muscolare',
    description: 'Costruisci muscoli definiti e aumenta la tua forza',
    tags: ['Forza', 'Ipertrofia'],
    pillBg: 'rgba(59,130,246,0.1)',
    iconColor: '#3B82F6',
  },
  {
    id: 'dimagrire',
    icon: Timer,
    title: 'Dimagrire e definirmi',
    description: 'Perdi peso in modo sano e scolpisci il tuo fisico',
    tags: ['Fat loss', 'Definizione'],
    pillBg: 'rgba(239,68,68,0.1)',
    iconColor: '#EF4444',
  },
  {
    id: 'resistenza',
    icon: Zap,
    title: 'Migliorare resistenza',
    description: 'Aumenta energia e performance cardiovascolare',
    tags: ['Cardio', 'Endurance'],
    pillBg: 'rgba(238,186,43,0.08)',
    iconColor: '#EEBA2B',
  },
  {
    id: 'tonificare',
    icon: Heart,
    title: 'Tonificare il corpo',
    description: 'Rassoda e definisci la tua silhouette',
    tags: ['Tonicità', 'Postura'],
    pillBg: 'rgba(16,185,129,0.1)',
    iconColor: '#10B981',
  },
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

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    trackOnboarding.stepCompleted(1, { obiettivo: goalId });

    updateData({ obiettivo: goalId });

    await new Promise((resolve) => setTimeout(resolve, 300));

    await saveAndContinue(1, { obiettivo: goalId });

    if (isMountedRef.current) {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4">
      {/* Header — box icona gold + titolo + sottotitolo */}
      <div className="text-center mb-8">
        <div
          className="w-[72px] h-[72px] rounded-[20px] bg-[rgba(238,186,43,0.08)] border border-[rgba(238,186,43,0.2)] flex items-center justify-center mx-auto mb-[18px]"
        >
          <Bot size={32} color="#EEBA2B" />
        </div>
        <h1 className="text-[clamp(24px,5vw,34px)] font-extrabold leading-[1.15] tracking-[-0.5px] text-[#F0EDE8] mb-[10px]">
          Ciao! Sono PrimeBot
        </h1>
        <p className="text-[15px] text-[#F0EDE8]/50">
          Qual è il tuo obiettivo principale?
        </p>
        <p className="text-[13px] text-[#F0EDE8]/30 mt-[6px]">
          Non preoccuparti, potrai sempre modificarlo in seguito
        </p>
      </div>

      {/* Goals Grid — 2 colonne, gap 14px */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;

          return (
            <motion.div
              key={goal.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectGoal(goal.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectGoal(goal.id);
                }
              }}
              whileHover={isSelected ? {} : { y: -3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
              className={`
                bg-[#16161A] border-[1.5px] rounded-[14px] p-5 cursor-pointer
                transition-all duration-[220ms] relative overflow-hidden
                ${isSelected
                  ? 'border-[#EEBA2B] shadow-[0_0_0_1px_#EEBA2B,0_8px_32px_rgba(238,186,43,0.12)]'
                  : 'border-white/[0.07] hover:border-white/[0.14]'
                }
                ${isTransitioning && !isSelected ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-[rgba(238,186,43,0.08)] pointer-events-none" />
              )}
              {isSelected && (
                <div
                  className="absolute top-3 right-3 w-[22px] h-[22px] rounded-full bg-[#EEBA2B] flex items-center justify-center z-10"
                >
                  <Check size={12} strokeWidth={2.5} color="#000" />
                </div>
              )}
              <div
                className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center mb-[14px] relative z-10"
                style={{ backgroundColor: goal.pillBg }}
              >
                <Icon size={22} color={goal.iconColor} />
              </div>
              <p className="text-[15px] font-bold mb-[6px] relative z-10 text-[#F0EDE8]">
                {goal.title}
              </p>
              <p className="text-[13px] text-[#F0EDE8]/50 leading-[1.5] relative z-10">
                {goal.description}
              </p>
              <div className="flex flex-wrap gap-[6px] mt-3 relative z-10">
                {goal.tags.map((t) => (
                  <span
                    key={t}
                    className={`px-[9px] py-[3px] rounded-full border text-[11px] font-medium ${
                      isSelected
                        ? 'border-[rgba(238,186,43,0.3)] text-[rgba(238,186,43,0.8)]'
                        : 'border-white/[0.07] text-[#F0EDE8]/50'
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {!selectedGoal && (
        <p className="text-center text-[13px] text-[#F0EDE8]/30 mt-[14px]">
          Seleziona un obiettivo per continuare →
        </p>
      )}
    </div>
  );
}
