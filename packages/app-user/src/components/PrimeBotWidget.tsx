import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Dumbbell, ClipboardList, Info } from 'lucide-react';
import { useTour } from '@/contexts/TourContext';
import { safeLocalStorage } from '@/utils/domHelpers';

const STORAGE_KEY = 'pp_welcome_widget_seen';
const TOUR_KEY = 'pp_tour_completed';

const EXCLUDED_PATHS = [
  '/',
  '/onboarding',
  '/auth',
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/terms-and-conditions',
  '/privacy-policy',
  '/workout/quick',
  '/timer',
];

const BUBBLE_ACTIONS = [
  { action: 'chat' as const, icon: MessageCircle, color: '#EEBA2B', bg: 'rgba(238,186,43,0.1)', label: 'Chatta con me', sub: 'Consigli personalizzati' },
  { action: 'workout' as const, icon: Dumbbell, color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Inizia il tuo allenamento', sub: 'Piano pronto per oggi' },
  { action: 'plan' as const, icon: ClipboardList, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Vedi il tuo piano', sub: 'Workout personalizzato' },
  { action: 'tour' as const, icon: Info, color: '#EEBA2B', bg: 'rgba(238,186,43,0.08)', label: "Fai il tour dell'app", sub: 'Ti guido in 5 step', gold: true },
];

export default function PrimeBotWidget() {
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [widgetVisible, setWidgetVisible] = useState(false);
  const [miniVisible, setMiniVisible] = useState(false);
  const [miniBubbleOpen, setMiniBubbleOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { startTour } = useTour();

  useEffect(() => {
    const seen = safeLocalStorage.getItem(STORAGE_KEY);
    if (!seen) setWidgetVisible(true);
  }, []);

  useEffect(() => {
    if (widgetVisible) {
      const t = setTimeout(() => setBubbleOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [widgetVisible]);

  // Mostra mini launcher dopo dismiss
  useEffect(() => {
    if (!widgetVisible) {
      const seen = safeLocalStorage.getItem(STORAGE_KEY);
      if (seen) setMiniVisible(true);
    }
  }, [widgetVisible]);

  if (EXCLUDED_PATHS.some((p) => location.pathname === p || location.pathname.startsWith('/auth'))) {
    return null;
  }

  if (!widgetVisible && !miniVisible) return null;

  const handleClose = () => {
    setBubbleOpen(false);
    setWidgetVisible(false);
    safeLocalStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleOption = (action: 'chat' | 'workout' | 'plan' | 'tour') => {
    setBubbleOpen(false);
    setMiniBubbleOpen(false);
    safeLocalStorage.setItem(STORAGE_KEY, 'true');
    setWidgetVisible(false);
    if (action === 'tour') {
      setTimeout(() => {
        startTour(() => {
          setWidgetVisible(true);
          setBubbleOpen(false);
        });
        safeLocalStorage.setItem(TOUR_KEY, 'true');
      }, 300);
      return;
    }
    if (action === 'chat') navigate('/ai-coach');
    if (action === 'workout') navigate('/workouts');
    if (action === 'plan') navigate('/workouts', { state: { openPiano: true } });
  };

  const renderBubbleContent = (onClose: () => void) => (
    <>
      <button
        onClick={onClose}
        className="absolute top-[10px] right-[10px] w-[22px] h-[22px] rounded-full bg-white/[0.06] border-none cursor-pointer flex items-center justify-center text-[#F0EDE8]/50 hover:bg-white/[0.14] hover:text-[#F0EDE8] transition-all"
      >
        <X size={11} />
      </button>
      <div className="flex items-center gap-[10px] mb-3 pr-6">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-[rgba(238,186,43,0.1)] border border-[rgba(238,186,43,0.25)] flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="7" width="20" height="15" rx="6" fill="#1A1A20" stroke="#EEBA2B" strokeWidth="1.2" />
            <circle cx="10" cy="14" r="2.5" fill="#EEBA2B" />
            <circle cx="18" cy="14" r="2.5" fill="#EEBA2B" />
            <circle cx="14" cy="4" r="2" fill="#EEBA2B" />
            <line x1="14" y1="6" x2="14" y2="8" stroke="#EEBA2B" strokeWidth="1.2" />
          </svg>
        </div>
        <div>
          <p className="text-[14px] font-bold text-[#F0EDE8]">Ciao! 👋</p>
          <div className="flex items-center gap-[4px] mt-[1px]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#10B981] animate-pulse flex-shrink-0" />
            <span className="text-[11px] text-[#F0EDE8]/40">PrimeBot • Online</span>
          </div>
        </div>
      </div>
      <p className="text-[13px] text-[#F0EDE8]/65 leading-[1.6] mb-[14px]">
        Sono il tuo <strong className="text-[#F0EDE8]">AI Coach personale</strong> su Performance Prime. Ho già il tuo piano pronto — cosa vuoi fare adesso?
      </p>
      <div className="flex flex-col gap-[7px]">
        {BUBBLE_ACTIONS.map(({ action, icon: Icon, color, bg, label, sub, gold }) => (
          <motion.button
            key={action}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOption(action)}
            className={`flex items-center gap-[10px] rounded-[10px] p-[10px_12px] border cursor-pointer transition-all text-left w-full ${
              gold
                ? 'border-[rgba(238,186,43,0.3)] bg-[rgba(238,186,43,0.06)] hover:bg-[rgba(238,186,43,0.1)]'
                : 'border-white/[0.07] bg-white/[0.03] hover:border-[rgba(238,186,43,0.3)] hover:bg-[rgba(238,186,43,0.04)]'
            }`}
          >
            <div
              className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}
            >
              <Icon size={14} color={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-semibold leading-none mb-[3px] ${gold ? 'text-[#EEBA2B]' : 'text-[#F0EDE8]'}`}>{label}</p>
              <p className="text-[11px] text-[#F0EDE8]/35">{sub}</p>
            </div>
            <span className="text-[#F0EDE8]/20 text-[16px]">›</span>
          </motion.button>
        ))}
      </div>
    </>
  );

  return (
    <>
      {widgetVisible && (
        <div
          className="fixed z-[10000]"
          style={{ bottom: 88, right: 16 }}
        >
          <AnimatePresence>
            {bubbleOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.34, 1.4, 0.64, 1] }}
                className="absolute bottom-[140px] right-0 w-[288px] bg-[#16161A] border border-[rgba(238,186,43,0.3)] rounded-[20px_20px_4px_20px] p-[18px] shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
              >
                {renderBubbleContent(handleClose)}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.34, 1.5, 0.64, 1], delay: 0.1 }}
        onClick={() => setBubbleOpen((prev) => !prev)}
        className="cursor-pointer relative"
        style={{ filter: 'drop-shadow(0 12px 30px rgba(238,186,43,0.28))' }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-[64px] h-[20px] rounded-full border-2 border-[rgba(238,186,43,0.2)]"
          animate={{ scale: [0.85, 1.25, 0.85], opacity: [0, 1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 1.6, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-[78px] h-[24px] rounded-full border border-[rgba(238,186,43,0.12)]"
          animate={{ scale: [0.8, 1.3, 0.8], opacity: [0, 1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 1.9, ease: 'easeInOut' }}
        />

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[54px] h-[8px] bg-[rgba(238,186,43,0.12)] rounded-full blur-[5px]" />

        <motion.svg
          width="90"
          height="118"
          viewBox="0 0 90 118"
          fill="none"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
        >
          <line x1="45" y1="5" x2="45" y2="14" stroke="#EEBA2B" strokeWidth="2.5" strokeLinecap="round" />
          <motion.circle
            cx="45"
            cy="4"
            r="4"
            fill="#EEBA2B"
            animate={{ fill: ['#EEBA2B', '#ffffff', '#EEBA2B'], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 1.5 }}
          />
          <circle cx="45" cy="4" r="7" fill="rgba(238,186,43,0.15)" />

          <rect x="12" y="13" width="66" height="46" rx="22" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2.2" />
          <ellipse cx="45" cy="22" rx="22" ry="6" fill="rgba(255,255,255,0.04)" />
          <rect x="17" y="18" width="56" height="36" rx="16" fill="#0A0A0C" stroke="rgba(238,186,43,0.15)" strokeWidth="1" />

          <ellipse cx="33" cy="36" rx="10" ry="11" fill="#111118" stroke="rgba(238,186,43,0.25)" strokeWidth="1.2" />
          <ellipse cx="33" cy="36" rx="7.5" ry="8.5" fill="#EEBA2B" opacity="0.92" />
          <circle cx="33" cy="36" r="4" fill="#0A0A0C" />
          <circle cx="35.2" cy="33.5" r="1.8" fill="white" opacity="0.7" />

          <ellipse cx="57" cy="36" rx="10" ry="11" fill="#111118" stroke="rgba(238,186,43,0.25)" strokeWidth="1.2" />
          <ellipse cx="57" cy="36" rx="7.5" ry="8.5" fill="#EEBA2B" opacity="0.92" />
          <circle cx="57" cy="36" r="4" fill="#0A0A0C" />
          <circle cx="59.2" cy="33.5" r="1.8" fill="white" opacity="0.7" />

          <path d="M34 49 Q45 55 56 49" stroke="#EEBA2B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />

          <circle cx="12" cy="36" r="7" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2" />
          <circle cx="12" cy="36" r="3.5" fill="rgba(238,186,43,0.2)" stroke="rgba(238,186,43,0.4)" strokeWidth="1" />
          <circle cx="78" cy="36" r="7" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2" />
          <circle cx="78" cy="36" r="3.5" fill="rgba(238,186,43,0.2)" stroke="rgba(238,186,43,0.4)" strokeWidth="1" />

          <rect x="36" y="59" width="18" height="9" rx="4.5" fill="#1E1E26" stroke="rgba(238,186,43,0.35)" strokeWidth="1.5" />

          <rect x="14" y="68" width="62" height="36" rx="18" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2.2" />
          <ellipse cx="45" cy="74" rx="20" ry="5" fill="rgba(255,255,255,0.03)" />

          <rect x="32" y="74" width="26" height="22" rx="8" fill="#0A0A0C" stroke="#EEBA2B" strokeWidth="1.5" />
          <text x="45" y="88" textAnchor="middle" fontSize="10" fontWeight="900" fill="#EEBA2B" fontFamily="Outfit,sans-serif">
            PP
          </text>

          <circle cx="21" cy="75" r="3.5" fill="#10B981" opacity="0.7" />
          <circle cx="69" cy="75" r="3.5" fill="#3B82F6" opacity="0.7" />

          <rect x="3" y="68" width="13" height="30" rx="6.5" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2" />
          <circle cx="14" cy="72" r="5" fill="#0A0A0C" stroke="rgba(238,186,43,0.3)" strokeWidth="1.2" />
          <circle cx="9" cy="99" r="6" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="1.8" />
          <rect x="74" y="68" width="13" height="30" rx="6.5" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2" />
          <circle cx="76" cy="72" r="5" fill="#0A0A0C" stroke="rgba(238,186,43,0.3)" strokeWidth="1.2" />
          <circle cx="81" cy="99" r="6" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="1.8" />

          <rect x="21" y="102" width="18" height="12" rx="6" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2" />
          <rect x="17" y="111" width="26" height="8" rx="4" fill="#EEBA2B" opacity="0.9" />
          <rect x="51" y="102" width="18" height="12" rx="6" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2" />
          <rect x="47" y="111" width="26" height="8" rx="4" fill="#EEBA2B" opacity="0.9" />
        </motion.svg>
          </motion.div>
        </div>
      )}

      {miniVisible && (
        <div className="fixed z-[10000]" style={{ bottom: 88, right: 16 }}>
          <AnimatePresence>
            {miniBubbleOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.34, 1.4, 0.64, 1] }}
                className="absolute bottom-[140px] right-0 w-[288px] bg-[#16161A] border border-[rgba(238,186,43,0.3)] rounded-[20px_20px_4px_20px] p-[18px] shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
              >
                {renderBubbleContent(() => setMiniBubbleOpen(false))}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.34, 1.5, 0.64, 1] }}
            onClick={() => setMiniBubbleOpen((prev) => !prev)}
            className="w-[56px] h-[56px] rounded-full bg-[#1a1a2e] border-2 border-[#EEBA2B] flex items-center justify-center cursor-pointer shadow-[0_4px_20px_rgba(238,186,43,0.3)]"
            whileTap={{ scale: 0.92 }}
            style={{ filter: 'drop-shadow(0 4px 12px rgba(238,186,43,0.25))' }}
          >
            <svg width="28" height="28" viewBox="0 0 90 118" fill="none">
              <rect x="12" y="13" width="66" height="46" rx="22" fill="#1E1E26" stroke="#EEBA2B" strokeWidth="2.2" />
              <ellipse cx="33" cy="36" rx="7.5" ry="8.5" fill="#EEBA2B" opacity="0.92" />
              <circle cx="33" cy="36" r="4" fill="#0A0A0C" />
              <ellipse cx="57" cy="36" rx="7.5" ry="8.5" fill="#EEBA2B" opacity="0.92" />
              <circle cx="57" cy="36" r="4" fill="#0A0A0C" />
              <path d="M34 49 Q45 55 56 49" stroke="#EEBA2B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
            </svg>
          </motion.button>
        </div>
      )}
    </>
  );
}
