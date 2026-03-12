import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserPlans } from '@/services/planService';
import { fetchUserNutritionPlans } from '@/services/nutritionPlanService';
import type { WorkoutPlan } from '@/types/plan';
import type { NutritionPlanRecord } from '@/types/nutritionPlan';
import { WorkoutPlanCard } from '@/components/plans/WorkoutPlanCard';
import { NutritionPlanCard } from '@/components/plans/NutritionPlanCard';

type TabKind = 'workout' | 'nutrition';

export default function IMieiPiani() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabKind>('workout');
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanRecord[]>([]);
  const [loadingWorkout, setLoadingWorkout] = useState(true);
  const [loadingNutrition, setLoadingNutrition] = useState(true);

  useEffect(() => {
    if (location.pathname !== '/i-miei-piani') return;
    if (!user?.id) return;

    const load = async () => {
      try {
        setLoadingWorkout(true);
        const workout = await fetchUserPlans(user.id);
        setWorkoutPlans(workout);
      } catch (err) {
        console.error('Errore caricamento piani allenamento:', err);
      } finally {
        setLoadingWorkout(false);
      }

      try {
        setLoadingNutrition(true);
        const nutrition = await fetchUserNutritionPlans(user.id);
        setNutritionPlans(nutrition);
      } catch (err) {
        console.error('Errore caricamento piani nutrizione:', err);
      } finally {
        setLoadingNutrition(false);
      }
    };

    load();
  }, [user?.id, location.pathname]);

  const totalPlans = workoutPlans.length + nutritionPlans.length;
  const isLoading = loadingWorkout && loadingNutrition;

  const handleWorkoutDelete = (id: string) => {
    setWorkoutPlans((prev) => prev.filter((p) => p.id !== id));
  };
  const handleWorkoutUpdate = (updated: WorkoutPlan) => {
    setWorkoutPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };
  const handleNutritionDelete = (id: string) => {
    setNutritionPlans((prev) => prev.filter((p) => p.id !== id));
  };
  const handleNutritionUpdate = (updated: NutritionPlanRecord) => {
    setNutritionPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleTabChange = (tab: TabKind) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0C]"
      style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
    >
      {/* Header sticky */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/7 bg-[#0A0A0C]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            aria-label="Indietro"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-white truncate">
              I miei piani
            </h1>
            <p className="text-xs text-[#8A8A96] truncate">
              {totalPlans} {totalPlans === 1 ? 'piano generato' : 'piani generati'}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-4 pb-3">
          <div
            className="flex rounded-[14px] border border-white/7 p-1"
            style={{ background: '#16161A' }}
          >
            <button
              type="button"
              onClick={() => handleTabChange('workout')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-[11px] py-2.5 text-sm font-medium transition-colors"
              style={
                activeTab === 'workout'
                  ? { background: '#EEBA2B', color: '#000' }
                  : { background: 'transparent', color: '#8A8A96' }
              }
            >
              <span aria-hidden>💪</span>
              Allenamento
              <span className="opacity-80">| {workoutPlans.length}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('nutrition')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-[11px] py-2.5 text-sm font-medium transition-colors"
              style={
                activeTab === 'nutrition'
                  ? { background: '#EEBA2B', color: '#000' }
                  : { background: 'transparent', color: '#8A8A96' }
              }
            >
              <span aria-hidden>🥗</span>
              Nutrizione
              <span className="opacity-80">| {nutritionPlans.length}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content scrollabile */}
      <main className="pt-[10px] pb-24 px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div
              className="h-10 w-10 rounded-full border-2 border-[#EEBA2B]/30 border-t-[#EEBA2B] animate-spin"
              style={{ color: '#EEBA2B' }}
            />
            <p className="mt-3 text-sm text-[#8A8A96]">Caricamento piani...</p>
          </div>
        ) : activeTab === 'workout' ? (
          workoutPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] border text-[26px]"
                style={{
                  background: 'rgba(238,186,43,0.12)',
                  borderColor: 'rgba(238,186,43,0.25)',
                }}
              >
                💪
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Nessun piano ancora
              </h3>
              <p className="mb-6 max-w-[220px] text-center text-sm text-[#8A8A96]">
                Chiedi a PrimeBot di crearti un piano personalizzato
              </p>
              <button
                type="button"
                onClick={() => navigate('/ai-coach')}
                className="rounded-[11px] px-5 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
                style={{ background: '#EEBA2B' }}
              >
                💬 Apri PrimeBot
              </button>
            </div>
          ) : (
            <div className="space-y-0">
              <AnimatePresence>
                {workoutPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: index * 0.07, duration: 0.25 }}
                  >
                    <WorkoutPlanCard
                      plan={plan}
                      onDelete={handleWorkoutDelete}
                      onUpdate={handleWorkoutUpdate}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        ) : nutritionPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] border text-[26px]"
              style={{
                background: 'rgba(238,186,43,0.12)',
                borderColor: 'rgba(238,186,43,0.25)',
              }}
            >
              🥗
            </div>
            <h3 className="mb-2 text-base font-semibold text-white">
              Nessun piano ancora
            </h3>
            <p className="mb-6 max-w-[220px] text-center text-sm text-[#8A8A96]">
              Chiedi a PrimeBot di crearti un piano personalizzato
            </p>
            <button
              type="button"
              onClick={() => navigate('/ai-coach')}
              className="rounded-[11px] px-5 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
              style={{ background: '#EEBA2B' }}
            >
              💬 Apri PrimeBot
            </button>
          </div>
        ) : user?.id ? (
          <div className="space-y-0">
            <AnimatePresence>
              {nutritionPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: index * 0.07, duration: 0.25 }}
                >
                  <NutritionPlanCard
                    plan={plan}
                    userId={user.id}
                    onDelete={handleNutritionDelete}
                    onUpdate={handleNutritionUpdate}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : null}
      </main>
    </div>
  );
}
