import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Target, Search, Filter, Heart, ChevronRight, Star, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MatchQuiz from '@/components/professionals/MatchQuiz';
import { 
  getProfessionals, 
  getMatchedProfessionals,
  Professional,
  ProfessionalWithMatch,
  ProfessionalsFilters,
  PROFESSIONAL_CATEGORIES,
  MODALITA_OPTIONS,
  PREZZO_OPTIONS,
  getCategoryLabel,
  getCategoryIcon
} from '@/services/professionalsService';

const Professionals: React.FC = () => {
  // Auth
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper per renderizzare prezzi (servizi > prezzo_seduta > prezzo_fascia)
  const renderPricing = (professional: Professional) => {
    if (professional.services && professional.services.length > 0) {
      // Mostra primi 2 servizi in tag orizzontali
      return (
        <div className="flex items-center gap-2 flex-wrap">
          {professional.services.slice(0, 2).map((service: { id?: string; name?: string; price?: number }, idx: number) => (
            <span 
              key={service.id || idx}
              className="bg-[#EEBA2B]/20 text-[#EEBA2B] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#EEBA2B]/30"
            >
              {service.name} €{service.price}
            </span>
          ))}
        </div>
      );
    } else if (professional.prezzo_seduta) {
      // Mostra prezzo seduta
      return (
        <span className="text-[#EEBA2B] font-bold text-sm">
          €{professional.prezzo_seduta}/seduta
        </span>
      );
    } else {
      // Fallback a prezzo fascia
      return (
        <span className="text-[#EEBA2B] font-bold text-sm">
          {professional.prezzo_fascia}
        </span>
      );
    }
  };
  
  // State
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPositionRestored, setIsPositionRestored] = useState(false);
  const [filters, setFilters] = useState<ProfessionalsFilters>({
    category: 'tutti',
    modalita: 'tutti',
    prezzo_fascia: 'tutti',
    zona: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [matchMode, setMatchMode] = useState<'list' | 'match'>('list');
  const [matchedProfessionals, setMatchedProfessionals] = useState<ProfessionalWithMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // Fetch professionisti
  useEffect(() => {
    const fetchProfessionals = async () => {
      setLoading(true);
      try {
        const data = await getProfessionals(filters);
        setProfessionals(data);
      } catch (error) {
        console.error('Errore caricamento professionisti:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, [filters]);

  // Ripristina la posizione di scroll quando i professionisti sono caricati
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('professionals_scroll_position');
    
    // Se non c'è posizione salvata, mostra subito
    if (!savedPosition) {
      setIsPositionRestored(true);
      return;
    }
    
    if (!loading && professionals.length > 0) {
      // Scrolla PRIMA di rendere visibile il contenuto
      window.scrollTo({
        top: parseInt(savedPosition),
        behavior: 'instant' as ScrollBehavior // Nessuna animazione
      });
      sessionStorage.removeItem('professionals_scroll_position');
      
      // Mostra il contenuto dopo un breve delay
      requestAnimationFrame(() => {
        setIsPositionRestored(true);
      });
    }
  }, [loading, professionals]);

  // Se non ci sono professionisti e nessuna posizione salvata, mostra subito
  useEffect(() => {
    if (!sessionStorage.getItem('professionals_scroll_position')) {
      setIsPositionRestored(true);
    }
  }, []);

  // Handler filtri
  const handleFilterChange = (key: keyof ProfessionalsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Match Rapido - recupera dati onboarding e calcola match
  const handleMatchRapido = async () => {
    if (!user) return;
    
    setMatchLoading(true);
    try {
      // Recupera dati onboarding utente
      const { data: onboardingData, error } = await supabase
        .from('user_onboarding_responses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Errore recupero onboarding:', error);
        // Se non ci sono dati onboarding, usa valori di default
        const defaultOnboarding = {
          obiettivo: 'tonificare' as const,
          livello_esperienza: 'principiante' as const,
          ha_limitazioni: false,
          consigli_nutrizionali: false
        };
        const results = await getMatchedProfessionals(defaultOnboarding);
        setMatchedProfessionals(results.slice(0, 3)); // SOLO TOP 3
      } else {
        const results = await getMatchedProfessionals(onboardingData || {});
        setMatchedProfessionals(results.slice(0, 3)); // SOLO TOP 3
      }
      
      setMatchMode('match');
    } catch (error) {
      console.error('Errore match rapido:', error);
    } finally {
      setMatchLoading(false);
    }
  };

  // Torna alla lista normale
  const handleBackToList = () => {
    setMatchMode('list');
    setMatchedProfessionals([]);
  };

  // Quando il quiz è completato
  const handleQuizComplete = (results: ProfessionalWithMatch[]) => {
    setShowQuiz(false);
    setMatchedProfessionals(results);
    setMatchMode('match');
  };

  return (
    <div 
      style={{ visibility: isPositionRestored ? 'visible' : 'hidden' }} 
      className="min-h-screen bg-background text-white"
    >
      <div className="px-5 pt-6 pb-4">
        <p className="text-[#8A8A96] mt-0.5" style={{ fontSize: '15px', fontWeight: 400 }}>Trova il professionista perfetto per te</p>
      </div>

      {matchMode === 'list' && (
        <>
          <div className="px-5 flex gap-2.5 mb-4">
            <div className="flex-1 flex items-center gap-2.5 bg-[#1A1A1F] border border-[rgba(255,255,255,0.1)] rounded-[14px] py-2.5 px-3.5">
              <Search className="w-4 h-4 text-[#5C5C66] shrink-0" />
              <input
                type="text"
                placeholder="Cerca città o nome..."
                value={filters.zona || ''}
                onChange={(e) => handleFilterChange('zona', e.target.value)}
                className="flex-1 bg-transparent border-none text-sm text-[#F0EDE8] placeholder:text-[#5C5C66] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="w-11 h-11 rounded-[14px] bg-[#16161A] border border-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0"
            >
              <Filter className="w-4 h-4 text-[#8A8A96]" />
            </button>
          </div>

          <div className="px-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {PROFESSIONAL_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleFilterChange('category', cat.value)}
                className={`shrink-0 py-2 px-4 rounded-full text-xs font-semibold transition-colors ${
                  filters.category === cat.value
                    ? 'bg-[#EEBA2B] text-[#0A0A0C]'
                    : 'bg-[#16161A] text-[#8A8A96]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="px-5 space-y-4 mb-8">
            <div
              className="rounded-[18px] p-5 flex items-center gap-4 cursor-pointer transition-opacity hover:opacity-95"
              style={{ background: 'linear-gradient(135deg, #16161A 0%, rgba(168,85,247,0.06) 100%)', border: '1px solid rgba(168,85,247,0.15)' }}
              onClick={() => setShowQuiz(true)}
            >
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.1)' }}>
                <Heart className="w-6 h-6 text-[#A855F7]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-[#F0EDE8]">Trova il tuo Match</p>
                <p className="text-[13px] text-[#8A8A96] mt-0.5">Quiz rapido per trovare il professionista ideale</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleMatchRapido(); }}
                  disabled={matchLoading}
                  className="text-[11px] font-semibold text-[#A855F7] mt-2 hover:underline disabled:opacity-50"
                >
                  {matchLoading ? 'Analisi...' : 'Oppure match rapido dai tuoi dati'}
                </button>
              </div>
              <ChevronRight className="w-5 h-5 text-[#5C5C66] shrink-0" />
            </div>
          </div>
        </>
      )}

      <div className="px-5 pb-24">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            {matchMode === 'match' ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-[#F0EDE8]">I Tuoi Match</h2>
                  <p className="text-[13px] text-[#8A8A96]">Professionisti ordinati per compatibilità</p>
                </div>
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="text-[13px] text-[#8A8A96] hover:text-[#EEBA2B]"
                >
                  ← Torna alla lista
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-[#F0EDE8]">Tutti i Professionisti</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-[13px] text-[#8A8A96] hover:text-[#EEBA2B]"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
                </button>
              </>
            )}
          </div>

          {matchMode === 'list' && showFilters && (
            <div className="bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4 mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#8A8A96] uppercase tracking-wide mb-2">Modalità</label>
                <div className="flex flex-wrap gap-2">
                  {MODALITA_OPTIONS.map(mod => (
                    <button
                      key={mod.value}
                      type="button"
                      onClick={() => handleFilterChange('modalita', mod.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        filters.modalita === mod.value ? 'bg-[#EEBA2B] text-[#0A0A0C]' : 'bg-[#1E1E24] text-[#8A8A96]'
                      }`}
                    >
                      {mod.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8A8A96] uppercase tracking-wide mb-2">Fascia prezzo</label>
                <div className="flex flex-wrap gap-2">
                  {PREZZO_OPTIONS.map(prezzo => (
                    <button
                      key={prezzo.value}
                      type="button"
                      onClick={() => handleFilterChange('prezzo_fascia', prezzo.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        filters.prezzo_fascia === prezzo.value ? 'bg-[#EEBA2B] text-[#0A0A0C]' : 'bg-[#1E1E24] text-[#8A8A96]'
                      }`}
                    >
                      {prezzo.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Griglia Professionisti */}
        {loading || matchLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-[#EEBA2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (matchMode === 'match' ? matchedProfessionals : professionals).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Nessun professionista trovato con questi filtri.</p>
          </div>
        ) : matchMode === 'match' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {matchedProfessionals.map((professional: ProfessionalWithMatch, index: number) => (
              <div
                key={professional.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  sessionStorage.setItem('professionals_scroll_position', window.scrollY.toString());
                  navigate(`/professionals/${professional.id}`);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sessionStorage.setItem('professionals_scroll_position', window.scrollY.toString()); navigate(`/professionals/${professional.id}`); } }}
                className="relative bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4 flex flex-col gap-3 cursor-pointer transition-opacity hover:opacity-95"
              >
                {'matchScore' in professional && (
                  <div className="absolute top-3 right-3 z-10 bg-[#EEBA2B] text-[#0A0A0C] text-xs font-bold px-2 py-1 rounded-full">
                    {professional.matchScore}% match
                  </div>
                )}
                {index < 3 && (
                  <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-[#0A0A0C] font-bold z-10 bg-[#EEBA2B]">
                    {index + 1}
                  </div>
                )}
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-[14px] shrink-0 flex items-center justify-center text-lg font-bold text-[#EEBA2B]"
                    style={{ background: 'linear-gradient(135deg, #1E1E24 0%, rgba(238,186,43,0.08) 100%)' }}
                  >
                    {professional.foto_url ? (
                      <img src={professional.foto_url} alt="" className="w-full h-full rounded-[14px] object-cover" />
                    ) : (
                      <span>{(professional.first_name?.[0] || '') + (professional.last_name?.[0] || '')}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-[#F0EDE8] truncate">{professional.first_name} {professional.last_name}</h3>
                    <p className="text-xs text-[#8A8A96]">{getCategoryLabel(professional.category)}</p>
                    {professional.is_partner && (
                      <span className="inline-block mt-1 text-[11px] font-semibold rounded-full py-0.5 px-2.5" style={{ color: '#EEBA2B', background: 'rgba(238,186,43,0.08)' }}>
                        Partner
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs mt-1">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#EEBA2B] fill-[#EEBA2B]" />
                    <span className="font-semibold text-[#EEBA2B]">{professional.rating.toFixed(1)}</span>
                    <span className="text-[#5C5C66]">({professional.reviews_count})</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#8A8A96]">
                    <MapPin className="w-3.5 h-3.5" />
                    {professional.zona || '—'}
                  </span>
                  <span className="ml-auto font-bold text-[#10B981]">
                    {professional.prezzo_seduta ? `€${professional.prezzo_seduta}` : professional.prezzo_fascia || '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.map((professional: Professional) => (
              <div
                key={professional.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  sessionStorage.setItem('professionals_scroll_position', window.scrollY.toString());
                  navigate(`/professionals/${professional.id}`);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sessionStorage.setItem('professionals_scroll_position', window.scrollY.toString()); navigate(`/professionals/${professional.id}`); } }}
                className="bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4 flex flex-col gap-3 cursor-pointer transition-opacity hover:opacity-95"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-[14px] shrink-0 flex items-center justify-center text-lg font-bold text-[#EEBA2B]"
                    style={{ background: 'linear-gradient(135deg, #1E1E24 0%, rgba(238,186,43,0.08) 100%)' }}
                  >
                    {professional.foto_url ? (
                      <img src={professional.foto_url} alt="" className="w-full h-full rounded-[14px] object-cover" />
                    ) : (
                      <span>{(professional.first_name?.[0] || '') + (professional.last_name?.[0] || '')}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-[#F0EDE8] truncate">{professional.first_name} {professional.last_name}</h3>
                    <p className="text-xs text-[#8A8A96]">{getCategoryLabel(professional.category)}</p>
                    {professional.is_partner && (
                      <span className="inline-block mt-1 text-[11px] font-semibold rounded-full py-0.5 px-2.5" style={{ color: '#EEBA2B', background: 'rgba(238,186,43,0.08)' }}>
                        Partner
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs mt-1">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#EEBA2B] fill-[#EEBA2B]" />
                    <span className="font-semibold text-[#EEBA2B]">{professional.rating.toFixed(1)}</span>
                    <span className="text-[#5C5C66]">({professional.reviews_count})</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#8A8A96]">
                    <MapPin className="w-3.5 h-3.5" />
                    {professional.zona || '—'}
                  </span>
                  <span className="ml-auto font-bold text-[#10B981]">
                    {professional.prezzo_seduta ? `€${professional.prezzo_seduta}` : professional.prezzo_fascia || '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      <MatchQuiz 
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        onComplete={handleQuizComplete}
      />
    </div>
  );
};

export default Professionals;
