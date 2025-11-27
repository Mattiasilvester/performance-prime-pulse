import { useEffect } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { generateWeeklyPlan } from '@/services/weeklyPlanGenerator';
import type { WorkoutPlan } from '@/types/plan';

export function GeneratingWeeklyStep() {
  const {
    weeklyGoal,
    weeklyLevel,
    weeklyDuration,
    weeklyFrequency,
    weeklyEquipment,
    weeklyLimitations,
    setGeneratedPlan,
    nextStep,
  } = usePlanCreationStore();

  useEffect(() => {
    generatePlan();
  }, []);

  const generatePlan = async () => {
    try {
      // Delay più lungo per piano complesso
      await new Promise((resolve) => setTimeout(resolve, 4000));

      if (
        weeklyGoal &&
        weeklyLevel &&
        weeklyDuration &&
        weeklyFrequency &&
        weeklyEquipment
      ) {
        const planData = await generateWeeklyPlan({
          goal: weeklyGoal,
          level: weeklyLevel,
          duration: weeklyDuration,
          frequency: weeklyFrequency,
          equipment: weeklyEquipment,
          limitations: weeklyLimitations,
        });

        // Crea piano nel formato WorkoutPlan completo
        const plan: WorkoutPlan = {
          id: '', // Sarà generato dal database al salvataggio
          user_id: '', // Sarà impostato al salvataggio
          name: planData.name || '',
          plan_type: 'weekly',
          source: 'primebot',
          goal: planData.goal,
          level: planData.level,
          duration_weeks: planData.duration_weeks,
          frequency_per_week: planData.frequency_per_week,
          equipment: planData.equipment,
          limitations: planData.limitations,
          workouts: planData.workouts || [],
          status: 'pending',
          created_at: planData.created_at || new Date().toISOString(),
          updated_at: planData.updated_at,
          is_active: true,
          metadata: planData.metadata,
        };

        setGeneratedPlan(plan);
        nextStep();
      } else {
        console.error('Missing required data for weekly plan generation');
        // TODO: Gestire errore con toast
      }
    } catch (error) {
      console.error('Error generating weekly plan:', error);
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

        {/* Cerchi animati multipli */}
        <div
          className="
          absolute inset-0 
          rounded-full 
          border-4 border-purple-500/30 
          animate-ping
        "
        />
        <div
          className="
          absolute inset-[-8px] 
          rounded-full 
          border-4 border-blue-500/20 
          animate-pulse delay-150
        "
        />
        <div
          className="
          absolute inset-[-16px] 
          rounded-full 
          border-4 border-purple-400/10 
          animate-ping delay-300
        "
        />
      </div>

      {/* Testo */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-white">
          PrimeBot sta creando il tuo piano settimanale...
        </h3>
        <p className="text-gray-400">
          Analizzando obiettivi, livello e frequenza
        </p>
        <p className="text-sm text-gray-500">
          Questo potrebbe richiedere qualche secondo
        </p>
      </div>

      {/* Loader */}
      <Loader2 className="h-8 w-8 animate-spin text-[#EEBA2B]" />
    </div>
  );
}


