import { useEffect } from 'react';

export default function MobileScrollFix() {
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) return;
    
    const fixMobileScroll = () => {
      // Fix body
      document.body.style.cssText = `
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        position: relative !important;
        height: auto !important;
        min-height: 100vh !important;
        touch-action: pan-y !important;
        overscroll-behavior: auto !important;
      `;
      
      // Fix html
      document.documentElement.style.cssText = `
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        position: relative !important;
        height: auto !important;
        touch-action: pan-y !important;
      `;
      
      // Fix root
      const root = document.getElementById('root');
      if (root) {
        root.style.cssText = `
          overflow: visible !important;
          min-height: 100vh !important;
          touch-action: pan-y !important;
        `;
      }
      
      // Rimuovi tutti i fixed positioning (eccetto modali)
      document.querySelectorAll('*').forEach(el => {
        const computed = window.getComputedStyle(el);
        const htmlEl = el as HTMLElement;
        
        if (computed.position === 'fixed' && 
            !el.classList.contains('modal') && 
            !el.classList.contains('toast')) {
          htmlEl.style.position = 'relative';
        }
        
        if (computed.touchAction === 'none') {
          htmlEl.style.touchAction = 'auto';
        }
      });
    };
    
    // Applica fix
    fixMobileScroll();
    
    // Riapplica dopo delay
    const timeouts = [100, 500, 1000, 2000].map(delay => 
      setTimeout(fixMobileScroll, delay)
    );
    
    // Listener per orientamento
    window.addEventListener('orientationchange', fixMobileScroll);
    
    // Previeni il bounce di iOS ma permetti scroll
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target === document.body) {
        e.stopPropagation();
      }
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener('orientationchange', fixMobileScroll);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
  
  return null;
}
