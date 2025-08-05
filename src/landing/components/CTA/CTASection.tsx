import React from 'react';
import QRCode from './QRCode';

interface CTASectionProps {
  onCTAClick: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onCTAClick }) => {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <h2 className="cta-title">Provalo ora gratuitamente</h2>
        
        <div className="cta-content">
          <QRCode />
          <div className="cta-buttons">
            <button 
              onClick={onCTAClick}
              className="cta-button primary large"
            >
              🚀 Scansiona e inizia ora
            </button>
            <p className="cta-subtitle">
              Scarica la beta gratuita: il tuo feedback ci aiuterà a costruire la versione definitiva.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection; 