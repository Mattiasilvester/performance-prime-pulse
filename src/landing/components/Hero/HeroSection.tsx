import React from 'react';
import QRCode from '../CTA/QRCode';

interface HeroSectionProps {
  onCTAClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onCTAClick }) => {
  return (
    <section className="hero-section">
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
          
          {/* Founders Section */}
          <div className="founders-section">
            <h3 className="founders-title">I Fondatori</h3>
            <div className="founders-cards">
              <div className="founder-card">
                <div className="founder-image">
                  <img 
                    src="/lovable-uploads/mattia-silvestrelli.png" 
                    alt="Mattia Silvestrelli"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjM0I0QjVCIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjN0M4QzlBIi8+CjxyZWN0IHg9IjM1IiB5PSI3MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjN0M4QzlBIi8+Cjwvc3ZnPgo=';
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
                <div className="founder-image">
                  <img 
                    src="/lovable-uploads/nicholas-capponi.png?v=4" 
                    alt="Nicholas Capponi - CTO & Co-Founder"
                    onError={(e) => {
                      console.log('Image failed to load:', e.currentTarget.src);
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjM0I0QjVCIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjN0M4QzlBIi8+CjxyZWN0IHg9IjM1IiB5PSI3MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjN0M4QzlBIi8+Cjwvc3ZnPgo=';
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
          
          {/* Social Proof */}
          <div className="hero-social-proof">
            <div className="social-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Utenti Beta</span>
              </div>
              <div className="stat">
                <span className="stat-number">4.8★</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 