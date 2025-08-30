import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <div className="privacy-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Torna alla home
          </button>
          <h1>Privacy Policy</h1>
        </div>
        
        <div className="privacy-content">
          <p>
            <strong>Ultimo aggiornamento:</strong> 2 Agosto 2025
          </p>
          
          <p>
            Questa Informativa sulla Privacy descrive le nostre politiche e procedure sulla raccolta, 
            l'uso e la divulgazione delle tue informazioni quando utilizzi il Servizio Performance Prime.
          </p>
          
          <h2>Raccolta e Utilizzo dei Dati</h2>
          <p>
            Raccogliamo solo i dati necessari per fornire il servizio: email, nome, cognome e dati di utilizzo.
            I tuoi dati sono protetti e utilizzati solo per migliorare la tua esperienza.
          </p>
          
          <h2>Contatti</h2>
          <p>
            Per domande sulla privacy: primeassistenza@gmail.com
          </p>
          
          <div className="privacy-footer">
            <button onClick={() => navigate('/auth')} className="cta-button">
              Accedi all'App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 