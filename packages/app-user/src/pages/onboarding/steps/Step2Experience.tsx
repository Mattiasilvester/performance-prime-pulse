/* eslint-disable @typescript-eslint/no-explicit-any -- tipi store onboarding */
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { OnboardingData } from '@/stores/onboardingStore';
import { trackOnboarding } from '@/services/analytics';
import { Slider } from '@/components/ui/slider';
import { 
  Sparkles,
  TrendingUp,
  Trophy,
  Calendar,
  Info,
  ArrowRight
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
  description: string;
  timeRange: string;
  characteristics: string[];
  recommendedDays: { min: number; max: number };
  gradient: string;
}

const experienceLevels: ExperienceLevel[] = [
  {
    id: 'principiante',
    icon: Sparkles,
    title: 'Principiante',
    description: 'Sto iniziando ora o riprendo dopo una pausa',
    timeRange: '0-6 mesi di esperienza',
    characteristics: [
      'Mai allenato o lunga pausa',
      'Voglio imparare le basi',
      'Preferisco iniziare gradualmente'
    ],
    recommendedDays: { min: 2, max: 3 },
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 'intermedio',
    icon: TrendingUp,
    title: 'Intermedio',
    description: 'Mi alleno con una certa regolarità',
    timeRange: '6 mesi - 2 anni di esperienza',
    characteristics: [
      'Conosco gli esercizi base',
      'Alleno 2-4 volte a settimana',
      'Voglio migliorare la tecnica'
    ],
    recommendedDays: { min: 3, max: 4 },
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'avanzato',
    icon: Trophy,
    title: 'Avanzato',
    description: 'Mi alleno da anni con costanza',
    timeRange: '2+ anni di esperienza',
    characteristics: [
      'Tecnica consolidata',
      'Alleno 4-6 volte a settimana',
      'Cerco stimoli avanzati'
    ],
    recommendedDays: { min: 4, max: 6 },
    gradient: 'from-purple-500 to-pink-500'
  }
];

const dayMessages = [
  { days: 1, message: "Un giorno è meglio di zero! 💪", color: 'text-yellow-500' },
  { days: 2, message: "Ottimo per iniziare! 🌱", color: 'text-green-500' },
  { days: 3, message: "Perfetto equilibrio! ⚖️", color: 'text-blue-500' },
  { days: 4, message: "Sei motivato! 🔥", color: 'text-orange-500' },
  { days: 5, message: "Atleta dedicato! 🎯", color: 'text-purple-500' },
  { days: 6, message: "Quasi tutti i giorni! 💎", color: 'text-pink-500' },
  { days: 7, message: "Campione assoluto! 🏆", color: 'text-[#FFD700]' }
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

    useEffect(() => {
      // ✅ FIX: Non trackare in edit mode (temporaneo per debug)
      if (!isEditMode) {
        trackStepStarted(2);
      }
    }, [trackStepStarted, isEditMode]);

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

    const getCurrentMessage = () => {
      return dayMessages.find(m => m.days === daysPerWeek) || dayMessages[2];
    };

    return (
      <div className="max-w-4xl mx-auto w-full animate-slide-up" style={{ animationDelay: '0.05s' }}>
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="text-5xl mb-4 animate-scale-in" style={{ animationDelay: '0.15s' }}>
            💪
          </div>
          
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-3 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            Qual è il tuo livello di esperienza?
          </h2>
          
          <p
            className="text-lg text-gray-400 animate-slide-up"
            style={{ animationDelay: '0.25s' }}
          >
            Questo mi aiuta a calibrare l'intensità degli allenamenti
          </p>
        </div>

        {/* Experience Level Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          {experienceLevels.map((level, index) => {
            const Icon = level.icon;
            const isSelected = selectedLevel === level.id;
            
            return (
              <button
                key={level.id}
                onClick={() => handleSelectLevel(level.id)}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300 transform
                  text-left group
                  ${isSelected 
                    ? 'bg-white/10 border-[#FFD700]/50 shadow-lg' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'}
                `}
              >
                {/* Icon and Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`
                    p-3 rounded-xl transition-all
                    ${isSelected 
                      ? `bg-gradient-to-br ${level.gradient}` 
                      : 'bg-white/10'}
                  `}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {level.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {level.timeRange}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-3">
                  {level.description}
                </p>

                {/* Characteristics */}
                <div className="space-y-1">
                  {level.characteristics.map((char, i) => (
                    <div 
                      key={i}
                      className={`
                        text-xs flex items-start gap-1 transition-all
                        ${isSelected ? 'text-white' : 'text-gray-500'}
                      `}
                    >
                      <span className={isSelected ? 'text-[#FFD700]' : ''}>•</span>
                      <span>{char}</span>
                    </div>
                  ))}
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-[#FFD700] rounded-full flex items-center justify-center animate-scale-in">
                    <span className="text-black text-sm">✓</span>
                  </div>
                )}

                {/* Recommended badge */}
                {isSelected && (
                  <div
                    className="mt-3 text-xs text-[#FFD700] animate-slide-up"
                    style={{ animationDelay: '0.1s' }}
                  >
                    Consigliati: {level.recommendedDays.min}-{level.recommendedDays.max} giorni/settimana
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Days per Week Slider */}
        {selectedLevel && (
          <div
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 animate-slide-up"
            style={{ animationDelay: '0.35s' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-lg font-bold text-white">
                Quanti giorni a settimana vuoi allenarti?
              </h3>
            </div>

            {/* Days Display */}
            <div className="text-center mb-4">
              <div
                key={daysPerWeek}
                className="inline-block animate-scale-in"
              >
                <span className="text-5xl font-bold text-[#FFD700]">
                  {daysPerWeek}
                </span>
                <span className="text-2xl text-white ml-2">
                  {daysPerWeek === 1 ? 'giorno' : 'giorni'}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="px-4">
              <Slider
                value={[daysPerWeek]}
                onValueChange={(value) => setDaysPerWeek(value[0])}
                min={1}
                max={7}
                step={1}
                className="mb-4"
              />
              
              {/* Day markers */}
              <div className="flex justify-between text-xs text-gray-500">
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <span 
                    key={day}
                    className={daysPerWeek === day ? 'text-[#FFD700] font-bold' : ''}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>

            {/* Message */}
            <div
              key={daysPerWeek}
              className={`text-center mt-4 font-medium animate-fade-in ${getCurrentMessage().color}`}
              style={{ animationDelay: '0.4s' }}
            >
              {getCurrentMessage().message}
            </div>

            {/* Info box */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                <p className="text-xs text-gray-300">
                  Non preoccuparti se non riesci sempre a rispettare i giorni prefissati. 
                  Il piano si adatterà automaticamente ai tuoi impegni!
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }
);

Step2Experience.displayName = 'Step2Experience';

export default Step2Experience;


