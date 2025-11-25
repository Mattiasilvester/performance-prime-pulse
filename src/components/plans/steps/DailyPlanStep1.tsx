import { useState } from 'react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { Heart, Dumbbell, User, Activity, Zap } from 'lucide-react';
import type { DailyPlanGoal } from '@/types/plan';

const GOALS: Array<{
  value: DailyPlanGoal;
  label: string;
  icon: typeof Heart;
  description: string;
}> = [
  {
    value: 'Full Body',
    label: 'Full Body',
    icon: User,
    description: 'Allena tutto il corpo',
  },
  {
    value: 'Upper Body',
    label: 'Upper Body',
    icon: Dumbbell,
    description: 'Petto, schiena, spalle, braccia',
  },
  {
    value: 'Lower Body',
    label: 'Lower Body',
    icon: Activity,
    description: 'Gambe, glutei, polpacci',
  },
  {
    value: 'Core',
    label: 'Core',
    icon: Zap,
    description: 'Addominali e stabilità',
  },
  {
    value: 'Cardio',
    label: 'Cardio',
    icon: Heart,
    description: 'Resistenza e brucia calorie',
  },
];

export function DailyPlanStep1() {
  const { dailyGoal, setDailyGoal, nextStep } = usePlanCreationStore();
  const [selectedValue, setSelectedValue] = useState<DailyPlanGoal | null>(null);

  const handleSelect = (goal: DailyPlanGoal) => {
    // 1. Mostra feedback visivo immediato
    setSelectedValue(goal);

    // 2. Salva nello store
    setDailyGoal(goal);

    // 3. Delay 600ms prima di cambiare step
    setTimeout(() => {
      nextStep();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Cosa vuoi allenare oggi?
        </h2>
        <p className="text-gray-400 text-lg">
          Scegli il focus del tuo workout
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = dailyGoal === goal.value;
          const isJustSelected = selectedValue === goal.value;

          return (
            <button
              key={goal.value}
              onClick={() => handleSelect(goal.value)}
              className={`
                p-6 rounded-xl text-left
                border-2 transition-all duration-300
                hover:scale-105
                ${isSelected || isJustSelected
                  ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 shadow-lg shadow-[#EEBA2B]/20 scale-105'
                  : 'border-white/10 hover:border-[#EEBA2B]/50 bg-black/30'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`
                  p-3 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-[#EEBA2B]' : 'bg-white/10'}
                `}
                >
                  <Icon
                    className={`
                    h-6 w-6
                    ${isSelected ? 'text-black' : 'text-white'}
                  `}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-white mb-1">
                    {goal.label}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {goal.description}
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

