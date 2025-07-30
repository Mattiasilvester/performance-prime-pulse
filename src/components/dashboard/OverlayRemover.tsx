import { useEffect } from 'react';

// Componente per rimuovere forzatamente l'overlay dal DOM
export const OverlayRemover = () => {
  useEffect(() => {
    const removeOverlay = () => {
      // Rimuovi tutti gli elementi con lock-overlay
      const overlayElements = document.querySelectorAll('.lock-overlay, .locked-container');
      overlayElements.forEach(element => {
        console.log('Rimuovendo overlay element:', element);
        element.remove();
      });

      // Rimuovi anche gli elementi con classi simili
      const similarElements = document.querySelectorAll('[class*="lock"], [class*="overlay"]');
      similarElements.forEach(element => {
        const className = element.className || '';
        if (typeof className === 'string' && (className.includes('lock') || className.includes('overlay'))) {
          console.log('Rimuovendo elemento simile:', element);
          element.remove();
        }
      });

      // Forza la rimozione con CSS
      const style = document.createElement('style');
      style.textContent = `
        .lock-overlay, .locked-container, [class*="lock"], [class*="overlay"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          position: absolute !important;
          top: -9999px !important;
          left: -9999px !important;
          z-index: -9999 !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Rimuovi immediatamente
    removeOverlay();

    // Rimuovi anche dopo un breve delay
    setTimeout(removeOverlay, 100);
    setTimeout(removeOverlay, 500);
    setTimeout(removeOverlay, 1000);

    // Rimuovi continuamente
    const interval = setInterval(removeOverlay, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null; // Questo componente non renderizza nulla
}; 