import { useState } from 'react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { Clock, Zap, Timer } from 'lucide-react';
import type { DailyPlanDuration } from '@/types/plan';

const DURATIONS: Array<{
  value: DailyPlanDuration;
  label: string;
  icon: typeof Clock;
  description: string;
  minutes: number;
}> = [
  {
    value: '15-20',
    label: '15-20 minuti',
    icon: Zap,
    description: 'Workout veloce e intenso',
    minutes: 20,
  },
  {
    value: '30-45',
    label: '30-45 minuti',
    icon: Clock,
    description: 'Durata ottimale per risultati',
    minutes: 45,
  },
  {
    value: '60+',
    label: '60+ minuti',
    icon: Timer,
    description: 'Sessione completa e dettagliata',
    minutes: 60,
  },
];

export function DailyPlanStep2() {
  const { dailyDuration, setDailyDuration, nextStep } = usePlanCreationStore();
  const [selectedValue, setSelectedValue] = useState<DailyPlanDuration | null>(null);

  const handleSelect = (duration: DailyPlanDuration) => {
    // 1. Mostra feedback visivo immediato
    setSelectedValue(duration);

    // 2. Salva nello store
    setDailyDuration(duration);

    // 3. Delay 600ms prima di cambiare step
    setTimeout(() => {
      nextStep();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Quanto tempo hai oggi?
        </h2>
        <p className="text-gray-400 text-lg">
          Scegli la durata del tuo workout
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {DURATIONS.map((duration) => {
          const Icon = duration.icon;
          const isSelected = dailyDuration === duration.value;
          const isJustSelected = selectedValue === duration.value;

          return (
            <button
              key={duration.value}
              onClick={() => handleSelect(duration.value)}
              className={`
                p-6 rounded-xl text-left
                border-2 transition-all duration-300
                hover:scale-105
                flex flex-col items-center text-center
                ${isSelected || isJustSelected
                  ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 shadow-lg shadow-[#EEBA2B]/20 scale-105'
                  : 'border-white/10 hover:border-[#EEBA2B]/50 bg-black/30'
                }
              `}
            >
              <div
                className={`
                  p-4 rounded-lg mb-4
                  ${isSelected ? 'bg-[#EEBA2B]' : 'bg-white/10'}
              `}
              >
                <Icon
                  className={`
                  h-8 w-8
                  ${isSelected ? 'text-black' : 'text-white'}
                `}
                />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">
                {duration.label}
              </h3>
              <p className="text-sm text-gray-400">
                {duration.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

