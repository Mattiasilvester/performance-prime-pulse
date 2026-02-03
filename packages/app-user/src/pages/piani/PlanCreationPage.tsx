/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { WelcomeModal } from '@/components/plans/WelcomeModal';
import { PlanTypeSelector } from '@/components/plans/steps/PlanTypeSelector';
import { DailyPlanStep1 } from '@/components/plans/steps/DailyPlanStep1';
import { DailyPlanStep2 } from '@/components/plans/steps/DailyPlanStep2';
import { DailyPlanStep3 } from '@/components/plans/steps/DailyPlanStep3';
import { GeneratingStep } from '@/components/plans/steps/GeneratingStep';
import { WeeklyPlanStep1 } from '@/components/plans/steps/WeeklyPlanStep1';
import { WeeklyPlanStep2 } from '@/components/plans/steps/WeeklyPlanStep2';
import { WeeklyPlanStep3 } from '@/components/plans/steps/WeeklyPlanStep3';
import { WeeklyPlanStep4 } from '@/components/plans/steps/WeeklyPlanStep4';
import { WeeklyPlanStep5 } from '@/components/plans/steps/WeeklyPlanStep5';
import { GeneratingWeeklyStep } from '@/components/plans/steps/GeneratingWeeklyStep';
import { PrimeBotExplanation } from '@/components/plans/PrimeBotExplanation';
import { PlanPreview } from '@/components/plans/PlanPreview';
import { PlanModificationChat } from '@/components/plans/PlanModificationChat';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { savePlan } from '@/services/planService';
import { useAuth } from '@pp/shared';
import { toast } from 'sonner';
import type { WorkoutPlan } from '@/types/plan';

export default function PlanCreationPage() {
  const navigate = useNavigate();
  const { planType, currentStep, totalSteps, prevStep, reset, generatedPlan } = usePlanCreationStore();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  // Reset store al mount
  useEffect(() => {
    reset();
  }, []);

  const handleStart = () => {
    setShowWelcome(false);
  };

  const handleCancel = () => {
    if (confirm('Sei sicuro di voler annullare?')) {
      reset();
      navigate('/piani');
    }
  };

  const handleBack = () => {
    if (currentStep === 0 && !planType) {
      // Se siamo al primo step senza tipo selezionato, torna indietro chiude modal
      handleCancel();
    } else if (currentStep === 0 && planType) {
      // Se abbiamo selezionato tipo ma siamo a step 0, torna a selezione tipo
      reset();
      setShowWelcome(false);
    } else {
      prevStep();
    }
  };

  /**
   * Handler: Salva il piano su Supabase
   */
  const handleSavePlan = async () => {
    const plan = generatedPlan as WorkoutPlan | null;
    
    if (!plan) {
      toast.error('Nessun piano da salvare');
      return;
    }

    if (!user) {
      toast.error('Devi effettuare il login per salvare il piano');
      return;
    }

    setIsSaving(true);

    try {
      // Prepara i dati del piano per il salvataggio
      const planData: Omit<WorkoutPlan, 'id' | 'created_at'> = {
        user_id: user.id,
        name: plan.name,
        plan_type: plan.plan_type,
        source: plan.source || 'custom',
        goal: plan.goal,
        duration_weeks: plan.duration_weeks,
        frequency_per_week: plan.frequency_per_week,
        equipment: plan.equipment,
        level: plan.level,
        limitations: plan.limitations,
        workouts: plan.workouts,
        metadata: plan.metadata || {},
        status: plan.status || 'pending', // Status default 'pending' per nuovi piani
        is_active: true,
      };

      // Salva su Supabase
      const savedPlan = await savePlan(planData);

      if (!savedPlan) {
        throw new Error('Errore durante il salvataggio del piano');
      }

      // Success!
      toast.success('✅ Piano salvato con successo!', {
        description: 'Puoi trovarlo nella tua lista piani',
      });

      // Reset store e naviga alla lista piani
      reset();
      navigate('/piani');

    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('❌ Errore durante il salvataggio', {
        description: error instanceof Error ? error.message : 'Riprova più tardi',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    // Prima mostra scelta tipo
    if (!planType) {
      return <PlanTypeSelector />;
    }

    // Piano giornaliero
    if (planType === 'daily') {
      switch (currentStep) {
        case 0:
          return <DailyPlanStep1 />;
        case 1:
          return <DailyPlanStep2 />;
        case 2:
          return <DailyPlanStep3 />;
        case 3:
          return <GeneratingStep />;
        case 4:
          return <PrimeBotExplanation />;
        case 5:
          return <PlanPreview onSave={handleSavePlan} isSaving={isSaving} />;
        case 6:
          return <PlanModificationChat onSave={handleSavePlan} isSaving={isSaving} />;
        default:
          return <PlanTypeSelector />;
      }
    }

    // Piano settimanale
    if (planType === 'weekly') {
      switch (currentStep) {
        case 0:
          return <WeeklyPlanStep1 />;
        case 1:
          return <WeeklyPlanStep2 />;
        case 2:
          return <WeeklyPlanStep3 />;
        case 3:
          return <WeeklyPlanStep4 />;
        case 4:
          return <WeeklyPlanStep5 />;
        case 5:
          return <GeneratingWeeklyStep />;
        case 6:
          return <PrimeBotExplanation />;
        case 7:
          return <PlanPreview onSave={handleSavePlan} isSaving={isSaving} />;
        case 8:
          return <PlanModificationChat onSave={handleSavePlan} isSaving={isSaving} />;
        default:
          return <PlanTypeSelector />;
      }
    }

    return <PlanTypeSelector />;
  };

  return (
    <>
      <WelcomeModal
        isOpen={showWelcome}
        onStart={handleStart}
        onCancel={handleCancel}
      />

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pb-24">
        {/* Header */}
        <div className="bg-black/50 border-b border-white/10 p-6 sticky top-0 z-10 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>

            <h1 className="text-3xl font-bold text-white mb-2">
              Crea Piano Personalizzato
            </h1>

            {/* Progress bar */}
            {planType && totalSteps > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    Step {currentStep + 1} di {totalSteps}
                  </span>
                  <span className="text-sm text-gray-400">
                    {Math.round(((currentStep + 1) / totalSteps) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-[#EEBA2B] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-6">
          {renderStep()}
        </div>
      </div>
    </>
  );
}
