import { useState } from 'react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { Clock } from 'lucide-react';
import type { WeeklyPlanDuration } from '@/types/plan';

const DURATIONS: Array<{
  value: WeeklyPlanDuration;
  label: string;
  description: string;
  recommended?: boolean;
}> = [
  {
    value: 4,
    label: '4 settimane',
    description: 'Ottimo per iniziare o provare',
  },
  {
    value: 8,
    label: '8 settimane',
    description: 'Bilanciato, risultati visibili',
    recommended: true,
  },
  {
    value: 12,
    label: '12 settimane',
    description: 'Trasformazione completa',
  },
];

export function WeeklyPlanStep3() {
  const { weeklyDuration, setWeeklyDuration, nextStep } = usePlanCreationStore();
  const [selectedValue, setSelectedValue] = useState<WeeklyPlanDuration | null>(null);

  const handleSelect = (duration: WeeklyPlanDuration) => {
    // 1. Mostra feedback visivo immediato
    setSelectedValue(duration);

    // 2. Salva nello store
    setWeeklyDuration(duration);

    // 3. Delay 600ms prima di cambiare step
    setTimeout(() => {
      nextStep();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Per quante settimane?
        </h2>
        <p className="text-gray-400 text-lg">
          Scegli la durata del tuo piano di allenamento
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {DURATIONS.map((duration) => {
          const isSelected = weeklyDuration === duration.value;
          const isJustSelected = selectedValue === duration.value;

          return (
            <button
              key={duration.value}
              onClick={() => handleSelect(duration.value)}
              className={`
                p-6 rounded-xl text-center
                border-2 transition-all duration-300
                relative
                hover:scale-105
                ${isSelected || isJustSelected
                  ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 shadow-lg shadow-[#EEBA2B]/20 scale-105'
                  : 'border-white/10 hover:border-[#EEBA2B]/50 bg-black/30'
                }
              `}
            >
              {duration.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#EEBA2B] text-black text-xs px-3 py-1 rounded-full font-bold">
                    Consigliato
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                <div
                  className={`
                  p-3 rounded-lg
                  ${isSelected ? 'bg-[#EEBA2B]' : 'bg-white/10'}
                `}
                >
                  <Clock
                    className={`
                    h-10 w-10
                    ${isSelected ? 'text-black' : 'text-[#EEBA2B]'}
                  `}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-2xl text-white mb-2">
                    {duration.label}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {duration.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

