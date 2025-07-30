import React from 'react';
import { isDevelopment, config } from '../config/environments';

const DevTools = () => {
  if (!isDevelopment) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      border: '2px solid #28a745',
      maxWidth: '300px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#28a745' }}>
        🛠️ MODALITÀ SVILUPPO
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>Dashboard:</strong> <a 
          href="http://localhost:8080/app" 
          target="_blank" 
          style={{ color: '#28a745', textDecoration: 'underline' }}
        >
          localhost:8080/app
        </a>
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>MVP Pubblico:</strong> <a 
          href={config.MVP_URL} 
          target="_blank" 
          style={{ color: '#EEBA2B', textDecoration: 'underline' }}
        >
          {config.MVP_URL}
        </a>
      </div>
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#ccc' }}>
        Questo pannello è visibile solo in sviluppo
      </div>
    </div>
  );
};

export default DevTools; 