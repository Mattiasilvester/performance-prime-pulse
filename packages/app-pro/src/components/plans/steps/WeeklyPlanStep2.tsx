import { usePlanCreationStore } from '@/stores/planCreationStore';
import { Button } from '@/components/ui/button';
import { User, Users, Award, Calendar } from 'lucide-react';
import type { ExperienceLevel, WeeklyFrequency } from '@/types/plan';

const LEVELS: Array<{
  value: ExperienceLevel;
  label: string;
  description: string;
  icon: typeof User;
}> = [
  {
    value: 'beginner',
    label: 'Principiante',
    description: 'Poca o nessuna esperienza',
    icon: User,
  },
  {
    value: 'intermediate',
    label: 'Intermedio',
    description: '6-12 mesi di allenamento',
    icon: Users,
  },
  {
    value: 'advanced',
    label: 'Avanzato',
    description: 'Oltre 1 anno di esperienza',
    icon: Award,
  },
];

const FREQUENCIES: Array<{
  value: WeeklyFrequency;
  label: string;
  description: string;
}> = [
  {
    value: '2-3',
    label: '2-3 giorni',
    description: 'Ideale per iniziare',
  },
  {
    value: '4-5',
    label: '4-5 giorni',
    description: 'Ottimale per risultati',
  },
  {
    value: '6+',
    label: '6+ giorni',
    description: 'Alta frequenza, massimi risultati',
  },
];

export function WeeklyPlanStep2() {
  const {
    weeklyLevel,
    weeklyFrequency,
    setWeeklyLevel,
    setWeeklyFrequency,
    nextStep,
  } = usePlanCreationStore();

  const canProceed = weeklyLevel && weeklyFrequency;

  const handleNext = () => {
    if (canProceed) {
      nextStep();
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* SEZIONE 1: LIVELLO */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Qual è il tuo livello di esperienza?
          </h2>
          <p className="text-gray-400">
            Questo ci aiuta a personalizzare l'intensità
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {LEVELS.map((level) => {
            const Icon = level.icon;
            const isSelected = weeklyLevel === level.value;

            return (
              <button
                key={level.value}
                onClick={() => setWeeklyLevel(level.value)}
                className={`
                  p-6 rounded-xl text-center
                  border-2 transition-all duration-300
                  hover:scale-105
                  ${isSelected
                    ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 shadow-lg shadow-[#EEBA2B]/20'
                    : 'border-white/10 hover:border-[#EEBA2B]/50 bg-black/30'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`
                    p-3 rounded-lg
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

                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">
                      {level.label}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {level.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEZIONE 2: FREQUENZA */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Quanti giorni a settimana vuoi allenarti?
          </h2>
          <p className="text-gray-400">
            Scegli una frequenza sostenibile nel tempo
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {FREQUENCIES.map((freq) => {
            const isSelected = weeklyFrequency === freq.value;

            return (
              <button
                key={freq.value}
                onClick={() => setWeeklyFrequency(freq.value)}
                className={`
                  p-6 rounded-xl text-center
                  border-2 transition-all duration-300
                  hover:scale-105
                  ${isSelected
                    ? 'border-[#EEBA2B] bg-[#EEBA2B]/10 shadow-lg shadow-[#EEBA2B]/20'
                    : 'border-white/10 hover:border-[#EEBA2B]/50 bg-black/30'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`
                    p-3 rounded-lg
                    ${isSelected ? 'bg-[#EEBA2B]' : 'bg-white/10'}
                  `}
                  >
                    <Calendar
                      className={`
                      h-8 w-8
                      ${isSelected ? 'text-black' : 'text-white'}
                    `}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">
                      {freq.label}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {freq.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTONE CONTINUA */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          size="lg"
          className="bg-[#EEBA2B] hover:bg-[#EEBA2B]/90 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua →
        </Button>
      </div>
    </div>
  );
}


