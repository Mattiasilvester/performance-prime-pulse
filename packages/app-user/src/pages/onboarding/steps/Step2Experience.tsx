/* eslint-disable @typescript-eslint/no-explicit-any -- tipi store onboarding */
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { OnboardingData } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import {
  Activity,
  Star,
  TrendingUp,
  Trophy,
  Calendar,
  Info,
  Check,
} from 'lucide-react';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';

export interface Step2ExperienceHandle {
  handleContinue: () => void;
}

interface Step2ExperienceProps {
  onComplete: () => void;
  isEditMode?: boolean;
}

interface ExperienceLevel {
  id: 'principiante' | 'intermedio' | 'avanzato';
  icon: any;
  title: string;
  subtitle: string;
  description: string;
  iconBg: string;
  iconColor: string;
  recommendedDays: { min: number; max: number };
}

const experienceLevels: ExperienceLevel[] = [
  {
    id: 'principiante',
    icon: Star,
    title: 'Principiante',
    subtitle: '0–6 mesi',
    description: 'Sto iniziando o riprendendo dopo una pausa',
    iconBg: 'rgba(255,255,255,0.06)',
    iconColor: '#F0EDE8',
    recommendedDays: { min: 2, max: 3 },
  },
  {
    id: 'intermedio',
    icon: TrendingUp,
    title: 'Intermedio',
    subtitle: '6 mesi–2 anni',
    description: 'Mi alleno con una certa regolarità',
    iconBg: 'rgba(59,130,246,0.1)',
    iconColor: '#3B82F6',
    recommendedDays: { min: 3, max: 4 },
  },
  {
    id: 'avanzato',
    icon: Trophy,
    title: 'Avanzato',
    subtitle: '2+ anni',
    description: 'Mi alleno con costanza da tempo',
    iconBg: 'rgba(238,186,43,0.08)',
    iconColor: '#EEBA2B',
    recommendedDays: { min: 4, max: 6 },
  },
];

