import { useState } from 'react';
import { usePlanCreationStore } from '@/stores/planCreationStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Target,
  Clock,
  Dumbbell,
  Save,
  Edit,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { WorkoutPlan } from '@/types/plan';

interface PlanPreviewProps {
  onSave: () => void;
  isSaving: boolean;
}

export function PlanPreview({ onSave, isSaving }: PlanPreviewProps) {
  const { generatedPlan, nextStep } = usePlanCreationStore();

  if (!generatedPlan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nessun piano disponibile</p>
      </div>
    );
  }

  const plan = generatedPlan as WorkoutPlan;
  const isDaily = plan.plan_type === 'daily';

  const handleModify = () => {
    nextStep(); // Vai a chat modifica (PARTE 2)
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Piano */}
      <div
        className="
        bg-gradient-to-br from-purple-900/30 to-blue-900/30 
        border-2 border-purple-500/30 
        rounded-2xl p-8
      "
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-3">{plan.name}</h2>

            {/* Badge tipo */}
            <div className="flex items-center gap-3">
              <span
                className={`
                px-4 py-2 rounded-full text-sm font-semibold
                ${isDaily
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }
              `}
              >
                {isDaily ? '⚡ Piano Giornaliero' : '📅 Piano Settimanale'}
              </span>
            </div>
          </div>
        </div>
        {/* Info principali */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plan.goal && (
            <div className="flex items-center gap-3 bg-black/20 rounded-lg p-4">
              <Target className="h-5 w-5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Obiettivo</p>
                <p className="text-sm font-semibold text-white">{plan.goal}</p>
              </div>
            </div>
          )}

          {plan.duration_weeks && (
            <div className="flex items-center gap-3 bg-black/20 rounded-lg p-4">
              <Calendar className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Durata</p>
                <p className="text-sm font-semibold text-white">
                  {plan.duration_weeks} settimane
                </p>
              </div>
            </div>
          )}

          {plan.frequency_per_week && (
            <div className="flex items-center gap-3 bg-black/20 rounded-lg p-4">
              <Clock className="h-5 w-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Frequenza</p>
                <p className="text-sm font-semibold text-white">
                  {plan.frequency_per_week}x/settimana
                </p>
              </div>
            </div>
          )}

          {plan.equipment && (
            <div className="flex items-center gap-3 bg-black/20 rounded-lg p-4">
              <Dumbbell className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Attrezzatura</p>
                <p className="text-sm font-semibold text-white">{plan.equipment}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workout Details */}
      {isDaily ? (
        <DailyPlanWorkouts plan={plan} />
      ) : (
        <WeeklyPlanWorkouts plan={plan} />
      )}

      {/* Bottoni Azione */}
      <div className="flex gap-4 justify-center pt-6 flex-wrap">
        <Button
          onClick={handleModify}
          variant="outline"
          size="lg"
          className="border-purple-500/50 hover:bg-purple-500/10 text-white"
        >
          <Edit className="mr-2 h-5 w-5" />
          Modifica Piano
        </Button>

        <Button
          onClick={onSave}
          disabled={isSaving}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salva Piano
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Visualizzazione workout per piano giornaliero
 */
interface DailyPlanWorkoutsProps {
  plan: WorkoutPlan;
}

function DailyPlanWorkouts({ plan }: DailyPlanWorkoutsProps) {
  const workout = plan.workouts?.[0];

  if (!workout || !workout.exercises) {
    return (
      <div className="text-center py-8 text-gray-400">
        Nessun esercizio disponibile
      </div>
    );
  }

  const exercises = workout.exercises;

  return (
    <div
      className="
      bg-black/30 
      border border-white/10 
      rounded-2xl p-6
    "
    >
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Dumbbell className="h-6 w-6 text-[#EEBA2B]" />
        Il tuo workout ({exercises.length} esercizi)
      </h3>
      <div className="space-y-4">
        {exercises.map((exercise: any, index: number) => {
          const name = exercise.nome || exercise.name || 'Esercizio';
          const sets = exercise.serie || exercise.sets || 3;
          const reps = exercise.ripetizioni || exercise.reps || 12;
          const rest = exercise.recupero || exercise.rest || '60s';

          return (
            <div
              key={index}
              className="
                bg-black/30 
                border border-white/10 
                rounded-xl p-5
                hover:border-[#EEBA2B]/50
                transition-colors
              "
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="
                    w-10 h-10 
                    bg-[#EEBA2B] 
                    rounded-lg 
                    flex items-center justify-center
                    font-bold text-black
                  "
                  >
                    {index + 1}
                  </div>
                  <h4 className="text-lg font-semibold text-white">{name}</h4>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 ml-13">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Serie:</span>
                  <span className="text-sm font-semibold text-white">{sets}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Ripetizioni:</span>
                  <span className="text-sm font-semibold text-white">{reps}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Recupero:</span>
                  <span className="text-sm font-semibold text-white">{rest}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Riepilogo */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Tempo stimato:</span>
          <span className="font-semibold text-white">
            {calculateWorkoutDuration(exercises)} minuti
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Visualizzazione workout per piano settimanale
 * Mostra SEMPRE 7 giorni con workout o riposo
 */
interface WeeklyPlanWorkoutsProps {
  plan: WorkoutPlan;
}

const DAYS_OF_WEEK = [
  { short: 'Lun', full: 'Lunedì' },
  { short: 'Mar', full: 'Martedì' },
  { short: 'Mer', full: 'Mercoledì' },
  { short: 'Gio', full: 'Giovedì' },
  { short: 'Ven', full: 'Venerdì' },
  { short: 'Sab', full: 'Sabato' },
  { short: 'Dom', full: 'Domenica' },
];

function WeeklyPlanWorkouts({ plan }: WeeklyPlanWorkoutsProps) {
  const workouts = plan.workouts || [];
  const frequency = plan.frequency_per_week || workouts.length || 3;

  // Distribuisci i workout sui 7 giorni in modo intelligente
  const weekSchedule = distributeWorkoutsToWeek(workouts, frequency);

  return (
    <div
      className="
      bg-black/30 
      border border-white/10 
      rounded-2xl p-6
    "
    >
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Calendar className="h-6 w-6 text-[#EEBA2B]" />
        Struttura settimanale
      </h3>

      {/* Tabs per TUTTI i 7 giorni */}
      <Tabs defaultValue="0" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-black/30 mb-6 h-auto p-1">
          {DAYS_OF_WEEK.map((day, index) => {
            const hasWorkout = weekSchedule[index] !== null;
            return (
              <TabsTrigger
                key={index}
                value={index.toString()}
                className={`
                  text-sm sm:text-base font-medium py-2 px-1
                  ${hasWorkout
                    ? 'data-[state=active]:bg-[#EEBA2B] data-[state=active]:text-black'
                    : 'data-[state=active]:bg-gray-700 data-[state=active]:text-gray-300'
                  }
                `}
              >
                {day.short}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {DAYS_OF_WEEK.map((day, dayIndex) => {
          const workout = weekSchedule[dayIndex];
          const isRestDay = workout === null;

          return (
            <TabsContent key={dayIndex} value={dayIndex.toString()} className="mt-6">
              {isRestDay ? (
                // Giorno di riposo
                <RestDayContent dayName={day.full} dayIndex={dayIndex} />
              ) : (
                // Giorno di allenamento
                <WorkoutDayContent workout={workout} />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

/**
 * Distribuisce i workout sui 7 giorni della settimana
 * in modo intelligente basato sulla frequenza
 */
function distributeWorkoutsToWeek(workouts: any[], frequency: number): (any | null)[] {
  const week: (any | null)[] = [null, null, null, null, null, null, null];

  if (workouts.length === 0) return week;

  // Pattern di distribuzione basato su frequenza
  const distributionPatterns: Record<number, number[]> = {
    2: [0, 3], // Lun, Gio
    3: [0, 2, 4], // Lun, Mer, Ven
    4: [0, 1, 3, 4], // Lun, Mar, Gio, Ven
    5: [0, 1, 2, 3, 4], // Lun-Ven
    6: [0, 1, 2, 3, 4, 5], // Lun-Sab
    7: [0, 1, 2, 3, 4, 5, 6], // Tutti i giorni
  };

  // Usa il pattern appropriato o default a 3 giorni
  const pattern = distributionPatterns[frequency] || distributionPatterns[3];

  // Assegna i workout ai giorni nel pattern
  pattern.forEach((dayIndex, workoutIndex) => {
    if (workoutIndex < workouts.length) {
      week[dayIndex] = workouts[workoutIndex];
    }
  });

  return week;
}

/**
 * Contenuto per giorno di riposo
 */
interface RestDayContentProps {
  dayName: string;
  dayIndex: number;
}

function RestDayContent({ dayName, dayIndex }: RestDayContentProps) {
  // Domenica = stretching/recupero, altri = riposo
  const isSunday = dayIndex === 6;
  const isSaturday = dayIndex === 5;

  return (
    <div
      className="
      text-center py-12
      bg-black/20 
      border border-white/10 
      rounded-xl
    "
    >
      <div className="text-6xl mb-4">{isSunday || isSaturday ? '🧘' : '😴'}</div>
      <h4 className="text-xl font-semibold text-white mb-2">{dayName}</h4>
      <p className="text-gray-400">
        {isSunday
          ? 'Stretching & Recupero attivo'
          : isSaturday
          ? 'Riposo o attività leggera'
          : 'Giorno di riposo'}
      </p>
      <p className="text-sm text-gray-500 mt-4">
        {isSunday || isSaturday
          ? 'Prenditi cura del tuo corpo con stretching leggero'
          : 'Il riposo è fondamentale per la crescita muscolare'}
      </p>
    </div>
  );
}

/**
 * Contenuto per giorno di allenamento
 */
interface WorkoutDayContentProps {
  workout: any;
}

function WorkoutDayContent({ workout }: WorkoutDayContentProps) {
  const exercises = workout.exercises || workout.esercizi || [];
  const workoutName = workout.name || workout.nome || 'Workout';

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white">{workoutName}</h4>

      {exercises.length > 0 ? (
        <div className="space-y-3">
          {exercises.map((exercise: any, exIndex: number) => {
            const name = exercise.nome || exercise.name || 'Esercizio';
            const sets = exercise.serie || exercise.sets || 3;
            const reps = exercise.ripetizioni || exercise.reps || 12;

            return (
              <div
                key={exIndex}
                className="
                  bg-black/30 
                  border border-white/10 
                  rounded-lg p-4
                  flex items-center justify-between
                "
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-white">{name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {sets}x{reps}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Nessun esercizio disponibile per questo giorno
        </p>
      )}
    </div>
  );
}

/**
 * Calcola durata workout (stima)
 */
function calculateWorkoutDuration(exercises: any[]): number {
  // Stima: 3 minuti per esercizio (serie + recupero)
  return exercises.length * 3;
}

