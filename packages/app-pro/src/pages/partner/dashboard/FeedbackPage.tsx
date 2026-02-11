/**
 * Pagina Feedback dashboard: il professionista invia feedback nella stessa tabella
 * landing_feedbacks con source = 'dashboard'.
 */

import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FEEDBACK_TYPES = [
  { value: 'Suggerimento', label: 'Suggerimento' },
  { value: 'Bug/Problema', label: 'Bug/Problema' },
  { value: 'Complimento', label: 'Complimento' },
  { value: 'Altro', label: 'Altro' },
] as const;

const MIN_MESSAGE_LENGTH = 10;

export default function FeedbackPage() {
  const [tipo, setTipo] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [senderName, setSenderName] = useState('Professionista (Dashboard)');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.full_name?.trim()) {
        setSenderName(profile.full_name.trim());
      }
    };
    loadProfile();
  }, []);

  const canSubmit =
    tipo &&
    rating >= 1 &&
    message.trim().length >= MIN_MESSAGE_LENGTH &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('landing_feedbacks').insert({
        name: senderName,
        category: tipo,
        rating,
        comment: message.trim().slice(0, 500),
        is_approved: false,
        source: 'dashboard',
      });
      if (error) throw error;
      toast.success('Feedback inviato! Grazie per il tuo contributo.');
      setTipo('');
      setRating(0);
      setMessage('');
    } catch (err) {
      console.error('Feedback error:', err);
      toast.error('Errore durante l\'invio. Riprova più tardi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Invia Feedback</h1>
      <p className="mt-1 text-gray-600">Il tuo parere ci aiuta a migliorare PrimePro</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo feedback *</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 bg-white focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none"
            required
          >
            <option value="">Seleziona...</option>
            {FEEDBACK_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Voto esperienza (1-5 stelle) *</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-[#EEBA2B]/50"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-8 h-8 cursor-pointer transition-colors ${
                    star <= (hoverRating || rating) ? 'text-[#EEBA2B] fill-[#EEBA2B]' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Messaggio * (min. 10 caratteri)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scrivi qui il tuo feedback..."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#EEBA2B] focus:border-[#EEBA2B] outline-none resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{message.length}/500</p>
          {message.length > 0 && message.length < MIN_MESSAGE_LENGTH && (
            <p className="text-xs text-amber-600 mt-1">Inserisci almeno {MIN_MESSAGE_LENGTH} caratteri</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 px-4 bg-[#EEBA2B] hover:bg-[#d4a826] text-black font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Invio in corso...
            </>
          ) : (
            'Invia Feedback'
          )}
        </button>
      </form>
    </div>
  );
}
