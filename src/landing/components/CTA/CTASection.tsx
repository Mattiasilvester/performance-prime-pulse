import React from 'react';
import QRCode from '@/components/QRCode';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

interface CTASectionProps {
  onCTAClick: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onCTAClick }) => {
  const ctaRef = useScrollAnimation();

  return (
    <section className="cta-section" style={{ backgroundColor: '#000000' }} ref={ctaRef}>
      <div className="cta-container">
        <h2 className="cta-title animate-on-scroll">Provalo ora gratuitamente</h2>
        
        <div className="cta-content">
          <QRCode url="https://performance-prime.lovable.app" size={180} />
          <div className="cta-buttons">
            <button 
              onClick={onCTAClick}
              className="cta-button primary large"
              aria-label="Inizia ora con Performance Prime"
            >
              🚀 INIZIA ORA - È GRATIS!
            </button>
            <p className="cta-subtitle">
              Crea il tuo account gratuito e accedi al nostro MVP: il tuo feedback ci aiuterà a costruire la versione definitiva.
            </p>
          </div>
        </div>
        
        {/* Founders Section - Spostata qui */}
        <div className="founders-section animate-on-scroll">
          <h3 className="founders-title">I Fondatori</h3>
          <div className="founders-cards">
            <div className="founder-card">
              <div className="w-48 h-48 rounded-full overflow-hidden mx-auto mb-6 border-4 border-[#EEBA2B]/30 bg-white/10 relative">
                <img 
                  src="/images/mattia-silvestrelli-real.jpg" 
                  alt="Mattia Silvestrelli - CEO e Co-Founder di Performance Prime, atleta della Nazionale Italiana"
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjM0I0QjVCIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjN0M4QzlAIi8+CjxyZWN0IHg9IjM1IiB5PSI3MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjN0M4QzlAIi8+Cjwvc3ZnPgo=';
                  }}
                />
              </div>
              <div className="founder-info">
                <h4 className="founder-name">Mattia Silvestrelli</h4>
                <p className="founder-role">CEO & Co-Founder</p>
                <p className="founder-description">
                  Sono un atleta della Nazionale Italiana e da sempre appassionato di performance, disciplina e tecnologia. Ho voluto creare Performance Prime per dare agli sportivi uno strumento concreto, semplice e potente per migliorarsi ogni giorno. Conosco le sfide, i sacrifici e le ambizioni di chi si allena seriamente, perché sono le stesse che vivo io, e con questa app voglio offrire il supporto digitale che avrei voluto trovare anni fa.
                </p>
              </div>
            </div>
            
            <div className="founder-card">
              <div className="w-48 h-48 rounded-full overflow-hidden mx-auto mb-6 border-4 border-[#EEBA2B]/30 bg-white/10 relative">
                <img 
                  src="/images/nicholas-capponi-real.jpg" 
                  alt="Nicholas Capponi - CTO e Co-Founder di Performance Prime, atleta e sviluppatore software"
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjM0I0QjVCIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjN0M4QzlBIi8+CjxyZWN0IHg9IjM1IiB5PSI3MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjN0M4QzlAIi8+Cjwvc3ZnPgo=';
                  }}
                />
              </div>
              <div className="founder-info">
                <h4 className="founder-name">Nicholas Capponi</h4>
                <p className="founder-role">CTO & Co-Founder</p>
                <p className="founder-description">
                  Sono un atleta con la passione per lo sviluppo software e l'intelligenza artificiale. Ho deciso di creare Performance Prime per dare agli sportivi come noi uno strumento concreto, moderno e personalizzato. Ogni funzione dell'app nasce da un bisogno reale vissuto in prima persona: per questo voglio che Performance Prime sia molto più di un'app, ma un alleato quotidiano per chi ha fame di risultati e crescita continua.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection; 