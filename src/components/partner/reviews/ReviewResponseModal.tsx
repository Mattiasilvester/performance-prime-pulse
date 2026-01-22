// src/components/partner/reviews/ReviewResponseModal.tsx

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, MessageSquare } from 'lucide-react';
import { respondToReview, Review } from '@/services/reviewsService';
import { toast } from 'sonner';

interface ReviewResponseModalProps {
  review: Review;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewResponseModal({
  review,
  onClose,
  onSuccess
}: ReviewResponseModalProps) {
  const [response, setResponse] = useState(review.response || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (response.trim().length < 5) {
      toast.error('La risposta deve contenere almeno 5 caratteri');
      return;
    }

    setLoading(true);

    try {
      const result = await respondToReview(review.id, { response: response.trim() });

      if (result) {
        toast.success('Risposta pubblicata con successo!');
        onSuccess();
        onClose();
      } else {
        toast.error('Errore nel salvataggio della risposta');
      }
    } catch (error: any) {
      console.error('Errore risposta recensione:', error);
      toast.error('Errore nel salvataggio della risposta');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EEBA2B]/10 rounded-xl">
              <MessageSquare className="w-5 h-5 text-[#EEBA2B]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {review.response ? 'Modifica Risposta' : 'Rispondi alla Recensione'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Recensione originale (solo lettura) */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-600 text-sm font-medium">Recensione originale:</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            {review.title && (
              <h4 className="text-gray-900 font-semibold text-sm mb-1">{review.title}</h4>
            )}
            {review.comment && (
              <p className="text-gray-700 text-sm">{review.comment}</p>
            )}
          </div>

          {/* Textarea risposta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              La tua risposta *
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Scrivi una risposta professionale e cortese..."
              rows={5}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="text-gray-500 text-xs mt-1">
              {response.length} / minimo 5 caratteri
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#EEBA2B] text-black rounded-lg font-semibold hover:bg-[#d4a827] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || response.trim().length < 5}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                'Pubblica Risposta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
