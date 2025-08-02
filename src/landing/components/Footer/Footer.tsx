import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Performance Prime</h3>
            <p className="footer-description">
              Oltre ogni limite, verso la tua migliore versione.
            </p>
          </div>
          
          <div className="footer-section">
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
                  onClick={() => navigate('/privacy-policy')}
                  className="footer-link"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Contatti</h4>
            <p className="footer-contact">
              Email: primeassistenza@gmail.com
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2025 Performance Prime. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 