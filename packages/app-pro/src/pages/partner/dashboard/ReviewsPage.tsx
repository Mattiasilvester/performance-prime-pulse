// src/pages/partner/dashboard/ReviewsPage.tsx
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@pp/shared';
import { useAuth } from '@pp/shared';
import { getReviewsByProfessional, Review, respondToReview } from '@pp/shared';
import ReviewList from '@/components/partner/reviews/ReviewList';
import ReviewResponseModal from '@/components/partner/reviews/ReviewResponseModal';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Carica professional_id
  useEffect(() => {
    loadProfessionalId();
  }, [user]);

  // Fetch recensioni quando professional_id è disponibile
  useEffect(() => {
    if (professionalId) {
      fetchReviews();
    }
  }, [professionalId]);

  const loadProfessionalId = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfessionalId(data.id);
      }
    } catch (error: any) {
      console.error('Errore caricamento professional_id:', error);
      if (error.code !== 'PGRST116') {
        // Ignora se non trovato (utente non è professionista)
      }
    }
  };

  const fetchReviews = async () => {
    if (!professionalId) return;

    setLoading(true);
    try {
      // Fetch tutte le recensioni (anche non visibili) per il professionista
      // Usa getReviewsByProfessional con onlyVisible = false
      const allReviews = await getReviewsByProfessional(professionalId, false);
      setReviews(allReviews);
    } catch (error) {
      console.error('Errore fetch recensioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (review: Review) => {
    setSelectedReview(review);
    setShowResponseModal(true);
  };

  const handleResponseSuccess = () => {
    fetchReviews(); // Ricarica recensioni dopo risposta
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#EEBA2B]/10 rounded-xl">
            <Star className="w-6 h-6 text-[#EEBA2B]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Recensioni</h1>
        </div>
        <p className="text-gray-500">Gestisci e rispondi alle recensioni dei tuoi clienti</p>
      </div>

      {/* Lista Recensioni */}
      <ReviewList
        reviews={reviews}
        loading={loading}
        onRespond={handleRespond}
        ratingFilter={ratingFilter}
        onRatingFilterChange={setRatingFilter}
      />

      {/* Modal Risposta */}
      {showResponseModal && selectedReview && (
        <ReviewResponseModal
          review={selectedReview}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedReview(null);
          }}
          onSuccess={handleResponseSuccess}
        />
      )}
    </div>
  );
}
