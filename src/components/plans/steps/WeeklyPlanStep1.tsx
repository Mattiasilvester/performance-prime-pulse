import { useState } from 'react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { Target, TrendingUp, Heart, Dumbbell, Activity } from 'lucide-react';
import type { WorkoutGoal } from '@/types/plan';

const GOALS: Array<{
  value: WorkoutGoal;
  label: string;
  icon: typeof Target;
  description: string;
}> = [
  {
    value: 'Perdere peso',
    label: 'Perdere peso',
    icon: TrendingUp,
    description: 'Bruciare calorie e ridurre massa grassa',
  },
  {
    value: 'Aumentare massa muscolare',
    label: 'Aumentare massa',
    icon: Dumbbell,
    description: 'Crescita e definizione muscolare',
  },
  {
    value: 'Migliorare resistenza',
    label: 'Resistenza',
    icon: Heart,
    description: 'Più energia e fiato',
  },
  {
    value: 'Tonificare',
    label: 'Tonificare',
    icon: Activity,
    description: 'Definizione senza volume eccessivo',
  },
  {
    value: 'Mantenersi attivo',
    label: 'Mantenersi attivo',
    icon: Target,
    description: 'Salute generale e benessere',
  },
];

export function WeeklyPlanStep1() {
  const { weeklyGoal, setWeeklyGoal, nextStep } = usePlanCreationStore();
  const [selectedValue, setSelectedValue] = useState<WorkoutGoal | null>(null);

  const handleSelect = (goal: WorkoutGoal) => {
    // 1. Mostra feedback visivo immediato
    setSelectedValue(goal);

    // 2. Salva nello store
    setWeeklyGoal(goal);

    // 3. Delay 600ms prima di cambiare step
    setTimeout(() => {
      nextStep();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Qual è il tuo obiettivo principale?
        </h2>
        <p className="text-gray-400 text-lg">
          Scegli cosa vuoi ottenere con questo piano
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = weeklyGoal === goal.value;
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

