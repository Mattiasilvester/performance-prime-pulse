import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { safeLocalStorage } from '@/utils/domHelpers';

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  desc: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'greeting',
    title: 'Benvenuto su Performance Prime',
    desc: 'Qui trovi il tuo streak giornaliero e un riepilogo rapido della tua attività.',
  },
  {
    target: 'stats',
    title: 'I tuoi progressi',
    desc: 'Allenamenti completati, obiettivi raggiunti e tempo totale — tutto monitorato per te.',
  },
  {
    target: 'quick-start',
    title: 'Inizia subito',
    desc: 'Un allenamento rapido da 10 minuti sempre disponibile. Nessuna scusa.',
  },
  {
    target: 'quick-actions',
    title: 'Azioni rapide',
    desc: 'Piano, Timer, Calendario e PrimeBot — le funzioni principali in un tap.',
  },
  {
    target: 'bottom-nav',
    title: "Naviga l'app",
    desc: "Da qui accedi a tutto: Allenamento, Appuntamenti, Professionisti e il tuo Profilo.",
  },
];

interface TourContextType {
  isOpen: boolean;
  currentStep: number;
  startTour: (onComplete?: () => void) => void;
  nextStep: () => void;
  prevStep: () => void;
  closeTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}

function TourOverlay() {
  const { currentStep, nextStep, prevStep, closeTour } = useTour();
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [arrowDir, setArrowDir] = useState<'top' | 'bottom'>('top');
  const scrollYRef = useRef(0);

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  useEffect(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      if (currentStep < TOUR_STEPS.length - 1) {
        nextStep();
      } else {
        closeTour();
      }
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollYRef.current);
      };
    }

    el.scrollIntoView({ behavior: 'instant', block: 'center' });

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        scrollYRef.current = scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        const rect = el.getBoundingClientRect();
        setSpotlightRect(rect);

        const viewportH = window.innerHeight;
        const spaceBelow = viewportH - rect.bottom;
        const tooltipH = 180;
        const tooltipW = 280;

        // Se il target è la bottom navigation, forza il tooltip
        // sufficientemente in alto da non coprirla
        const isBottomNav = step.target === 'bottom-nav';
        const bottomNavOffset = isBottomNav ? 100 : 12;

        if (spaceBelow > tooltipH + 16) {
          setTooltipPos({
            top: rect.bottom + 12,
            left: Math.min(Math.max(rect.left, 16), window.innerWidth - tooltipW - 16),
          });
          setArrowDir('top');
        } else {
          setTooltipPos({
            top: rect.top - tooltipH - bottomNavOffset,
            left: Math.min(Math.max(rect.left, 16), window.innerWidth - tooltipW - 16),
          });
          setArrowDir('bottom');
        }
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollYRef.current);
    };
  }, [currentStep, step.target, nextStep, closeTour]);

  if (!spotlightRect) return null;

  const PAD = 6;

  return createPortal(
    <div
      className="fixed inset-0 z-[99990]"
      style={{ pointerEvents: 'all' }}
    >
      {/* Overlay scuro con spotlight ritagliato via box-shadow */}
      <div
        className="absolute transition-all duration-300"
        style={{
          top: spotlightRect.top - PAD,
          left: spotlightRect.left - PAD,
          width: spotlightRect.width + PAD * 2,
          height: spotlightRect.height + PAD * 2,
          borderRadius: 16,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
          border: '2px solid rgba(238,186,43,0.7)',
          pointerEvents: 'none',
          transition: 'all 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        }}
      />

      {/* Tooltip */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="absolute bg-[#16161A] border border-[rgba(238,186,43,0.35)] rounded-[16px] p-4"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: 280,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 99991,
        }}
      >
        {/* Salta tour — in alto a destra */}
        <button
          type="button"
          onClick={closeTour}
          className="absolute top-3 right-4 text-[11px] text-[#F0EDE8]/35 hover:text-[#F0EDE8]/60 transition-colors bg-transparent border-none cursor-pointer"
        >
          Salta tour
        </button>

        {/* Arrow */}
        <div
          className="absolute w-3 h-3 bg-[#16161A] border-[rgba(238,186,43,0.35)]"
          style={{
            ...(arrowDir === 'top'
              ? { top: -7, left: 24, borderTop: '1.5px solid', borderLeft: '1.5px solid', transform: 'rotate(45deg)' }
              : { bottom: -7, left: 24, borderBottom: '1.5px solid', borderRight: '1.5px solid', transform: 'rotate(45deg)' }
            ),
          }}
        />

        {/* Step badge */}
        <div className="inline-flex items-center gap-[6px] bg-[rgba(238,186,43,0.1)] border border-[rgba(238,186,43,0.25)] rounded-full px-[10px] py-[3px] mb-3">
          <span className="text-[11px] font-bold text-[#EEBA2B]">
            Step {currentStep + 1} di {TOUR_STEPS.length}
          </span>
        </div>

        <p className="text-[15px] font-extrabold text-[#F0EDE8] mb-[6px]">{step.title}</p>
        <p className="text-[13px] text-[#F0EDE8]/60 leading-[1.6] mb-4">{step.desc}</p>

        {/* Divider */}
        <div className="border-t border-[rgba(255,255,255,0.08)] mb-4" />

        {/* Actions: Indietro | dots | Avanti/Fine */}
        <div className="flex items-center justify-between">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className="text-[12px] text-[#F0EDE8]/35 hover:text-[#F0EDE8]/60 transition-colors bg-transparent border-none cursor-pointer"
            >
              ← Indietro
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-[5px]">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className="h-[6px] rounded-full transition-all duration-300"
                style={{
                  width: i === currentStep ? 18 : 6,
                  background: i === currentStep ? '#EEBA2B' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={isLast ? closeTour : nextStep}
            className="text-[12px] font-bold text-[#EEBA2B] hover:text-[#f5c93a] transition-colors bg-transparent border-none cursor-pointer"
          >
            {isLast ? 'Fine 🎉' : 'Avanti →'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const onCompleteRef = useRef<(() => void) | undefined>(undefined);

  const startTour = useCallback((onComplete?: () => void) => {
    onCompleteRef.current = onComplete;
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
    safeLocalStorage.setItem('pp_tour_completed', 'true');
    onCompleteRef.current?.();
    onCompleteRef.current = undefined;
  }, []);

  return (
    <TourContext.Provider value={{ isOpen, currentStep, startTour, nextStep, prevStep, closeTour }}>
      {children}
      <AnimatePresence>
        {isOpen && <TourOverlay />}
      </AnimatePresence>
    </TourContext.Provider>
  );
}
