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

export function ActivePlansPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, [user?.id]);

  async function loadPlans() {
    if (!user?.id) return;

    setLoading(true);
    try {
      const userPlans = await fetchUserPlans(user.id);
      // Filtra solo piani attivi (già filtrati da fetchUserPlans, ma per sicurezza)
      const activePlans = userPlans.filter(plan => plan.is_active);
      setPlans(activePlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Errore nel caricamento dei piani');
    } finally {
      setLoading(false);
    }
  }

  const handleStartPlan = (plan: WorkoutPlan) => {
    // TODO: Implementare logica start piano completa
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#EEBA2B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black pb-24 pt-20 px-4">
      {/* Header con back button */}
      <div className="max-w-7xl mx-auto mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="text-white hover:text-[#EEBA2B] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold text-white mb-2">
          Piani Personalizzati
        </h1>
        <p className="text-gray-400">
          {plans.length} {plans.length === 1 ? 'piano attivo' : 'piani attivi'}
        </p>
      </div>

      {/* Grid piani */}
      {plans.length === 0 ? (
        // Empty state se nessun piano
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-6">
              Non hai ancora creato nessun piano personalizzato.
            </p>
            <div className="max-w-md mx-auto">
              <CreatePlanCard />
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card piani esistenti */}
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onStart={handleStartPlan}
              onDelete={handleDeletePlan}
              onUpdate={loadPlans}
            />
          ))}

          {/* Card crea nuovo piano */}
          <CreatePlanCard />
        </div>
      )}
    </div>
  );
}

