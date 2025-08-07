import React from 'react';
import QRCode from '../CTA/QRCode';

interface HeroSectionProps {
  onCTAClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onCTAClick }) => {
  return (
    <section className="hero-section" style={{ backgroundColor: '#000000' }}>
      {/* Background Animation */}
      <div className="hero-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <div className="hero-container">
        <div className="hero-content">
          {/* Logo/Brand */}
          <div className="hero-brand">
            <div className="brand-logo">
              <img 
                src="/logo-pp.jpg" 
                alt="Performance Prime Logo"
                className="logo-image"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="logo-fallback hidden">PP</span>
            </div>
            <span className="brand-text">Performance Prime</span>
          </div>
          
          {/* Main Title with Animation - Extended horizontally */}
          <h1 className="hero-title">
            <span className="title-line">Oltre ogni limite</span>
          </h1>
          
          {/* Subtitle with better typography */}
          <p className="hero-subtitle">
            L'app che trasforma i tuoi dati in 
            <span className="highlight-text"> performance straordinarie</span>
          </p>
          
          {/* New Content Section */}
          <div className="hero-description">
            {/* Linea divisoria oro al posto dei testi rimossi */}
            <div className="hero-divider"></div>
            
            <p className="hero-app-description">
              Performance Prime è la prima app creata da atleti per atleti, amatori e performer che vogliono evolversi davvero.
            </p>
            
            <p className="hero-app-description">
              Allenamento, nutrizione, routine e progressi: tutto in un'unica piattaforma intelligente, personalizzata e motivante.
            </p>
            
            {/* Container ottimizzato per le card */}
            <div className="hero-cards-container">
              <div className="hero-features-list">
                <h3 className="features-title">✅ Cosa puoi fare:</h3>
                <ul className="features-list">
                  <li>Trova palestre e professionisti vicino a te</li>
                  <li>Ricevi piani su misura con l'AI Coach</li>
                  <li>Organizza tutto con calendario, note, timer e promemoria</li>
                  <li>Tieni traccia di peso, forza, cardio, progressi</li>
                  <li>Accedi al nostro e-commerce sportivo integrato</li>
                  <li>Entra in una community reale e motivante</li>
                </ul>
              </div>
              
              <div className="hero-differences">
                <h3 className="differences-title">🚀 Perché è diversa:</h3>
                <ul className="differences-list">
                  <li>Niente piani standard: tutto è su misura per te</li>
                  <li>AI Coach + professionisti reali: scegli tu come essere seguito</li>
                  <li>Creato da atleti veri: Nicholas (judo) e Mattia (atletica)</li>
                  <li>Focus su performance, costanza e risultati, non solo estetica</li>
                  <li>Design semplice, intuitivo, senza distrazioni</li>
                </ul>
              </div>
            </div>
            
            <div className="hero-cta-section">
              <h3 className="cta-title">👇 Provala ora</h3>
              <p className="cta-description">
                Accedi al nostro MVP gratuito, lasciaci un feedback e unisciti alla waiting list per l'app completa.
              </p>
              <p className="cta-special">Siete i primi. Siete speciali.</p>
            </div>
          </div>
          
          {/* Features Preview */}
          <div className="hero-features">
            <div className="feature-pill">
              <span className="feature-icon">🏃‍♂️</span>
              <span>Tracking Avanzato</span>
            </div>
            <div className="feature-pill">
              <span className="feature-icon">🤖</span>
              <span>AI Coach</span>
            </div>
            <div className="feature-pill">
              <span className="feature-icon">📊</span>
              <span>Analisi Dettagliate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 