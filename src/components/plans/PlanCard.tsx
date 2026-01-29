import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, Clock, Trash2, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/dateHelpers';
import { toast } from 'sonner';
import { activatePlan, completePlan } from '@/services/planService';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { WorkoutPlan } from '@/types/plan';

interface PlanCardProps {
  plan: WorkoutPlan;
  onStart: (plan: WorkoutPlan) => void;
  onDelete: (planId: string) => void;
  onUpdate?: () => void;
}

export function PlanCard({ plan, onStart, onDelete, onUpdate }: PlanCardProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = () => {
    onStart(plan);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Sei sicuro di voler eliminare questo piano?')) {
      onDelete(plan.id);
    }
  };

  /**
   * Calcola il giorno corrente della settimana (0=Lunedì, 6=Domenica)
   * JavaScript usa 0=Domenica, noi vogliamo 0=Lunedì
   */
  function getCurrentWeekdayIndex(): number {
    const today = new Date();
    const jsDay = today.getDay(); // 0=Domenica, 1=Lunedì, ..., 6=Sabato
    
    // Converti: Lunedì=0, Martedì=1, ..., Domenica=6
    return jsDay === 0 ? 6 : jsDay - 1;
  }

  /**
   * Trova il workout del giorno corrente per un piano settimanale
   * Pattern distribuzione: 2x=[0,3], 3x=[0,2,4], 4x=[0,1,3,4], ecc.
   */
  function getTodayWorkout() {
    const currentDay = getCurrentWeekdayIndex();
    
    // Per piani giornalieri: c'è solo un workout
    if (plan.plan_type === 'daily') {
      return plan.workouts[0] || null;
    }
    
    // Per piani settimanali: trova workout del giorno corrente
    // I workout sono distribuiti nei giorni secondo pattern 2x, 3x, 4x, ecc.
    const totalWorkouts = plan.workouts.length;
    
    // Pattern distribuzione workout nella settimana
    const workoutDays: Record<number, number[]> = {
      2: [0, 3],           // Lunedì, Giovedì
      3: [0, 2, 4],        // Lunedì, Mercoledì, Venerdì
      4: [0, 1, 3, 4],     // Lunedì, Martedì, Giovedì, Venerdì
      5: [0, 1, 2, 3, 4],  // Lunedì-Venerdì
      6: [0, 1, 2, 3, 4, 5], // Lunedì-Sabato
      7: [0, 1, 2, 3, 4, 5, 6], // Tutti i giorni
    };
    
    const scheduledDays = workoutDays[totalWorkouts] || [];
    const workoutIndex = scheduledDays.indexOf(currentDay);
    
    // Se oggi non c'è workout (giorno di riposo)
    if (workoutIndex === -1) {
      return null;
    }
    
    return plan.workouts[workoutIndex];
  }

  /**
   * Handler: Attiva questo piano e naviga al workout del giorno
   */
  async function handleActivate(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) return;

    setIsActivating(true);
    try {
      const success = await activatePlan(user.id, plan.id);
      
      if (success) {
        toast.success('✅ Piano attivato!', {
          description: 'Questo è ora il tuo piano attivo',
        });
        
        // Trova workout del giorno corrente
        const todayWorkout = getTodayWorkout();
        
        if (!todayWorkout) {
          // Oggi è giorno di riposo
          toast.info('💤 Oggi è giorno di riposo', {
            description: 'Torna domani per il prossimo allenamento!',
          });
          onUpdate?.(); // Ricarica la lista
        } else {
          // Gestisci diverse strutture del workout
          // Caso 1: workout ha proprietà 'exercises' o 'esercizi'
          // Caso 2: workout è direttamente un array di esercizi
          type ExerciseLike = { name?: string; nome?: string; duration?: number; durata?: number; rest?: number; riposo?: number; sets?: number; serie?: number; instructions?: string; istruzioni?: string; note?: string; muscleGroup?: string; gruppo_muscolare?: string };
          type TodayWorkoutShape = { exercises?: unknown[]; esercizi?: unknown[]; name?: string; nome?: string; duration?: number; durata?: number };
          const tw = todayWorkout as ExerciseLike[] | TodayWorkoutShape;
          let exercisesArray: ExerciseLike[] = [];

          if (Array.isArray(tw)) {
            exercisesArray = tw as ExerciseLike[];
          } else if (tw.exercises && Array.isArray(tw.exercises)) {
            exercisesArray = tw.exercises as ExerciseLike[];
          } else if (tw.esercizi && Array.isArray(tw.esercizi)) {
            exercisesArray = tw.esercizi as ExerciseLike[];
          }

          const workoutMeta = Array.isArray(tw) ? {} : (tw as TodayWorkoutShape);
          // Converti esercizi nel formato aspettato da /workouts
          const customExercises = exercisesArray.map((ex: ExerciseLike) => ({
            name: ex.name || ex.nome || 'Esercizio',
            duration: ex.duration || ex.durata || 30, // Default 30 secondi
            rest: ex.rest || ex.riposo || 0,
            sets: ex.sets || ex.serie || undefined,
            instructions: ex.instructions || ex.istruzioni || ex.note || undefined,
            muscleGroup: ex.muscleGroup || ex.gruppo_muscolare || undefined,
          }));

          // Naviga alla STESSA pagina workout usata per altri workout
          navigate('/workouts', {
            state: {
              startCustomWorkout: 'personalized',
              customExercises: customExercises,
              workoutTitle: workoutMeta.name || workoutMeta.nome || plan.name,
              workoutType: plan.plan_type === 'daily' ? 'giornaliero' : 'settimanale',
              duration: workoutMeta.duration ?? workoutMeta.durata ?? undefined,
              source: 'plan',
              planName: plan.name,
              planId: plan.id,
            }
          });
        }
      } else {
        toast.error('Errore durante attivazione piano');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore durante attivazione piano');
    } finally {
      setIsActivating(false);
    }
  }

  /**
   * Handler: Completa questo piano
   */
  async function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    setIsCompleting(true);
    try {
      const success = await completePlan(plan.id);
      
      if (success) {
        toast.success('🎉 Piano completato!', {
          description: 'Ottimo lavoro! Piano segnato come completato',
        });
        onUpdate?.(); // Ricarica la lista piani
      } else {
        toast.error('Errore durante completamento piano');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore durante completamento piano');
    } finally {
      setIsCompleting(false);
    }
  }

  // Colori border/background in base allo status
  const statusColors = {
    pending: 'border-orange-500/50 bg-orange-500/5',
    active: 'border-pp-gold bg-pp-gold/10',
    completed: 'border-green-500/50 bg-green-500/5',
  };

  // Colori badge status
  const statusBadgeColors = {
    pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    active: 'bg-pp-gold/20 text-pp-gold border-pp-gold/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  // Label status
  const statusLabels = {
    pending: '🟠 Da Fare',
    active: '🟡 Attivo',
    completed: '🟢 Completato',
  };

  // Determina colori per questo piano
  const borderColor = statusColors[plan.status] || statusColors.pending;
  const badgeColor = statusBadgeColors[plan.status] || statusBadgeColors.pending;
  const statusLabel = statusLabels[plan.status] || statusLabels.pending;

  return (
    <Card
      className={`
        bg-card border-border hover:border-primary/50
        rounded-2xl
        hover:shadow-lg hover:shadow-primary/10
        transition-all duration-300
        cursor-pointer
        group
        h-full flex flex-col
        ${borderColor}
      `}
      onClick={handleCardClick}
    >
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header con nome e badge tipo */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground mb-2 truncate">
              {plan.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant={plan.plan_type === 'daily' ? 'orange' : 'purple'}
                className="text-xs"
              >
                {plan.plan_type === 'daily' ? '⚡ Giornaliero' : '📅 Settimanale'}
              </Badge>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${badgeColor}`}>
                {statusLabel}
              </div>
            </div>
          </div>

          {/* Icona workout */}
          <div className="bg-[#EEBA2B]/10 p-3 rounded-xl ml-2 flex-shrink-0">
            <Target className="h-6 w-6 text-[#EEBA2B]" />
          </div>
        </div>

        {/* Info piano */}
        <div className="space-y-2 mb-4 flex-1">
          {plan.goal && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Obiettivo: {plan.goal}</span>
            </div>
          )}

          {plan.duration_weeks && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Durata: {plan.duration_weeks} settimane</span>
            </div>
          )}

          {plan.frequency_per_week && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Frequenza: {plan.frequency_per_week}x/settimana</span>
            </div>
          )}

          {plan.plan_type === 'daily' && plan.workouts && plan.workouts.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Play className="h-4 w-4 flex-shrink-0" />
              <span>{plan.workouts.length} esercizi</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground/70 pt-2 border-t border-border/50">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>Creato il {formatDate(plan.created_at)}</span>
          </div>
        </div>

        {/* Bottoni azione */}
        <div className="space-y-3 mt-auto">
          {/* Riga 1: Inizia + Elimina */}
          <div className="flex gap-3">
            <Button
              onClick={handleActivate}
              disabled={isActivating || plan.status === 'completed'}
              className="flex-1 bg-gradient-to-r from-pp-gold to-yellow-500 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Attivazione...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Inizia
                </>
              )}
            </Button>

            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Riga 2: Completa (solo se status è 'active') */}
          {plan.status === 'active' && (
            <div className="flex justify-center">
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completamento...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Completa
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


