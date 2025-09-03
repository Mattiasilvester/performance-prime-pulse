import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

const QRCode = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // URL della pagina di autenticazione
      const loginUrl = `${window.location.origin}/auth`;
      
      try {
        // Genera QR code reale
        await QRCodeLib.toCanvas(canvas, loginUrl, {
          width: 180,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (error) {
        // Errore nella generazione del QR code
      }
    };

    generateQRCode();
  }, []);

  const handleQRClick = () => {
    // Apri la pagina di autenticazione in una nuova tab
    window.open(`${window.location.origin}/auth`, '_blank');
  };

  return (
    <div className="qr-code-container">
      <canvas 
        ref={canvasRef} 
        className="qr-code-canvas"
        onClick={handleQRClick}
        aria-label="Scansiona il QR code per accedere a Performance Prime"
        style={{ 
          width: '180px', 
          height: '180px',
          borderRadius: '12px',
          border: '2px solid rgba(238, 186, 43, 0.3)',
          display: 'block',
          margin: '0 auto',
          cursor: 'pointer',
          background: 'white'
        }}
      />
      <p className="qr-code-text">Scansiona per accedere</p>
      <p className="qr-code-description">
        Scansiona il QR code con il tuo smartphone per accedere direttamente all'app
      </p>
    </div>
  );
};

export default QRCode; 