import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  FolderKanban,
  Briefcase,
  Receipt,
  TrendingUp,
  Star,
  CreditCard,
  UserCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export interface TourStep {
  id: string;
  target: string | null;
  title: string;
  message: string;
  icon: React.ReactNode;
  position?: 'center' | 'right';
}

interface OnboardingTourProps {
  userName: string;
  professionalId: string;
  onComplete: () => void;
}

const SPOTLIGHT_STYLE = {
  position: 'relative' as const,
  zIndex: 70,
  boxShadow: '0 0 0 4px rgba(238,186,43,0.4)',
  borderRadius: '8px',
  backgroundColor: 'white',
};

function getSteps(userName: string): TourStep[] {
  return [
    {
      id: 'welcome',
      target: null,
      title: `Ciao ${userName}! 👋`,
      message: 'Benvenuto in PrimePro! Questa breve guida ti mostrerà come sfruttare al massimo la tua dashboard professionale. Ci vorranno solo 2 minuti.',
      icon: <Sparkles className="w-6 h-6 text-[#EEBA2B]" />,
      position: 'center',
    },
    {
      id: 'dashboard',
      target: 'sidebar-overview',
      title: 'La tua Dashboard',
      message: 'Qui trovi una panoramica completa della tua attività: appuntamenti di oggi, incassi del mese, clienti attivi e il tuo rating medio.',
      icon: <LayoutDashboard className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'calendario',
      target: 'sidebar-calendario',
      title: 'Agenda e Disponibilità',
      message: 'Imposta i giorni e gli orari in cui sei disponibile. I tuoi clienti potranno prenotare solo negli slot che decidi tu.',
      icon: <Calendar className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'prenotazioni',
      target: 'sidebar-prenotazioni',
      title: 'Le tue Prenotazioni',
      message: 'Gestisci tutte le richieste in un unico posto: conferma, modifica o cancella. Riceverai una notifica per ogni nuova prenotazione.',
      icon: <ClipboardList className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'clienti',
      target: 'sidebar-clienti',
      title: 'La tua Rubrica Clienti',
      message: 'Tutti i tuoi clienti con lo storico completo delle sessioni e i contatti diretti. Più sessioni fai, più il profilo si arricchisce.',
      icon: <Users className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'progetti',
      target: 'sidebar-progetti',
      title: 'Progetti Clienti',
      message: 'Crea percorsi personalizzati per i tuoi clienti: programmi di allenamento, piani alimentari o protocolli di riabilitazione con obiettivi e scadenze.',
      icon: <FolderKanban className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'servizi',
      target: 'sidebar-servizi',
      title: 'I tuoi Servizi e Tariffe',
      message: 'Configura cosa offri: nome del servizio, prezzo, durata e modalità. I servizi attivi appariranno nella tua pagina pubblica su Prime Pro Finder.',
      icon: <Briefcase className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'costi',
      target: 'sidebar-costi-spese',
      title: 'Costi e Spese',
      message: 'Registra e monitora tutte le spese della tua attività professionale. PrimePro calcolerà automaticamente il tuo profitto netto.',
      icon: <Receipt className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'andamento',
      target: 'sidebar-andamento',
      title: 'Andamento e Analytics',
      message: 'Grafici e statistiche dettagliate sull\'andamento della tua attività: trend prenotazioni, distribuzione servizi e performance nel tempo.',
      icon: <TrendingUp className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'recensioni',
      target: 'sidebar-recensioni',
      title: 'Recensioni',
      message: 'Visualizza le recensioni ricevute dai tuoi clienti. Un buon rating ti posiziona meglio su Prime Pro Finder e attrae nuovi clienti.',
      icon: <Star className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'abbonamento',
      target: 'sidebar-abbonamento',
      title: 'Abbonamento',
      message: 'Gestisci il tuo piano PrimePro: verifica lo stato dell\'abbonamento, i metodi di pagamento e le fatture.',
      icon: <CreditCard className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'profilo',
      target: 'sidebar-profilo',
      title: 'Il tuo Profilo',
      message: 'Completa e aggiorna il tuo profilo professionale. Queste informazioni saranno visibili ai clienti che ti cercano su Prime Pro Finder.',
      icon: <UserCircle className="w-5 h-5 text-[#EEBA2B]" />,
      position: 'right',
    },
    {
      id: 'complete',
      target: null,
      title: 'Sei pronto! 🚀',
      message: 'Il tuo profilo è attivo. Completa i primi passi nella dashboard e inizia a ricevere le tue prime prenotazioni. In bocca al lupo!',
      icon: <CheckCircle className="w-6 h-6 text-[#EEBA2B]" />,
      position: 'center',
    },
  ];
}

function clearSpotlight(el: HTMLElement | null) {
  if (!el) return;
  el.style.position = '';
  el.style.zIndex = '';
  el.style.boxShadow = '';
  el.style.borderRadius = '';
  el.style.backgroundColor = '';
}

