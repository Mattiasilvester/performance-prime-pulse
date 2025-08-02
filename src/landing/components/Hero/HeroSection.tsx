import React from 'react';
import QRCode from '../CTA/QRCode';

interface HeroSectionProps {
  onCTAClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onCTAClick }) => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Oltre ogni <span className="text-yellow">limite</span>
          </h1>
          <p className="hero-subtitle">
            L'app che trasforma i tuoi dati in performance straordinarie
          </p>
          
          <div className="hero-cta">
            <QRCode />
            <button 
              onClick={onCTAClick}
              className="cta-button primary"
            >
              🚀 Scansiona o Clicca Qui
            </button>
            <p className="cta-description">
              Accedi alla beta gratuita: il tuo feedback ci aiuterà a costruire la versione definitiva.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 