import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Target, Search, Filter } from 'lucide-react';
import { useAuth } from '@pp/shared';
import { supabase } from '@pp/shared';
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
      className="min-h-screen bg-black text-white"
    >
      {/* Header Pagina */}
      <div className="p-6 text-center border-b border-gray-800">
        <h1 className="text-2xl font-bold mb-2">
          🔍 TROVA IL TUO PROFESSIONISTA
        </h1>
        <p className="text-gray-400 text-sm">
          Personal Trainer, Nutrizionisti, Fisioterapisti e Mental Coach
        </p>
      </div>

      {/* Sezione Match Cards - NASCONDI in modalità match */}
      {matchMode === 'list' && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Card Match Rapido */}
          <div 
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl p-6 
                       hover:border-[#EEBA2B] hover:shadow-[0_0_20px_rgba(238,186,43,0.2)] 
                       transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#EEBA2B]/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#EEBA2B]" />
              </div>
              <h2 className="text-xl font-bold">MATCH RAPIDO</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Basato sui tuoi dati di onboarding. Trova subito i professionisti più adatti a te!
            </p>
            <button 
              onClick={handleMatchRapido}
              disabled={matchLoading}
              className="w-full bg-[#EEBA2B] text-black font-bold py-3 px-4 rounded-lg 
                         hover:bg-[#d4a826] transition-colors disabled:opacity-50"
            >
              {matchLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Analisi in corso...
                </span>
              ) : (
                '⚡ Trova subito'
              )}
            </button>
          </div>

          {/* Card Match Interattivo */}
          <div 
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl p-6 
                       hover:border-[#EEBA2B] hover:shadow-[0_0_20px_rgba(238,186,43,0.2)] 
                       transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#EEBA2B]/20 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-[#EEBA2B]" />
              </div>
              <h2 className="text-xl font-bold">MATCH INTERATTIVO</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Rispondi a 5-7 domande per trovare il professionista perfetto per te!
            </p>
            <button 
              onClick={() => setShowQuiz(true)}
              className="w-full bg-transparent border-2 border-[#EEBA2B] text-[#EEBA2B] font-bold py-3 px-4 rounded-lg 
                         hover:bg-[#EEBA2B] hover:text-black transition-colors"
            >
              🎯 Inizia il quiz
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Sezione Professionisti */}
      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {matchMode === 'match' ? (
              <>
                <div>
                  <h2 className="text-xl font-bold">🎯 I Tuoi Match</h2>
                  <p className="text-sm text-gray-400">Professionisti ordinati per compatibilità</p>
                </div>
                <button 
                  onClick={handleBackToList}
                  className="text-[#EEBA2B] text-sm hover:underline"
                >
                  ← Torna alla lista
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">📋 Tutti i Professionisti</h2>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-[#EEBA2B] text-sm"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
                </button>
              </>
            )}
          </div>

          {/* Filtri - mostra solo in modalità lista */}
          {matchMode === 'list' && showFilters && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-4 space-y-4">
              {/* Categoria */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {PROFESSIONAL_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => handleFilterChange('category', cat.value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        filters.category === cat.value
                          ? 'bg-[#EEBA2B] text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modalità */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Modalità</label>
                <div className="flex flex-wrap gap-2">
                  {MODALITA_OPTIONS.map(mod => (
                    <button
                      key={mod.value}
                      onClick={() => handleFilterChange('modalita', mod.value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        filters.modalita === mod.value
                          ? 'bg-[#EEBA2B] text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {mod.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prezzo */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Fascia prezzo</label>
                <div className="flex flex-wrap gap-2">
                  {PREZZO_OPTIONS.map(prezzo => (
                    <button
                      key={prezzo.value}
                      onClick={() => handleFilterChange('prezzo_fascia', prezzo.value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        filters.prezzo_fascia === prezzo.value
                          ? 'bg-[#EEBA2B] text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {prezzo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zona */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Zona</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Cerca città..."
                    value={filters.zona || ''}
                    onChange={(e) => handleFilterChange('zona', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 
                             text-white placeholder-gray-500 focus:border-[#EEBA2B] focus:outline-none"
                  />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-24 max-w-4xl mx-auto">
            {matchedProfessionals.map((professional: ProfessionalWithMatch, index: number) => (
              <div 
                key={professional.id}
                className={`relative rounded-xl p-4 transition-all duration-300 cursor-pointer
                  ${professional.is_partner 
                    ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-2 border-[#EEBA2B] hover:shadow-[0_0_30px_rgba(238,186,43,0.4)] hover:scale-[1.02]' 
                    : 'bg-gradient-to-br from-gray-900 to-black border border-gray-700 hover:border-[#EEBA2B] hover:shadow-[0_0_20px_rgba(238,186,43,0.2)] hover:scale-[1.02]'
                  }`}
              >
                {/* Badge Partner */}
                {professional.is_partner && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-[#EEBA2B] to-yellow-500 
                                  text-black font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 z-20">
                    <span>🏆</span>
                    <span>Partner</span>
                  </div>
                )}

                {/* Badge Match Score - solo in modalità match */}
                {matchMode === 'match' && 'matchScore' in professional && (
                  <div className={`absolute ${professional.is_partner ? '-top-2 -right-16' : '-top-2 -right-2'} bg-[#EEBA2B] text-black text-xs font-bold 
                                  px-2 py-1 rounded-full shadow-lg z-10`}>
                    {professional.matchScore}% match
                  </div>
                )}
                
                {/* Posizione podio per top 3 */}
                {matchMode === 'match' && index < 3 && (
                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 
                                  rounded-full flex items-center justify-center text-black font-bold shadow-lg z-10">
                    {index + 1}
                  </div>
                )}
                {/* Header Card */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
                    {professional.foto_url ? (
                      <img src={professional.foto_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getCategoryIcon(professional.category)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">
                      {professional.first_name} {professional.last_name}
                    </h3>
                    <p className="text-[#EEBA2B] text-sm">
                      {getCategoryLabel(professional.category)}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">📍 {professional.zona || 'Non specificata'}</span>
                    <span className="text-gray-400">{professional.modalita}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-400">
                      ⭐ {professional.rating.toFixed(1)} ({professional.reviews_count})
                    </span>
                  </div>
                  
                  {/* Prezzi: Servizi > Prezzo Seduta > Prezzo Fascia */}
                  <div className="mt-2">
                    {renderPricing(professional)}
                  </div>
                </div>

                {/* Bio */}
                {professional.bio && (
                  <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                    {professional.bio}
                  </p>
                )}

                {/* Specializzazioni */}
                {professional.specializzazioni && professional.specializzazioni.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {professional.specializzazioni.slice(0, 3).map((spec, idx) => (
                      <span key={idx} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded">
                        {spec}
                      </span>
                    ))}
                    {professional.specializzazioni.length > 3 && (
                      <span className="text-gray-500 text-xs">+{professional.specializzazioni.length - 3}</span>
                    )}
                  </div>
                )}

                {/* CTA */}
                <button 
                  onClick={() => {
                    // Salva la posizione di scroll prima di navigare
                    sessionStorage.setItem('professionals_scroll_position', window.scrollY.toString());
                    navigate(`/professionals/${professional.id}`);
                  }}
                  className="w-full bg-[#EEBA2B]/10 border border-[#EEBA2B]/30 text-[#EEBA2B] 
                           font-medium py-2 rounded-lg hover:bg-[#EEBA2B]/20 transition-colors text-sm">
                  Vedi profilo
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
            {professionals.map((professional: Professional) => (
              <div 
                key={professional.id}
                className={`relative rounded-xl p-4 transition-all duration-300 cursor-pointer
                  ${professional.is_partner 
                    ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-2 border-[#EEBA2B] hover:shadow-[0_0_30px_rgba(238,186,43,0.4)] hover:scale-[1.02]' 
                    : 'bg-gray-900/50 border border-gray-700 hover:border-[#EEBA2B] hover:shadow-[0_0_20px_rgba(238,186,43,0.2)] hover:scale-[1.02]'
                  }`}
              >
                {/* Badge Partner */}
                {professional.is_partner && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-[#EEBA2B] to-yellow-500 
                                  text-black font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 z-10">
                    <span>🏆</span>
                    <span>Partner</span>
                  </div>
                )}
                {/* Header Card */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
                    {professional.foto_url ? (
                      <img src={professional.foto_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getCategoryIcon(professional.category)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">
                      {professional.first_name} {professional.last_name}
                    </h3>
                    <p className="text-[#EEBA2B] text-sm">
                      {getCategoryLabel(professional.category)}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">📍 {professional.zona || 'Non specificata'}</span>
                    <span className="text-gray-400">{professional.modalita}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-400">
                      ⭐ {professional.rating.toFixed(1)} ({professional.reviews_count})
                    </span>
                  </div>
                  
                  {/* Prezzi: Servizi > Prezzo Seduta > Prezzo Fascia */}
                  <div className="mt-2">
                    {renderPricing(professional)}
                  </div>
                </div>

                {/* Bio */}
                {professional.bio && (
                  <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                    {professional.bio}
                  </p>
                )}

                {/* Specializzazioni */}
                {professional.specializzazioni && professional.specializzazioni.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {professional.specializzazioni.slice(0, 3).map((spec, idx) => (
                      <span key={idx} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded">
                        {spec}
                      </span>
                    ))}
                    {professional.specializzazioni.length > 3 && (
                      <span className="text-gray-500 text-xs">+{professional.specializzazioni.length - 3}</span>
                    )}
                  </div>
                )}

                {/* CTA */}
                <button 
                  onClick={() => {
                    // Salva la posizione di scroll prima di navigare
                    sessionStorage.setItem('professionals_scroll_position', window.scrollY.toString());
                    navigate(`/professionals/${professional.id}`);
                  }}
                  className="w-full bg-gradient-to-r from-[#EEBA2B] to-yellow-500 text-black font-bold py-2 px-4 rounded-lg 
                           hover:from-yellow-400 hover:to-yellow-300 transition-all">
                  Vedi profilo
                </button>
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
