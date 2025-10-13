import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const Footer = () => {
  const navigate = useNavigate();
  const footerRef = useScrollAnimation();

  return (
    <footer className="footer" style={{ backgroundColor: '#1a1a1a' }} ref={footerRef}>
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section animate-on-scroll">
            <h3 className="footer-title">Performance Prime</h3>
            <p className="footer-description">
              Oltre ogni limite, verso la tua versione migliore.
            </p>
          </div>
          
          <div className="footer-section animate-on-scroll">
            <h4 className="footer-subtitle">Link Utili</h4>
            <ul className="footer-links">
              <li>
                <button 
                  onClick={() => navigate('/auth')}
                  className="footer-link"
                >
                  Accedi
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/terms-and-conditions')}
                  className="footer-link"
                >
                  Termini e Condizioni
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/privacy-policy')}
                  className="footer-link"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
          
          <div className="footer-section animate-on-scroll">
            <h4 className="footer-subtitle">Contatti</h4>
            <p className="footer-contact">
              Email: primeassistenza@gmail.com
            </p>
            <p className="footer-contact">
              P.IVA: 17774791002
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-copyright animate-on-scroll">
            © 2025 Performance Prime. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 