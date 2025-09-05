import React, { useEffect, useRef } from 'react';

interface FeatureModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  bullets: string[];
  ctaText?: string;
  cardPosition?: { x: number; y: number };
}

export const FeatureModal: React.FC<FeatureModalProps> = ({
  open,
  onClose,
  title,
  icon,
  bullets,
  ctaText = "Inizia Ora - È Gratis!",
  cardPosition
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      
      // Cleanup timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleCtaClick = () => {
    onClose();
    window.scrollTo(0, 0);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      window.location.href = '/auth';
      timeoutRef.current = null;
    }, 100);
  };

  return (
    <div 
      className="fixed inset-0 z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        className="relative bg-black border border-yellow-400/30 rounded-2xl p-4 md:p-6 shadow-2xl animate-slideUp"
        style={{
          width: '90vw',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#000000',
          zIndex: 9999,
          position: 'absolute',
          left: cardPosition ? `${cardPosition.x}px` : '50%',
          top: cardPosition ? `${cardPosition.y - 20}px` : '50%',
          transform: cardPosition ? 'translateX(-50%)' : 'translate(-50%, -50%)',
          margin: 'auto'
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 md:right-4 top-3 md:top-4 text-gray-400 hover:text-yellow-400 transition-colors p-1.5 md:p-2"
          aria-label="Chiudi dettagli"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="text-yellow-400 text-3xl md:text-4xl animate-pulse">{icon}</div>
          <h2 id="modal-title" className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
            {title}
          </h2>
        </div>

        <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
          {bullets.slice(0, 3).map((bullet, index) => (
            <li key={index} className="flex items-start gap-3 group">
              <span className="text-yellow-400 mt-1 transition-transform group-hover:translate-x-1 flex-shrink-0">
                ▸
              </span>
              <span className="text-gray-300 text-base md:text-lg leading-relaxed">
                {bullet}
              </span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleCtaClick}
          className="w-full py-3 md:py-4 px-4 md:px-6 bg-gradient-to-b from-[#FFD700] via-[#EEBA2B] to-[#DDA012] text-black font-bold text-base md:text-lg rounded-xl hover:shadow-xl hover:shadow-yellow-400/20 transform hover:scale-105 transition-all duration-200"
        >
          {ctaText} →
        </button>
      </div>
    </div>
  );
};
