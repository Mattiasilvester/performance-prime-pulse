// src/components/user/ReviewForm.tsx

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, Loader2 } from 'lucide-react';
import { createReview, CreateReviewData } from '@pp/shared';
import { toast } from 'sonner';
import { useAuth } from '@pp/shared';

interface ReviewFormProps {
  professionalId: string;
  bookingId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewForm({
  professionalId,
  bookingId,
  onClose,
  onSuccess
}: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = 'Seleziona un rating';
    }

    if (comment.trim().length < 10) {
      newErrors.comment = 'Il commento deve contenere almeno 10 caratteri';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      toast.error('Devi essere autenticato per lasciare una recensione');
      return;
    }

    setLoading(true);

    try {
      const reviewData: CreateReviewData = {
        professional_id: professionalId,
        user_id: user.id,
        booking_id: bookingId || null,
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
      };

      const result = await createReview(reviewData);

      if (result) {
        toast.success('Recensione pubblicata con successo!');
        onSuccess();
        onClose();
      } else {
        toast.error('Errore nel salvataggio della recensione');
      }
    } catch (error: unknown) {
      console.error('Errore creazione recensione:', error);
      const err = error as Error;
      // Gestione errori specifici
      if (err.message?.includes('unique_review_per_booking')) {
        toast.error('Hai già lasciato una recensione per questo appuntamento');
      } else {
        toast.error('Errore nel salvataggio della recensione');
      }
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-[#EEBA2B]" />
            Lascia una Recensione
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Valutazione *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                  disabled={loading}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="text-red-400 text-xs mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Titolo (opzionale) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Titolo (opzionale)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es: Ottima esperienza!"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent"
              maxLength={200}
              disabled={loading}
            />
          </div>

          {/* Commento */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Commento *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Condividi la tua esperienza..."
              rows={5}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="text-gray-500 text-xs mt-1">
              {comment.length} / minimo 10 caratteri
            </p>
            {errors.comment && (
              <p className="text-red-400 text-xs mt-1">{errors.comment}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#EEBA2B] text-black rounded-lg font-semibold hover:bg-[#d4a827] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Pubblicazione...
                </>
              ) : (
                'Pubblica Recensione'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
