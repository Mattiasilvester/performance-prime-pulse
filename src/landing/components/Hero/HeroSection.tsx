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