export function OnboardingTour({ userName, professionalId, onComplete }: OnboardingTourProps) {
  const steps = getSteps(userName);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const spotlightRef = useRef<HTMLElement | null>(null);

  const currentStep = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;
  const showCenteredCard = isFirst || isLast || isMobile;
  const isMobileCenterStep = isMobile && (isFirst || isLast);
  const isMobileBottomSheet = isMobile && !isMobileCenterStep;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const targetSelector = currentStep.target;
    if (spotlightRef.current) {
      clearSpotlight(spotlightRef.current);
      spotlightRef.current = null;
    }
    if (!targetSelector) {
      if (isMobile) window.dispatchEvent(new CustomEvent('close-partner-sidebar'));
      return;
    }
    if (isMobile) {
      window.dispatchEvent(new CustomEvent('open-partner-sidebar'));
      const t = setTimeout(() => {
        const el = document.querySelector<HTMLElement>(`[data-tour="${targetSelector}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.position = SPOTLIGHT_STYLE.position;
          el.style.zIndex = String(SPOTLIGHT_STYLE.zIndex);
          el.style.boxShadow = SPOTLIGHT_STYLE.boxShadow;
          el.style.borderRadius = SPOTLIGHT_STYLE.borderRadius;
          el.style.backgroundColor = SPOTLIGHT_STYLE.backgroundColor;
          spotlightRef.current = el;
        }
      }, 300);
      return () => {
        clearTimeout(t);
        if (spotlightRef.current) {
          clearSpotlight(spotlightRef.current);
          spotlightRef.current = null;
        }
      };
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${targetSelector}"]`);
    if (el) {
      el.style.position = SPOTLIGHT_STYLE.position;
      el.style.zIndex = String(SPOTLIGHT_STYLE.zIndex);
      el.style.boxShadow = SPOTLIGHT_STYLE.boxShadow;
      el.style.borderRadius = SPOTLIGHT_STYLE.borderRadius;
      el.style.backgroundColor = SPOTLIGHT_STYLE.backgroundColor;
      spotlightRef.current = el;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return () => {
      if (spotlightRef.current) {
        clearSpotlight(spotlightRef.current);
        spotlightRef.current = null;
      }
    };
  }, [currentIndex, currentStep.target, isMobile]);

  useEffect(() => {
    return () => {
      if (spotlightRef.current) clearSpotlight(spotlightRef.current);
    };
  }, []);

  const handleComplete = useCallback(() => {
    if (spotlightRef.current) {
      clearSpotlight(spotlightRef.current);
      spotlightRef.current = null;
    }
    try {
      window.dispatchEvent(new CustomEvent('close-partner-sidebar'));
    } catch {
      // ignore
    }
    try {
      localStorage.setItem(`pp_dashboard_tour_done_${professionalId}`, 'true');
    } catch {
      // ignore
    }
    onComplete();
  }, [professionalId, onComplete]);

  const handleSkip = useCallback(() => {
    if (spotlightRef.current) {
      clearSpotlight(spotlightRef.current);
      spotlightRef.current = null;
    }
    try {
      window.dispatchEvent(new CustomEvent('close-partner-sidebar'));
    } catch {
      // ignore
    }
    try {
      localStorage.setItem(`pp_dashboard_tour_done_${professionalId}`, 'true');
    } catch {
      // ignore
    }
    onComplete();
  }, [professionalId, onComplete]);

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (isLast) {
      handleComplete();
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 z-[60]"
        aria-hidden
      />

      {/* Card container: su mobile step sidebar = bottom sheet; step center o desktop = come prima */}
      <div
        className={
          isMobileBottomSheet
            ? 'fixed bottom-0 left-0 right-0 z-[70] pointer-events-none flex justify-center'
            : 'fixed inset-0 z-[70] pointer-events-none flex items-center justify-center md:block'
        }
      >
        <div
          className={
            isMobileBottomSheet
              ? 'pointer-events-auto w-full max-w-md max-h-[45vh] overflow-y-auto rounded-t-2xl shadow-2xl bg-white border border-gray-200 border-b-0 p-4 pb-6'
              : `pointer-events-auto w-full max-w-md mx-4 ${showCenteredCard ? 'flex items-center justify-center' : 'md:absolute md:left-[calc(16rem+2rem)] md:top-1/2 md:-translate-y-1/2 md:mx-0'}`
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={isMobileBottomSheet ? 'w-full' : 'bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full'}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{currentStep.icon}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{currentStep.title}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed mt-2">{currentStep.message}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-[#EEBA2B] h-full rounded-full"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {currentIndex + 1} di {steps.length}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between mt-6 gap-3">
                {isFirst ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                    >
                      Salta
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-[#EEBA2B] hover:bg-[#d4a61f] text-black font-semibold px-6 py-2.5 rounded-xl transition-colors"
                    >
                      Continua
                    </button>
                  </>
                ) : isLast ? (
                  <>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      Indietro
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-[#EEBA2B] hover:bg-[#d4a61f] text-black font-semibold px-6 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2"
                    >
                      Inizia!
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      Indietro
                    </button>
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                    >
                      Salta
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-[#EEBA2B] hover:bg-[#d4a61f] text-black font-semibold px-6 py-2.5 rounded-xl transition-colors"
                    >
                      Continua
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
