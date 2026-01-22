// src/components/partner/reviews/ReviewList.tsx

import React from 'react';
import { Star, Filter } from 'lucide-react';
import { Review } from '@/services/reviewsService';
import ReviewCard from './ReviewCard';

interface ReviewListProps {
  reviews: Review[];
  loading: boolean;
  onRespond: (review: Review) => void;
  ratingFilter: number | null;
  onRatingFilterChange: (rating: number | null) => void;
}

export default function ReviewList({
  reviews,
  loading,
  onRespond,
  ratingFilter,
  onRatingFilterChange
}: ReviewListProps) {
  // Filtra recensioni per rating se selezionato
  const filteredReviews = ratingFilter
    ? reviews.filter(r => r.rating === ratingFilter)
    : reviews;

  // Calcola statistiche
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: totalReviews > 0
      ? Math.round((reviews.filter(r => r.rating === rating).length / totalReviews) * 100)
      : 0
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#EEBA2B]"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg font-medium mb-2">Nessuna recensione ancora</p>
        <p className="text-gray-400 text-sm">Le recensioni dei tuoi clienti appariranno qui</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiche */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rating Medio */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Rating Medio</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">{averageRating}</span>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
            </div>
          </div>

          {/* Totale Recensioni */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Totale Recensioni</p>
            <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
          </div>

          {/* Recensioni Verificate */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Recensioni Verificate</p>
            <p className="text-3xl font-bold text-gray-900">
              {reviews.filter(r => r.is_verified).length}
            </p>
          </div>
        </div>

        {/* Distribuzione Rating */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Distribuzione Rating</p>
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm text-gray-600">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#EEBA2B] h-full rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        {/* Mobile: layout verticale (testo sopra, bottoni sotto) */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtra per rating:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onRatingFilterChange(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                ratingFilter === null
                  ? 'bg-[#EEBA2B] text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutte
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => onRatingFilterChange(rating)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  ratingFilter === rating
                    ? 'bg-[#EEBA2B] text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className={`w-3 h-3 ${ratingFilter === rating ? 'fill-black' : ''}`} />
                {rating}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: layout orizzontale (tutto su una riga) */}
        <div className="hidden md:flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtra per rating:</span>
          </div>
          <button
            onClick={() => onRatingFilterChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              ratingFilter === null
                ? 'bg-[#EEBA2B] text-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutte
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => onRatingFilterChange(rating)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                ratingFilter === rating
                  ? 'bg-[#EEBA2B] text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star className={`w-3 h-3 ${ratingFilter === rating ? 'fill-black' : ''}`} />
              {rating}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Recensioni */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Nessuna recensione con questo rating</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onRespond={onRespond}
            />
          ))
        )}
      </div>
    </div>
  );
}
