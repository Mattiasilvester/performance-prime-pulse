import { motion } from 'framer-motion';
import type { Medal } from '@/types/medalSystem';

export interface MedalUnlockModalProps {
  medal: Medal;
  totalPending: number;
  currentIndex: number;
  onDismiss: () => void;
}

const RARITY_CONFIG: Record<
  Medal['rarity'],
  { label: string; cardBorder: string; badgeBg: string; badgeColor: string; badgeBorder: string }
> = {
  common: {
    label: 'Comune',
    cardBorder: '#888780',
    badgeBg: 'rgba(136,135,128,0.15)',
    badgeColor: '#888780',
    badgeBorder: 'rgba(136,135,128,0.35)',
  },
  rare: {
    label: 'Rara',
    cardBorder: '#3B82F6',
    badgeBg: 'rgba(59,130,246,0.15)',
    badgeColor: '#60A5FA',
    badgeBorder: 'rgba(59,130,246,0.35)',
  },
  epic: {
    label: 'Epica',
    cardBorder: '#8B5CF6',
    badgeBg: 'rgba(139,92,246,0.15)',
    badgeColor: '#A78BFA',
    badgeBorder: 'rgba(139,92,246,0.35)',
  },
  legendary: {
    label: 'Leggendaria',
    cardBorder: '#EEBA2B',
    badgeBg: 'rgba(238,186,43,0.15)',
    badgeColor: '#EEBA2B',
    badgeBorder: 'rgba(238,186,43,0.35)',
  },
};

function getRarityConfig(rarity: Medal['rarity']) {
  return RARITY_CONFIG[rarity];
}

const CONFETTI = [
  { size: 7, color: '#EEBA2B', top: -8, left: 30 },
  { size: 5, color: '#A78BFA', top: 10, right: -10 },
  { size: 6, color: '#60A5FA', bottom: 40, right: -8 },
  { size: 4, color: '#EEBA2B', bottom: -5, left: 50 },
  { size: 5, color: '#F9A8D4', top: -6, right: 40 },
  { size: 6, color: '#6EE7B7', bottom: 20, left: -10 },
  { size: 4, color: '#EEBA2B', top: 20, left: -8 },
  { size: 5, color: '#A78BFA', bottom: -8, right: 30 },
];

export default function MedalUnlockModal({
  medal,
  totalPending,
  currentIndex,
  onDismiss,
}: MedalUnlockModalProps) {
  const config = getRarityConfig(medal.rarity);
  const isLast = currentIndex === totalPending - 1;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 99995,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(2px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative text-center"
        style={{
          background: '#16161A',
          border: `1.5px solid ${config.cardBorder}`,
          borderRadius: 22,
          padding: '24px 20px 20px',
          width: 288,
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.2 } }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        {/* Particelle confetti */}
        <div
          className="pointer-events-none absolute"
          style={{ inset: -20 }}
        >
          {CONFETTI.map((c, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: c.size,
                height: c.size,
                background: c.color,
                top: c.top !== undefined ? c.top : undefined,
                left: c.left !== undefined ? c.left : undefined,
                right: c.right !== undefined ? c.right : undefined,
                bottom: c.bottom !== undefined ? c.bottom : undefined,
              }}
              animate={{ opacity: [0, 0.85, 0.85, 0] }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          ))}
        </div>

        {totalPending > 1 && (
          <div className="mb-3.5 flex flex-row justify-center gap-1.5">
            {Array.from({ length: totalPending }).map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  background: i === currentIndex ? '#EEBA2B' : '#2a2a2e',
                }}
              />
            ))}
          </div>
        )}

        <div
          className="mb-3 font-medium uppercase tracking-widest"
          style={{ fontSize: 9, color: '#EEBA2B', letterSpacing: 1.5 }}
        >
          MEDAGLIA SBLOCCATA
        </div>

        <motion.span
          className="mb-2.5 block leading-none"
          style={{ fontSize: 52 }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ delay: 0.2, duration: 0.4, ease: 'easeInOut' }}
        >
          {medal.icon}
        </motion.span>

        <div
          className="mb-1.5 font-bold text-white"
          style={{ fontSize: 15 }}
        >
          {medal.name}
        </div>

        <span
          className="mb-2.5 inline-block rounded-full font-semibold uppercase tracking-wide"
          style={{
            fontSize: 9,
            padding: '3px 10px',
            letterSpacing: 0.8,
            background: config.badgeBg,
            color: config.badgeColor,
            border: `1px solid ${config.badgeBorder}`,
          }}
        >
          {config.label}
        </span>

        <p
          className="mb-4 px-1 text-[#8A8A96]"
          style={{ fontSize: 11, lineHeight: 1.5 }}
        >
          {medal.description}
        </p>

        <button
          type="button"
          className="w-full cursor-pointer rounded-xl border-none py-2.5 font-bold text-black"
          style={{ background: '#EEBA2B', fontSize: 12 }}
          onClick={onDismiss}
        >
          {isLast ? 'Fine' : 'Continua'}
        </button>

        <p
          className="mt-2 text-[#4A4A56]"
          style={{ fontSize: 9 }}
        >
          Vedi tutte le medaglie nel tuo profilo
        </p>
      </motion.div>
    </motion.div>
  );
}
