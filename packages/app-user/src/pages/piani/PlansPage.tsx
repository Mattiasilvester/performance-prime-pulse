/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserPlans, deletePlan } from '@/services/planService';
import { PlanCard } from '@/components/plans/PlanCard';
import { CreatePlanCard } from '@/components/plans/CreatePlanCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkoutPlan } from '@/types/plan';

export default function PlansPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch piani al mount
  useEffect(() => {
    loadPlans();
  }, [user?.id]);

  const loadPlans = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await fetchUserPlans(user.id);
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Errore nel caricamento dei piani');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlan = (plan: WorkoutPlan) => {
    // TODO: Implementare logica start piano completa
    // Per ora mostra toast e prepara per navigazione futura
    toast.success(`Avvio piano: ${plan.name}`);
    
    // Navigazione futura a workout page con piano
    // navigate('/workouts', { 
    //   state: { 
    //     planId: plan.id,
    //     planType: plan.plan_type,
    //     workouts: plan.workouts 
    //   } 
    // });
  };

  const handleDeletePlan = async (planId: string) => {
    // Conferma delete
    if (!confirm('Sei sicuro di voler eliminare questo piano?')) {
      return;
    }

    try {
      await deletePlan(planId);
      toast.success('Piano eliminato con successo');
      // Ricarica lista
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Errore nell\'eliminazione del piano');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#EEBA2B] mx-auto mb-4" />
          <p className="text-gray-400">Caricamento piani...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pb-24">
      {/* Header */}
      <div className="bg-black/50 border-b border-white/10 p-6 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-4 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-white">
            I tuoi piani
          </h1>
          <p className="text-gray-400 mt-2">
            {plans.length === 0
              ? 'Non hai ancora nessun piano. Creane uno ora!'
              : `${plans.length} ${plans.length === 1 ? 'piano attivo' : 'piani attivi'}`
            }
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {plans.length === 0 ? (
          // Empty state - solo CreatePlanCard centrata
          <div className="max-w-2xl mx-auto">
            <CreatePlanCard />
          </div>
        ) : (
          // Grid con piani + CreatePlanCard
          <div
            className="
            grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 
            gap-6
          "
          >
            {/* Piani esistenti */}
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onStart={handleStartPlan}
                onDelete={handleDeletePlan}
                onUpdate={loadPlans}
              />
            ))}

            {/* Card Crea Nuovo - sempre alla fine */}
            <CreatePlanCard />
          </div>
        )}
      </div>
    </div>
  );
}
