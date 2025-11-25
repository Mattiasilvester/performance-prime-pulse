import { useEffect } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { generateDailyWorkout } from '@/services/dailyPlanGenerator';
import type { WorkoutPlan } from '@/types/plan';

export function GeneratingStep() {
  const {
    planType,
    dailyGoal,
    dailyDuration,
    dailyEquipment,
    setGeneratedPlan,
    nextStep,
  } = usePlanCreationStore();

  useEffect(() => {
    generatePlan();
  }, []);

  const generatePlan = async () => {
    try {
      // Simula delay per UX migliore
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (planType === 'daily' && dailyGoal && dailyDuration && dailyEquipment) {
        // Genera workout giornaliero
        const workout = generateDailyWorkout(dailyGoal, dailyDuration, dailyEquipment);

        // Crea piano nel formato WorkoutPlan completo
        const plan: WorkoutPlan = {
          id: '', // Sarà generato dal database al salvataggio
          name: workout.name,
          plan_type: 'daily',
          source: 'primebot',
          goal: dailyGoal,
          workouts: [workout], // Array con singolo workout
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          // Campi opzionali per daily plan
          duration_weeks: undefined,
          frequency_per_week: undefined,
          experience_level: undefined,
          weekly_plan_data: undefined,
        };

        setGeneratedPlan(plan);
        nextStep();
      } else {
        console.error('Missing required data for daily plan generation');
        // TODO: Gestire errore con toast
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      // TODO: Gestire errore con toast
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      {/* Bot animato */}
      <div className="relative">
        <div
          className="
          w-24 h-24 
          bg-gradient-to-br from-purple-500 to-blue-500 
          rounded-full 
          flex items-center justify-center
          animate-pulse
        "
        >
          <Bot className="h-12 w-12 text-white" />
        </div>

        {/* Cerchi animati */}
        <div
          className="
          absolute inset-0 
          rounded-full 
          border-4 border-purple-500/30 
          animate-ping
        "
        />
      </div>

      {/* Testo */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">
          PrimeBot sta creando il tuo piano...
        </h3>
        <p className="text-gray-400">
          Analizzando i tuoi obiettivi e preferenze
        </p>
      </div>

      {/* Loader */}
      <Loader2 className="h-8 w-8 animate-spin text-[#EEBA2B]" />
    </div>
  );
}


