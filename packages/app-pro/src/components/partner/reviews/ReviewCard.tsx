// src/components/partner/reviews/ReviewCard.tsx

import React from 'react';
import { Star, CheckCircle, MessageSquare } from 'lucide-react';
import { Review } from '@pp/shared';

interface ReviewCardProps {
  review: Review;
  onRespond?: (review: Review) => void;
}

// Helper per formattare data relativa
const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Oggi';
  if (diffInDays === 1) return 'Ieri';
  if (diffInDays < 7) return `${diffInDays} giorni fa`;
  if (diffInDays < 14) return '1 settimana fa';
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} settimane fa`;
  if (diffInDays < 60) return '1 mese fa';
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} mesi fa`;
  return `${Math.floor(diffInDays / 365)} anni fa`;
};

// Helper per ottenere nome utente
const getUserDisplayName = (review: Review): string => {
  if (review.user?.full_name) return review.user.full_name;
  if (review.user?.first_name && review.user?.last_name) {
    return `${review.user.first_name} ${review.user.last_name}`;
  }
  if (review.user?.first_name) return review.user.first_name;
  return 'Utente';
};

export default function ReviewCard({ review, onRespond }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Stelle con badge e data sulla stessa riga */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < review.rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {review.is_verified && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              <CheckCircle className="w-3 h-3" />
              Verificata
            </span>
          )}
          <span className="text-gray-500 text-sm">{formatRelativeDate(review.created_at)}</span>
        </div>
      </div>

      {/* Nome utente */}
      <div className="mb-3">
        <span className="text-gray-900 font-semibold">{getUserDisplayName(review)}</span>
      </div>

      {/* Titolo */}
      {review.title && (
        <h3 className="text-gray-900 font-semibold text-base mb-2">{review.title}</h3>
      )}

      {/* Commento */}
      {review.comment && (
        <p className="text-gray-700 text-sm mb-4 leading-relaxed">{review.comment}</p>
      )}

      {/* Risposta professionista o bottone rispondi */}
      {review.response ? (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#EEBA2B] font-semibold text-sm">La tua risposta</span>
            {review.response_at && (
              <span className="text-gray-500 text-xs">
                {formatRelativeDate(review.response_at)}
              </span>
            )}
          </div>
          <p className="text-gray-700 text-sm">{review.response}</p>
          {onRespond && (
            <button
              onClick={() => onRespond(review)}
              className="mt-3 text-sm text-[#EEBA2B] hover:text-[#d4a827] font-medium transition-colors"
            >
              Modifica risposta
            </button>
          )}
        </div>
      ) : (
        onRespond && (
          <button
            onClick={() => onRespond(review)}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-[#EEBA2B] text-black rounded-lg font-semibold hover:bg-[#d4a827] transition-colors text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Rispondi alla recensione
          </button>
        )
      )}
    </div>
  );
}
