import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Video, Users, Euro, MessageCircle, Calendar, X, ChevronLeft, ChevronRight, Ban, CheckCircle, Plus, GraduationCap } from 'lucide-react';
import { getProfessionalById, Professional, getCategoryLabel, getCategoryIcon } from '@/services/professionalsService';
import { useBlockedPeriods } from '@/hooks/useBlockedPeriods';
import { availabilityOverrideService, type AvailabilityOverride } from '@/services/availabilityOverrideService';
import { toast } from 'sonner';
import { getReviewsByProfessional, Review, getAvailableBookingsForReview, hasUserReviewedProfessional } from '@/services/reviewsService';
import { useAuth } from '@/hooks/useAuth';
import ReviewForm from '@/components/user/ReviewForm';

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

const ProfessionalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [availableBookings, setAvailableBookings] = useState<Array<{ id: string; booking_date: string; booking_time: string; service_name?: string | null }>>([]);
  const [canReview, setCanReview] = useState(false);
  const [checkingCanReview, setCheckingCanReview] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingStep, setBookingStep] = useState<'calendar' | 'time' | 'confirm'>('calendar');
  const [blockedSlotsForDate, setBlockedSlotsForDate] = useState<AvailabilityOverride[]>([]);

  // Calcola range date per il mese corrente (per ottimizzare fetch blocchi)
  const monthDateRange = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const formatDate = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    return {
      startDate: formatDate(firstDay),
      endDate: formatDate(lastDay),
    };
  }, [currentMonth]);

  // Fetch giorni bloccati per il professionista
  const { isDateBlocked, loading: loadingBlocks } = useBlockedPeriods({
    professionalId: professional?.id || null,
    startDate: monthDateRange.startDate,
    endDate: monthDateRange.endDate,
    autoFetch: !!professional?.id,
  });

  // Fetch fasce orarie bloccate per la data selezionata (per step orario prenotazione)
  useEffect(() => {
    if (!professional?.id || !selectedDate) {
      setBlockedSlotsForDate([]);
      return;
    }
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    availabilityOverrideService
      .getBlockedSlots(professional.id, dateStr, dateStr)
      .then(setBlockedSlotsForDate)
      .catch(() => setBlockedSlotsForDate([]));
  }, [professional?.id, selectedDate]);

  useEffect(() => {
    const loadProfessional = async () => {
      if (!id) return;
      setLoading(true);
      const data = await getProfessionalById(id);
      setProfessional(data);
      setLoading(false);
    };
    loadProfessional();
  }, [id]);

  // Fetch recensioni quando professional è caricato
  useEffect(() => {
    const loadReviews = async () => {
      if (!professional?.id) return;
      setReviewsLoading(true);
      try {
        const reviewsData = await getReviewsByProfessional(professional.id);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Errore caricamento recensioni:', error);
      } finally {
        setReviewsLoading(false);
      }
    };
    loadReviews();
  }, [professional?.id]);

  // Verifica se l'utente può lasciare una recensione
  useEffect(() => {
    const checkCanReview = async () => {
      if (!user?.id || !professional?.id) {
        setCanReview(false);
        return;
      }

      setCheckingCanReview(true);
      try {
        // Verifica booking completati disponibili
        const bookings = await getAvailableBookingsForReview(user.id, professional.id);
        setAvailableBookings(bookings);

        // L'utente può lasciare recensione se:
        // 1. Ha booking completati senza recensione, OPPURE
        // 2. Non ha ancora lasciato una recensione generale (senza booking_id)
        const hasGeneralReview = await hasUserReviewedProfessional(user.id, professional.id);
        
        setCanReview(bookings.length > 0 || !hasGeneralReview);
        
        // Seleziona il primo booking disponibile (se ce ne sono)
        if (bookings.length > 0) {
          setSelectedBookingId(bookings[0].id);
        } else {
          setSelectedBookingId(null);
        }
      } catch (error) {
        console.error('Errore verifica possibilità recensione:', error);
        setCanReview(false);
      } finally {
        setCheckingCanReview(false);
      }
    };

    checkCanReview();
  }, [user?.id, professional?.id]);

  // Scroll in alto quando la pagina si carica
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EEBA2B]"></div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">Professionista non trovato</p>
        <button 
          onClick={() => navigate('/professionals')}
          className="text-[#EEBA2B] hover:underline"
        >
          ← Torna ai professionisti
        </button>
      </div>
    );
  }

  const categoryIcon = getCategoryIcon(professional.category);
  const modalitaLabel = professional.modalita === 'online' ? 'Solo Online' : 
                        professional.modalita === 'presenza' ? 'Solo in Presenza' : 'Online + Presenza';

  // Genera i giorni del mese corrente
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Domenica
    
    const days: (Date | null)[] = [];
    
    // Aggiungi giorni vuoti per allineare al giorno della settimana
    for (let i = 0; i < (startingDay === 0 ? 6 : startingDay - 1); i++) {
      days.push(null);
    }
    
    // Aggiungi i giorni del mese
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Converte Date in stringa YYYY-MM-DD senza problemi di timezone
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Verifica se un giorno è disponibile
  const isDayAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();
    
    // Non disponibile se: passato, domenica, o bloccato dal professionista
    if (date < today) return false;
    if (dayOfWeek === 0) return false; // Domenica
    if (isDateBlocked(date)) return false; // Giorno bloccato
    
    return true;
  };

  // Verifica se un giorno è bloccato
  const isDayBlocked = (date: Date) => {
    return isDateBlocked(date);
  };

  // Verifica se un giorno è oggi
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Verifica se un giorno è selezionato
  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  // Formatta il mese per l'header
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

  // Slot orari disponibili (demo) - quelli non coperti da blocchi orari del professionista
  const TIME_SLOTS_BASE = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];
  const isTimeSlotBlocked = (slotTime: string, overrides: AvailabilityOverride[]): boolean =>
    overrides.some((o) => slotTime >= o.start_time && slotTime < o.end_time);
  const TIME_SLOTS = TIME_SLOTS_BASE.filter((t) => !isTimeSlotBlocked(t, blockedSlotsForDate));

  // Naviga al mese precedente
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // Naviga al mese successivo
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Seleziona un giorno
  const handleDayClick = (date: Date) => {
    if (!isDayAvailable(date)) {
      if (isDayBlocked(date)) {
        toast.error('Questo giorno non è disponibile per prenotazioni. Il professionista ha bloccato questa data.');
      }
      return;
    }
    setSelectedDate(date);
    setBookingStep('time');
  };

  // Seleziona un orario
  const handleTimeClick = (time: string) => {
    setSelectedTime(time);
    setBookingStep('confirm');
  };

  // Conferma prenotazione
  const handleConfirmBooking = () => {
    // Per ora mostra solo un alert, in futuro salverà nel database
    alert(`Prenotazione confermata!\n\n📅 ${selectedDate?.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n⏰ ${selectedTime}\n👤 ${professional.first_name} ${professional.last_name}`);
    
    // Reset e chiudi
    setShowBookingModal(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingStep('calendar');
  };

  // Reset booking modal
  const handleCloseBooking = () => {
    setShowBookingModal(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingStep('calendar');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pb-24">
      {/* Header con back button */}
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => navigate('/professionals')}
            className="flex items-center gap-2 text-gray-400 hover:text-[#EEBA2B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Torna ai professionisti</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* HEADER PROFILO */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Foto */}
            <div className="flex-shrink-0">
              {professional.foto_url ? (
                <img 
                  src={professional.foto_url} 
                  alt={`${professional.first_name} ${professional.last_name}`}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 
                              border-2 border-gray-700 flex items-center justify-center text-4xl">
                  {categoryIcon}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                {/* Badge Partner */}
                {professional.is_partner && (
                  <div className="inline-flex items-center gap-1 bg-gradient-to-r from-[#EEBA2B] to-yellow-500 
                                  text-black font-bold text-sm px-4 py-1.5 rounded-full mb-2">
                    <span>🏆</span>
                    <span>Partner Performance Prime</span>
                  </div>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {professional.first_name} {professional.last_name}
                </h1>
                <p className="text-[#EEBA2B] font-medium text-lg">{getCategoryLabel(professional.category)}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold">{professional.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">({professional.reviews_count} recensioni)</span>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{professional.zona || 'Non specificata'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  <span>{modalitaLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Euro className="w-4 h-4" />
                  <span>{professional.prezzo_fascia}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="flex items-center gap-2 bg-transparent border-2 border-[#EEBA2B] text-[#EEBA2B] 
                           font-bold py-3 px-6 rounded-xl hover:bg-[#EEBA2B] hover:text-black transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contatta
                </button>
                <button 
                  onClick={() => setShowBookingModal(true)}
                  className="flex items-center gap-2 bg-[#EEBA2B] text-black font-bold py-3 px-6 rounded-xl 
                           hover:bg-yellow-400 transition-all hover:shadow-[0_0_20px_rgba(238,186,43,0.4)]"
                >
                  <Calendar className="w-5 h-5" />
                  Prenota
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CHI SONO */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📝 Chi sono
          </h2>
          <p className="text-gray-300 leading-relaxed break-words whitespace-normal overflow-hidden">
            {professional.bio || 'Nessuna descrizione disponibile.'}
          </p>
        </div>

        {/* SPECIALIZZAZIONI */}
        {professional.specializzazioni && professional.specializzazioni.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🎯 Specializzazioni
            </h2>
            <div className="flex flex-wrap gap-2">
              {professional.specializzazioni.map((spec, index) => (
                <span 
                  key={index}
                  className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm border border-gray-700
                           hover:border-[#EEBA2B] hover:text-[#EEBA2B] transition-colors"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* FORMAZIONE (titoli di studio) */}
        {(() => {
          const titoli = professional.titolo_studio
            ? (Array.isArray(professional.titolo_studio) ? professional.titolo_studio : [professional.titolo_studio])
            : [];
          return titoli.length > 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#EEBA2B]" />
                Formazione
              </h2>
              <ul className="space-y-2">
                {titoli.map((titolo, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-gray-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EEBA2B] flex-shrink-0" />
                    {titolo}
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}

        {/* INFORMAZIONI */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📊 Informazioni
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-300">
              <MapPin className="w-5 h-5 text-[#EEBA2B]" />
              <div>
                <p className="text-gray-500 text-sm">Zona</p>
                <p>{professional.zona || 'Non specificata'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Video className="w-5 h-5 text-[#EEBA2B]" />
              <div>
                <p className="text-gray-500 text-sm">Modalità</p>
                <p>{modalitaLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Euro className="w-5 h-5 text-[#EEBA2B]" />
              <div>
                <p className="text-gray-500 text-sm">Fascia prezzo</p>
                <p>{professional.prezzo_fascia} {professional.prezzo_fascia === '€' ? '(Economico)' : professional.prezzo_fascia === '€€' ? '(Medio)' : '(Premium)'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Users className="w-5 h-5 text-[#EEBA2B]" />
              <div>
                <p className="text-gray-500 text-sm">Clienti seguiti</p>
                <p>{professional.reviews_count}+ clienti</p>
              </div>
            </div>
          </div>
        </div>

        {/* RECENSIONI */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ⭐ Recensioni ({professional.reviews_count})
            </h2>
            {canReview && user && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#EEBA2B] text-black rounded-lg font-semibold hover:bg-[#d4a827] transition-colors text-sm"
                disabled={checkingCanReview}
              >
                <Plus className="w-4 h-4" />
                Lascia Recensione
              </button>
            )}
          </div>
          
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#EEBA2B]"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-4">Nessuna recensione ancora</p>
              {canReview && user && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEBA2B] text-black rounded-lg font-semibold hover:bg-[#d4a827] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Sii il primo a lasciare una recensione
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  {/* Stelle con badge e data sulla stessa riga */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {review.is_verified && (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Verificata
                        </span>
                      )}
                      <span className="text-gray-500 text-sm">{formatRelativeDate(review.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Nome utente */}
                  <div className="mb-3">
                    <span className="text-white font-medium">{getUserDisplayName(review)}</span>
                  </div>
                  
                  {/* Titolo */}
                  {review.title && (
                    <h3 className="text-white font-semibold text-sm mb-2">{review.title}</h3>
                  )}
                  
                  {/* Commento */}
                  {review.comment && (
                    <p className="text-gray-300 text-sm mb-3">{review.comment}</p>
                  )}
                  
                  {/* Risposta professionista */}
                  {review.response && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#EEBA2B] font-semibold text-xs">Risposta del professionista</span>
                        {review.response_at && (
                          <span className="text-gray-500 text-xs">{formatRelativeDate(review.response_at)}</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{review.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODAL CONTATTA */}
      {showContactModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-[0_0_30px_rgba(238,186,43,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                📞 Contatta {professional.first_name}
              </h3>
              <button 
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opzioni contatto */}
            <div className="space-y-3">
              {/* WhatsApp */}
              <a 
                href={`https://wa.me/393331234567?text=Ciao ${professional.first_name}, ti contatto tramite Performance Prime per avere informazioni sui tuoi servizi.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-green-600 text-white font-bold py-4 px-6 rounded-xl 
                         hover:bg-green-500 transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>

              {/* Email */}
              <a 
                href={`mailto:${professional.email || 'info@performanceprime.it'}?subject=Richiesta informazioni - Performance Prime&body=Ciao ${professional.first_name},%0D%0A%0D%0ATi contatto tramite Performance Prime per avere informazioni sui tuoi servizi.%0D%0A%0D%0AGrazie!`}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-4 px-6 rounded-xl 
                         hover:bg-blue-500 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
            </div>

            {/* Nota */}
            <p className="text-gray-500 text-sm text-center mt-6">
              Il professionista ti risponderà il prima possibile
            </p>
          </div>
        </div>
      )}

      {/* MODAL PRENOTA */}
      {showBookingModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleCloseBooking}
        >
          <div 
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-[0_0_30px_rgba(238,186,43,0.2)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                📅 Prenota con {professional.first_name}
              </h3>
              <button 
                onClick={handleCloseBooking}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: Calendario */}
            {bookingStep === 'calendar' && (
              <div>
                {/* Navigazione mese */}
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={prevMonth}
                    className="p-2 text-gray-400 hover:text-[#EEBA2B] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-white font-medium capitalize">{formatMonth(currentMonth)}</span>
                  <button 
                    onClick={nextMonth}
                    className="p-2 text-gray-400 hover:text-[#EEBA2B] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Header giorni settimana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                    <div key={day} className="text-center text-gray-500 text-xs font-medium py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Griglia giorni */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    if (!date) {
                      return <div key={index} className="aspect-square" />;
                    }
                    
                    const available = isDayAvailable(date);
                    const blocked = isDayBlocked(date);
                    const selected = isSelected(date);
                    const today = isToday(date);
                    
                    return (
                      <div key={index} className="aspect-square relative">
                        <button
                          onClick={() => handleDayClick(date)}
                          disabled={!available}
                          className={`w-full h-full rounded-lg text-sm font-medium transition-all relative
                            ${available 
                              ? 'hover:bg-[#EEBA2B] hover:text-black cursor-pointer' 
                              : 'text-gray-600 cursor-not-allowed'
                            }
                            ${selected 
                              ? 'bg-[#EEBA2B] text-black' 
                              : available 
                                ? 'text-white bg-gray-800' 
                                : blocked
                                  ? 'bg-red-900/30 text-red-400 line-through'
                                  : 'bg-transparent'
                            }
                            ${today && !selected ? 'ring-2 ring-[#EEBA2B]' : ''}
                          `}
                        >
                          {date.getDate()}
                        </button>
                        {/* Indicatore giorno bloccato */}
                        {blocked && (
                          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                            <Ban className="w-3 h-3 text-red-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legenda */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-800"></div>
                    <span>Disponibile</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded ring-2 ring-[#EEBA2B]"></div>
                    <span>Oggi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-900/30"></div>
                    <Ban className="w-3 h-3 text-red-500" />
                    <span>Non disponibile</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Selezione orario */}
            {bookingStep === 'time' && selectedDate && (
              <div>
                {/* Back button */}
                <button 
                  onClick={() => setBookingStep('calendar')}
                  className="flex items-center gap-1 text-gray-400 hover:text-[#EEBA2B] transition-colors mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Cambia data</span>
                </button>

                {/* Data selezionata */}
                <div className="bg-gray-800 rounded-xl p-4 mb-4">
                  <p className="text-gray-400 text-sm">Data selezionata</p>
                  <p className="text-white font-bold capitalize">
                    {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>

                {/* Slot orari (esclusi quelli in fasce bloccate dal professionista) */}
                <p className="text-white font-medium mb-3">Seleziona un orario:</p>
                {TIME_SLOTS.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-gray-400 text-sm">Nessun orario disponibile in questa data.</p>
                    <p className="text-gray-500 text-xs mt-1">Il professionista ha bloccato le fasce orarie.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeClick(time)}
                        className={`py-3 px-4 rounded-lg font-medium transition-all
                          ${selectedTime === time 
                            ? 'bg-[#EEBA2B] text-black' 
                            : 'bg-gray-800 text-white hover:bg-gray-700'
                          }
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Conferma */}
            {bookingStep === 'confirm' && selectedDate && selectedTime && (
              <div>
                {/* Back button */}
                <button 
                  onClick={() => setBookingStep('time')}
                  className="flex items-center gap-1 text-gray-400 hover:text-[#EEBA2B] transition-colors mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Cambia orario</span>
                </button>

                {/* Riepilogo */}
                <div className="bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
                  <h4 className="text-white font-bold text-lg">Riepilogo prenotazione</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <span>👤</span>
                      <span>{professional.first_name} {professional.last_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span>📅</span>
                      <span className="capitalize">{selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span>⏰</span>
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span>📍</span>
                      <span>{professional.zona || 'Da definire'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottone conferma */}
                <button
                  onClick={handleConfirmBooking}
                  className="w-full bg-[#EEBA2B] text-black font-bold py-4 px-6 rounded-xl 
                           hover:bg-yellow-400 transition-all hover:shadow-[0_0_20px_rgba(238,186,43,0.4)]"
                >
                  ✅ Conferma prenotazione
                </button>

                <p className="text-gray-500 text-sm text-center mt-4">
                  Riceverai una conferma via email
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL REVIEW FORM */}
      {showReviewForm && professional && user && (
        <ReviewForm
          professionalId={professional.id}
          bookingId={selectedBookingId}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            // Ricarica recensioni dopo la creazione
            const loadReviews = async () => {
              if (!professional?.id) return;
              try {
                const reviewsData = await getReviewsByProfessional(professional.id);
                setReviews(reviewsData);
                // Ricarica anche il professionista per aggiornare reviews_count
                const updatedProfessional = await getProfessionalById(professional.id);
                if (updatedProfessional) {
                  setProfessional(updatedProfessional);
                }
              } catch (error) {
                console.error('Errore ricaricamento recensioni:', error);
              }
            };
            loadReviews();
            // Ricarica anche la verifica canReview
            setCanReview(false);
            const checkCanReview = async () => {
              if (!user?.id || !professional?.id) return;
              try {
                const bookings = await getAvailableBookingsForReview(user.id, professional.id);
                setAvailableBookings(bookings);
                const hasGeneralReview = await hasUserReviewedProfessional(user.id, professional.id);
                setCanReview(bookings.length > 0 || !hasGeneralReview);
                if (bookings.length > 0) {
                  setSelectedBookingId(bookings[0].id);
                } else {
                  setSelectedBookingId(null);
                }
              } catch (error) {
                console.error('Errore verifica possibilità recensione:', error);
              }
            };
            checkCanReview();
          }}
        />
      )}
    </div>
  );
};

export default ProfessionalDetail;

