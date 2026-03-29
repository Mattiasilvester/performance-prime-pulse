import { useState } from 'react';
import { toast } from 'sonner';
import {
  upsertFeedback,
  type PlanType,
  type Vote,
} from '@/services/planFeedbackService';

export interface PlanFeedbackButtonsProps {
  planId: string;
  userId: string;
  planType: PlanType;
  initialVote?: Vote | null;
  onVote: (vote: Vote, notes?: string) => void;
}

export default function PlanFeedbackButtons({
  planId,
  userId,
  planType,
  onVote,
}: PlanFeedbackButtonsProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleThumbsUp = async () => {
    setLoading(true);
    try {
      await upsertFeedback(planId, userId, planType, 1);
      onVote(1);
      toast.success('Grazie per il feedback!');
    } catch {
      toast.error('Errore nel salvataggio del feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbsDown = () => {
    setShowNotes(true);
  };

  const handleSubmitNegative = async () => {
    setLoading(true);
    try {
      await upsertFeedback(
        planId,
        userId,
        planType,
        -1,
        notes.trim() || undefined
      );
      onVote(-1, notes.trim() || undefined);
      toast.success('Grazie per il feedback!');
    } catch {
      toast.error('Errore nel salvataggio del feedback');
    } finally {
      setLoading(false);
    }
  };

  const baseBtn = {
    background: 'transparent',
    border: '1px solid #2a2a2e',
    color: '#8A8A96',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 12,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 4,
    transition: 'all 0.15s ease',
    cursor: 'pointer',
  };

  if (showNotes) {
    return (
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <p style={{ fontSize: 11, color: '#8A8A96', textAlign: 'center' }}>
          Cosa non ha funzionato? (opzionale)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scrivi qui il tuo feedback..."
          rows={2}
          style={{
            background: '#0A0A0C',
            border: '1px solid #2a2a2e',
            borderRadius: 10,
            padding: '8px 10px',
            color: '#ffffff',
            fontSize: 12,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            width: '100%',
          }}
        />
        <button
          type="button"
          onClick={handleSubmitNegative}
          disabled={loading}
          style={{
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '8px 0',
            width: '100%',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          Invia feedback
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <p style={{ fontSize: 11, color: '#8A8A96', textAlign: 'center' }}>
        Questo piano ti è stato utile?
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleThumbsUp}
          disabled={loading}
          style={baseBtn}
        >
          👍 Utile
        </button>
        <button
          type="button"
          onClick={handleThumbsDown}
          disabled={loading}
          style={baseBtn}
        >
          👎 Da migliorare
        </button>
      </div>
    </div>
  );
}
