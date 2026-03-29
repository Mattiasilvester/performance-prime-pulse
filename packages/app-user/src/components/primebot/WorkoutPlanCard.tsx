import { useState, useEffect } from 'react';
import { type StructuredWorkoutPlan } from '@/services/workoutPlanGenerator';
import { ExerciseGifLink } from '@/components/workouts/ExerciseGifLink';
import { downloadWorkoutPlanPDF } from '@/utils/pdfExport';
import PlanFeedbackButtons from '@/components/plans/PlanFeedbackButtons';
import { getFeedback, deleteFeedback, type Vote } from '@/services/planFeedbackService';
import { toast } from 'sonner';

export interface WorkoutPlanCardProps {
  plan: StructuredWorkoutPlan;
  planId?: string;
  userId: string;
}

export default function WorkoutPlanCard({ plan, planId, userId }: WorkoutPlanCardProps) {
  const [feedbackVote, setFeedbackVote] = useState<Vote | null>(null);
  const [feedbackFetched, setFeedbackFetched] = useState(false);

  useEffect(() => {
    if (!planId || !userId || feedbackFetched) return;
    getFeedback(planId, userId)
      .then((result) => {
        setFeedbackVote(result?.vote ?? null);
        setFeedbackFetched(true);
      })
      .catch(() => setFeedbackFetched(true));
  }, [planId, userId, feedbackFetched]);

  const handleResetVote = async () => {
    if (!planId) return;
    try {
      await deleteFeedback(planId, userId);
      setFeedbackVote(null);
    } catch {
      toast.error('Errore nel reset del voto');
    }
  };

  return (
    <div className="mt-4 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-[#EEBA2B] rounded-xl p-4">
      <h3 className="text-xl font-bold text-[#EEBA2B] mb-2">
        {plan.name}
      </h3>
      {plan.description && (
        <p className="text-gray-300 text-sm mb-3">{plan.description}</p>
      )}

      {/* Consigli Terapeutici - Mostra PRIMA degli esercizi se presenti */}
      {plan.therapeuticAdvice && plan.therapeuticAdvice.length > 0 && (
        <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4 mb-4">
          <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
            💡 Consigli per il tuo dolore
          </h4>
          <ul className="space-y-2 text-sm text-gray-300">
            {plan.therapeuticAdvice.map((advice: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{advice}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Note di Sicurezza */}
      {plan.safetyNotes && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-4">
          <p className="text-blue-300 text-sm">
            <span className="font-semibold">ℹ️ Nota di sicurezza:</span> {plan.safetyNotes}
          </p>
        </div>
      )}

      {/* Info Piano */}
      <div className="flex gap-4 mb-4 text-sm text-gray-400">
        <span>⏱️ {plan.duration_minutes} min</span>
        <span>💪 {plan.exercises.length} esercizi</span>
        <span>📊 {plan.difficulty}</span>
      </div>

      {/* Lista Esercizi */}
      <div className="space-y-2 mb-4">
        {plan.exercises.map((ex, idx) => (
          <div key={idx} className="bg-gray-700/50 rounded-lg p-3 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-medium">{ex.name}</span>
              </div>
              <div className="text-gray-300 text-sm">
                <span className="font-semibold text-[#EEBA2B]">{ex.sets}x{ex.reps}</span>
                {' • '}
                <span>Recupero: {ex.rest_seconds}s</span>
              </div>
              {ex.notes && (
                <p className="text-gray-400 text-xs mt-1 italic">{ex.notes}</p>
              )}
            </div>
            {/* Bottone GIF a destra */}
            <div className="ml-3 flex-shrink-0">
              <ExerciseGifLink exerciseName={ex.name} />
            </div>
          </div>
        ))}
      </div>

      {/* Warmup e Cooldown */}
      {(plan.warmup || plan.cooldown) && (
        <div className="space-y-2 mb-4 text-sm">
          {plan.warmup && (
            <div className="bg-blue-900/30 rounded-lg p-2">
              <span className="text-blue-300 font-semibold">🔥 Warmup:</span>
              <p className="text-gray-300 mt-1">{plan.warmup}</p>
            </div>
          )}
          {plan.cooldown && (
            <div className="bg-green-900/30 rounded-lg p-2">
              <span className="text-green-300 font-semibold">🧘 Cooldown:</span>
              <p className="text-gray-300 mt-1">{plan.cooldown}</p>
            </div>
          )}
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-gray-600 flex items-center gap-2">
        {feedbackVote !== null && (
          <button
            type="button"
            onClick={handleResetVote}
            title="Cambia voto"
            aria-label={
              feedbackVote === 1
                ? 'Hai trovato utile questo piano. Clicca per cambiare voto'
                : 'Hai trovato questo piano da migliorare. Clicca per cambiare voto'
            }
            style={{
              background: '#1e1e24',
              border: '1px solid #2a2a2e',
              borderRadius: 10,
              padding: '8px 10px',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {feedbackVote === 1 ? '👍' : '👎'}
          </button>
        )}
        <button
          type="button"
          onClick={() => downloadWorkoutPlanPDF(plan)}
          className="flex items-center gap-2 rounded-lg bg-[#EEBA2B] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
        >
          📥 Scarica PDF
        </button>
      </div>
      {planId && feedbackVote === null && (
        <PlanFeedbackButtons
          planId={planId}
          userId={userId}
          planType="workout"
          onVote={(vote) => setFeedbackVote(vote)}
        />
      )}
    </div>
  );
}