const Step2Experience = forwardRef<Step2ExperienceHandle, Step2ExperienceProps>(
  ({ onComplete, isEditMode = false }, ref) => {
    const { data, updateData } = useOnboardingStore();
    const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel['id'] | null>(
      data.livelloEsperienza || null
    );
    const [daysPerWeek, setDaysPerWeek] = useState<number>(
      data.giorniSettimana || 3
    );
    const [canProceed, setCanProceed] = useState(false);
    const { saveAndContinue, trackStepStarted } = useOnboardingNavigation(isEditMode);
    const hasTrackedRef = useRef(false);

    useEffect(() => {
      if (!isEditMode && !hasTrackedRef.current) {
        trackStepStarted(2);
        hasTrackedRef.current = true;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode]);

    useEffect(() => {
      setCanProceed(!!selectedLevel);
    }, [selectedLevel]);

    const handleSelectLevel = (levelId: ExperienceLevel['id']) => {
      setSelectedLevel(levelId);
      
      // Auto-adjust days based on level recommendation
      const level = experienceLevels.find(l => l.id === levelId);
      if (level) {
        const recommendedDays = Math.floor(
          (level.recommendedDays.min + level.recommendedDays.max) / 2
        );
        setDaysPerWeek(recommendedDays);
      }

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    };

    useImperativeHandle(ref, () => ({
      handleContinue: () => {
        if (!canProceed) {
          console.log('⚠️ Step 2: validazione non passata');
          return;
        }

        console.log('✅ Step 2: validazione OK, procedo');

        const payload: Partial<OnboardingData> = {
          livelloEsperienza: selectedLevel ?? undefined,
          giorniSettimana: daysPerWeek
        };

        updateData(payload);

        saveAndContinue(2, payload);

        trackOnboarding.stepCompleted(2, payload);

        onComplete();
      }
    }));

    return (
      <div className="max-w-3xl mx-auto w-full px-4">
        {/* Header — box icona gold + titolo + sottotitolo */}
        <div className="text-center mb-8">
          <div
            className="w-[72px] h-[72px] rounded-[20px] bg-[rgba(238,186,43,0.08)] border border-[rgba(238,186,43,0.2)] flex items-center justify-center mx-auto mb-[18px]"
          >
            <Activity size={32} color="#EEBA2B" />
          </div>
          <h1 className="text-[clamp(24px,5vw,34px)] font-extrabold text-[#F0EDE8] text-center leading-[1.15] tracking-[-0.5px] mb-[10px]">
            Qual è il tuo livello di esperienza?
          </h1>
          <p className="text-[15px] text-[#F0EDE8]/50 text-center">
            Questo mi aiuta a calibrare l'intensità degli allenamenti
          </p>
        </div>

        {/* 3 card livello — griglia 3 colonne */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
          {experienceLevels.map((level) => {
            const Icon = level.icon;
            const isSelected = selectedLevel === level.id;

            return (
              <motion.div
                key={level.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectLevel(level.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectLevel(level.id);
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
                  style={{ backgroundColor: level.iconBg }}
                >
                  <Icon size={22} color={level.iconColor} />
                </div>
                <p className="text-[15px] font-bold mb-[4px] relative z-10 text-[#F0EDE8]">
                  {level.title}
                </p>
                <p className="text-[13px] text-[#F0EDE8]/50 mb-[8px] relative z-10">
                  {level.subtitle}
                </p>
                <p className="text-[13px] text-[#F0EDE8]/50 leading-[1.5] relative z-10">
                  {level.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Sezione slider giorni — visibile solo se selectedLevel */}
        {selectedLevel && (
          <div className="bg-[#16161A] border border-white/[0.07] rounded-[14px] p-6 mt-[14px]">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(238,186,43,0.08)] flex items-center justify-center"
              >
                <Calendar size={18} color="#EEBA2B" />
              </div>
              <p className="text-[15px] font-semibold text-[#F0EDE8]">
                Quanti giorni a settimana vuoi allenarti?
              </p>
            </div>

            <div className="text-center mb-4">
              <span className="text-[56px] font-extrabold text-[#EEBA2B] leading-none">
                {daysPerWeek}
              </span>
              <span className="text-[20px] text-[#F0EDE8]/50 ml-2">
                {daysPerWeek === 1 ? 'giorno' : 'giorni'}
              </span>
            </div>

            <div className="px-2 [&_[role=slider]]:!hidden">
              <Slider
                value={[daysPerWeek]}
                onValueChange={(v) => setDaysPerWeek(v[0])}
                min={1}
                max={7}
                step={1}
              />
            </div>

            <div className="flex justify-between mt-3 px-1">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => {
                const isSelected = daysPerWeek === n;
                return (
                  <motion.button
                    key={n}
                    type="button"
                    onClick={() => setDaysPerWeek(n)}
                    whileHover={isSelected ? {} : { scale: 1.08, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                    className={`w-[32px] h-[32px] rounded-full text-[13px] font-bold transition-all
                      ${isSelected
                        ? 'bg-[#EEBA2B] text-black shadow-[0_0_12px_rgba(238,186,43,0.4)]'
                        : 'bg-white/[0.06] text-[#F0EDE8]/50 hover:bg-white/[0.12]'
                      }`}
                  >
                    {n}
                  </motion.button>
                );
              })}
            </div>

            {(() => {
              const info: Record<number, { color: string; bg: string; border: string; text: string }> = {
                1: {
                  color: '#3B82F6',
                  bg: 'rgba(59,130,246,0.08)',
                  border: 'rgba(59,130,246,0.2)',
                  text: 'Un punto di partenza — anche poco conta!',
                },
                2: {
                  color: '#10B981',
                  bg: 'rgba(16,185,129,0.08)',
                  border: 'rgba(16,185,129,0.2)',
                  text: 'Ottimo per iniziare con recupero adeguato',
                },
                3: {
                  color: '#10B981',
                  bg: 'rgba(16,185,129,0.08)',
                  border: 'rgba(16,185,129,0.2)',
                  text: 'Il classico dei principianti, funziona bene',
                },
                4: {
                  color: '#EEBA2B',
                  bg: 'rgba(238,186,43,0.08)',
                  border: 'rgba(238,186,43,0.2)',
                  text: 'Ottimo equilibrio tra recupero e progressi',
                },
                5: {
                  color: '#EEBA2B',
                  bg: 'rgba(238,186,43,0.08)',
                  border: 'rgba(238,186,43,0.2)',
                  text: 'Atleta dedicato! Alta frequenza',
                },
                6: {
                  color: '#EEBA2B',
                  bg: 'rgba(238,186,43,0.08)',
                  border: 'rgba(238,186,43,0.2)',
                  text: 'Intensità massima — assicurati di recuperare',
                },
                7: {
                  color: '#EEBA2B',
                  bg: 'rgba(238,186,43,0.08)',
                  border: 'rgba(238,186,43,0.2)',
                  text: 'Ogni giorno! Pianifica bene il recupero attivo',
                },
              };
              const i = info[daysPerWeek];
              return (
                <div
                  className="mt-4 rounded-[10px] px-4 py-3 flex items-center gap-3 border"
                  style={{ backgroundColor: i.bg, borderColor: i.border }}
                >
                  <Info size={16} style={{ color: i.color, flexShrink: 0 }} />
                  <p className="text-[13px] font-medium" style={{ color: i.color }}>
                    {i.text}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }
);

Step2Experience.displayName = 'Step2Experience';

export default Step2Experience;


